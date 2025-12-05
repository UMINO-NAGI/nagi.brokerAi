import { auth } from "./auth.js";
import { billing } from "./billing.js";
import { generateDescriptions } from "./contentGenerator.js";

// ==================== ELEMENTOS DO DOM ====================
const els = {
  langToggle: document.getElementById("lang-toggle"),
  quotaCount: document.getElementById("quota-count"),
  quotaLabel: document.getElementById("quota-label"),
  form: document.getElementById("property-form"),
  generateBtn: document.getElementById("generate-btn"),
  tabButtons: Array.from(document.querySelectorAll(".tab-btn")),
  outputs: {
    short: document.getElementById("output-short"),
    medium: document.getElementById("output-medium"),
    long: document.getElementById("output-long")
  },
  copyAllBtn: document.getElementById("copy-all-btn"),
  statusMessage: document.getElementById("status-message"),
  paywallOverlay: document.getElementById("paywall-overlay"),
  upgradeBtn: document.getElementById("upgrade-btn"),
  alreadyPaidBtn: document.getElementById("already-paid-btn"),
  paywallTitle: document.getElementById("paywall-title"),
  paywallText: document.getElementById("paywall-text"),
  paywallHint: document.getElementById("paywall-hint"),
  benefitsList: document.getElementById("benefits-list"),
  formTitle: document.getElementById("form-title"),
  formSubtitle: document.getElementById("form-subtitle"),
  outputTitle: document.getElementById("output-title"),
  authArea: document.getElementById("auth-area"),
  userInfo: document.getElementById("user-info"),
  userName: document.getElementById("user-name"),
  userAvatar: document.getElementById("user-avatar"),
  signOutBtn: document.getElementById("sign-out-btn"),
  loginWarning: document.getElementById("login-warning"),
  loginWarningText: document.getElementById("login-warning-text"),
  
  // Campos do formulário
  fieldType: document.getElementById("property-type"),
  fieldHeadline: document.getElementById("headline"),
  fieldBedrooms: document.getElementById("bedrooms"),
  fieldBathrooms: document.getElementById("bathrooms"),
  fieldKitchens: document.getElementById("kitchens"),
  fieldParking: document.getElementById("parking"),
  fieldArea: document.getElementById("area"),
  fieldPrice: document.getElementById("price"),
  fieldAddress: document.getElementById("address"),
  fieldLocationContext: document.getElementById("location-context"),
  fieldHighlights: document.getElementById("highlights"),
  fieldExtras: document.getElementById("extras"),
  fieldAudience: document.getElementById("audience"),
  fieldTone: document.getElementById("tone"),
  
  // Labels & abas (para tradução)
  labelPropertyType: document.getElementById("label-property-type"),
  labelHeadline: document.getElementById("label-headline"),
  labelBedrooms: document.getElementById("label-bedrooms"),
  labelBathrooms: document.getElementById("label-bathrooms"),
  labelKitchens: document.getElementById("label-kitchens"),
  labelParking: document.getElementById("label-parking"),
  labelArea: document.getElementById("label-area"),
  labelPrice: document.getElementById("label-price"),
  labelAddress: document.getElementById("label-address"),
  labelLocationContext: document.getElementById("label-location-context"),
  labelHighlights: document.getElementById("label-highlights"),
  labelExtras: document.getElementById("label-extras"),
  labelAudience: document.getElementById("label-audience"),
  labelTone: document.getElementById("label-tone"),
  tabShort: document.getElementById("tab-short"),
  tabMedium: document.getElementById("tab-medium"),
  tabLong: document.getElementById("tab-long")
};

// ==================== VARIÁVEIS GLOBAIS ====================
let currentLang = "pt";
let currentUser = null;
let isGenerating = false;
let formAutoSaveTimer = null;

// ==================== SISTEMA DE CÓDIGOS MANUAL ====================
let CODIGOS_ATIVOS = []; // Começa vazia, você vai adicionar códigos

// Painel de controle admin (acessado com CTRL+SHIFT+A)
function mostrarPainelAdmin() {
  const painel = document.createElement("div");
  painel.className = "overlay";
  painel.style.zIndex = "9999";
  
  // Gerar 5 códigos novos
  const novosCodigos = [];
  for (let i = 0; i < 5; i++) {
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    novosCodigos.push(codigo);
    CODIGOS_ATIVOS.push(codigo);
  }
  
  painel.innerHTML = `
    <div class="overlay-content" style="max-width: 500px;">
      <h2 style="color: #f97316; margin-bottom: 20px;">🎮 PAINEL DE CONTROLE NAGI</h2>
      
      <div style="background: #0f172a; padding: 15px; border-radius: 10px; margin-bottom: 20px;">
        <h3 style="font-size: 14px; margin-bottom: 10px;">🆕 NOVOS CÓDIGOS GERADOS:</h3>
        <div style="font-family: monospace; font-size: 18px; line-height: 2;">
          ${novosCodigos.map(c => `<div>${c}</div>`).join('')}
        </div>
        <button id="copiar-codigos" style="margin-top: 10px; padding: 8px 15px; background: #10b981; color: white; border: none; border-radius: 5px; cursor: pointer;">
          📋 Copiar Todos
        </button>
      </div>
      
      <div style="background: #0f172a; padding: 15px; border-radius: 10px; margin-bottom: 20px;">
        <h3 style="font-size: 14px; margin-bottom: 10px;">📊 CÓDIGOS ATIVOS (${CODIGOS_ATIVOS.length}):</h3>
        <div style="max-height: 150px; overflow-y: auto; font-family: monospace; font-size: 14px;">
          ${CODIGOS_ATIVOS.length > 0 
            ? CODIGOS_ATIVOS.map(c => `<div style="padding: 3px 0;">${c}</div>`).join('') 
            : '<div style="color: #9ca3af;">Nenhum código ativo</div>'}
        </div>
      </div>
      
      <div style="margin-bottom: 20px;">
        <h3 style="font-size: 14px; margin-bottom: 10px;">📝 INSTRUÇÕES:</h3>
        <ol style="font-size: 13px; color: #9ca3af; padding-left: 20px;">
          <li>Envie um código para cada cliente que pagar</li>
          <li>O cliente digita o código no site para ativar o plano</li>
          <li>O código é removido automaticamente após uso</li>
          <li>Gere novos códigos sempre que precisar</li>
        </ol>
      </div>
      
      <button id="fechar-painel" class="primary-btn" style="width: 100%; padding: 12px;">
        Fechar Painel
      </button>
    </div>
  `;
  
  document.body.appendChild(painel);
  
  // Copiar códigos
  document.getElementById("copiar-codigos").addEventListener("click", () => {
    navigator.clipboard.writeText(novosCodigos.join('\n'));
    alert("✅ Códigos copiados! Cole no email para o cliente.");
  });
  
  // Fechar painel
  document.getElementById("fechar-painel").addEventListener("click", () => {
    document.body.removeChild(painel);
  });
}

// Atalho do teclado para abrir painel
document.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.shiftKey && e.key === "A") {
    e.preventDefault();
    if (document.querySelector(".overlay[style*='z-index: 9999']")) return;
    mostrarPainelAdmin();
  }
});

// Verificar código manual
function verificarCodigoManual(codigo) {
  if (!codigo || codigo.length !== 6) return false;
  
  const index = CODIGOS_ATIVOS.indexOf(codigo);
  if (index !== -1) {
    // Código válido - remover da lista
    CODIGOS_ATIVOS.splice(index, 1);
    return true;
  }
  
  return false;
}

// ==================== GOOGLE AUTH CALLBACK ====================
window.handleGoogleCredential = (response) => {
  try {
    const credential = response?.credential || response;
    if (!credential) return;
    
    auth.handleGoogleCredential(credential);
  } catch (error) {
    console.error("Erro no login Google:", error);
    mostrarStatus("❌ Erro no login. Tente novamente.", true);
  }
};

// ==================== AUTENTICAÇÃO ====================
auth.onChange((user) => {
  currentUser = user;
  atualizarInterfaceAuth();
  atualizarQuotaUI();
  
  if (user) {
    mostrarStatus(`👋 Bem-vindo, ${user.name || "Usuário"}!`);
  }
});

function atualizarInterfaceAuth() {
  if (currentUser) {
    els.authArea.classList.add("hidden");
    els.userInfo.classList.remove("hidden");
    els.userName.textContent = currentUser.name || "Usuário";
    
    if (currentUser.avatar) {
      els.userAvatar.src = currentUser.avatar;
      els.userAvatar.classList.remove("hidden");
    } else {
      els.userAvatar.classList.add("hidden");
    }
    
    els.loginWarning.classList.add("hidden");
    els.generateBtn.disabled = false;
  } else {
    els.authArea.classList.remove("hidden");
    els.userInfo.classList.add("hidden");
    els.loginWarning.classList.remove("hidden");
    els.generateBtn.disabled = true;
    
    els.loginWarningText.textContent = currentLang === "pt"
      ? "Inicie sessão com o Google para começar."
      : "Sign in with Google to start.";
  }
}

// ==================== QUOTA & PLANOS ====================
function atualizarQuotaUI() {
  const restantes = billing.getRemaining(currentUser);
  
  if (restantes === Infinity || billing.hasActivePlan(currentUser)) {
    els.quotaCount.textContent = "∞";
    els.quotaCount.style.color = "#10b981";
    els.quotaLabel.textContent = currentLang === "pt"
      ? "Plano profissional ativo"
      : "Pro plan active";
  } else {
    els.quotaCount.textContent = String(restantes);
    els.quotaCount.style.color = restantes === 0 ? "#ef4444" : "#fb923c";
    els.quotaLabel.textContent = currentLang === "pt"
      ? "Gerações gratuitas restantes:"
      : "Free generations left:";
  }
}

function verificarPermissaoGeracao() {
  if (!currentUser) {
    mostrarStatus(
      currentLang === "pt"
        ? "Inicie sessão com o Google para gerar descrições."
        : "Sign in with Google to generate descriptions.",
      true
    );
    return false;
  }

  if (billing.canGenerate(currentUser)) {
    return true;
  } else {
    mostrarPaywall();
    return false;
  }
}

// ==================== IDIOMA ====================
function aplicarIdioma(lang) {
  currentLang = lang;
  
  // Botões do idioma
  els.langToggle.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.lang === lang);
  });

  const isPt = lang === "pt";

  // Textos da interface
  if (isPt) {
    // Títulos
    els.formTitle.textContent = "Gerador inteligente de descrições imobiliárias";
    els.formSubtitle.textContent = "Insira os detalhes do imóvel e receba três versões prontas para anúncios, apresentações e discursos.";
    els.outputTitle.textContent = "Resultados gerados";
    
    // Labels
    els.labelPropertyType.textContent = "Tipo de imóvel";
    els.labelHeadline.textContent = "Título / foco principal";
    els.labelBedrooms.textContent = "Quartos";
    els.labelBathrooms.textContent = "Banheiros";
    els.labelKitchens.textContent = "Cozinhas";
    els.labelParking.textContent = "Vagas de garagem";
    els.labelArea.textContent = "Área (m²)";
    els.labelPrice.textContent = "Valor";
    els.labelAddress.textContent = "Morada / localização";
    els.labelLocationContext.textContent = "Contexto da localização";
    els.labelHighlights.textContent = "Destaques e comodidades";
    els.labelExtras.textContent = "Observações / informações complementares";
    els.labelAudience.textContent = "Público-alvo";
    els.labelTone.textContent = "Tom da comunicação";
    
    // Botões
    els.generateBtn.textContent = "Gerar descrições";
    els.copyAllBtn.textContent = "Copiar todas as versões";
    els.tabShort.textContent = "Curta";
    els.tabMedium.textContent = "Média";
    els.tabLong.textContent = "Longa";
    els.signOutBtn.textContent = "Sair";
    
    // Paywall
    els.paywallTitle.textContent = "Atualize o seu plano";
    els.paywallText.textContent = "Você já utilizou as 3 gerações gratuitas do NAGI REAL ESTATE ASSISTANT. Para continuar a criar descrições ilimitadas, adquira o plano profissional.";
    els.paywallHint.textContent = 'Após o pagamento, você receberá um código por email. Digite-o aqui para ativar seu plano.';
    els.alreadyPaidBtn.textContent = "Já paguei - Tenho um código";
    els.upgradeBtn.textContent = "🛒 Comprar Plano Profissional";
    
    // Benefícios
    els.benefitsList.innerHTML = `
      <li>Gerações ilimitadas de descrições e discursos imobiliários</li>
      <li>Textos otimizados para anúncios online, impressos e apresentações</li>
      <li>Conteúdos sempre diferentes, persuasivos e encantadores</li>
    `;
    
    // Placeholders
    els.fieldHeadline.placeholder = "Ex.: Luxuoso T3 com vista mar e varanda ampla";
    els.fieldPrice.placeholder = "Ex.: 250.000 €, R$ 800.000, 1200 €/mês";
    els.fieldAddress.placeholder = "Rua, bairro, cidade, país ou zona de referência";
    els.fieldLocationContext.placeholder = "Próximo a escolas, praias, transportes, centros comerciais...";
    els.fieldHighlights.placeholder = "Piscina, varanda gourmet, suite, vista mar, mobiliado, condomínio com segurança 24h...";
    els.fieldExtras.placeholder = "Informações específicas, regras do condomínio, possibilidade de financiamento, etc.";
  } else {
    // English
    els.formTitle.textContent = "Smart real estate copy generator";
    els.formSubtitle.textContent = "Enter the property details and get three ready-to-use versions for ads, presentations and sales pitches.";
    els.outputTitle.textContent = "Generated results";
    
    els.labelPropertyType.textContent = "Property type";
    els.labelHeadline.textContent = "Headline / main highlight";
    els.labelBedrooms.textContent = "Bedrooms";
    els.labelBathrooms.textContent = "Bathrooms";
    els.labelKitchens.textContent = "Kitchens";
    els.labelParking.textContent = "Parking spaces";
    els.labelArea.textContent = "Area (m²)";
    els.labelPrice.textContent = "Price";
    els.labelAddress.textContent = "Address / location";
    els.labelLocationContext.textContent = "Location context";
    els.labelHighlights.textContent = "Highlights & amenities";
    els.labelExtras.textContent = "Notes / additional information";
    els.labelAudience.textContent = "Target audience";
    els.labelTone.textContent = "Tone of voice";
    
    els.generateBtn.textContent = "Generate descriptions";
    els.copyAllBtn.textContent = "Copy all versions";
    els.tabShort.textContent = "Short";
    els.tabMedium.textContent = "Standard";
    els.tabLong.textContent = "Extended";
    els.signOutBtn.textContent = "Sign out";
    
    els.paywallTitle.textContent = "Upgrade your plan";
    els.paywallText.textContent = "You have already used the 3 free generations of NAGI REAL ESTATE ASSISTANT. To keep generating unlimited descriptions, buy the professional plan.";
    els.paywallHint.textContent = 'After payment, you will receive a code by email. Enter it here to activate your plan.';
    els.alreadyPaidBtn.textContent = "I paid - I have a code";
    els.upgradeBtn.textContent = "🛒 Buy Professional Plan";
    
    els.benefitsList.innerHTML = `
      <li>Unlimited real estate descriptions and sales scripts</li>
      <li>Copy optimized for online ads, print materials and presentations</li>
      <li>Always fresh, persuasive and engaging content</li>
    `;
    
    els.fieldHeadline.placeholder = "Ex.: Luxury T3 with sea view and spacious balcony";
    els.fieldPrice.placeholder = "Ex.: €250,000, $800,000, €1200/month";
    els.fieldAddress.placeholder = "Street, neighborhood, city, country or reference area";
    els.fieldLocationContext.placeholder = "Near schools, beaches, transport, shopping centers...";
    els.fieldHighlights.placeholder = "Pool, gourmet balcony, en-suite, sea view, furnished, 24h security...";
    els.fieldExtras.placeholder = "Specific information, condo rules, financing possibilities, etc.";
  }
  
  atualizarQuotaUI();
}

// ==================== ABAS ====================
function clicarAba(tab) {
  els.tabButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tab);
  });
  
  ["short", "medium", "long"].forEach((key) => {
    els.outputs[key].classList.toggle("active", key === tab);
  });
}

// ==================== FORMULÁRIO ====================
function coletarDadosFormulario() {
  return {
    type: els.fieldType.value || "imóvel",
    headline: els.fieldHeadline.value || "",
    bedrooms: parseInt(els.fieldBedrooms.value) || 0,
    bathrooms: parseInt(els.fieldBathrooms.value) || 0,
    kitchens: parseInt(els.fieldKitchens.value) || 0,
    parking: parseInt(els.fieldParking.value) || 0,
    area: parseInt(els.fieldArea.value) || 0,
    price: els.fieldPrice.value || "",
    address: els.fieldAddress.value || "",
    locationContext: els.fieldLocationContext.value || "",
    highlights: els.fieldHighlights.value || "",
    extras: els.fieldExtras.value || "",
    audience: els.fieldAudience.value || "geral",
    tone: els.fieldTone.value || "encantador"
  };
}

function validarDadosFormulario(dados) {
  const temDadosMinimos = 
    dados.type ||
    dados.headline.trim() ||
    dados.bedrooms > 0 ||
    dados.bathrooms > 0 ||
    dados.area > 0 ||
    dados.address.trim() ||
    dados.locationContext.trim() ||
    dados.highlights.trim();
  
  return temDadosMinimos;
}

function salvarFormulario() {
  const dados = coletarDadosFormulario();
  try {
    localStorage.setItem("nagi_form_data", JSON.stringify(dados));
  } catch (error) {
    console.warn("Não foi possível salvar:", error);
  }
}

function carregarFormulario() {
  try {
    const salvo = localStorage.getItem("nagi_form_data");
    if (!salvo) return false;
    
    const dados = JSON.parse(salvo);
    
    els.fieldType.value = dados.type || "apartamento";
    els.fieldHeadline.value = dados.headline || "";
    els.fieldBedrooms.value = dados.bedrooms || "";
    els.fieldBathrooms.value = dados.bathrooms || "";
    els.fieldKitchens.value = dados.kitchens || "";
    els.fieldParking.value = dados.parking || "";
    els.fieldArea.value = dados.area || "";
    els.fieldPrice.value = dados.price || "";
    els.fieldAddress.value = dados.address || "";
    els.fieldLocationContext.value = dados.locationContext || "";
    els.fieldHighlights.value = dados.highlights || "";
    els.fieldExtras.value = dados.extras || "";
    els.fieldAudience.value = dados.audience || "geral";
    els.fieldTone.value = dados.tone || "encantador";
    
    return true;
  } catch (error) {
    return false;
  }
}

function configurarAutoSave() {
  const elementosForm = [
    els.fieldType, els.fieldHeadline, els.fieldBedrooms, els.fieldBathrooms,
    els.fieldKitchens, els.fieldParking, els.fieldArea, els.fieldPrice,
    els.fieldAddress, els.fieldLocationContext, els.fieldHighlights,
    els.fieldExtras, els.fieldAudience, els.fieldTone
  ];
  
  elementosForm.forEach(elemento => {
    elemento.addEventListener("input", () => {
      clearTimeout(formAutoSaveTimer);
      formAutoSaveTimer = setTimeout(salvarFormulario, 500);
    });
    
    elemento.addEventListener("change", salvarFormulario);
  });
}

function carregarDadosDemo() {
  if (localStorage.getItem("nagi_primeira_vez") !== "sim") {
    // Dados de exemplo
    els.fieldType.value = "apartamento";
    els.fieldHeadline.value = currentLang === "pt" 
      ? "Luxuoso T3 com vista mar e varanda ampla" 
      : "Luxury T3 with sea view and spacious balcony";
    els.fieldBedrooms.value = "3";
    els.fieldBathrooms.value = "2";
    els.fieldKitchens.value = "1";
    els.fieldParking.value = "1";
    els.fieldArea.value = "120";
    els.fieldPrice.value = currentLang === "pt" ? "350.000 €" : "€350,000";
    els.fieldAddress.value = currentLang === "pt" ? "Zona Ribeirinha, Lisboa" : "Riverside Area, Lisbon";
    els.fieldLocationContext.value = currentLang === "pt" 
      ? "Próximo ao centro comercial, transporte público e escolas" 
      : "Near shopping center, public transport and schools";
    els.fieldHighlights.value = currentLang === "pt"
      ? "Vista mar, varanda gourmet, cozinha equipada, ar condicionado"
      : "Sea view, gourmet balcony, equipped kitchen, air conditioning";
    els.fieldExtras.value = currentLang === "pt"
      ? "Condomínio com piscina e ginásio. Possibilidade de financiamento bancário."
      : "Condominium with pool and gym. Bank financing available.";
    els.fieldAudience.value = "familias";
    els.fieldTone.value = "premium";
    
    localStorage.setItem("nagi_primeira_vez", "sim");
    salvarFormulario();
  }
}

// ==================== GERAÇÃO DE CONTEÚDO ====================
async function gerarConteudo() {
  if (isGenerating) return;
  
  if (!verificarPermissaoGeracao()) return;
  
  const dados = coletarDadosFormulario();
  if (!validarDadosFormulario(dados)) {
    mostrarStatus(
      currentLang === "pt"
        ? "Preencha pelo menos um campo principal do imóvel."
        : "Fill in at least one main property field.",
      true
    );
    return;
  }
  
  isGenerating = true;
  const textoOriginal = els.generateBtn.textContent;
  els.generateBtn.textContent = currentLang === "pt" ? "Gerando..." : "Generating...";
  els.generateBtn.disabled = true;
  
  try {
    const resultados = generateDescriptions(dados, currentLang);
    
    els.outputs.short.textContent = resultados.short || "";
    els.outputs.medium.textContent = resultados.medium || "";
    els.outputs.long.textContent = resultados.long || "";
    
    billing.registerGeneration(currentUser);
    atualizarQuotaUI();
    clicarAba("short");
    salvarFormulario();
    
    if (billing.isPaywalled(currentUser)) {
      mostrarStatus(
        currentLang === "pt"
          ? "Limite gratuito atingido. Adquira o plano para continuar."
          : "Free limit reached. Purchase plan to continue."
      );
    } else {
      mostrarStatus(
        currentLang === "pt"
          ? "✅ Descrições geradas com sucesso!"
          : "✅ Descriptions generated successfully!"
      );
    }
    
  } catch (error) {
    console.error("Erro na geração:", error);
    mostrarStatus(
      currentLang === "pt"
        ? "❌ Erro ao gerar descrições. Tente novamente."
        : "❌ Error generating descriptions. Please try again.",
      true
    );
    
    const textoFallback = currentLang === "pt"
      ? "Ocorreu um erro ao gerar as descrições. Por favor, verifique os dados inseridos e tente novamente."
      : "An error occurred while generating descriptions. Please check your input and try again.";
    
    els.outputs.short.textContent = textoFallback;
    els.outputs.medium.textContent = textoFallback;
    els.outputs.long.textContent = textoFallback;
    
  } finally {
    isGenerating = false;
    els.generateBtn.textContent = textoOriginal;
    els.generateBtn.disabled = !currentUser;
  }
}

// ==================== MENSAGENS DE STATUS ====================
function mostrarStatus(texto, erro = false) {
  els.statusMessage.textContent = texto || "";
  els.statusMessage.style.color = erro ? "#ef4444" : "#9ca3af";
  
  if (!texto) return;
  
  setTimeout(() => {
    if (els.statusMessage.textContent === texto) {
      els.statusMessage.textContent = "";
    }
  }, 3000);
}

// ==================== COPIAR CONTEÚDO ====================
async function copiarTodoConteudo() {
  const combinado = [els.outputs.short, els.outputs.medium, els.outputs.long]
    .map((el) => el.textContent.trim())
    .filter(Boolean)
    .join("\n\n---\n\n");
  
  if (!combinado) {
    mostrarStatus(
      currentLang === "pt"
        ? "Nenhum conteúdo para copiar."
        : "No content to copy.",
      true
    );
    return;
  }
  
  try {
    await navigator.clipboard.writeText(combinado);
    mostrarStatus(
      currentLang === "pt"
        ? "✅ Conteúdo copiado!"
        : "✅ Content copied!"
    );
  } catch (error) {
    // Fallback para navegadores antigos
    const areaTexto = document.createElement("textarea");
    areaTexto.value = combinado;
    areaTexto.style.position = "fixed";
    areaTexto.style.left = "-999999px";
    areaTexto.style.top = "-999999px";
    document.body.appendChild(areaTexto);
    areaTexto.focus();
    areaTexto.select();
    
    try {
      document.execCommand("copy");
      mostrarStatus(
        currentLang === "pt"
          ? "✅ Conteúdo copiado!"
          : "✅ Content copied!"
      );
    } catch (err) {
      mostrarStatus(
        currentLang === "pt"
          ? "❌ Não foi possível copiar. Selecione e copie manualmente."
          : "❌ Unable to copy. Please select and copy manually.",
        true
      );
    } finally {
      document.body.removeChild(areaTexto);
    }
  }
}

// ==================== PAYWALL ====================
function mostrarPaywall() {
  els.paywallOverlay.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function esconderPaywall() {
  els.paywallOverlay.classList.add("hidden");
  document.body.style.overflow = "";
}

function mostrarVerificacaoCodigo() {
  const modal = document.createElement("div");
  modal.className = "overlay";
  modal.style.zIndex = "1001";
  
  modal.innerHTML = `
    <div class="overlay-content" style="max-width: 400px; text-align: center;">
      <h2 style="color: #f97316;">🔑 ATIVAR PLANO PROFISSIONAL</h2>
      <p style="margin-bottom: 20px;">
        Digite o código de 6 dígitos que você recebeu após o pagamento.
      </p>
      
      <input type="text" 
             id="input-codigo" 
             placeholder="Ex: 123456"
             style="width: 100%; padding: 15px; font-size: 24px; text-align: center; border-radius: 10px; border: 2px solid #f97316; margin-bottom: 20px;"
             maxlength="6">
      
      <button id="btn-ativar" class="primary-btn" style="padding: 12px 30px; font-size: 16px; margin-right: 10px;">
        ✅ ATIVAR PLANO
      </button>
      
      <button id="btn-cancelar" class="ghost-btn" style="padding: 12px 30px; font-size: 16px;">
        ❌ CANCELAR
      </button>
      
      <div style="margin-top: 25px; padding: 15px; background: rgba(249, 115, 22, 0.1); border-radius: 10px;">
        <p style="margin: 0; font-size: 14px; color: #fb923c;">
          <strong>Não tem código?</strong><br>
          Envie um email para <strong>suporte@seudominio.com</strong><br>
          com seu email de login e comprovante de pagamento.
        </p>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  const btnAtivar = modal.querySelector("#btn-ativar");
  const btnCancelar = modal.querySelector("#btn-cancelar");
  const inputCodigo = modal.querySelector("#input-codigo");
  
  btnAtivar.addEventListener("click", () => {
    const codigo = inputCodigo.value.trim();
    if (!codigo || codigo.length !== 6) {
      alert("Por favor, digite um código de 6 dígitos.");
      return;
    }
    
    if (verificarCodigoManual(codigo)) {
      billing.activatePlan(currentUser);
      atualizarQuotaUI();
      esconderPaywall();
      document.body.removeChild(modal);
      mostrarStatus("✅ Plano ativado com sucesso!");
    } else {
      mostrarStatus("❌ Código inválido. Verifique e tente novamente.", true);
    }
  });
  
  btnCancelar.addEventListener("click", () => {
    document.body.removeChild(modal);
  });
  
  inputCodigo.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      btnAtivar.click();
    }
  });
  
  inputCodigo.focus();
}

// ==================== LINK DE PAGAMENTO ====================
function abrirLinkPagamento() {
  if (!currentUser) {
    mostrarStatus("Faça login primeiro para comprar o plano.", true);
    return;
  }
  
  // SUBSTITUA ESTE LINK PELO SEU LINK REAL DE PAGAMENTO
  const linkPagamento = "https://www.paypal.com/ncp/payment/YBLWPYKEZBBZC";
  // OU use Mercado Pago: "https://www.mercadopago.com.br/checkout/v1/redirect"
  // OU use PagSeguro: "https://pagseguro.uol.com.br/checkout/v2/payment.html"
  
  window.open(linkPagamento, "_blank");
  mostrarStatus("Redirecionando para página de pagamento...");
}

// ==================== EVENT LISTENERS ====================
function configurarEventListeners() {
  // Idioma
  els.langToggle.addEventListener("click", (e) => {
    const btn = e.target.closest(".lang-btn");
    if (!btn) return;
    aplicarIdioma(btn.dataset.lang);
  });
  
  // Abas
  els.tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => clicarAba(btn.dataset.tab));
  });
  
  // Formulário
  els.form.addEventListener("submit", (e) => {
    e.preventDefault();
    gerarConteudo();
  });
  
  // Copiar tudo
  els.copyAllBtn.addEventListener("click", copiarTodoConteudo);
  
  // Sair
  els.signOutBtn.addEventListener("click", () => {
    auth.signOut();
    mostrarStatus("Sessão encerrada. Até logo!");
  });
  
  // Botão "Já paguei"
  els.alreadyPaidBtn.addEventListener("click", mostrarVerificacaoCodigo);
  
  // Botão "Comprar Plano"
  els.upgradeBtn.addEventListener("click", abrirLinkPagamento);
  
  // Fechar paywall clicando fora
  els.paywallOverlay.addEventListener("click", (e) => {
    if (e.target === els.paywallOverlay) {
      esconderPaywall();
    }
  });
  
  // Fechar com ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !els.paywallOverlay.classList.contains("hidden")) {
      esconderPaywall();
    }
  });
  
  // Validação de números
  const camposNumeros = [els.fieldBedrooms, els.fieldBathrooms, els.fieldKitchens, els.fieldParking, els.fieldArea];
  camposNumeros.forEach(campo => {
    campo.addEventListener("input", () => {
      if (campo.value < 0) campo.value = 0;
      if (campo.value > 999) campo.value = 999;
    });
  });
}

// ==================== INICIALIZAÇÃO ====================
function inicializar() {
  // Detectar idioma do navegador
  const idiomaNavegador = navigator.language || navigator.userLanguage;
  currentLang = idiomaNavegador.toLowerCase().startsWith("pt") ? "pt" : "en";
  
  // Aplicar idioma
  aplicarIdioma(currentLang);
  
  // Configurar listener de auth
  auth.onChange((user) => {
    currentUser = user;
    atualizarInterfaceAuth();
    atualizarQuotaUI();
    
    if (user) {
      mostrarStatus(`👋 Bem-vindo, ${user.name || "Usuário"}!`);
    }
  });
  
  // Carregar usuário atual
  currentUser = auth.getCurrentUser();
  atualizarInterfaceAuth();
  atualizarQuotaUI();
  
  // Configurar aba inicial
  clicarAba("short");
  
  // Configurar auto-save do formulário
  configurarAutoSave();
  
  // Carregar dados demo (se primeira vez)
  carregarDadosDemo();
  
  // Carregar dados salvos
  carregarFormulario();
  
  // Configurar event listeners
  configurarEventListeners();
  
  console.log("✅ NAGI Real Estate Assistant inicializado!");
}

// Iniciar quando o DOM estiver carregado
document.addEventListener("DOMContentLoaded", inicializar);