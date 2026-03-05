// ============================================
// NAGI BROKER AI - Frontend Principal
// Versão: 2.0 - Produção
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
// INTERNACIONALIZAÇÃO (PT/EN)
// ============================================
let currentLanguage = 'pt';

const translations = {
    pt: {
        login: "Entrar com Google",
        logout: "Sair",
        pricing_title: "Escolha seu plano",
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
        features: [
            "✓ 8 ferramentas especializadas",
            "✓ Suporte prioritário",
            "✓ Atualizações mensais",
            "✓ Sem limites de uso"
        ],
        dashboard_title: "Dashboard Premium",
        premium_badge: "ASSINANTE PREMIUM",
        tool1: "Gerador de Anúncios",
        tool1_placeholder: "Descreva o imóvel (local, área, quartos, diferenciais, público-alvo)...",
        tool2: "Tradutor Técnico Imobiliário",
        tool2_placeholder: "Cole o texto ou termos técnicos para tradução (inglês/português)...",
        tool3: "Quebrador de Objeções",
        tool3_placeholder: "Digite a objeção do cliente (ex: 'está muito caro', 'vou pensar mais')...",
        tool4: "Roteiros de Vídeo (Reels/TikTok)",
        tool4_placeholder: "Descreva o imóvel e o que quer destacar (cômodos, vista, localização)...",
        tool5: "Criador de Campanhas (Ads Copy)",
        tool5_placeholder: "Perfil do imóvel e público-alvo (ex: apartamento de luxo, casal sem filhos)...",
        tool6: "Sequência de E-mails (Follow-up)",
        tool6_placeholder: "Contexto do lead e último contato (ex: visitou imóvel há 3 dias)...",
        tool7: "Simplificador de Contratos",
        tool7_placeholder: "Cole a cláusula complexa do contrato...",
        tool8: "Sugestão de Home Staging",
        tool8_placeholder: "Descreva o cômodo vazio (tamanho, cores, móveis existentes)...",
        generate: "Gerar Conteúdo",
        generating: "Processando...",
        output: "Resultado:",
        error_generic: "Erro ao processar. Tente novamente.",
        not_premium: "Você precisa de um plano premium para acessar o dashboard.",
        buy_now: "Assinar Agora",
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
        features: [
            "✓ 8 specialized tools",
            "✓ Priority support",
            "✓ Monthly updates",
            "✓ Unlimited usage"
        ],
        dashboard_title: "Premium Dashboard",
        premium_badge: "PREMIUM MEMBER",
        tool1: "Ad Generator",
        tool1_placeholder: "Describe the property (location, area, rooms, highlights, target audience)...",
        tool2: "Real Estate Technical Translator",
        tool2_placeholder: "Paste technical text or terms to translate (English/Portuguese)...",
        tool3: "Objection Crusher",
        tool3_placeholder: "Enter the client's objection (e.g., 'too expensive', 'I'll think about it')...",
        tool4: "Video Scripts (Reels/TikTok)",
        tool4_placeholder: "Describe the property and what to highlight (rooms, view, location)...",
        tool5: "Campaign Creator (Ads Copy)",
        tool5_placeholder: "Property profile and target audience (e.g., luxury apartment, couple without children)...",
        tool6: "Email Sequence (Follow-up)",
        tool6_placeholder: "Lead context and last contact (e.g., visited property 3 days ago)...",
        tool7: "Contract Simplifier",
        tool7_placeholder: "Paste the complex contract clause...",
        tool8: "Home Staging Suggestions",
        tool8_placeholder: "Describe the empty room (size, colors, existing furniture)...",
        generate: "Generate Content",
        generating: "Processing...",
        output: "Result:",
        error_generic: "Error processing. Please try again.",
        not_premium: "You need a premium plan to access the dashboard.",
        buy_now: "Subscribe Now",
    }
};

// ============================================
// ELEMENTOS DO DOM
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
// UTILITÁRIOS
// ============================================
function t(key) {
    return translations[currentLanguage][key] || key;
}

function updateStaticTexts() {
    googleLoginBtn.textContent = t('login');
    logoutBtn.textContent = t('logout');
}

// ============================================
// GERENCIAMENTO DE IDIOMA
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

// ============================================
// FIREBASE AUTH
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

// Garante que o documento do usuário existe no Firestore
async function ensureUserDocument(user) {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
        await setDoc(userRef, {
            email: user.email,
            createdAt: Timestamp.now(),
            premiumUntil: null
        });
        console.log('📝 Documento criado para:', user.email);
    }
}

// Verifica status premium
async function checkPremiumAndRender() {
    if (!currentUser) return;

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
        console.log('🔑 Status premium:', isPremium, premiumUntil);
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
// RENDERIZAÇÃO: PLANOS (PRICING)
// ============================================
function renderPricing() {
    mainContent.innerHTML = `
        <div class="pricing-container">
            <h1 class="pricing-title">${t('pricing_title')}</h1>
            <p class="pricing-subtitle">${t('pricing_subtitle')}</p>
            <div class="pricing-grid">
                <div class="pricing-card">
                    <h3>${t('plan_month')}</h3>
                    <div class="price">${t('price_month')} <span>${t('per_month')}</span></div>
                    <ul>
                        ${translations[currentLanguage].features.map(f => `<li>${f}</li>`).join('')}
                    </ul>
                    <div class="paypal-button-container" id="paypal-button-19.99"></div>
                </div>
                <div class="pricing-card popular">
                    <h3>${t('plan_3months')}</h3>
                    <div class="price">${t('price_3months')} <span>${t('per_3months')}</span></div>
                    <ul>
                        ${translations[currentLanguage].features.map(f => `<li>${f}</li>`).join('')}
                    </ul>
                    <div class="paypal-button-container" id="paypal-button-49.99"></div>
                </div>
                <div class="pricing-card">
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
        { id: '19.99', amount: '19.99', months: 1 },
        { id: '49.99', amount: '49.99', months: 3 },
        { id: '199.00', amount: '199.00', months: 12 }
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
                container.innerHTML = '<p style="color: var(--primary);">Processando pagamento...</p>';
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
                    console.error('Erro na verificação:', error);
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
// RENDERIZAÇÃO: DASHBOARD (FERRAMENTAS)
// ============================================
function renderDashboard() {
    mainContent.innerHTML = `
        <div class="dashboard">
            <div class="dashboard-header">
                <h2>${t('dashboard_title')}</h2>
                <span class="premium-badge">${t('premium_badge')}</span>
            </div>
            <div class="tools-grid">
                ${renderTool(1)}
                ${renderTool(2)}
                ${renderTool(3)}
                ${renderTool(4)}
                ${renderTool(5)}
                ${renderTool(6)}
                ${renderTool(7)}
                ${renderTool(8)}
            </div>
        </div>
    `;
    attachToolListeners();
}

function renderTool(number) {
    return `
        <div class="tool-card" data-tool="${number}">
            <div class="tool-header">
                <div class="tool-icon">${number}</div>
                <h3>${t(`tool${number}`)}</h3>
            </div>
            <textarea class="tool-textarea" id="tool${number}-input" 
                placeholder="${t(`tool${number}_placeholder`)}"></textarea>
            <button class="tool-btn" id="tool${number}-btn">
                ${t('generate')}
            </button>
            <div class="tool-output" id="tool${number}-output">
                ${t('output')}
            </div>
        </div>
    `;
}

function attachToolListeners() {
    for (let i = 1; i <= 8; i++) {
        const btn = document.getElementById(`tool${i}-btn`);
        if (btn) {
            btn.addEventListener('click', () => handleToolClick(i));
        }
    }
}

// Prompts específicos para cada ferramenta
function getSystemPrompt(toolNumber, language) {
    const lang = language === 'pt' ? 'Portuguese' : 'English';
    
    const basePrompt = `You are a specialized real estate AI assistant. Respond EXCLUSIVELY in ${lang}. Be professional, detailed, and practical. `;
    
    const toolPrompts = {
        1: "Generate compelling real estate ads based on the property description. Include a catchy headline, key features, and a call-to-action.",
        2: "Translate real estate technical terms or documents maintaining legal and professional context. Provide both the translation and brief explanations if needed.",
        3: "As an objection handling expert, provide 3 persuasive responses to the client's objection. Each response should be psychologically effective and professional.",
        4: "Create a viral video script for Reels/TikTok showcasing the property. Include scene-by-scene breakdown, camera angles, and suggested narration.",
        5: "Create optimized ad copy for Facebook/Google Ads. Include headline, primary text, and call-to-action. Consider the target audience described.",
        6: "Write a follow-up email sequence for a lead who stopped responding. Include 3 emails with subject lines, spaced appropriately.",
        7: "Simplify complex contract clauses into plain language that clients can understand. Maintain the legal meaning but make it accessible.",
        8: "Suggest budget-friendly home staging ideas to enhance the property's appeal. Be specific about furniture placement, colors, and accessories."
    };
    
    return basePrompt + (toolPrompts[toolNumber] || "Provide helpful real estate advice.");
}

async function handleToolClick(toolNumber) {
    const inputEl = document.getElementById(`tool${toolNumber}-input`);
    const outputEl = document.getElementById(`tool${toolNumber}-output`);
    const btn = document.getElementById(`tool${toolNumber}-btn`);
    
    const prompt = inputEl.value.trim();
    if (!prompt) {
        alert('Por favor, insira algum texto.');
        return;
    }

    // Disable button and show loading
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span> ${t('generating')}`;
    outputEl.textContent = t('generating');
    outputEl.classList.add('loading');

    try {
        const response = await fetch('/api/deepseek', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: prompt,
                language: currentLanguage,
                tool: toolNumber,
                systemPrompt: getSystemPrompt(toolNumber, currentLanguage)
            })
        });

        // Get response text
        const text = await response.text();
        console.log(`📦 Resposta bruta da ferramenta ${toolNumber}:`, text.substring(0, 200) + '...');

        // Try to parse JSON
        let data;
        try {
            data = JSON.parse(text);
        } catch (jsonError) {
            console.error('❌ Resposta não é JSON:', text);
            outputEl.textContent = 'Erro: resposta inválida do servidor. Por favor, tente novamente.';
            outputEl.classList.remove('loading');
            btn.disabled = false;
            btn.innerHTML = t('generate');
            return;
        }

        if (data.success) {
            outputEl.textContent = data.result;
        } else {
            outputEl.textContent = 'Erro: ' + (data.error || t('error_generic'));
        }
    } catch (error) {
        console.error('❌ Erro na requisição:', error);
        outputEl.textContent = 'Falha na requisição: ' + error.message;
    } finally {
        outputEl.classList.remove('loading');
        btn.disabled = false;
        btn.innerHTML = t('generate');
    }
}

// ============================================
// INICIALIZAÇÃO
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

// Idioma padrão
setLanguage('pt');