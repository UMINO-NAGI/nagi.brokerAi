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
  activateCodeBtn: document.getElementById("activate-code-btn"),
  closePaywallBtn: document.getElementById("close-paywall-btn"),
  verificationCodeInput: document.getElementById("verification-code"),
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
  googleLoginBtn: document.getElementById("google-login-btn"),
  
  // Campos do formulário
  fieldType: document.getElementById("property-type"),
  fieldHeadline: document.getElementById("headline"),
  fieldBedrooms: document.getElementById("bedrooms"),
  fieldBathrooms: document.getElementById("bathrooms"),
  fieldArea: document.getElementById("area"),
  fieldParking: document.getElementById("parking"),
  fieldPrice: document.getElementById("price"),
  fieldAddress: document.getElementById("address"),
  fieldHighlights: document.getElementById("highlights"),
  fieldAudience: document.getElementById("audience"),
  fieldTone: document.getElementById("tone"),
  
  // Labels & abas (para tradução)
  labelPropertyType: document.getElementById("label-property-type"),
  labelHeadline: document.getElementById("label-headline"),
  labelBedrooms: document.getElementById("label-bedrooms"),
  labelBathrooms: document.getElementById("label-bathrooms"),
  labelArea: document.getElementById("label-area"),
  labelParking: document.getElementById("label-parking"),
  labelPrice: document.getElementById("label-price"),
  labelAddress: document.getElementById("label-address"),
  labelHighlights: document.getElementById("label-highlights"),
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
const ADMIN_PASSWORD = "948399692Se@";
let CODIGOS_ATIVOS = ["123456", "654321", "789012"];

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

// ==================== AUTENTICAÇÃO SIMPLIFICADA ====================
function inicializarGoogleLogin() {
  if (!els.googleLoginBtn) return;
  
  els.googleLoginBtn.addEventListener("click", () => {
    if (typeof google === 'undefined') {
      mostrarStatus("Google Sign-In não carregado. Recarregue a página.", true);
      return;
    }
    
    const clientId = "54495922404-90dpm3542ktljge07ntttaa6vdt6ffco.apps.googleusercontent.com";
    
    // Criar um iframe para o login do Google
    const googleLoginWindow = document.createElement('div');
    googleLoginWindow.id = 'google-login-window';
    googleLoginWindow.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.8);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    googleLoginWindow.innerHTML = `
      <div style="background: white; padding: 30px; border-radius: 10px; max-width: 400px; width: 90%; text-align: center;">
        <h3 style="color: #333; margin-bottom: 20px;">Login com Google</h3>
        <div id="google-login-button"></div>
        <button id="cancel-google-login" style="margin-top: 20px; padding: 10px 20px; background: #ccc; border: none; border-radius: 5px; cursor: pointer;">
          Cancelar
        </button>
      </div>
    `;
    
    document.body.appendChild(googleLoginWindow);
    
    // Configurar Google Sign-In
    google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => {
        console.log("Google login response:", response);
        if (response.credential) {
          auth.handleGoogleCredential(response.credential);
          document.body.removeChild(googleLoginWindow);
          mostrarStatus("Login realizado com sucesso!");
        }
      },
      context: 'signin',
      ux_mode: 'popup',
      auto_select: false
    });
    
    // Renderizar botão do Google
    google.accounts.id.renderButton(
      document.getElementById('google-login-button'),
      { 
        theme: 'outline', 
        size: 'large',
        width: 300,
        text: 'signin_with',
        shape: 'rectangular',
        logo_alignment: 'left'
      }
    );
    
    // Botão cancelar
    document.getElementById('cancel-google-login').addEventListener('click', () => {
      document.body.removeChild(googleLoginWindow);
    });
  });
}

// Listener de mudança de autenticação
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
      els.userAvatar.alt = currentUser.name;
      els.userAvatar.classList.remove("hidden");
    } else {
      els.userAvatar.classList.add("hidden");
    }
    
    if (els.loginWarning) {
      els.loginWarning.classList.add("hidden");
    }
    
    if (els.generateBtn) {
      els.generateBtn.disabled = false;
    }
    
    if (els.copyAllBtn) {
      els.copyAllBtn.disabled = false;
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
    
    if (els.copyAllBtn) {
      els.copyAllBtn.disabled = true;
    }
    
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
    if (els.labelArea) els.labelArea.textContent = "Área (m²)";
    if (els.labelParking) els.labelParking.textContent = "Vagas de garagem";
    if (els.labelPrice) els.labelPrice.textContent = "Valor";
    if (els.labelAddress) els.labelAddress.textContent = "Morada / localização";
    if (els.labelHighlights) els.labelHighlights.textContent = "Destaques e comodidades";
    if (els.labelAudience) els.labelAudience.textContent = "Público-alvo";
    if (els.labelTone) els.labelTone.textContent = "Tom da comunicação";
    
    // Botões
    if (els.generateBtn) els.generateBtn.textContent = "Gerar descrições";
    if (els.copyAllBtn) els.copyAllBtn.textContent = "Copiar todas as versões";
    if (els.tabShort) els.tabShort.textContent = "Curta";
    if (els.tabMedium) els.tabMedium.textContent = "Média";
    if (els.tabLong) els.tabLong.textContent = "Longa";
    if (els.signOutBtn) els.signOutBtn.textContent = "Sair";
    if (els.googleLoginBtn) els.googleLoginBtn.innerHTML = `
      <svg style="width:20px;height:20px;margin-right:8px;" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      Entrar com Google
    `;
    if (els.upgradeBtn) els.upgradeBtn.textContent = "🛒 Comprar Plano Profissional";
    if (els.activateCodeBtn) els.activateCodeBtn.textContent = "✅ Ativar com Código";
    if (els.closePaywallBtn) els.closePaywallBtn.textContent = "Fechar";
    
    // Paywall
    if (els.paywallTitle) els.paywallTitle.textContent = "Atualize o seu plano";
    if (els.paywallText) els.paywallText.textContent = "Você já utilizou as 3 gerações gratuitas do NAGI REAL ESTATE ASSISTANT. Para continuar a criar descrições ilimitadas, adquira o plano profissional.";
    if (els.paywallHint) els.paywallHint.textContent = 'Após o pagamento, você receberá um código por email. Digite-o aqui para ativar seu plano.';
    
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
    if (els.fieldHighlights) els.fieldHighlights.placeholder = "Piscina, varanda gourmet, suite, vista mar, mobiliado, condomínio com segurança 24h...";
    if (els.verificationCodeInput) els.verificationCodeInput.placeholder = "Código de 6 dígitos";
  } else {
    // Inglês
    if (els.formTitle) els.formTitle.textContent = "Smart real estate copy generator";
    if (els.formSubtitle) els.formSubtitle.textContent = "Enter the property details and get three ready-to-use versions for ads, presentations and sales pitches.";
    if (els.outputTitle) els.outputTitle.textContent = "Generated results";
    
    if (els.labelPropertyType) els.labelPropertyType.textContent = "Property type";
    if (els.labelHeadline) els.labelHeadline.textContent = "Headline / main highlight";
    if (els.labelBedrooms) els.labelBedrooms.textContent = "Bedrooms";
    if (els.labelBathrooms) els.labelBathrooms.textContent = "Bathrooms";
    if (els.labelArea) els.labelArea.textContent = "Area (m²)";
    if (els.labelParking) els.labelParking.textContent = "Parking spaces";
    if (els.labelPrice) els.labelPrice.textContent = "Price";
    if (els.labelAddress) els.labelAddress.textContent = "Address / location";
    if (els.labelHighlights) els.labelHighlights.textContent = "Highlights & amenities";
    if (els.labelAudience) els.labelAudience.textContent = "Target audience";
    if (els.labelTone) els.labelTone.textContent = "Tone of voice";
    
    if (els.generateBtn) els.generateBtn.textContent = "Generate descriptions";
    if (els.copyAllBtn) els.copyAllBtn.textContent = "Copy all versions";
    if (els.tabShort) els.tabShort.textContent = "Short";
    if (els.tabMedium) els.tabMedium.textContent = "Standard";
    if (els.tabLong) els.tabLong.textContent = "Extended";
    if (els.signOutBtn) els.signOutBtn.textContent = "Sign out";
    if (els.googleLoginBtn) els.googleLoginBtn.innerHTML = `
      <svg style="width:20px;height:20px;margin-right:8px;" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      Sign in with Google
    `;
    if (els.upgradeBtn) els.upgradeBtn.textContent = "🛒 Buy Professional Plan";
    if (els.activateCodeBtn) els.activateCodeBtn.textContent = "✅ Activate with Code";
    if (els.closePaywallBtn) els.closePaywallBtn.textContent = "Close";
    
    if (els.paywallTitle) els.paywallTitle.textContent = "Upgrade your plan";
    if (els.paywallText) els.paywallText.textContent = "You have already used the 3 free generations of NAGI REAL ESTATE ASSISTANT. To keep generating unlimited descriptions, buy the professional plan.";
    if (els.paywallHint) els.paywallHint.textContent = 'After payment, you will receive a code by email. Enter it here to activate your plan.';
    
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
    if (els.fieldHighlights) els.fieldHighlights.placeholder = "Pool, gourmet balcony, en-suite, sea view, furnished, 24h security...";
    if (els.verificationCodeInput) els.verificationCodeInput.placeholder = "6-digit code";
  }
  
  atualizarQuotaUI();
}

// ==================== ABAS ====================
function clicarAba(tab) {
  els.tabButtons.forEach((btn) => {
    if (btn.dataset.tab === tab) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
  
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
    type: els.fieldType ? els.fieldType.value : "apartamento",
    headline: els.fieldHeadline ? els.fieldHeadline.value : "",
    bedrooms: els.fieldBedrooms ? parseInt(els.fieldBedrooms.value) || 0 : 0,
    bathrooms: els.fieldBathrooms ? parseInt(els.fieldBathrooms.value) || 0 : 0,
    area: els.fieldArea ? parseInt(els.fieldArea.value) || 0 : 0,
    parking: els.fieldParking ? parseInt(els.fieldParking.value) || 0 : 0,
    price: els.fieldPrice ? els.fieldPrice.value : "",
    location: els.fieldAddress ? els.fieldAddress.value : "",
    highlights: els.fieldHighlights ? els.fieldHighlights.value : "",
    audience: els.fieldAudience ? els.fieldAudience.value : "familias",
    tone: els.fieldTone ? els.fieldTone.value : "profissional"
  };
}

function validarDadosFormulario(dados) {
  return (
    dados.type ||
    dados.headline.trim() ||
    dados.bedrooms > 0 ||
    dados.bathrooms > 0 ||
    dados.area > 0 ||
    dados.location.trim() ||
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
    if (els.fieldArea) els.fieldArea.value = data.area || "";
    if (els.fieldParking) els.fieldParking.value = data.parking || "";
    if (els.fieldPrice) els.fieldPrice.value = data.price || "";
    if (els.fieldAddress) els.fieldAddress.value = data.location || "";
    if (els.fieldHighlights) els.fieldHighlights.value = data.highlights || "";
    if (els.fieldAudience) els.fieldAudience.value = data.audience || "familias";
    if (els.fieldTone) els.fieldTone.value = data.tone || "profissional";
    
    return true;
  } catch (error) {
    console.warn("Não foi possível carregar os dados do formulário:", error);
    return false;
  }
}

function configurarAutoSave() {
  const formElements = [
    els.fieldType, els.fieldHeadline, els.fieldBedrooms, els.fieldBathrooms,
    els.fieldArea, els.fieldParking, els.fieldPrice, els.fieldAddress,
    els.fieldHighlights, els.fieldAudience, els.fieldTone
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
    if (els.fieldType) els.fieldType.value = "apartamento";
    if (els.fieldHeadline) els.fieldHeadline.value = currentLang === "pt" 
      ? "Luxuoso T3 com vista mar e varanda ampla" 
      : "Luxury T3 with sea view and spacious balcony";
    if (els.fieldBedrooms) els.fieldBedrooms.value = "3";
    if (els.fieldBathrooms) els.fieldBathrooms.value = "2";
    if (els.fieldArea) els.fieldArea.value = "120";
    if (els.fieldParking) els.fieldParking.value = "1";
    if (els.fieldPrice) els.fieldPrice.value = currentLang === "pt" ? "350.000 €" : "€350,000";
    if (els.fieldAddress) els.fieldAddress.value = currentLang === "pt" ? "Zona Ribeirinha, Lisboa" : "Riverside Area, Lisbon";
    if (els.fieldHighlights) els.fieldHighlights.value = currentLang === "pt"
      ? "Vista mar, varanda gourmet, cozinha equipada, ar condicionado"
      : "Sea view, gourmet balcony, equipped kitchen, air conditioning";
    if (els.fieldAudience) els.fieldAudience.value = "familias";
    if (els.fieldTone) els.fieldTone.value = "profissional";
    
    localStorage.setItem("nagi_first_visit", "completed");
    salvarFormulario();
  }
}

// ==================== GERAÇÃO DE CONTEÚDO ====================
async function gerarConteudo() {
  if (isGenerating) return;
  
  if (!verificarPermissaoGeracao()) return;
  
  const formData = coletarDadosFormulario();
  
  if (!validarDadosFormulario(formData)) {
    mostrarStatus(
      currentLang === "pt"
        ? "Preencha pelo menos um campo principal do imóvel."
        : "Fill in at least one main property field.",
      true
    );
    return;
  }
  
  isGenerating = true;
  const originalBtnText = els.generateBtn.textContent;
  els.generateBtn.textContent = currentLang === "pt" ? "Gerando..." : "Generating...";
  els.generateBtn.disabled = true;
  
  try {
    const results = generateDescriptions(formData, currentLang);
    
    if (els.outputs.short) els.outputs.short.textContent = results.short || "";
    if (els.outputs.medium) els.outputs.medium.textContent = results.medium || "";
    if (els.outputs.long) els.outputs.long.textContent = results.long || "";
    
    billing.registerGeneration(currentUser);
    atualizarQuotaUI();
    
    clicarAba("short");
    
    salvarFormulario();
    
    mostrarStatus(
      currentLang === "pt"
        ? "✅ Descrições geradas com sucesso!"
        : "✅ Descriptions generated successfully!"
    );
    
  } catch (error) {
    console.error("Erro na geração:", error);
    mostrarStatus(
      currentLang === "pt"
        ? "❌ Erro ao gerar descrições. Tente novamente."
        : "❌ Error generating descriptions. Please try again.",
      true
    );
    
    const errorMessage = currentLang === "pt"
      ? "Ocorreu um erro ao gerar as descrições. Por favor, verifique os dados inseridos e tente novamente."
      : "An error occurred while generating descriptions. Please check your input and try again.";
    
    if (els.outputs.short) els.outputs.short.textContent = errorMessage;
    if (els.outputs.medium) els.outputs.medium.textContent = errorMessage;
    if (els.outputs.long) els.outputs.long.textContent = errorMessage;
    
  } finally {
    isGenerating = false;
    els.generateBtn.textContent = originalBtnText;
    els.generateBtn.disabled = !currentUser;
  }
}

// ==================== COPIAR CONTEÚDO ====================
async function copiarTodoConteudo() {
  if (!els.outputs.short || !els.outputs.medium || !els.outputs.long) return;
  
  const short = els.outputs.short.textContent.trim();
  const medium = els.outputs.medium.textContent.trim();
  const long = els.outputs.long.textContent.trim();
  
  const combined = [short, medium, long]
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
    if (els.verificationCodeInput) {
      els.verificationCodeInput.value = "";
    }
  }
}

function esconderPaywall() {
  if (els.paywallOverlay) {
    els.paywallOverlay.classList.add("hidden");
    document.body.style.overflow = "";
  }
}

function verificarCodigoAtivacao() {
  const codigo = els.verificationCodeInput ? els.verificationCodeInput.value.trim() : "";
  
  if (!codigo || codigo.length !== 6) {
    mostrarStatus(
      currentLang === "pt"
        ? "Por favor, digite um código válido de 6 dígitos."
        : "Please enter a valid 6-digit code.",
      true
    );
    return;
  }
  
  const index = CODIGOS_ATIVOS.indexOf(codigo);
  if (index !== -1) {
    CODIGOS_ATIVOS.splice(index, 1);
    billing.activateMonthlyPlan(currentUser);
    atualizarQuotaUI();
    esconderPaywall();
    
    mostrarStatus(
      currentLang === "pt"
        ? "✅ Plano ativado com sucesso! Agora você tem gerações ilimitadas."
        : "✅ Plan activated successfully! You now have unlimited generations."
    );
  } else {
    mostrarStatus(
      currentLang === "pt"
        ? "❌ Código inválido. Verifique e tente novamente."
        : "❌ Invalid code. Please check and try again.",
      true
    );
  }
}

function abrirLinkPagamento() {
  if (!currentUser) {
    mostrarStatus("Faça login primeiro para comprar o plano.", true);
    return;
  }
  
  const paymentLink = "https://www.paypal.com/ncp/payment/YBLWPYKEZBBZC";
  window.open(paymentLink, "_blank");
  
  mostrarStatus(
    currentLang === "pt"
      ? "Redirecionando para página de pagamento..."
      : "Redirecting to payment page..."
  );
}

// ==================== PAINEL ADMINISTRATIVO ====================
function mostrarPainelAdmin() {
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
  
  document.getElementById("copy-new-codes").addEventListener("click", () => {
    navigator.clipboard.writeText(newCodes.join('\n'));
    mostrarStatus("✅ Novos códigos copiados!");
  });
  
  document.getElementById("generate-more").addEventListener("click", () => {
    document.body.removeChild(dashboard);
    mostrarDashboardAdmin();
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
  
  // Formulário
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
  
  // Paywall
  if (els.upgradeBtn) {
    els.upgradeBtn.addEventListener("click", abrirLinkPagamento);
  }
  
  if (els.activateCodeBtn) {
    els.activateCodeBtn.addEventListener("click", verificarCodigoAtivacao);
  }
  
  if (els.closePaywallBtn) {
    els.closePaywallBtn.addEventListener("click", esconderPaywall);
  }
  
  // Ativar código com Enter
  if (els.verificationCodeInput) {
    els.verificationCodeInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        verificarCodigoAtivacao();
      }
    });
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
    els.fieldBedrooms, els.fieldBathrooms, els.fieldArea, els.fieldParking
  ].filter(field => field !== null);
  
  numberFields.forEach(field => {
    field.addEventListener("input", () => {
      if (field.value < 0) field.value = 0;
      if (field.value > 999) field.value = 999;
    });
  });
  
  // Atalho para painel admin
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
  
  // Configurar Google Login
  inicializarGoogleLogin();
  
  // Configurar auto-save do formulário
  configurarAutoSave();
  
  // Carregar dados demo
  carregarDadosDemo();
  
  // Carregar dados salvos
  carregarFormulario();
  
  // Configurar event listeners
  configurarEventListeners();
  
  console.log("✅ NAGI Real Estate Assistant inicializado com sucesso!");
}

// ==================== INICIAR APLICAÇÃO ====================
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializar);
} else {
  inicializar();
}