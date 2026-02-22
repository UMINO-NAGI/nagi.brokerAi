// app.js - Main frontend logic

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

// Firebase configuration (from provided file)
const firebaseConfig = {
    apiKey: "AIzaSyCsGNZ5JyzagqwEEYjkOu9Ch6U0QRf6stc",
    authDomain: "nagibrokerai-107b0.firebaseapp.com",
    projectId: "nagibrokerai-107b0",
    storageBucket: "nagibrokerai-107b0.firebasestorage.app",
    messagingSenderId: "45883710254",
    appId: "1:45883710254:web:1d6d8b330abf6cc07878bf",
    measurementId: "G-FRN86VXEPC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// Internationalization
let currentLanguage = 'pt'; // default

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

// DOM elements
const mainContent = document.getElementById('main-content');
const googleLoginBtn = document.getElementById('google-login');
const userInfoDiv = document.getElementById('user-info');
const userNameSpan = document.getElementById('user-name');
const logoutBtn = document.getElementById('logout-btn');
const langPT = document.getElementById('lang-pt');
const langEN = document.getElementById('lang-en');

// Current user and premium status
let currentUser = null;
let isPremium = false;

// Language toggle event listeners
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
    updateUILanguage();
    // If dashboard is visible, we need to re-render with new language?
    // Actually the dashboard is static but tool placeholders and labels need update.
    // We'll refresh the view based on current user state.
    if (currentUser) {
        checkPremiumAndRender();
    } else {
        renderPricing(); // render pricing with new language
    }
}

function translate(key) {
    return translations[currentLanguage][key] || key;
}

// Update all static UI text elements (for dynamic parts, we re-render)
function updateUILanguage() {
    // Update login button
    googleLoginBtn.textContent = translate('login');
    // Update logout button
    logoutBtn.textContent = translate('logout');
    // If showing pricing, it's re-rendered, so no need here.
    // But we might have already rendered something, so we re-render content.
}

// Firebase Auth
googleLoginBtn.addEventListener('click', async () => {
    try {
        await signInWithPopup(auth, provider);
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed: ' + error.message);
    }
});

logoutBtn.addEventListener('click', async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error('Logout error:', error);
    }
});

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        userNameSpan.textContent = user.displayName || user.email;
        googleLoginBtn.style.display = 'none';
        userInfoDiv.style.display = 'flex';
        
        // Verifica/cria documento do usuário no Firestore
        await ensureUserDocument(user);
        
        await checkPremiumAndRender();
    } else {
        currentUser = null;
        userNameSpan.textContent = '';
        googleLoginBtn.style.display = 'inline-block';
        userInfoDiv.style.display = 'none';
        renderPricing();
    }
});

// Nova função para garantir que o documento do usuário existe
async function ensureUserDocument(user) {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
        // Cria documento básico com email e data de criação
        await setDoc(userRef, {
            email: user.email,
            createdAt: new Date(),
            premiumUntil: null // ou não incluir este campo
        });
        console.log('Documento do usuário criado no Firestore');
    }
}

// Render pricing with PayPal buttons
function renderPricing() {
    mainContent.innerHTML = `
        <div class="pricing-container">
            <h1 class="pricing-title">${translate('pricing_title')}</h1>
            <p class="pricing-subtitle">${translate('pricing_subtitle')}</p>
            <div class="pricing-grid">
                <div class="pricing-card" data-plan="19.99">
                    <h3>${translate('plan_month')}</h3>
                    <div class="price">${translate('price_month')} <span>${translate('per_month')}</span></div>
                    <ul>
                        ${translations[currentLanguage].features.map(f => `<li>${f}</li>`).join('')}
                    </ul>
                    <div class="paypal-button-container" id="paypal-button-19.99"></div>
                </div>
                <div class="pricing-card" data-plan="49.99">
                    <h3>${translate('plan_3months')}</h3>
                    <div class="price">${translate('price_3months')} <span>${translate('per_3months')}</span></div>
                    <ul>
                        ${translations[currentLanguage].features.map(f => `<li>${f}</li>`).join('')}
                    </ul>
                    <div class="paypal-button-container" id="paypal-button-49.99"></div>
                </div>
                <div class="pricing-card" data-plan="199.00">
                    <h3>${translate('plan_year')}</h3>
                    <div class="price">${translate('price_year')} <span>${translate('per_year')}</span></div>
                    <ul>
                        ${translations[currentLanguage].features.map(f => `<li>${f}</li>`).join('')}
                    </ul>
                    <div class="paypal-button-container" id="paypal-button-199.00"></div>
                </div>
            </div>
        </div>
    `;
    // Initialize PayPal buttons for each plan
    renderPayPalButtons();
}

function renderPayPalButtons() {
    if (!window.paypal) return;
    const plans = [
        { id: '19.99', amount: '19.99' },
        { id: '49.99', amount: '49.99' },
        { id: '199.00', amount: '199.00' }
    ];
    plans.forEach(plan => {
        const container = document.getElementById(`paypal-button-${plan.id}`);
        if (!container) return;
        container.innerHTML = ''; // Clear in case re-render
        paypal.Buttons({
            createOrder: (data, actions) => {
                return actions.order.create({
                    purchase_units: [{
                        amount: {
                            value: plan.amount
                        }
                    }]
                });
            },
            onApprove: async (data, actions) => {
                // Show loading
                container.innerHTML = '<p>Processing...</p>';
                // Call our verification function
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
                        alert('Payment successful! Your premium access is now active.');
                        await checkPremiumAndRender(); // refresh
                    } else {
                        alert('Payment verification failed: ' + result.error);
                        renderPayPalButtons(); // re-render buttons
                    }
                } catch (error) {
                    alert('Error verifying payment: ' + error.message);
                    renderPayPalButtons();
                }
            },
            onError: (err) => {
                console.error('PayPal error:', err);
                alert('PayPal error: ' + err.message);
            }
        }).render(container);
    });
}

// Render dashboard with 8 tools
function renderDashboard() {
    mainContent.innerHTML = `
        <div class="dashboard">
            <h2>${translate('dashboard_title')}</h2>
            <div class="tools-grid">
                <!-- Tool 1: Ad Generator -->
                <div class="tool-card" data-tool="adGenerator">
                    <h3>${translate('tool1')}</h3>
                    <textarea class="tool-textarea" id="tool1-input" placeholder="${translate('tool1_placeholder')}"></textarea>
                    <button class="tool-btn" id="tool1-btn">${translate('generate')}</button>
                    <div class="tool-output" id="tool1-output">${translate('output')}</div>
                </div>
                <!-- Tool 2: Technical Translator -->
                <div class="tool-card" data-tool="translator">
                    <h3>${translate('tool2')}</h3>
                    <textarea class="tool-textarea" id="tool2-input" placeholder="${translate('tool2_placeholder')}"></textarea>
                    <button class="tool-btn" id="tool2-btn">${translate('generate')}</button>
                    <div class="tool-output" id="tool2-output">${translate('output')}</div>
                </div>
                <!-- Tool 3: Objection Crusher -->
                <div class="tool-card" data-tool="objection">
                    <h3>${translate('tool3')}</h3>
                    <textarea class="tool-textarea" id="tool3-input" placeholder="${translate('tool3_placeholder')}"></textarea>
                    <button class="tool-btn" id="tool3-btn">${translate('generate')}</button>
                    <div class="tool-output" id="tool3-output">${translate('output')}</div>
                </div>
                <!-- Tool 4: Video Scripts -->
                <div class="tool-card" data-tool="videoScript">
                    <h3>${translate('tool4')}</h3>
                    <textarea class="tool-textarea" id="tool4-input" placeholder="${translate('tool4_placeholder')}"></textarea>
                    <button class="tool-btn" id="tool4-btn">${translate('generate')}</button>
                    <div class="tool-output" id="tool4-output">${translate('output')}</div>
                </div>
                <!-- Tool 5: Campaign Creator -->
                <div class="tool-card" data-tool="campaign">
                    <h3>${translate('tool5')}</h3>
                    <textarea class="tool-textarea" id="tool5-input" placeholder="${translate('tool5_placeholder')}"></textarea>
                    <button class="tool-btn" id="tool5-btn">${translate('generate')}</button>
                    <div class="tool-output" id="tool5-output">${translate('output')}</div>
                </div>
                <!-- Tool 6: Email Sequence -->
                <div class="tool-card" data-tool="email">
                    <h3>${translate('tool6')}</h3>
                    <textarea class="tool-textarea" id="tool6-input" placeholder="${translate('tool6_placeholder')}"></textarea>
                    <button class="tool-btn" id="tool6-btn">${translate('generate')}</button>
                    <div class="tool-output" id="tool6-output">${translate('output')}</div>
                </div>
                <!-- Tool 7: Contract Simplifier -->
                <div class="tool-card" data-tool="contract">
                    <h3>${translate('tool7')}</h3>
                    <textarea class="tool-textarea" id="tool7-input" placeholder="${translate('tool7_placeholder')}"></textarea>
                    <button class="tool-btn" id="tool7-btn">${translate('generate')}</button>
                    <div class="tool-output" id="tool7-output">${translate('output')}</div>
                </div>
                <!-- Tool 8: Home Staging Suggestions -->
                <div class="tool-card" data-tool="homeStaging">
                    <h3>${translate('tool8')}</h3>
                    <textarea class="tool-textarea" id="tool8-input" placeholder="${translate('tool8_placeholder')}"></textarea>
                    <button class="tool-btn" id="tool8-btn">${translate('generate')}</button>
                    <div class="tool-output" id="tool8-output">${translate('output')}</div>
                </div>
            </div>
        </div>
    `;
    // Attach event listeners to tool buttons
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
        alert('Please enter some input.');
        return;
    }
    outputEl.textContent = translate('loading');
    try {
        const response = await fetch('/api/deepseek', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: prompt,
                language: currentLanguage,
                tool: toolNumber // optional, you can customize prompts per tool
            })
        });
        const data = await response.json();
        if (data.success) {
            outputEl.textContent = data.result;
        } else {
            outputEl.textContent = 'Error: ' + data.error;
        }
    } catch (error) {
        outputEl.textContent = 'Request failed: ' + error.message;
    }
}

// Initialize language and render pricing if no user
setLanguage('pt');