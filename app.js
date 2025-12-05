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

// ==================== SISTEMA DE CÓDIGOS COM SENHA ====================
const ADMIN_PASSWORD = "948399692Se@"; // SENHA PARA PAINEL ADMINISTRATIVO
let CODIGOS_ATIVOS = [];

// ==================== FUNÇÕES UTILITÁRIAS ====================
function mostrarStatus(texto, erro = false) {
  if (els.statusMessage) {
    els.statusMessage.textContent = texto || "";
    els.statusMessage.style.color = erro ? "#ef4444" : "#9ca3af";
    
    if (texto) {
      setTimeout(() => {
        if (els.statusMessage.textContent === texto) {
          els.statusMessage.textContent = "";
        }
      }, 3000);
    }
  }
}

// ==================== GOOGLE AUTH CALLBACK ====================
window.handleGoogleCredential = (response) => {
  try {
    const credential = response?.credential || response;
    if (!credential) {
      mostrarStatus("Erro: Credencial do Google não recebida", true);
      return;
    }
    
    auth.handleGoogleCredential(credential);
  } catch (error) {
    console.error("Erro no login Google:", error);
    mostrarStatus("Erro no login com Google", true);
  }
};

// ==================== AUTENTICAÇÃO ====================
auth.onChange((user) => {
  currentUser = user;
  atualizarInterfaceAuth();
  atualizarQuotaUI();
  
  if (user) {
    mostrarStatus(`👋 Bem-vindo, ${user.name || "Usuário"}!`);
  } else {
    mostrarStatus("Sessão encerrada");
  }
});

function atualizarInterfaceAuth() {
  if (!els.authArea || !els.userInfo) return;
  
  if (currentUser) {
    // Usuário logado
    els.authArea.classList.add("hidden");
    els.userInfo.classList.remove("hidden");
    
    if (els.userName) {
      els.userName.textContent = currentUser.name || "Usuário";
    }
    
    if (els.userAvatar && currentUser.avatar) {
      els.userAvatar.src = currentUser.avatar;
      els.userAvatar.classList.remove("hidden");
    }
    
    if (els.loginWarning) {
      els.loginWarning.classList.add("hidden");
    }
    
    if (els.generateBtn) {
      els.generateBtn.disabled = false;
    }
  } else {
    // Usuário não logado
    els.authArea.classList.remove("hidden");
    els.userInfo.classList.add("hidden");
    
    if (els.loginWarning) {
      els.loginWarning.classList.remove("hidden");
    }
    
    if (els.generateBtn) {
      els.generateBtn.disabled = true;
    }
    
    // Atualizar texto do warning
    if (els.loginWarningText) {
      els.loginWarningText.textContent = currentLang === "pt" 
        ? "Inicie sessão com o Google para gerar descrições."
        : "Sign in with Google to generate descriptions.";
    }
  }
}

// ==================== QUOTA & PLANOS ====================
function atualizarQuotaUI() {
  if (!els.quotaCount || !els.quotaLabel) return;
  
  const restantes = billing.getRemaining(currentUser);
  
  if (restantes === Infinity || billing.hasActivePlan(currentUser)) {
    // Plano profissional ativo
    els.quotaCount.textContent = "∞";
    els.quotaCount.style.color = "#10b981";
    els.quotaLabel.textContent = currentLang === "pt"
      ? "Plano profissional ativo"
      : "Pro plan active";
  } else {
    // Modo gratuito
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
  if (els.langToggle) {
    els.langToggle.querySelectorAll(".lang-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.lang === lang);
    });
  }

  const isPt = lang === "pt";

  // Textos da interface
  if (isPt) {
    // Títulos
    if (els.formTitle) els.formTitle.textContent = "Gerador inteligente de descrições imobiliárias";
    if (els.formSubtitle) els.formSubtitle.textContent = "Insira os detalhes do imóvel e receba três versões prontas para anúncios, apresentações e discursos.";
    if (els.outputTitle) els.outputTitle.textContent = "Resultados gerados";
    
    // Labels
    if (els.labelPropertyType) els.labelPropertyType.textContent = "Tipo de imóvel";
    if (els.labelHeadline) els.labelHeadline.textContent = "Título / foco principal";
    if (els.labelBedrooms) els.labelBedrooms.textContent = "Quartos";
    if (els.labelBathrooms) els.labelBathrooms.textContent = "Banheiros";
    if (els.labelKitchens) els.labelKitchens.textContent = "Cozinhas";
    if (els.labelParking) els.labelParking.textContent = "Vagas de garagem";
    if (els.labelArea) els.labelArea.textContent = "Área (m²)";
    if (els.labelPrice) els.labelPrice.textContent = "Valor";
    if (els.labelAddress) els.labelAddress.textContent = "Morada / localização";
    if (els.labelLocationContext) els.labelLocationContext.textContent = "Contexto da localização";
    if (els.labelHighlights) els.labelHighlights.textContent = "Destaques e comodidades";
    if (els.labelExtras) els.labelExtras.textContent = "Observações / informações complementares";
    if (els.labelAudience) els.labelAudience.textContent = "Público-alvo";
    if (els.labelTone) els.labelTone.textContent = "Tom da comunicação";
    
    // Botões
    if (els.generateBtn) els.generateBtn.textContent = "Gerar descrições";
    if (els.copyAllBtn) els.copyAllBtn.textContent = "Copiar todas as versões";
    if (els.tabShort) els.tabShort.textContent = "Curta";
    if (els.tabMedium) els.tabMedium.textContent = "Média";
    if (els.tabLong) els.tabLong.textContent = "Longa";
    if (els.signOutBtn) els.signOutBtn.textContent = "Sair";
    
    // Paywall
    if (els.paywallTitle) els.paywallTitle.textContent = "Atualize o seu plano";
    if (els.paywallText) els.paywallText.textContent = "Você já utilizou as 3 gerações gratuitas do NAGI REAL ESTATE ASSISTANT. Para continuar a criar descrições ilimitadas, adquira o plano profissional.";
    if (els.paywallHint) els.paywallHint.textContent = 'Após o pagamento, você receberá um código por email. Digite-o aqui para ativar seu plano.';
    if (els.alreadyPaidBtn) els.alreadyPaidBtn.textContent = "Já paguei - Tenho um código";
    if (els.upgradeBtn) els.upgradeBtn.textContent = "🛒 Comprar Plano Profissional";
    
    // Benefícios
    if (els.benefitsList) {
      els.benefitsList.innerHTML = `
        <li>Gerações ilimitadas de descrições e discursos imobiliários</li>
        <li>Textos otimizados para anúncios online, impressos e apresentações</li>
        <li>Conteúdos sempre diferentes, persuasivos e encantadores</li>
      `;
    }
    
    // Placeholders
    if (els.fieldHeadline) els.fieldHeadline.placeholder = "Ex.: Luxuoso T3 com vista mar e varanda ampla";
    if (els.fieldPrice) els.fieldPrice.placeholder = "Ex.: 250.000 €, R$ 800.000, 1200 €/mês";
    if (els.fieldAddress) els.fieldAddress.placeholder = "Rua, bairro, cidade, país ou zona de referência";
    if (els.fieldLocationContext) els.fieldLocationContext.placeholder = "Próximo a escolas, praias, transportes, centros comerciais...";
    if (els.fieldHighlights) els.fieldHighlights.placeholder = "Piscina, varanda gourmet, suite, vista mar, mobiliado, condomínio com segurança 24h...";
    if (els.fieldExtras) els.fieldExtras.placeholder = "Informações específicas, regras do condomínio, possibilidade de financiamento, etc.";
  } else {
    // Inglês
    if (els.formTitle) els.formTitle.textContent = "Smart real estate copy generator";
    if (els.formSubtitle) els.formSubtitle.textContent = "Enter the property details and get three ready-to-use versions for ads, presentations and sales pitches.";
    if (els.outputTitle) els.outputTitle.textContent = "Generated results";
    
    if (els.labelPropertyType) els.labelPropertyType.textContent = "Property type";
    if (els.labelHeadline) els.labelHeadline.textContent = "Headline / main highlight";
    if (els.labelBedrooms) els.labelBedrooms.textContent = "Bedrooms";
    if (els.labelBathrooms) els.labelBathrooms.textContent = "Bathrooms";
    if (els.labelKitchens) els.labelKitchens.textContent = "Kitchens";
    if (els.labelParking) els.labelParking.textContent = "Parking spaces";
    if (els.labelArea) els.labelArea.textContent = "Area (m²)";
    if (els.labelPrice) els.labelPrice.textContent = "Price";
    if (els.labelAddress) els.labelAddress.textContent = "Address / location";
    if (els.labelLocationContext) els.labelLocationContext.textContent = "Location context";
    if (els.labelHighlights) els.labelHighlights.textContent = "Highlights & amenities";
    if (els.labelExtras) els.labelExtras.textContent = "Notes / additional information";
    if (els.labelAudience) els.labelAudience.textContent = "Target audience";
    if (els.labelTone) els.labelTone.textContent = "Tone of voice";
    
    if (els.generateBtn) els.generateBtn.textContent = "Generate descriptions";
    if (els.copyAllBtn) els.copyAllBtn.textContent = "Copy all versions";
    if (els.tabShort) els.tabShort.textContent = "Short";
    if (els.tabMedium) els.tabMedium.textContent = "Standard";
    if (els.tabLong) els.tabLong.textContent = "Extended";
    if (els.signOutBtn) els.signOutBtn.textContent = "Sign out";
    
    if (els.paywallTitle) els.paywallTitle.textContent = "Upgrade your plan";
    if (els.paywallText) els.paywallText.textContent = "You have already used the 3 free generations of NAGI REAL ESTATE ASSISTANT. To keep generating unlimited descriptions, buy the professional plan.";
    if (els.paywallHint) els.paywallHint.textContent = 'After payment, you will receive a code by email. Enter it here to activate your plan.';
    if (els.alreadyPaidBtn) els.alreadyPaidBtn.textContent = "I paid - I have a code";
    if (els.upgradeBtn) els.upgradeBtn.textContent = "🛒 Buy Professional Plan";
    
    if (els.benefitsList) {
      els.benefitsList.innerHTML = `
        <li>Unlimited real estate descriptions and sales scripts</li>
        <li>Copy optimized for online ads, print materials and presentations</li>
        <li>Always fresh, persuasive and engaging content</li>
      `;
    }
    
    if (els.fieldHeadline) els.fieldHeadline.placeholder = "Ex.: Luxury T3 with sea view and spacious balcony";
    if (els.fieldPrice) els.fieldPrice.placeholder = "Ex.: €250,000, $800,000, €1200/month";
    if (els.fieldAddress) els.fieldAddress.placeholder = "Street, neighborhood, city, country or reference area";
    if (els.fieldLocationContext) els.fieldLocationContext.placeholder = "Near schools, beaches, transport, shopping centers...";
    if (els.fieldHighlights) els.fieldHighlights.placeholder = "Pool, gourmet balcony, en-suite, sea view, furnished, 24h security...";
    if (els.fieldExtras) els.fieldExtras.placeholder = "Specific information, condo rules, financing possibilities, etc.";
  }
  
  atualizarQuotaUI();
}

// ==================== ABAS ====================
function clicarAba(tab) {
  // Atualizar botões das abas
  els.tabButtons.forEach((btn) => {
    if (btn.dataset.tab === tab) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
  
  // Mostrar conteúdo da aba selecionada
  Object.keys(els.outputs).forEach((key) => {
    if (els.outputs[key]) {
      if (key === tab) {
        els.outputs[key].classList.add("active");
      } else {
        els.outputs[key].classList.remove("active");
      }
    }
  });
}

// ==================== FORMULÁRIO ====================
function coletarDadosFormulario() {
  return {
    type: els.fieldType ? els.fieldType.value : "imóvel",
    headline: els.fieldHeadline ? els.fieldHeadline.value : "",
    bedrooms: els.fieldBedrooms ? parseInt(els.fieldBedrooms.value) || 0 : 0,
    bathrooms: els.fieldBathrooms ? parseInt(els.fieldBathrooms.value) || 0 : 0,
    kitchens: els.fieldKitchens ? parseInt(els.fieldKitchens.value) || 0 : 0,
    parking: els.fieldParking ? parseInt(els.fieldParking.value) || 0 : 0,
    area: els.fieldArea ? parseInt(els.fieldArea.value) || 0 : 0,
    price: els.fieldPrice ? els.fieldPrice.value : "",
    address: els.fieldAddress ? els.fieldAddress.value : "",
    locationContext: els.fieldLocationContext ? els.fieldLocationContext.value : "",
    highlights: els.fieldHighlights ? els.fieldHighlights.value : "",
    extras: els.fieldExtras ? els.fieldExtras.value : "",
    audience: els.fieldAudience ? els.fieldAudience.value : "geral",
    tone: els.fieldTone ? els.fieldTone.value : "encantador"
  };
}

function validarDadosFormulario(dados) {
  // Verificar se há pelo menos um campo preenchido
  return (
    dados.type ||
    dados.headline.trim() ||
    dados.bedrooms > 0 ||
    dados.bathrooms > 0 ||
    dados.area > 0 ||
    dados.address.trim() ||
    dados.locationContext.trim() ||
    dados.highlights.trim()
  );
}

function salvarFormulario() {
  const formData = coletarDadosFormulario();
  try {
    localStorage.setItem("nagi_form_data", JSON.stringify(formData));
  } catch (error) {
    console.warn("Não foi possível salvar os dados do formulário:", error);
  }
}

function carregarFormulario() {
  try {
    const saved = localStorage.getItem("nagi_form_data");
    if (!saved) return false;
    
    const data = JSON.parse(saved);
    
    if (els.fieldType) els.fieldType.value = data.type || "apartamento";
    if (els.fieldHeadline) els.fieldHeadline.value = data.headline || "";
    if (els.fieldBedrooms) els.fieldBedrooms.value = data.bedrooms || "";
    if (els.fieldBathrooms) els.fieldBathrooms.value = data.bathrooms || "";
    if (els.fieldKitchens) els.fieldKitchens.value = data.kitchens || "";
    if (els.fieldParking) els.fieldParking.value = data.parking || "";
    if (els.fieldArea) els.fieldArea.value = data.area || "";
    if (els.fieldPrice) els.fieldPrice.value = data.price || "";
    if (els.fieldAddress) els.fieldAddress.value = data.address || "";
    if (els.fieldLocationContext) els.fieldLocationContext.value = data.locationContext || "";
    if (els.fieldHighlights) els.fieldHighlights.value = data.highlights || "";
    if (els.fieldExtras) els.fieldExtras.value = data.extras || "";
    if (els.fieldAudience) els.fieldAudience.value = data.audience || "geral";
    if (els.fieldTone) els.fieldTone.value = data.tone || "encantador";
    
    return true;
  } catch (error) {
    console.warn("Não foi possível carregar os dados do formulário:", error);
    return false;
  }
}

function configurarAutoSave() {
  const formElements = [
    els.fieldType, els.fieldHeadline, els.fieldBedrooms, els.fieldBathrooms,
    els.fieldKitchens, els.fieldParking, els.fieldArea, els.fieldPrice,
    els.fieldAddress, els.fieldLocationContext, els.fieldHighlights,
    els.fieldExtras, els.fieldAudience, els.fieldTone
  ].filter(el => el !== null);
  
  formElements.forEach(element => {
    if (element) {
      element.addEventListener("input", () => {
        clearTimeout(formAutoSaveTimer);
        formAutoSaveTimer = setTimeout(salvarFormulario, 500);
      });
      
      element.addEventListener("change", salvarFormulario);
    }
  });
}

function carregarDadosDemo() {
  if (localStorage.getItem("nagi_first_visit") !== "completed") {
    // Carregar dados de exemplo
    if (els.fieldType) els.fieldType.value = "apartamento";
    if (els.fieldHeadline) els.fieldHeadline.value = currentLang === "pt" 
      ? "Luxuoso T3 com vista mar e varanda ampla" 
      : "Luxury T3 with sea view and spacious balcony";
    if (els.fieldBedrooms) els.fieldBedrooms.value = "3";
    if (els.fieldBathrooms) els.fieldBathrooms.value = "2";
    if (els.fieldKitchens) els.fieldKitchens.value = "1";
    if (els.fieldParking) els.fieldParking.value = "1";
    if (els.fieldArea) els.fieldArea.value = "120";
    if (els.fieldPrice) els.fieldPrice.value = currentLang === "pt" ? "350.000 €" : "€350,000";
    if (els.fieldAddress) els.fieldAddress.value = currentLang === "pt" ? "Zona Ribeirinha, Lisboa" : "Riverside Area, Lisbon";
    if (els.fieldLocationContext) els.fieldLocationContext.value = currentLang === "pt" 
      ? "Próximo ao centro comercial, transporte público e escolas" 
      : "Near shopping center, public transport and schools";
    if (els.fieldHighlights) els.fieldHighlights.value = currentLang === "pt"
      ? "Vista mar, varanda gourmet, cozinha equipada, ar condicionado"
      : "Sea view, gourmet balcony, equipped kitchen, air conditioning";
    if (els.fieldExtras) els.fieldExtras.value = currentLang === "pt"
      ? "Condomínio com piscina e ginásio. Possibilidade de financiamento bancário."
      : "Condominium with pool and gym. Bank financing available.";
    if (els.fieldAudience) els.fieldAudience.value = "familias";
    if (els.fieldTone) els.fieldTone.value = "premium";
    
    localStorage.setItem("nagi_first_visit", "completed");
    salvarFormulario();
  }
}

// ==================== GERAÇÃO DE CONTEÚDO ====================
async function gerarConteudo() {
  if (isGenerating) return;
  
  // Verificar permissão
  if (!verificarPermissaoGeracao()) return;
  
  // Coletar dados do formulário
  const formData = coletarDadosFormulario();
  
  // Validar dados
  if (!validarDadosFormulario(formData)) {
    mostrarStatus(
      currentLang === "pt"
        ? "Preencha pelo menos um campo principal do imóvel."
        : "Fill in at least one main property field.",
      true
    );
    return;
  }
  
  // Mostrar estado de carregamento
  isGenerating = true;
  const originalBtnText = els.generateBtn.textContent;
  els.generateBtn.textContent = currentLang === "pt" ? "Gerando..." : "Generating...";
  els.generateBtn.disabled = true;
  
  try {
    // Gerar descrições
    const results = generateDescriptions(formData, currentLang);
    
    // Atualizar interface com resultados
    if (els.outputs.short) els.outputs.short.textContent = results.short || "";
    if (els.outputs.medium) els.outputs.medium.textContent = results.medium || "";
    if (els.outputs.long) els.outputs.long.textContent = results.long || "";
    
    // Registrar uso e atualizar quota
    billing.registerGeneration(currentUser);
    atualizarQuotaUI();
    
    // Mostrar primeira aba
    clicarAba("short");
    
    // Salvar dados do formulário
    salvarFormulario();
    
    // Mostrar mensagem de sucesso
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
    
    // Mostrar mensagem de erro nas saídas
    const errorMessage = currentLang === "pt"
      ? "Ocorreu um erro ao gerar as descrições. Por favor, verifique os dados inseridos e tente novamente."
      : "An error occurred while generating descriptions. Please check your input and try again.";
    
    if (els.outputs.short) els.outputs.short.textContent = errorMessage;
    if (els.outputs.medium) els.outputs.medium.textContent = errorMessage;
    if (els.outputs.long) els.outputs.long.textContent = errorMessage;
    
  } finally {
    // Restaurar estado do botão
    isGenerating = false;
    els.generateBtn.textContent = originalBtnText;
    els.generateBtn.disabled = !currentUser;
  }
}

// ==================== COPIAR CONTEÚDO ====================
async function copiarTodoConteudo() {
  if (!els.outputs.short || !els.outputs.medium || !els.outputs.long) return;
  
  const combined = [
    els.outputs.short.textContent.trim(),
    els.outputs.medium.textContent.trim(),
    els.outputs.long.textContent.trim()
  ]
    .filter(text => text.length > 0)
    .join("\n\n---\n\n");
  
  if (!combined) {
    mostrarStatus(
      currentLang === "pt"
        ? "Nenhum conteúdo para copiar."
        : "No content to copy.",
      true
    );
    return;
  }
  
  try {
    await navigator.clipboard.writeText(combined);
    mostrarStatus(
      currentLang === "pt"
        ? "✅ Conteúdo copiado para a área de transferência!"
        : "✅ Content copied to clipboard!"
    );
  } catch (error) {
    // Fallback para navegadores mais antigos
    const textArea = document.createElement("textarea");
    textArea.value = combined;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      const successful = document.execCommand("copy");
      if (successful) {
        mostrarStatus(
          currentLang === "pt"
            ? "✅ Conteúdo copiado!"
            : "✅ Content copied!"
        );
      } else {
        throw new Error("Fallback copy failed");
      }
    } catch (err) {
      mostrarStatus(
        currentLang === "pt"
          ? "❌ Não foi possível copiar. Selecione e copie manualmente."
          : "❌ Unable to copy. Please select and copy manually.",
        true
      );
    } finally {
      document.body.removeChild(textArea);
    }
  }
}

// ==================== PAYWALL ====================
function mostrarPaywall() {
  if (els.paywallOverlay) {
    els.paywallOverlay.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }
}

function esconderPaywall() {
  if (els.paywallOverlay) {
    els.paywallOverlay.classList.add("hidden");
    document.body.style.overflow = "";
  }
}

// ==================== VERIFICAÇÃO DE CÓDIGO ====================
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
             id="code-input" 
             placeholder="Ex: 123456"
             style="width: 100%; padding: 15px; font-size: 20px; text-align: center; border-radius: 8px; border: 2px solid #f97316; margin-bottom: 20px; letter-spacing: 3px;"
             maxlength="6"
             inputmode="numeric">
      
      <button id="activate-btn" class="primary-btn" style="padding: 12px 24px; font-size: 16px; margin-right: 10px;">
        ✅ ATIVAR PLANO
      </button>
      
      <button id="cancel-btn" class="ghost-btn" style="padding: 12px 24px; font-size: 16px;">
        ❌ CANCELAR
      </button>
      
      <div style="margin-top: 20px; padding: 15px; background: rgba(249, 115, 22, 0.1); border-radius: 8px;">
        <p style="margin: 0; font-size: 14px; color: #fb923c;">
          <strong>Não tem código?</strong><br>
          Envie um email para <strong>suporte@seudominio.com</strong>
        </p>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  const activateBtn = modal.querySelector("#activate-btn");
  const cancelBtn = modal.querySelector("#cancel-btn");
  const codeInput = modal.querySelector("#code-input");
  
  // Função para verificar código
  const verifyCode = () => {
    const code = codeInput.value.trim();
    
    if (code.length !== 6 || !/^\d+$/.test(code)) {
      mostrarStatus("Por favor, digite um código válido de 6 dígitos.", true);
      return;
    }
    
    // Verificar se o código está na lista
    const codeIndex = CODIGOS_ATIVOS.indexOf(code);
    if (codeIndex !== -1) {
      // Código válido - remover da lista e ativar plano
      CODIGOS_ATIVOS.splice(codeIndex, 1);
      billing.activatePlan(currentUser);
      atualizarQuotaUI();
      esconderPaywall();
      document.body.removeChild(modal);
      mostrarStatus("✅ Plano ativado com sucesso!");
    } else {
      mostrarStatus("❌ Código inválido. Verifique e tente novamente.", true);
    }
  };
  
  // Event listeners
  activateBtn.addEventListener("click", verifyCode);
  
  cancelBtn.addEventListener("click", () => {
    document.body.removeChild(modal);
  });
  
  codeInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      verifyCode();
    }
  });
  
  // Focar no input
  setTimeout(() => codeInput.focus(), 100);
}

// ==================== LINK DE PAGAMENTO ====================
function abrirLinkPagamento() {
  if (!currentUser) {
    mostrarStatus("Faça login primeiro para comprar o plano.", true);
    return;
  }
  
  // SUBSTITUA ESTE LINK PELO SEU LINK DE PAGAMENTO REAL
  const paymentLink = "https://www.paypal.com/ncp/payment/YBLWPYKEZBBZC";
  
  window.open(paymentLink, "_blank");
  mostrarStatus("Redirecionando para página de pagamento...");
}

// ==================== PAINEL ADMINISTRATIVO PROTEGIDO ====================
function mostrarPainelAdmin() {
  // Pedir senha primeiro
  const passwordModal = document.createElement("div");
  passwordModal.className = "overlay";
  passwordModal.style.zIndex = "1002";
  
  passwordModal.innerHTML = `
    <div class="overlay-content" style="max-width: 350px; text-align: center;">
      <h2 style="color: #f97316; margin-bottom: 20px;">🔐 ACESSO ADMINISTRATIVO</h2>
      <p style="margin-bottom: 20px; color: #9ca3af;">
        Digite a senha de administrador:
      </p>
      
      <input type="password" 
             id="admin-password" 
             placeholder="Senha"
             style="width: 100%; padding: 12px; font-size: 16px; text-align: center; border-radius: 8px; border: 2px solid #f97316; margin-bottom: 20px;"
             autocomplete="off">
      
      <button id="submit-password" class="primary-btn" style="padding: 12px 24px; font-size: 16px; margin-right: 10px;">
        🔑 ENTRAR
      </button>
      
      <button id="cancel-password" class="ghost-btn" style="padding: 12px 24px; font-size: 16px;">
        ❌ CANCELAR
      </button>
      
      <p style="margin-top: 20px; font-size: 12px; color: #6b7280;">
        Apenas administradores autorizados.
      </p>
    </div>
  `;
  
  document.body.appendChild(passwordModal);
  
  const submitBtn = passwordModal.querySelector("#submit-password");
  const cancelBtn = passwordModal.querySelector("#cancel-password");
  const passwordInput = passwordModal.querySelector("#admin-password");
  
  submitBtn.addEventListener("click", () => {
    if (passwordInput.value === ADMIN_PASSWORD) {
      document.body.removeChild(passwordModal);
      mostrarDashboardAdmin();
    } else {
      mostrarStatus("❌ Senha incorreta!", true);
      passwordInput.value = "";
      passwordInput.focus();
    }
  });
  
  cancelBtn.addEventListener("click", () => {
    document.body.removeChild(passwordModal);
  });
  
  passwordInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      submitBtn.click();
    }
  });
  
  setTimeout(() => passwordInput.focus(), 100);
}

function mostrarDashboardAdmin() {
  // Gerar novos códigos
  const newCodes = [];
  for (let i = 0; i < 5; i++) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    newCodes.push(code);
    CODIGOS_ATIVOS.push(code);
  }
  
  const dashboard = document.createElement("div");
  dashboard.className = "overlay";
  dashboard.style.zIndex = "1003";
  
  dashboard.innerHTML = `
    <div class="overlay-content" style="max-width: 600px;">
      <h2 style="color: #f97316; margin-bottom: 20px;">📊 PAINEL ADMINISTRATIVO NAGI</h2>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
        <div style="background: #0f172a; padding: 15px; border-radius: 10px;">
          <h3 style="font-size: 14px; margin-bottom: 10px;">🆕 NOVOS CÓDIGOS</h3>
          <div style="font-family: monospace; font-size: 18px; line-height: 1.8;">
            ${newCodes.map(code => `<div>${code}</div>`).join('')}
          </div>
          <button id="copy-new-codes" style="margin-top: 10px; padding: 8px 15px; background: #10b981; color: white; border: none; border-radius: 5px; cursor: pointer; width: 100%;">
            📋 Copiar Novos Códigos
          </button>
        </div>
        
        <div style="background: #0f172a; padding: 15px; border-radius: 10px;">
          <h3 style="font-size: 14px; margin-bottom: 10px;">📈 ESTATÍSTICAS</h3>
          <div style="font-size: 14px;">
            <div style="margin-bottom: 8px;">Códigos ativos: <strong>${CODIGOS_ATIVOS.length}</strong></div>
            <div style="margin-bottom: 8px;">Usuário atual: <strong>${currentUser ? currentUser.name : 'Nenhum'}</strong></div>
            <div style="margin-bottom: 8px;">Plano ativo: <strong>${billing.hasActivePlan(currentUser) ? 'Sim' : 'Não'}</strong></div>
          </div>
          <button id="generate-more" style="margin-top: 10px; padding: 8px 15px; background: #f97316; color: white; border: none; border-radius: 5px; cursor: pointer; width: 100%;">
            🎲 Gerar Mais 5 Códigos
          </button>
        </div>
      </div>
      
      <div style="background: #0f172a; padding: 15px; border-radius: 10px; margin-bottom: 20px; max-height: 200px; overflow-y: auto;">
        <h3 style="font-size: 14px; margin-bottom: 10px;">📋 TODOS OS CÓDIGOS ATIVOS (${CODIGOS_ATIVOS.length})</h3>
        <div style="font-family: monospace; font-size: 14px; column-count: 2;">
          ${CODIGOS_ATIVOS.length > 0 
            ? CODIGOS_ATIVOS.map(code => `<div style="padding: 3px 0;">${code}</div>`).join('') 
            : '<div style="color: #9ca3af;">Nenhum código ativo</div>'}
        </div>
      </div>
      
      <div style="display: flex; gap: 10px;">
        <button id="clear-all-codes" class="ghost-btn" style="flex: 1; padding: 12px;">
          🗑️ Limpar Todos os Códigos
        </button>
        <button id="close-dashboard" class="primary-btn" style="flex: 1; padding: 12px;">
          ✅ Fechar Painel
        </button>
      </div>
      
      <div style="margin-top: 20px; padding: 15px; background: rgba(249, 115, 22, 0.1); border-radius: 8px;">
        <h4 style="margin: 0 0 10px 0; font-size: 13px;">📝 INSTRUÇÕES:</h4>
        <ol style="margin: 0; padding-left: 20px; font-size: 12px; color: #9ca3af;">
          <li>Copie um código e envie para o cliente que pagou</li>
          <li>O cliente digita o código no site para ativar o plano</li>
          <li>Os códigos são removidos automaticamente após uso</li>
          <li>Gere novos códigos quando necessário</li>
        </ol>
      </div>
    </div>
  `;
  
  document.body.appendChild(dashboard);
  
  // Event listeners do dashboard
  document.getElementById("copy-new-codes").addEventListener("click", () => {
    navigator.clipboard.writeText(newCodes.join('\n'));
    mostrarStatus("✅ Novos códigos copiados!");
  });
  
  document.getElementById("generate-more").addEventListener("click", () => {
    document.body.removeChild(dashboard);
    mostrarDashboardAdmin(); // Recarregar com novos códigos
  });
  
  document.getElementById("clear-all-codes").addEventListener("click", () => {
    if (confirm("Tem certeza que deseja limpar TODOS os códigos ativos?")) {
      CODIGOS_ATIVOS = [];
      document.body.removeChild(dashboard);
      mostrarDashboardAdmin();
      mostrarStatus("✅ Todos os códigos foram removidos.");
    }
  });
  
  document.getElementById("close-dashboard").addEventListener("click", () => {
    document.body.removeChild(dashboard);
  });
}

// ==================== CONFIGURAR EVENT LISTENERS ====================
function configurarEventListeners() {
  // Idioma
  if (els.langToggle) {
    els.langToggle.addEventListener("click", (e) => {
      const btn = e.target.closest(".lang-btn");
      if (btn) {
        aplicarIdioma(btn.dataset.lang);
      }
    });
  }
  
  // Abas
  if (els.tabButtons) {
    els.tabButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        clicarAba(btn.dataset.tab);
      });
    });
  }
  
  // Formulário - prevenir comportamento padrão
  if (els.form) {
    els.form.addEventListener("submit", (e) => {
      e.preventDefault();
      gerarConteudo();
    });
  }
  
  // Copiar tudo
  if (els.copyAllBtn) {
    els.copyAllBtn.addEventListener("click", copiarTodoConteudo);
  }
  
  // Sair
  if (els.signOutBtn) {
    els.signOutBtn.addEventListener("click", () => {
      auth.signOut();
    });
  }
  
  // Botão "Já paguei"
  if (els.alreadyPaidBtn) {
    els.alreadyPaidBtn.addEventListener("click", mostrarVerificacaoCodigo);
  }
  
  // Botão "Comprar Plano"
  if (els.upgradeBtn) {
    els.upgradeBtn.addEventListener("click", abrirLinkPagamento);
  }
  
  // Fechar paywall ao clicar fora
  if (els.paywallOverlay) {
    els.paywallOverlay.addEventListener("click", (e) => {
      if (e.target === els.paywallOverlay) {
        esconderPaywall();
      }
    });
  }
  
  // Fechar com ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && els.paywallOverlay && !els.paywallOverlay.classList.contains("hidden")) {
      esconderPaywall();
    }
  });
  
  // Validação de campos numéricos
  const numberFields = [
    els.fieldBedrooms, els.fieldBathrooms, els.fieldKitchens, 
    els.fieldParking, els.fieldArea
  ].filter(field => field !== null);
  
  numberFields.forEach(field => {
    field.addEventListener("input", () => {
      if (field.value < 0) field.value = 0;
      if (field.value > 999) field.value = 999;
    });
  });
  
  // Atalho para painel admin (Ctrl+Alt+Shift+A)
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.altKey && e.shiftKey && e.key === "A") {
      e.preventDefault();
      mostrarPainelAdmin();
    }
  });
}

// ==================== INICIALIZAÇÃO ====================
function inicializar() {
  console.log("Inicializando NAGI Real Estate Assistant...");
  
  // Detectar idioma do navegador
  const browserLang = navigator.language || navigator.userLanguage;
  currentLang = browserLang.toLowerCase().startsWith("pt") ? "pt" : "en";
  
  // Aplicar idioma
  aplicarIdioma(currentLang);
  
  // Configurar listener de autenticação
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
  
  // Carregar dados demo (primeira visita)
  carregarDadosDemo();
  
  // Carregar dados salvos
  carregarFormulario();
  
  // Configurar event listeners
  configurarEventListeners();
  
  console.log("✅ NAGI Real Estate Assistant inicializado com sucesso!");
}

// ==================== INICIAR APLICAÇÃO ====================
document.addEventListener("DOMContentLoaded", inicializar);