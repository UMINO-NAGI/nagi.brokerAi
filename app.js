// ============================================
// NAGI BROKER AI - Frontend Principal
// ============================================

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';

// Configuração Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCsGNZ5JyzagqwEEYjkOu9Ch6U0QRf6stc",
    authDomain: "nagibrokerai-107b0.firebaseapp.com",
    projectId: "nagibrokerai-107b0",
    storageBucket: "nagibrokerai-107b0.firebasestorage.app",
    messagingSenderId: "45883710254",
    appId: "1:45883710254:web:1d6d8b330abf6cc07878bf",
    measurementId: "G-FRN86VXEPC"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// ============================================
// Internacionalização
// ============================================
let currentLanguage = 'pt';

const translations = {
    pt: {
        login: "Entrar com Google",
        logout: "Sair",
        pricing_title: "Escolha seu plano premium",
        pricing_subtitle: "Acesso ilimitado a todas as ferramentas de IA",
        plan_month: "Plano Mensal",
        plan_3months: "Plano Trimestral",
        plan_year: "Plano Anual",
        price_month: "$19.99",
        price_3months: "$49.99",
        price_year: "$199.00",
        per_month: "/mês",
        per_3months: "/trimestre",
        per_year: "/ano",
        features: [
            "✓ Todas as 8 ferramentas de IA",
            "✓ Suporte prioritário",
            "✓ Atualizações gratuitas",
            "✓ Sem limites de uso"
        ],
        dashboard_title: "Dashboard - Ferramentas de IA",
        tool1: "🏠 Gerador de Anúncios Imobiliários",
        tool1_placeholder: "Descreva o imóvel em detalhes (local, área, quartos, diferenciais, público-alvo)...",
        tool2: "🌎 Tradutor Técnico Imobiliário",
        tool2_placeholder: "Cole o texto ou termos para tradução (contratos, descrições técnicas)...",
        tool3: "💪 Quebrador de Objeções",
        tool3_placeholder: "Digite a objeção do cliente (ex: 'está muito caro', 'vou pensar mais')...",
        tool4: "🎬 Roteiros para Vídeos (Reels/TikTok)",
        tool4_placeholder: "Descreva o imóvel e o estilo de vídeo desejado (tour, storytelling, dicas)...",
        tool5: "📢 Criador de Campanhas (Ads Copy)",
        tool5_placeholder: "Informe o perfil do imóvel, público-alvo e objetivo da campanha...",
        tool6: "✉️ Sequência de E-mails (Follow-up)",
        tool6_placeholder: "Descreva o lead e o contexto do último contato...",
        tool7: "📄 Simplificador de Contratos",
        tool7_placeholder: "Cole a cláusula complexa do contrato para simplificar...",
        tool8: "🪑 Sugestão de Home Staging",
        tool8_placeholder: "Descreva o cômodo vazio (tamanho, iluminação, estilo desejado)...",
        generate: "Gerar Conteúdo",
        output: "Resultado:",
        loading: "Processando...",
        error_prefix: "Erro",
        try_again: "Por favor, tente novamente",
        premium_required: "Área exclusiva para assinantes. Assine um plano para acessar."
    },
    en: {
        login: "Login with Google",
        logout: "Logout",
        pricing_title: "Choose your premium plan",
        pricing_subtitle: "Unlimited access to all AI tools",
        plan_month: "Monthly Plan",
        plan_3months: "Quarterly Plan",
        plan_year: "Yearly Plan",
        price_month: "$19.99",
        price_3months: "$49.99",
        price_year: "$199.00",
        per_month: "/month",
        per_3months: "/quarter",
        per_year: "/year",
        features: [
            "✓ All 8 AI tools",
            "✓ Priority support",
            "✓ Free updates",
            "✓ Unlimited usage"
        ],
        dashboard_title: "Dashboard - AI Tools",
        tool1: "🏠 Real Estate Ad Generator",
        tool1_placeholder: "Describe the property in detail (location, size, bedrooms, features, target audience)...",
        tool2: "🌎 Real Estate Technical Translator",
        tool2_placeholder: "Paste text or terms to translate (contracts, technical descriptions)...",
        tool3: "💪 Objection Crusher",
        tool3_placeholder: "Enter the client's objection (e.g., 'too expensive', 'I'll think about it')...",
        tool4: "🎬 Video Scripts (Reels/TikTok)",
        tool4_placeholder: "Describe the property and desired video style (tour, storytelling, tips)...",
        tool5: "📢 Campaign Creator (Ads Copy)",
        tool5_placeholder: "Provide property profile, target audience and campaign objective...",
        tool6: "✉️ Email Sequence (Follow-up)",
        tool6_placeholder: "Describe the lead and last contact context...",
        tool7: "📄 Contract Simplifier",
        tool7_placeholder: "Paste the complex contract clause to simplify...",
        tool8: "🪑 Home Staging Suggestions",
        tool8_placeholder: "Describe the empty room (size, lighting, desired style)...",
        generate: "Generate",
        output: "Result:",
        loading: "Processing...",
        error_prefix: "Error",
        try_again: "Please try again",
        premium_required: "Exclusive area for subscribers. Subscribe to a plan to access."
    }
};

// ============================================
// Elementos DOM
// ============================================
const mainContent = document.getElementById('main-content');
const googleLoginBtn = document.getElementById('google-login');
const userInfoDiv = document.getElementById('user-info');
const userNameSpan = document.getElementById('user-name');
const logoutBtn = document.getElementById('logout-btn');
const langPT = document.getElementById('lang-pt');
const langEN = document.getElementById('lang-en');

// Estado
let currentUser = null;
let isPremium = false;

// ============================================
// Utilitários
// ============================================
function t(key) {
    return translations[currentLanguage][key] || key;
}

function showError(message) {
    console.error(message);
    alert(message);
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
    if (currentUser) {
        checkPremiumAndRender();
    } else {
        renderPricing();
    }
}

function updateStaticTexts() {
    googleLoginBtn.textContent = t('login');
    logoutBtn.textContent = t('logout');
}

// ============================================
// Firebase Auth
// ============================================
googleLoginBtn.addEventListener('click', async () => {
    try {
        await signInWithPopup(auth, provider);
    } catch (error) {
        showError('Erro no login: ' + error.message);
    }
});

logoutBtn.addEventListener('click', async () => {
    try {
        await signOut(auth);
    } catch (error) {
        showError('Erro ao sair: ' + error.message);
    }
});

async function ensureUserDocument(user) {
    try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
            await setDoc(userRef, {
                email: user.email,
                createdAt: Timestamp.now(),
                premiumUntil: null
            });
            console.log('Documento criado para:', user.uid);
        }
    } catch (error) {
        console.error('Erro ao criar documento:', error);
    }
}

async function checkPremiumAndRender() {
    if (!currentUser) return;

    try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const data = userSnap.data();
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
            console.log('Premium:', isPremium, premiumUntil);
        } else {
            isPremium = false;
        }

        if (isPremium) {
            renderDashboard();
        } else {
            renderPricing();
        }
    } catch (error) {
        console.error('Erro ao verificar premium:', error);
        renderPricing();
    }
}

// ============================================
// Renderização de Planos
// ============================================
function renderPricing() {
    mainContent.innerHTML = `
        <div class="pricing-container">
            <h1 class="pricing-title">${t('pricing_title')}</h1>
            <p class="pricing-subtitle">${t('pricing_subtitle')}</p>
            <div class="pricing-grid">
                <div class="pricing-card">
                    <h3>${t('plan_month')}</h3>
                    <div class="price">${t('price_month')}<span>${t('per_month')}</span></div>
                    <ul>
                        ${translations[currentLanguage].features.map(f => `<li>${f}</li>`).join('')}
                    </ul>
                    <div class="paypal-button-container" id="paypal-button-19.99"></div>
                </div>
                <div class="pricing-card">
                    <h3>${t('plan_3months')}</h3>
                    <div class="price">${t('price_3months')}<span>${t('per_3months')}</span></div>
                    <ul>
                        ${translations[currentLanguage].features.map(f => `<li>${f}</li>`).join('')}
                    </ul>
                    <div class="paypal-button-container" id="paypal-button-49.99"></div>
                </div>
                <div class="pricing-card">
                    <h3>${t('plan_year')}</h3>
                    <div class="price">${t('price_year')}<span>${t('per_year')}</span></div>
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

        container.innerHTML = '';

        paypal.Buttons({
            createOrder: (data, actions) => {
                return actions.order.create({
                    purchase_units: [{
                        amount: { value: plan.amount }
                    }]
                });
            },
            onApprove: async (data, actions) => {
                container.innerHTML = '<p style="color:#2563eb;">Processando pagamento...</p>';
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
                        alert('✅ Pagamento confirmado! Seu acesso premium foi ativado.');
                        await checkPremiumAndRender();
                    } else {
                        alert('❌ Falha na verificação: ' + (result.error || 'Erro desconhecido'));
                        renderPayPalButtons();
                    }
                } catch (error) {
                    alert('Erro ao processar pagamento: ' + error.message);
                    renderPayPalButtons();
                }
            },
            onError: (err) => {
                console.error('Erro PayPal:', err);
                alert('Erro no PayPal. Tente novamente.');
                renderPayPalButtons();
            }
        }).render(container);
    });
}

// ============================================
// Renderização do Dashboard
// ============================================
function renderDashboard() {
    mainContent.innerHTML = `
        <div class="dashboard">
            <h2>${t('dashboard_title')}</h2>
            <div class="tools-grid">
                <div class="tool-card">
                    <h3>${t('tool1')}</h3>
                    <textarea class="tool-textarea" id="tool1-input" placeholder="${t('tool1_placeholder')}"></textarea>
                    <button class="tool-btn" id="tool1-btn">${t('generate')}</button>
                    <div class="tool-output" id="tool1-output">${t('output')}</div>
                </div>
                <div class="tool-card">
                    <h3>${t('tool2')}</h3>
                    <textarea class="tool-textarea" id="tool2-input" placeholder="${t('tool2_placeholder')}"></textarea>
                    <button class="tool-btn" id="tool2-btn">${t('generate')}</button>
                    <div class="tool-output" id="tool2-output">${t('output')}</div>
                </div>
                <div class="tool-card">
                    <h3>${t('tool3')}</h3>
                    <textarea class="tool-textarea" id="tool3-input" placeholder="${t('tool3_placeholder')}"></textarea>
                    <button class="tool-btn" id="tool3-btn">${t('generate')}</button>
                    <div class="tool-output" id="tool3-output">${t('output')}</div>
                </div>
                <div class="tool-card">
                    <h3>${t('tool4')}</h3>
                    <textarea class="tool-textarea" id="tool4-input" placeholder="${t('tool4_placeholder')}"></textarea>
                    <button class="tool-btn" id="tool4-btn">${t('generate')}</button>
                    <div class="tool-output" id="tool4-output">${t('output')}</div>
                </div>
                <div class="tool-card">
                    <h3>${t('tool5')}</h3>
                    <textarea class="tool-textarea" id="tool5-input" placeholder="${t('tool5_placeholder')}"></textarea>
                    <button class="tool-btn" id="tool5-btn">${t('generate')}</button>
                    <div class="tool-output" id="tool5-output">${t('output')}</div>
                </div>
                <div class="tool-card">
                    <h3>${t('tool6')}</h3>
                    <textarea class="tool-textarea" id="tool6-input" placeholder="${t('tool6_placeholder')}"></textarea>
                    <button class="tool-btn" id="tool6-btn">${t('generate')}</button>
                    <div class="tool-output" id="tool6-output">${t('output')}</div>
                </div>
                <div class="tool-card">
                    <h3>${t('tool7')}</h3>
                    <textarea class="tool-textarea" id="tool7-input" placeholder="${t('tool7_placeholder')}"></textarea>
                    <button class="tool-btn" id="tool7-btn">${t('generate')}</button>
                    <div class="tool-output" id="tool7-output">${t('output')}</div>
                </div>
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
        alert('Por favor, insira algum texto para gerar o conteúdo.');
        return;
    }

    outputEl.textContent = t('loading');

    try {
        const response = await fetch('/api/deepseek', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: prompt,
                language: currentLanguage
            })
        });

        // Obter resposta como texto primeiro
        const text = await response.text();
        console.log('Resposta da API:', text.substring(0, 200) + '...'); // Log parcial

        // Tentar parsear JSON
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error('Resposta não é JSON:', text);
            outputEl.textContent = `❌ Erro: resposta inválida do servidor. ${t('try_again')}`;
            return;
        }

        if (data.success && data.result) {
            outputEl.textContent = data.result;
        } else {
            outputEl.textContent = `❌ ${t('error_prefix')}: ${data.error || t('try_again')}`;
        }
    } catch (error) {
        console.error('Erro na requisição:', error);
        outputEl.textContent = `❌ Falha na comunicação: ${error.message}`;
    }
}

// ============================================
// Inicialização
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
        googleLoginBtn.style.display = 'inline-block';
        userInfoDiv.style.display = 'none';
        renderPricing();
    }
    updateStaticTexts();
});

// Idioma inicial
setLanguage('pt');