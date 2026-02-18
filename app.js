// app.js
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, signOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";

// Configuração do Firebase (fornecida)
const firebaseConfig = {
    apiKey: "AIzaSyBfkl_aCIE35eZQKDYfVqe5Wu8XJrqMNYM",
    authDomain: "nagibrokerai.firebaseapp.com",
    projectId: "nagibrokerai",
    storageBucket: "nagibrokerai.firebasestorage.app",
    messagingSenderId: "682836610499",
    appId: "1:682836610499:web:6d909603e36159df404176",
    measurementId: "G-5KQMSN8FZV"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// DeepSeek API Key (⚠️ mover para backend em produção)
const DEEPSEEK_API_KEY = "sk-d5808163e0ed4acbad4cf892b1a554f9";

// Links PayPal fornecidos
const PAYPAL_LINKS = {
    monthly: "https://www.paypal.com/ncp/payment/3ZTZRT45ZN9JN",
    quarterly: "https://www.paypal.com/ncp/payment/RUTJGDGJC6KWJ",
    yearly: "https://www.paypal.com/ncp/payment/GJXBFRS63YESE"
};

// Elementos DOM
const welcomeScreen = document.getElementById('welcome-screen');
const loadingScreen = document.getElementById('loading-screen');
const plansScreen = document.getElementById('plans-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const authSection = document.getElementById('auth-section');
const welcomeLoginBtn = document.getElementById('welcome-login-btn');

// Elementos do dashboard (serão populados depois)
let userNameSpan, logoutBtn, toolInputArea, resultContent, gerarBtn, copiarBtn, tamanhoSelect, idiomaSelect;

// Estado
let currentUser = null;
let currentTool = 'descricao';

// ========== FUNÇÕES DE UI ==========
function mostrarLoading(mostrar) {
    if (mostrar) {
        welcomeScreen.classList.add('hidden');
        plansScreen.classList.add('hidden');
        dashboardScreen.classList.add('hidden');
        loadingScreen.classList.remove('hidden');
    } else {
        loadingScreen.classList.add('hidden');
    }
}

function mostrarWelcome() {
    welcomeScreen.classList.remove('hidden');
    plansScreen.classList.add('hidden');
    dashboardScreen.classList.add('hidden');
    loadingScreen.classList.add('hidden');
}

function mostrarPlanos() {
    welcomeScreen.classList.add('hidden');
    plansScreen.classList.remove('hidden');
    dashboardScreen.classList.add('hidden');
    loadingScreen.classList.add('hidden');
}

function mostrarDashboard() {
    welcomeScreen.classList.add('hidden');
    plansScreen.classList.add('hidden');
    dashboardScreen.classList.remove('hidden');
    loadingScreen.classList.add('hidden');
}

// ========== LOGIN GOOGLE ==========
async function loginComGoogle() {
    try {
        mostrarLoading(true);
        await signInWithPopup(auth, provider);
    } catch (error) {
        console.error('Erro no login:', error);
        mostrarWelcome();
        alert('Erro ao fazer login. Tente novamente.');
    }
}

welcomeLoginBtn.addEventListener('click', loginComGoogle);

// ========== LOGOUT ==========
function logout() {
    signOut(auth);
}

// ========== VERIFICAR ASSINATURA ==========
async function verificarAssinatura(user) {
    if (!user) return false;
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        // Primeiro login: criar documento
        await setDoc(userRef, {
            email: user.email,
            subscriptionStatus: 'pending',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return false;
    }

    const data = userSnap.data();
    const status = data.subscriptionStatus;
    const expiry = data.expiryDate?.toDate?.() || null;

    if (status === 'paid' && expiry && expiry > new Date()) {
        return true;
    } else if (status === 'paid' && expiry && expiry <= new Date()) {
        // Expirado: atualizar status
        await updateDoc(userRef, { subscriptionStatus: 'expired' });
        return false;
    }
    return false;
}

// ========== ATUALIZAR UI CONFORME USUÁRIO ==========
async function atualizarUIComUsuario(user) {
    if (!user) {
        mostrarWelcome();
        authSection.innerHTML = ''; // limpa
        return;
    }

    mostrarLoading(true);
    const temPlanoAtivo = await verificarAssinatura(user);
    currentUser = user;

    if (temPlanoAtivo) {
        // Inicializar elementos do dashboard (se necessário)
        inicializarDashboard();
        mostrarDashboard();
        authSection.innerHTML = `<span class="text-sm bg-green-600/20 px-3 py-1 rounded-full">Plano Ativo</span>`;
    } else {
        // Mostrar tela de planos e inicializar botões PayPal
        inicializarPlanos();
        mostrarPlanos();
        authSection.innerHTML = `
            <span class="text-sm bg-yellow-600/20 px-3 py-1 rounded-full">Assinatura pendente</span>
            <button onclick="logout()" class="px-4 py-2 bg-gray-700 rounded-lg">Sair</button>
        `;
    }
    mostrarLoading(false);
}

// ========== INICIALIZAR ELEMENTOS DO DASHBOARD ==========
function inicializarDashboard() {
    // Buscar elementos do dashboard (se não existirem, criar)
    if (!dashboardScreen.querySelector('#user-name')) {
        // Preencher o conteúdo do dashboard (pode ser carregado de um template)
        dashboardScreen.innerHTML = `
            <div class="flex justify-between items-center mb-8">
                <h2 class="text-3xl font-bold">Olá, <span id="user-name"></span>! 👋</h2>
                <button id="logout-btn" class="px-4 py-2 bg-red-600/20 hover:bg-red-600/40 rounded-lg transition">Sair</button>
            </div>
            <div class="flex flex-wrap gap-2 mb-8 border-b border-gray-700 pb-2">
                <button data-tool="descricao" class="tab-btn px-6 py-3 rounded-t-xl font-semibold transition tab-active">📝 Descrição Persuasiva</button>
                <button data-tool="roteiro" class="tab-btn px-6 py-3 rounded-t-xl font-semibold transition">🎬 Roteiro para Vídeo</button>
                <button data-tool="objecoes" class="tab-btn px-6 py-3 rounded-t-xl font-semibold transition">⚡ Quebra de Objeções</button>
                <button data-tool="ficha" class="tab-btn px-6 py-3 rounded-t-xl font-semibold transition">📋 Ficha Técnica</button>
                <button data-tool="foto" class="tab-btn px-6 py-3 rounded-t-xl font-semibold transition">🖼️ Legenda de Foto</button>
                <button data-tool="extrator" class="tab-btn px-6 py-3 rounded-t-xl font-semibold transition">🔍 Extrator de Dados</button>
            </div>
            <div class="glass-card p-6 mb-8">
                <div class="flex flex-wrap gap-6 items-center">
                    <div>
                        <label class="block text-sm text-gray-400 mb-1">Tamanho do texto</label>
                        <select id="tamanho-texto" class="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2">
                            <option value="curto">📱 Curto (Instagram/WhatsApp)</option>
                            <option value="medio" selected>📄 Médio (Portais)</option>
                            <option value="longo">📑 Longo (Blog/Site)</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm text-gray-400 mb-1">Idioma</label>
                        <select id="idioma-saida" class="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2">
                            <option value="pt">🇧🇷 Português</option>
                            <option value="en">🇺🇸 English</option>
                        </select>
                    </div>
                    <div class="ml-auto">
                        <button id="gerar-agora" class="btn-primary px-8 py-3 rounded-xl text-white font-bold">✨ Gerar Agora</button>
                    </div>
                </div>
            </div>
            <div id="tool-input-area" class="glass-card p-6 mb-8"></div>
            <div id="result-area" class="glass-card p-8">
                <h3 class="text-xl font-bold mb-4 flex items-center gap-2">
                    <span class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    Resultado
                </h3>
                <div id="result-content" class="prose prose-invert max-w-none whitespace-pre-wrap font-light text-lg">
                    Seu resultado aparecerá aqui...
                </div>
                <button id="copiar-resultado" class="mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition">📋 Copiar</button>
            </div>
        `;
    }

    // Atribuir referências
    userNameSpan = document.getElementById('user-name');
    logoutBtn = document.getElementById('logout-btn');
    toolInputArea = document.getElementById('tool-input-area');
    resultContent = document.getElementById('result-content');
    gerarBtn = document.getElementById('gerar-agora');
    copiarBtn = document.getElementById('copiar-resultado');
    tamanhoSelect = document.getElementById('tamanho-texto');
    idiomaSelect = document.getElementById('idioma-saida');

    if (userNameSpan) userNameSpan.textContent = currentUser.displayName || currentUser.email;

    // Event listeners
    logoutBtn?.addEventListener('click', logout);

    // Abas
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('tab-active'));
            btn.classList.add('tab-active');
            currentTool = btn.dataset.tool;
            atualizarInputArea();
        });
    });

    // Botão gerar
    gerarBtn?.addEventListener('click', gerarConteudo);

    // Botão copiar
    copiarBtn?.addEventListener('click', () => {
        const texto = resultContent.innerText;
        if (texto && texto !== 'Seu resultado aparecerá aqui...') {
            navigator.clipboard.writeText(texto);
            alert('Copiado!');
        }
    });

    // Inicializar input area
    atualizarInputArea();
}

function atualizarInputArea() {
    let html = '';
    switch (currentTool) {
        case 'descricao':
            html = `
                <h3 class="text-lg font-semibold mb-4">📝 Descreva o imóvel</h3>
                <textarea id="input-texto" rows="4" class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3" placeholder="Ex: Apartamento 3 quartos, 2 banheiros, 120m², varanda gourmet, piscina, localização perto do metrô..."></textarea>
            `;
            break;
        case 'roteiro':
            html = `
                <h3 class="text-lg font-semibold mb-4">🎬 Roteiro para vídeo</h3>
                <textarea id="input-texto" rows="4" class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3" placeholder="Descreva o imóvel e o estilo do vídeo (ex: tour rápido, story para Instagram...)"></textarea>
            `;
            break;
        case 'objecoes':
            html = `
                <h3 class="text-lg font-semibold mb-4">⚡ Objeção do cliente</h3>
                <textarea id="input-texto" rows="4" class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3" placeholder="Ex: 'Achei o imóvel caro', 'Condomínio muito alto', 'Localização distante'..."></textarea>
            `;
            break;
        case 'ficha':
            html = `
                <h3 class="text-lg font-semibold mb-4">📋 Organizar ficha técnica</h3>
                <textarea id="input-texto" rows="4" class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3" placeholder="Cole anotações bagunçadas: 3qt 2ban 70m² garagem2 vaga etc..."></textarea>
            `;
            break;
        case 'foto':
            html = `
                <h3 class="text-lg font-semibold mb-4">🖼️ Descreva a foto para legenda</h3>
                <textarea id="input-texto" rows="4" class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3" placeholder="Ex: foto da sala com luz natural, sofá cinza, vista para o mar..."></textarea>
            `;
            break;
        case 'extrator':
            html = `
                <h3 class="text-lg font-semibold mb-4">🔍 Extrair dados de texto bruto</h3>
                <textarea id="input-texto" rows="4" class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3" placeholder="Cole a descrição do imóvel como veio do cliente..."></textarea>
            `;
            break;
    }
    if (toolInputArea) toolInputArea.innerHTML = html;
}

// ========== INICIALIZAR TELA DE PLANOS ==========
function inicializarPlanos() {
    if (!plansScreen.querySelector('.grid')) {
        plansScreen.innerHTML = `
            <div class="text-center mb-12">
                <h2 class="text-4xl md:text-5xl font-extrabold mb-4">
                    <span class="gradient-text">Desbloqueie o Poder da IA</span>
                </h2>
                <p class="text-xl text-gray-300 max-w-2xl mx-auto">Escolha o plano ideal para turbinar suas vendas imobiliárias</p>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                <div class="glass-card p-8 flex flex-col items-center text-center">
                    <h3 class="text-2xl font-bold mb-2">Mensal</h3>
                    <p class="text-5xl font-black mb-4">R$19,<span class="text-2xl">99</span></p>
                    <p class="text-gray-400 mb-6">por mês, cancela quando quiser</p>
                    <button data-plan="monthly" class="paypal-btn w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition">Comprar via PayPal</button>
                </div>
                <div class="glass-card p-8 flex flex-col items-center text-center border-2 border-purple-500 transform scale-105">
                    <span class="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-bold mb-2">MAIS POPULAR</span>
                    <h3 class="text-2xl font-bold mb-2">Trimestral</h3>
                    <p class="text-5xl font-black mb-4">R$49,<span class="text-2xl">99</span></p>
                    <p class="text-gray-400 mb-6">economize 16%</p>
                    <button data-plan="quarterly" class="paypal-btn w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition">Comprar via PayPal</button>
                </div>
                <div class="glass-card p-8 flex flex-col items-center text-center">
                    <h3 class="text-2xl font-bold mb-2">Anual</h3>
                    <p class="text-5xl font-black mb-4">R$199,<span class="text-2xl">00</span></p>
                    <p class="text-gray-400 mb-6">menos de R$17/mês</p>
                    <button data-plan="yearly" class="paypal-btn w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition">Comprar via PayPal</button>
                </div>
            </div>
            <p class="text-center text-gray-500 mt-8">Após o pagamento, sua assinatura será ativada manualmente (aguarde até 24h).</p>
        `;

        // Adicionar listeners aos botões PayPal
        document.querySelectorAll('.paypal-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const plan = e.target.dataset.plan;
                const link = PAYPAL_LINKS[plan];
                if (link) window.open(link, '_blank');
            });
        });
    }
}

// ========== CHAMADA À API DEEPSEEK ==========
async function gerarComDeepSeek(prompt) {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
                { role: 'system', content: 'Você é um assistente especializado em marketing imobiliário. Responda no idioma solicitado pelo usuário. Seja criativo, persuasivo e profissional.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.8,
            max_tokens: 1000
        })
    });
    const data = await response.json();
    return data.choices[0].message.content;
}

// ========== GERAR CONTEÚDO ==========
async function gerarConteudo() {
    const inputTexto = document.getElementById('input-texto')?.value;
    if (!inputTexto) {
        resultContent.innerText = 'Por favor, preencha o campo de entrada.';
        return;
    }

    const tamanho = tamanhoSelect.value;
    const idioma = idiomaSelect.value;

    let instrucaoTamanho = '';
    switch (tamanho) {
        case 'curto': instrucaoTamanho = 'Gere um texto CURTO (máx 150 palavras), ideal para Instagram ou WhatsApp.'; break;
        case 'medio': instrucaoTamanho = 'Gere um texto MÉDIO (cerca de 300 palavras), para portais imobiliários.'; break;
        case 'longo': instrucaoTamanho = 'Gere um texto LONGO e detalhado (cerca de 600 palavras), para blog ou site próprio.'; break;
    }

    let prompt = '';
    switch (currentTool) {
        case 'descricao':
            prompt = `Com base nestas informações: "${inputTexto}", crie uma descrição persuasiva do imóvel. ${instrucaoTamanho} Idioma: ${idioma === 'pt' ? 'Português do Brasil' : 'English'}. Use gatilhos mentais.`;
            break;
        case 'roteiro':
            prompt = `Crie um roteiro para vídeo de redes sociais (Reels/TikTok) sobre este imóvel: "${inputTexto}". Inclua cenas, falas e dicas. ${instrucaoTamanho} Idioma: ${idioma === 'pt' ? 'Português' : 'English'}.`;
            break;
        case 'objecoes':
            prompt = `O cliente disse: "${inputTexto}". Gere 3 argumentos de vendas para quebrar essa objeção. ${instrucaoTamanho} Idioma: ${idioma === 'pt' ? 'Português' : 'English'}.`;
            break;
        case 'ficha':
            prompt = `Organize estas anotações em uma ficha técnica profissional de imóvel: "${inputTexto}". Liste itens como área, quartos, banheiros, vagas, diferenciais. ${instrucaoTamanho} Idioma: ${idioma === 'pt' ? 'Português' : 'English'}.`;
            break;
        case 'foto':
            prompt = `Crie uma legenda atraente para uma foto que mostra: "${inputTexto}". A legenda deve ser persuasiva e usar palavras-chave imobiliárias. ${instrucaoTamanho} Idioma: ${idioma === 'pt' ? 'Português' : 'English'}.`;
            break;
        case 'extrator':
            prompt = `Extraia os dados técnicos (m², quartos, banheiros, vagas, características) deste texto bruto: "${inputTexto}". Apresente em formato de lista. ${instrucaoTamanho} Idioma: ${idioma === 'pt' ? 'Português' : 'English'}.`;
            break;
    }

    resultContent.innerText = 'Gerando... 🤖';
    try {
        const resultado = await gerarComDeepSeek(prompt);
        resultContent.innerText = resultado;
    } catch (error) {
        console.error(error);
        resultContent.innerText = 'Erro ao gerar conteúdo. Tente novamente.';
    }
}

// ========== OUVIR ESTADO DE AUTENTICAÇÃO ==========
onAuthStateChanged(auth, (user) => {
    atualizarUIComUsuario(user);
});

// Expor funções globalmente para botões inline (não necessário agora)
window.logout = logout;