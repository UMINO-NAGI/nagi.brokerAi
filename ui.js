// js/ui.js
import { loginComGoogle, logout, initAuthObserver } from './auth.js';
import { verificarAssinatura } from './subscription.js';
import { inicializarDashboard } from './dashboard.js'; // (será criado depois)

// Elementos DOM
const welcomeScreen = document.getElementById('welcome-screen');
const plansScreen = document.getElementById('plans-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const loadingScreen = document.getElementById('loading-screen');
const authSection = document.getElementById('auth-section');

// Mostrar/esconder telas
function mostrarLoading(mostrar) {
  loadingScreen?.classList.toggle('hidden', !mostrar);
  [welcomeScreen, plansScreen, dashboardScreen].forEach(s => s?.classList.toggle('hidden', mostrar));
}

function mostrarWelcome() {
  welcomeScreen?.classList.remove('hidden');
  plansScreen?.classList.add('hidden');
  dashboardScreen?.classList.add('hidden');
  loadingScreen?.classList.add('hidden');
}

function mostrarPlanos() {
  welcomeScreen?.classList.add('hidden');
  plansScreen?.classList.remove('hidden');
  dashboardScreen?.classList.add('hidden');
  loadingScreen?.classList.add('hidden');
}

function mostrarDashboard() {
  welcomeScreen?.classList.add('hidden');
  plansScreen?.classList.add('hidden');
  dashboardScreen?.classList.remove('hidden');
  loadingScreen?.classList.add('hidden');
}

// Inicializa a UI baseada no estado de autenticação/assinatura
export function iniciarUI() {
  initAuthObserver(async (dados) => {
    mostrarLoading(false); // esconde loading inicial

    if (!dados) {
      mostrarWelcome();
      authSection.innerHTML = '<button id="welcome-login-btn" class="btn-primary">Entrar com Google</button>';
      document.getElementById('welcome-login-btn')?.addEventListener('click', loginComGoogle);
      return;
    }

    const { user, subscription } = dados;
    if (subscription.ativa) {
      // Usuário com assinatura ativa: mostra dashboard
      await inicializarDashboard(user, subscription);
      mostrarDashboard();
      authSection.innerHTML = `
        <span class="text-sm bg-green-600/20 px-3 py-1 rounded-full">Plano ${subscription.plano} ativo</span>
        <button onclick="logout()" class="px-4 py-2 bg-gray-700 rounded-lg">Sair</button>
      `;
    } else {
      // Usuário sem assinatura ativa: mostra planos
      inicializarPlanos();
      mostrarPlanos();
      authSection.innerHTML = `
        <span class="text-sm bg-yellow-600/20 px-3 py-1 rounded-full">Assinatura ${subscription.status}</span>
        <button onclick="logout()" class="px-4 py-2 bg-gray-700 rounded-lg">Sair</button>
      `;
    }
  });

  // Tratar mensagem de redirecionamento
  const msg = sessionStorage.getItem('redirectMessage');
  if (msg) {
    sessionStorage.removeItem('redirectMessage');
    alert(msg);
  }
}

// Função para inicializar tela de planos (com links PayPal)
function inicializarPlanos() {
  if (plansScreen.querySelector('.grid')) return; // já populado

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
        <button data-plan="mensal" class="paypal-btn w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition">Comprar via PayPal</button>
      </div>
      <div class="glass-card p-8 flex flex-col items-center text-center border-2 border-purple-500 transform scale-105">
        <span class="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-bold mb-2">MAIS POPULAR</span>
        <h3 class="text-2xl font-bold mb-2">Trimestral</h3>
        <p class="text-5xl font-black mb-4">R$49,<span class="text-2xl">99</span></p>
        <p class="text-gray-400 mb-6">economize 16%</p>
        <button data-plan="trimestral" class="paypal-btn w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition">Comprar via PayPal</button>
      </div>
      <div class="glass-card p-8 flex flex-col items-center text-center">
        <h3 class="text-2xl font-bold mb-2">Anual</h3>
        <p class="text-5xl font-black mb-4">R$199,<span class="text-2xl">00</span></p>
        <p class="text-gray-400 mb-6">menos de R$17/mês</p>
        <button data-plan="anual" class="paypal-btn w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition">Comprar via PayPal</button>
      </div>
    </div>
    <p class="text-center text-gray-500 mt-8">Após o pagamento, sua assinatura será ativada manualmente (aguarde até 24h).</p>
  `;

  document.querySelectorAll('.paypal-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const plan = e.target.dataset.plan;
      const links = {
        mensal: "https://www.paypal.com/ncp/payment/3ZTZRT45ZN9JN",
        trimestral: "https://www.paypal.com/ncp/payment/RUTJGDGJC6KWJ",
        anual: "https://www.paypal.com/ncp/payment/GJXBFRS63YESE"
      };
      window.open(links[plan], '_blank');
    });
  });
}