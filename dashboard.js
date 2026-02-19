// js/dashboard.js
import { gerarComDeepSeek } from './deepseek.js';

let currentTool = 'descricao';
let currentUser = null;
let currentSubscription = null;

export async function inicializarDashboard(user, subscription) {
  currentUser = user;
  currentSubscription = subscription;

  const dashboard = document.getElementById('dashboard-screen');
  if (!dashboard.querySelector('#user-name')) {
    // Injetar HTML do dashboard (igual ao do app.js, mas organizado)
    dashboard.innerHTML = `
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

  document.getElementById('user-name').textContent = user.displayName || user.email;
  document.getElementById('logout-btn').addEventListener('click', logout);

  // Abas
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('tab-active'));
      btn.classList.add('tab-active');
      currentTool = btn.dataset.tool;
      atualizarInputArea();
    });
  });

  // Botões de ação
  document.getElementById('gerar-agora').addEventListener('click', gerarConteudo);
  document.getElementById('copiar-resultado').addEventListener('click', copiarResultado);

  atualizarInputArea();
}

function atualizarInputArea() {
  const area = document.getElementById('tool-input-area');
  const textos = {
    descricao: 'Descreva o imóvel (ex: 3 quartos, 120m², varanda...)',
    roteiro: 'Descreva o imóvel e o estilo do vídeo (ex: tour rápido, story...)',
    objecoes: 'Digite a objeção do cliente (ex: "Achei caro")',
    ficha: 'Cole anotações bagunçadas sobre o imóvel',
    foto: 'Descreva a foto (ex: sala com luz natural, sofá cinza)',
    extrator: 'Cole a descrição do imóvel como veio do cliente'
  };
  area.innerHTML = `
    <h3 class="text-lg font-semibold mb-4">${area.previousElementSibling?.textContent || ''}</h3>
    <textarea id="input-texto" rows="4" class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3" placeholder="${textos[currentTool]}"></textarea>
  `;
}

async function gerarConteudo() {
  const input = document.getElementById('input-texto')?.value;
  if (!input) {
    document.getElementById('result-content').innerText = 'Preencha o campo.';
    return;
  }

  const tamanho = document.getElementById('tamanho-texto').value;
  const idioma = document.getElementById('idioma-saida').value;
  const resultDiv = document.getElementById('result-content');
  resultDiv.innerText = 'Gerando... 🤖';

  let instrucaoTamanho = {
    curto: 'Gere um texto CURTO (máx 150 palavras)',
    medio: 'Gere um texto MÉDIO (cerca de 300 palavras)',
    longo: 'Gere um texto LONGO (cerca de 600 palavras)'
  }[tamanho];

  let prompt = '';
  switch (currentTool) {
    case 'descricao':
      prompt = `Com base em: "${input}", crie uma descrição persuasiva de imóvel. ${instrucaoTamanho} Idioma: ${idioma === 'pt' ? 'Português' : 'Inglês'}. Use gatilhos mentais.`;
      break;
    case 'roteiro':
      prompt = `Crie um roteiro para vídeo sobre: "${input}". ${instrucaoTamanho} Idioma: ${idioma === 'pt' ? 'Português' : 'Inglês'}.`;
      break;
    case 'objecoes':
      prompt = `Objeção: "${input}". Gere 3 argumentos de vendas. ${instrucaoTamanho} Idioma: ${idioma === 'pt' ? 'Português' : 'Inglês'}.`;
      break;
    case 'ficha':
      prompt = `Organize em ficha técnica: "${input}". ${instrucaoTamanho} Idioma: ${idioma === 'pt' ? 'Português' : 'Inglês'}.`;
      break;
    case 'foto':
      prompt = `Crie legenda para foto que mostra: "${input}". ${instrucaoTamanho} Idioma: ${idioma === 'pt' ? 'Português' : 'Inglês'}.`;
      break;
    case 'extrator':
      prompt = `Extraia dados técnicos de: "${input}". Apresente em lista. ${instrucaoTamanho} Idioma: ${idioma === 'pt' ? 'Português' : 'Inglês'}.`;
      break;
  }

  try {
    const resultado = await gerarComDeepSeek(prompt);
    resultDiv.innerText = resultado;
  } catch (error) {
    resultDiv.innerText = 'Erro ao gerar. Tente novamente.';
  }
}

function copiarResultado() {
  const texto = document.getElementById('result-content').innerText;
  if (texto && texto !== 'Seu resultado aparecerá aqui...') {
    navigator.clipboard.writeText(texto);
    alert('Copiado!');
  }
}

// Importar logout de auth
import { logout } from './auth.js';