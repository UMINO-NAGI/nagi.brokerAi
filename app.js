// ============================================
// NAGI BROKER AI - Frontend Principal
// ============================================

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';

// Configuração do Firebase (do arquivo integrações.txt)
const firebaseConfig = {
    apiKey: "AIzaSyCsGNZ5JyzagqwEEYjkOu9Ch6U0QRf6stc",
    authDomain: "nagibrokerai-107b0.firebaseapp.com",
    projectId: "nagibrokerai-107b0",
    storageBucket: "nagibrokerai-107b0.firebasestorage.app",
    messagingSenderId: "45883710254",
    appId: "1:45883710254:web:1d6d8b330abf6cc07878bf",
    measurementId: "G-FRN86VXEPC"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// ============================================
// Internacionalização (PT/EN)
// ============================================
let currentLanguage = 'pt'; // padrão

const translations = {
    pt: {
        login: "Login com Google",
        logout: "Sair",
        pricing_title: "Escolha o plano ideal para você",
        pricing_subtitle: "Acesso ilimitado a todas as ferramentas de IA",
        plan_month: "1 Mês",
        plan_3months: "3 Meses",
        plan_year: "1 Ano",
        price_month: "$19.99",
        price_3months: "$49.99",
        price_year: "$199.00",
        per_month: "/mês",
        per_3months: "/trimestre",
        per_year: "/ano",
        features: ["Acesso a todas as 8 ferramentas", "Suporte prioritário", "Atualizações gratuitas"],
        dashboard_title: "Dashboard - Ferramentas de IA",
        tool1: "Gerador de Anúncios",
        tool1_placeholder: "Descreva o imóvel (local, características, diferencial)...",
        tool2: "Tradutor Técnico Imobiliário",
        tool2_placeholder: "Cole o texto ou termos a traduzir...",
        tool3: "Quebrador de Objeções",
        tool3_placeholder: "Digite a objeção do cliente...",
        tool4: "Roteiros de Vídeo (Reels/TikTok)",
        tool4_placeholder: "Descreva o imóvel e o que quer destacar...",
        tool5: "Criador de Campanhas (Ads Copy)",
        tool5_placeholder: "Perfil do imóvel e público-alvo...",
        tool6: "Sequência de E-mails (Follow-up)",
        tool6_placeholder: "Contexto do lead e último contato...",
        tool7: "Simplificador de Contratos",
        tool7_placeholder: "Cole a cláusula complexa...",
        tool8: "Sugestão de Home Staging",
        tool8_placeholder: "Descreva o cômodo vazio...",
        generate: "Gerar",
        output: "Resposta:",
        loading: "Processando...",
        not_premium: "Você precisa de um plano premium para acessar o dashboard.",
        buy_now: "Assinar",
    },
    en: {
        login: "Login with Google",
        logout: "Logout",
        pricing_title: "Choose your plan",
        pricing_subtitle: "Unlimited access to all AI tools",
        plan_month: "1 Month",
        plan_3months: "3 Months",
        plan_year: "1 Year",
        price_month: "$19.99",
        price_3months: "$49.99",
        price_year: "$199.00",
        per_month: "/month",
        per_3months: "/quarter",
        per_year: "/year",
        features: ["Access to all 8 tools", "Priority support", "Free updates"],
        dashboard_title: "Dashboard - AI Tools",
        tool1: "Ad Generator",
        tool1_placeholder: "Describe the property (location, features, unique points)...",
        tool2: "Real Estate Technical Translator",
        tool2_placeholder: "Paste text or terms to translate...",
        tool3: "Objection Crusher",
        tool3_placeholder: "Enter the client's objection...",
        tool4: "Video Scripts (Reels/TikTok)",
        tool4_placeholder: "Describe the property and what to highlight...",
        tool5: "Campaign Creator (Ads Copy)",
        tool5_placeholder: "Property profile and target audience...",
        tool6: "Email Sequence (Follow-up)",
        tool6_placeholder: "Lead context and last contact...",
        tool7: "Contract Simplifier",
        tool7_placeholder: "Paste the complex clause...",
        tool8: "Home Staging Suggestions",
        tool8_placeholder: "Describe the empty room...",
        generate: "Generate",
        output: "Response:",
        loading: "Processing...",
        not_premium: "You need a premium plan to access the dashboard.",
        buy_now: "Subscribe",
    }
};

// ============================================
// Elementos do DOM
// ============================================
const mainContent = document.getElementById('main-content');
const googleLoginBtn = document.getElementById('google-login');
const userInfoDiv = document.getElementById('user-info');
const userNameSpan = document.getElementById('user-name');
const logoutBtn = document.getElementById('logout-btn');
const langPT = document.getElementById('lang-pt');
const langEN = document.getElementById('lang-en');

// Estado global
let currentUser = null;
let isPremium = false;

// ============================================
// Utilitários de tradução
// ============================================
function t(key) {
    return translations[currentLanguage][key] || key;
}

function updateStaticTexts() {
    googleLoginBtn.textContent = t('login');
    logoutBtn.textContent = t('logout');
}

// ============================================
// Gerenciamento de Idioma
// ============================================
langPT.addEventListener('click', () => {
    setLanguage('pt');
    langPT.classList.add('active');
    langEN.classList.remove('active');
});

langEN.addEventListener('click', () => {
    setLanguage('en');
    langEN.classList.add('active');
    langPT.classList.remove('active');
});

function setLanguage(lang) {
    currentLanguage = lang;
    updateStaticTexts();
    // Re-renderiza a view atual
    if (currentUser) {
        checkPremiumAndRender();
    } else {
        renderPricing();
    }
}

// ============================================
// Firebase Auth
// ============================================
googleLoginBtn.addEventListener('click', async () => {
    try {
        await signInWithPopup(auth, provider);
    } catch (error) {
        console.error('Erro no login:', error);
        alert('Falha no login: ' + error.message);
    }
});

logoutBtn.addEventListener('click', async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error('Erro no logout:', error);
    }
});

// Cria documento do usuário se não existir
async function ensureUserDocument(user) {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
        await setDoc(userRef, {
            email: user.email,
            createdAt: Timestamp.now(),
            premiumUntil: null
        });
        console.log('Documento do usuário criado:', user.uid);
    }
}

// Verifica premium e renderiza tela apropriada
async function checkPremiumAndRender() {
    if (!currentUser) return;

    const userRef = doc(db, 'users', currentUser.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        const data = userSnap.data();
        // Converte premiumUntil para Date, suportando diferentes formatos
        let premiumUntil = null;
        if (data.premiumUntil) {
            if (data.premiumUntil instanceof Timestamp) {
                premiumUntil = data.premiumUntil.toDate();
            } else if (typeof data.premiumUntil === 'string') {
                premiumUntil = new Date(data.premiumUntil);
            } else if (data.premiumUntil?.seconds) {
                premiumUntil = new Date(data.premiumUntil.seconds * 1000);
            }
        }
        isPremium = premiumUntil && premiumUntil > new Date();
        console.log('Premium status:', isPremium, 'Expira:', premiumUntil);
    } else {
        isPremium = false;
    }

    if (isPremium) {
        renderDashboard();
    } else {
        renderPricing();
    }
}

// ============================================
// Renderização: Planos (Pricing)
// ============================================
function renderPricing() {
    mainContent.innerHTML = `
        <div class="pricing-container">
            <h1 class="pricing-title">${t('pricing_title')}</h1>
            <p class="pricing-subtitle">${t('pricing_subtitle')}</p>
            <div class="pricing-grid">
                <div class="pricing-card" data-plan="19.99">
                    <h3>${t('plan_month')}</h3>
                    <div class="price">${t('price_month')} <span>${t('per_month')}</span></div>
                    <ul>
                        ${translations[currentLanguage].features.map(f => `<li>${f}</li>`).join('')}
                    </ul>
                    <div class="paypal-button-container" id="paypal-button-19.99"></div>
                </div>
                <div class="pricing-card" data-plan="49.99">
                    <h3>${t('plan_3months')}</h3>
                    <div class="price">${t('price_3months')} <span>${t('per_3months')}</span></div>
                    <ul>
                        ${translations[currentLanguage].features.map(f => `<li>${f}</li>`).join('')}
                    </ul>
                    <div class="paypal-button-container" id="paypal-button-49.99"></div>
                </div>
                <div class="pricing-card" data-plan="199.00">
                    <h3>${t('plan_year')}</h3>
                    <div class="price">${t('price_year')} <span>${t('per_year')}</span></div>
                    <ul>
                        ${translations[currentLanguage].features.map(f => `<li>${f}</li>`).join('')}
                    </ul>
                    <div class="paypal-button-container" id="paypal-button-199.00"></div>
                </div>
            </div>
        </div>
    `;
    renderPayPalButtons();
}

function renderPayPalButtons() {
    if (!window.paypal) {
        console.error('PayPal SDK não carregado');
        return;
    }
    const plans = [
        { id: '19.99', amount: '19.99' },
        { id: '49.99', amount: '49.99' },
        { id: '199.00', amount: '199.00' }
    ];
    plans.forEach(plan => {
        const container = document.getElementById(`paypal-button-${plan.id}`);
        if (!container) return;
        container.innerHTML = ''; // Limpa para evitar duplicação
        paypal.Buttons({
            createOrder: (data, actions) => {
                return actions.order.create({
                    purchase_units: [{
                        amount: { value: plan.amount }
                    }]
                });
            },
            onApprove: async (data, actions) => {
                container.innerHTML = '<p>Processando...</p>';
                try {
                    const response = await fetch('/api/verify-payment', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            orderID: data.orderID,
                            planID: plan.id,
                            userUID: currentUser?.uid
                        })
                    });
                    const result = await response.json();
                    if (result.success) {
                        alert('Pagamento confirmado! Seu acesso premium foi ativado.');
                        await checkPremiumAndRender();
                    } else {
                        alert('Falha na verificação: ' + result.error);
                        renderPayPalButtons(); // Re-renderiza botões
                    }
                } catch (error) {
                    alert('Erro ao verificar pagamento: ' + error.message);
                    renderPayPalButtons();
                }
            },
            onError: (err) => {
                console.error('Erro PayPal:', err);
                alert('Erro no PayPal: ' + err.message);
            }
        }).render(container);
    });
}

// ============================================
// Renderização: Dashboard (Ferramentas)
// ============================================
function renderDashboard() {
    mainContent.innerHTML = `
        <div class="dashboard">
            <h2>${t('dashboard_title')}</h2>
            <div class="tools-grid">
                <!-- Ferramenta 1 -->
                <div class="tool-card">
                    <h3>${t('tool1')}</h3>
                    <textarea class="tool-textarea" id="tool1-input" placeholder="${t('tool1_placeholder')}"></textarea>
                    <button class="tool-btn" id="tool1-btn">${t('generate')}</button>
                    <div class="tool-output" id="tool1-output">${t('output')}</div>
                </div>
                <!-- Ferramenta 2 -->
                <div class="tool-card">
                    <h3>${t('tool2')}</h3>
                    <textarea class="tool-textarea" id="tool2-input" placeholder="${t('tool2_placeholder')}"></textarea>
                    <button class="tool-btn" id="tool2-btn">${t('generate')}</button>
                    <div class="tool-output" id="tool2-output">${t('output')}</div>
                </div>
                <!-- Ferramenta 3 -->
                <div class="tool-card">
                    <h3>${t('tool3')}</h3>
                    <textarea class="tool-textarea" id="tool3-input" placeholder="${t('tool3_placeholder')}"></textarea>
                    <button class="tool-btn" id="tool3-btn">${t('generate')}</button>
                    <div class="tool-output" id="tool3-output">${t('output')}</div>
                </div>
                <!-- Ferramenta 4 -->
                <div class="tool-card">
                    <h3>${t('tool4')}</h3>
                    <textarea class="tool-textarea" id="tool4-input" placeholder="${t('tool4_placeholder')}"></textarea>
                    <button class="tool-btn" id="tool4-btn">${t('generate')}</button>
                    <div class="tool-output" id="tool4-output">${t('output')}</div>
                </div>
                <!-- Ferramenta 5 -->
                <div class="tool-card">
                    <h3>${t('tool5')}</h3>
                    <textarea class="tool-textarea" id="tool5-input" placeholder="${t('tool5_placeholder')}"></textarea>
                    <button class="tool-btn" id="tool5-btn">${t('generate')}</button>
                    <div class="tool-output" id="tool5-output">${t('output')}</div>
                </div>
                <!-- Ferramenta 6 -->
                <div class="tool-card">
                    <h3>${t('tool6')}</h3>
                    <textarea class="tool-textarea" id="tool6-input" placeholder="${t('tool6_placeholder')}"></textarea>
                    <button class="tool-btn" id="tool6-btn">${t('generate')}</button>
                    <div class="tool-output" id="tool6-output">${t('output')}</div>
                </div>
                <!-- Ferramenta 7 -->
                <div class="tool-card">
                    <h3>${t('tool7')}</h3>
                    <textarea class="tool-textarea" id="tool7-input" placeholder="${t('tool7_placeholder')}"></textarea>
                    <button class="tool-btn" id="tool7-btn">${t('generate')}</button>
                    <div class="tool-output" id="tool7-output">${t('output')}</div>
                </div>
                <!-- Ferramenta 8 -->
                <div class="tool-card">
                    <h3>${t('tool8')}</h3>
                    <textarea class="tool-textarea" id="tool8-input" placeholder="${t('tool8_placeholder')}"></textarea>
                    <button class="tool-btn" id="tool8-btn">${t('generate')}</button>
                    <div class="tool-output" id="tool8-output">${t('output')}</div>
                </div>
            </div>
        </div>
    `;
    attachToolListeners();
}

function attachToolListeners() {
    for (let i = 1; i <= 8; i++) {
        const btn = document.getElementById(`tool${i}-btn`);
        if (btn) {
            btn.addEventListener('click', () => handleToolClick(i));
        }
    }
}

async function handleToolClick(toolNumber) {
    const inputEl = document.getElementById(`tool${toolNumber}-input`);
    const outputEl = document.getElementById(`tool${toolNumber}-output`);
    const prompt = inputEl.value.trim();
    if (!prompt) {
        alert('Por favor, insira algum texto.');
        return;
    }
    outputEl.textContent = t('loading');
    try {
        const response = await fetch('/api/deepseek', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: prompt,
                language: currentLanguage,
                tool: toolNumber
            })
        });

        // Primeiro obtém o texto da resposta
        const text = await response.text();
        console.log('Resposta bruta da API:', text);

        // Tenta converter para JSON
        let data;
        try {
            data = JSON.parse(text);
        } catch (jsonError) {
            console.error('Resposta não é JSON:', text);
            outputEl.textContent = 'Erro: resposta inválida do servidor (não é JSON).';
            return;
        }

        if (data.success) {
            outputEl.textContent = data.result;
        } else {
            outputEl.textContent = 'Erro: ' + (data.error || 'Resposta inválida');
        }
    } catch (error) {
        console.error('Erro na requisição:', error);
        outputEl.textContent = 'Falha na requisição: ' + error.message;
    }
}

// ============================================
// Inicialização e Observador de Auth
// ============================================
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        userNameSpan.textContent = user.displayName || user.email;
        googleLoginBtn.style.display = 'none';
        userInfoDiv.style.display = 'flex';

        await ensureUserDocument(user);
        await checkPremiumAndRender();
    } else {
        currentUser = null;
        userNameSpan.textContent = '';
        googleLoginBtn.style.display = 'inline-block';
        userInfoDiv.style.display = 'none';
        renderPricing();
    }
    updateStaticTexts();
});

// Inicializa idioma padrão
setLanguage('pt');