import { auth } from "./auth.js";
import { billing } from "./billing.js";
import { generateDescriptions } from "./contentGenerator.js";

// DOM Elements
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
  
  // Form fields
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
  
  // Labels & tabs
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

// State
let currentLang = "pt";
let currentUser = null;
let isGenerating = false;
let formAutoSaveTimer = null;

// ==================== INITIALIZATION ====================
function init() {
  // Set language based on browser
  const browserLang = navigator.language || navigator.userLanguage;
  currentLang = browserLang.toLowerCase().startsWith("pt") ? "pt" : "en";
  
  // Apply initial language
  applyLanguage(currentLang);
  
  // Setup auth listener
  auth.onChange(handleAuthChange);
  
  // Load initial user
  currentUser = auth.getCurrentUser();
  updateAuthUI();
  updateQuotaUI();
  
  // Setup tabs
  handleTabClick("short");
  
  // Setup form auto-save
  setupFormAutoSave();
  
  // Load demo data for first-time users
  loadDemoData();
  
  // Add event listeners
  setupEventListeners();
  
  console.log("NAGI Real Estate Assistant initialized");
}

// ==================== AUTHENTICATION ====================
function handleAuthChange(user) {
  currentUser = user;
  updateAuthUI();
  updateQuotaUI();
  
  if (user) {
    showStatus(
      currentLang === "pt"
        ? `Bem-vindo, ${user.name || "Usuário"}!`
        : `Welcome, ${user.name || "User"}!`,
      false
    );
  } else {
    showStatus(
      currentLang === "pt"
        ? "Sessão encerrada"
        : "Session ended",
      false
    );
  }
}

function updateAuthUI() {
  if (currentUser) {
    // User is logged in
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
    
    // Update quota immediately
    updateQuotaUI();
  } else {
    // User is not logged in
    els.authArea.classList.remove("hidden");
    els.userInfo.classList.add("hidden");
    els.loginWarning.classList.remove("hidden");
    els.generateBtn.disabled = true;
    
    // Update login warning text
    if (currentLang === "pt") {
      els.loginWarningText.textContent = "Inicie sessão com o Google para começar a gerar descrições.";
    } else {
      els.loginWarningText.textContent = "Sign in with Google to start generating descriptions.";
    }
  }
}

// ==================== BILLING & QUOTA ====================
function updateQuotaUI() {
  const remaining = billing.getRemaining(currentUser);
  
  if (remaining === Infinity || billing.hasActivePlan(currentUser)) {
    // Professional plan active
    els.quotaCount.textContent = "∞";
    els.quotaCount.style.color = "#10b981";
    
    if (currentLang === "pt") {
      els.quotaLabel.textContent = "Plano profissional ativo";
      els.loginWarningText.textContent = "Plano profissional ativo. Gerações ilimitadas disponíveis.";
    } else {
      els.quotaLabel.textContent = "Pro plan active";
      els.loginWarningText.textContent = "Pro plan active. Unlimited generations available.";
    }
  } else {
    // Free tier
    els.quotaCount.textContent = String(remaining);
    els.quotaCount.style.color = remaining === 0 ? "#ef4444" : "#fb923c";
    
    if (currentLang === "pt") {
      els.quotaLabel.textContent = "Gerações gratuitas restantes:";
      if (!currentUser) {
        els.loginWarningText.textContent = "Inicie sessão com o Google para gerar descrições.";
      }
    } else {
      els.quotaLabel.textContent = "Free generations left:";
      if (!currentUser) {
        els.loginWarningText.textContent = "Sign in with Google to generate descriptions.";
      }
    }
  }
}

function checkGenerationPermission() {
  if (!currentUser) {
    showStatus(
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
    showPaywall();
    return false;
  }
}

// ==================== LANGUAGE MANAGEMENT ====================
function applyLanguage(lang) {
  currentLang = lang;
  
  // Update language toggle buttons
  els.langToggle.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.lang === lang);
  });

  const isPt = lang === "pt";

  // Update all interface texts
  if (isPt) {
    // Form
    els.formTitle.textContent = "Gerador inteligente de descrições imobiliárias";
    els.formSubtitle.textContent = "Insira os detalhes do imóvel e receba três versões prontas para anúncios, apresentações e discursos.";
    
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
    
    // Buttons
    els.generateBtn.textContent = "Gerar descrições";
    els.copyAllBtn.textContent = "Copiar todas as versões";
    els.tabShort.textContent = "Curta";
    els.tabMedium.textContent = "Média";
    els.tabLong.textContent = "Longa";
    els.outputTitle.textContent = "Resultados gerados";
    els.signOutBtn.textContent = "Sair";
    
    // Paywall
    els.paywallTitle.textContent = "Atualize o seu plano";
    els.paywallText.textContent = "Você já utilizou as 3 gerações gratuitas do NAGI REAL ESTATE ASSISTANT. Para continuar a criar descrições ilimitadas, ative o plano profissional.";
    els.paywallHint.textContent = 'Após concluir o pagamento com sucesso, toque em "Já efetuei o pagamento" para ativar o seu plano nesta conta.';
    els.alreadyPaidBtn.textContent = "Já efetuei o pagamento";
    els.upgradeBtn.textContent = "Atualizar plano via PayPal";
    
    // Benefits list
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
    
    // Options
    els.fieldAudience.innerHTML = `
      <option value="familias">Famílias</option>
      <option value="investidores">Investidores</option>
      <option value="jovens">Jovens profissionais</option>
      <option value="luxo">Segmento de luxo</option>
      <option value="aluguel">Arrendamento / aluguel</option>
      <option value="geral">Geral</option>
    `;
    
    els.fieldTone.innerHTML = `
      <option value="encantador">Encantador e envolvente</option>
      <option value="objetivo">Objetivo e profissional</option>
      <option value="emocional">Emocional e inspirador</option>
      <option value="premium">Premium / alto padrão</option>
    `;
  } else {
    // English
    els.formTitle.textContent = "Smart real estate copy generator";
    els.formSubtitle.textContent = "Enter the property details and get three ready-to-use versions for ads, presentations and sales pitches.";
    
    // Labels
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
    
    // Buttons
    els.generateBtn.textContent = "Generate descriptions";
    els.copyAllBtn.textContent = "Copy all versions";
    els.tabShort.textContent = "Short";
    els.tabMedium.textContent = "Standard";
    els.tabLong.textContent = "Extended";
    els.outputTitle.textContent = "Generated results";
    els.signOutBtn.textContent = "Sign out";
    
    // Paywall
    els.paywallTitle.textContent = "Upgrade your plan";
    els.paywallText.textContent = "You have already used the 3 free generations of NAGI REAL ESTATE ASSISTANT. To keep generating unlimited descriptions, activate the professional plan.";
    els.paywallHint.textContent = 'After you successfully complete payment, tap "I have paid" to activate your plan for this account.';
    els.alreadyPaidBtn.textContent = "I have paid";
    els.upgradeBtn.textContent = "Upgrade via PayPal";
    
    // Benefits list
    els.benefitsList.innerHTML = `
      <li>Unlimited real estate descriptions and sales scripts</li>
      <li>Copy optimized for online ads, print materials and presentations</li>
      <li>Always fresh, persuasive and engaging content</li>
    `;
    
    // Placeholders
    els.fieldHeadline.placeholder = "Ex.: Luxury T3 with sea view and spacious balcony";
    els.fieldPrice.placeholder = "Ex.: €250,000, $800,000, €1200/month";
    els.fieldAddress.placeholder = "Street, neighborhood, city, country or reference area";
    els.fieldLocationContext.placeholder = "Near schools, beaches, transport, shopping centers...";
    els.fieldHighlights.placeholder = "Pool, gourmet balcony, en-suite, sea view, furnished, 24h security...";
    els.fieldExtras.placeholder = "Specific information, condo rules, financing possibilities, etc.";
    
    // Options
    els.fieldAudience.innerHTML = `
      <option value="familias">Families</option>
      <option value="investidores">Investors</option>
      <option value="jovens">Young professionals</option>
      <option value="luxo">Luxury segment</option>
      <option value="aluguel">Rental</option>
      <option value="geral">General</option>
    `;
    
    els.fieldTone.innerHTML = `
      <option value="encantador">Charming & engaging</option>
      <option value="objetivo">Objective & professional</option>
      <option value="emocional">Emotional & inspirational</option>
      <option value="premium">Premium / high-end</option>
    `;
  }
  
  // Update quota display
  updateQuotaUI();
}

// ==================== TAB MANAGEMENT ====================
function handleTabClick(tab) {
  // Update tab buttons
  els.tabButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tab);
  });
  
  // Show corresponding output
  ["short", "medium", "long"].forEach((key) => {
    els.outputs[key].classList.toggle("active", key === tab);
  });
}

// ==================== FORM HANDLING ====================
function collectFormData() {
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

function validateFormData(data) {
  const hasMinimumData = 
    data.type ||
    data.headline.trim() ||
    data.bedrooms > 0 ||
    data.bathrooms > 0 ||
    data.area > 0 ||
    data.address.trim() ||
    data.locationContext.trim() ||
    data.highlights.trim();
  
  return hasMinimumData;
}

function saveFormData() {
  const formData = collectFormData();
  try {
    localStorage.setItem("nagi_form_data", JSON.stringify(formData));
  } catch (error) {
    console.warn("Could not save form data:", error);
  }
}

function loadFormData() {
  try {
    const saved = localStorage.getItem("nagi_form_data");
    if (!saved) return false;
    
    const data = JSON.parse(saved);
    
    // Restore form values
    els.fieldType.value = data.type || "apartamento";
    els.fieldHeadline.value = data.headline || "";
    els.fieldBedrooms.value = data.bedrooms || "";
    els.fieldBathrooms.value = data.bathrooms || "";
    els.fieldKitchens.value = data.kitchens || "";
    els.fieldParking.value = data.parking || "";
    els.fieldArea.value = data.area || "";
    els.fieldPrice.value = data.price || "";
    els.fieldAddress.value = data.address || "";
    els.fieldLocationContext.value = data.locationContext || "";
    els.fieldHighlights.value = data.highlights || "";
    els.fieldExtras.value = data.extras || "";
    els.fieldAudience.value = data.audience || "geral";
    els.fieldTone.value = data.tone || "encantador";
    
    return true;
  } catch (error) {
    console.warn("Could not load form data:", error);
    return false;
  }
}

function setupFormAutoSave() {
  const formElements = [
    els.fieldType, els.fieldHeadline, els.fieldBedrooms, els.fieldBathrooms,
    els.fieldKitchens, els.fieldParking, els.fieldArea, els.fieldPrice,
    els.fieldAddress, els.fieldLocationContext, els.fieldHighlights,
    els.fieldExtras, els.fieldAudience, els.fieldTone
  ];
  
  formElements.forEach(element => {
    element.addEventListener("input", () => {
      // Debounce the save operation
      clearTimeout(formAutoSaveTimer);
      formAutoSaveTimer = setTimeout(saveFormData, 500);
    });
    
    element.addEventListener("change", saveFormData);
  });
}

function loadDemoData() {
  // Check if user has visited before
  if (localStorage.getItem("nagi_first_visit") !== "completed") {
    // Load demo data
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
    
    // Mark first visit as completed
    localStorage.setItem("nagi_first_visit", "completed");
    
    // Save demo data
    saveFormData();
  }
}

// ==================== CONTENT GENERATION ====================
async function generateContent() {
  if (isGenerating) return;
  
  // Check permissions
  if (!checkGenerationPermission()) return;
  
  // Validate form
  const formData = collectFormData();
  if (!validateFormData(formData)) {
    showStatus(
      currentLang === "pt"
        ? "Preencha pelo menos um campo principal do imóvel."
        : "Fill in at least one main property field.",
      true
    );
    return;
  }
  
  // Set generating state
  isGenerating = true;
  const originalBtnText = els.generateBtn.textContent;
  els.generateBtn.textContent = currentLang === "pt" ? "Gerando..." : "Generating...";
  els.generateBtn.disabled = true;
  
  try {
    // Generate descriptions
    const results = generateDescriptions(formData, currentLang);
    
    // Update UI with results
    els.outputs.short.textContent = results.short || "";
    els.outputs.medium.textContent = results.medium || "";
    els.outputs.long.textContent = results.long || "";
    
    // Register usage
    billing.registerGeneration(currentUser);
    
    // Update quota
    updateQuotaUI();
    
    // Switch to short tab to show results
    handleTabClick("short");
    
    // Show success message
    if (billing.isPaywalled(currentUser)) {
      showStatus(
        currentLang === "pt"
          ? "Limite gratuito atingido. Ative o plano para continuar."
          : "Free limit reached. Activate plan to continue."
      );
    } else {
      showStatus(
        currentLang === "pt"
          ? "Descrições geradas com sucesso!"
          : "Descriptions generated successfully!"
      );
    }
    
    // Save form data
    saveFormData();
    
  } catch (error) {
    console.error("Generation error:", error);
    showStatus(
      currentLang === "pt"
        ? "Erro ao gerar descrições. Tente novamente."
        : "Error generating descriptions. Please try again.",
      true
    );
    
    // Fallback content
    const fallbackText = currentLang === "pt"
      ? "Ocorreu um erro ao gerar as descrições. Por favor, verifique os dados inseridos e tente novamente."
      : "An error occurred while generating descriptions. Please check your input and try again.";
    
    els.outputs.short.textContent = fallbackText;
    els.outputs.medium.textContent = fallbackText;
    els.outputs.long.textContent = fallbackText;
    
  } finally {
    // Reset generating state
    isGenerating = false;
    els.generateBtn.textContent = originalBtnText;
    els.generateBtn.disabled = !currentUser;
  }
}

// ==================== STATUS MESSAGES ====================
function showStatus(text, isError = false) {
  els.statusMessage.textContent = text || "";
  els.statusMessage.style.color = isError ? "#ef4444" : "#9ca3af";
  
  if (!text) return;
  
  // Auto-clear after 3 seconds
  setTimeout(() => {
    if (els.statusMessage.textContent === text) {
      els.statusMessage.textContent = "";
    }
  }, 3000);
}

// ==================== COPY FUNCTIONALITY ====================
async function copyAllContent() {
  const combined = [els.outputs.short, els.outputs.medium, els.outputs.long]
    .map((el) => el.textContent.trim())
    .filter(Boolean)
    .join("\n\n---\n\n");
  
  if (!combined) {
    showStatus(
      currentLang === "pt"
        ? "Nenhum conteúdo para copiar."
        : "No content to copy.",
      true
    );
    return;
  }
  
  try {
    // Modern clipboard API
    await navigator.clipboard.writeText(combined);
    showStatus(
      currentLang === "pt"
        ? "Conteúdo copiado para a área de transferência!"
        : "Content copied to clipboard!"
    );
  } catch (error) {
    // Fallback for older browsers or insecure contexts
    console.warn("Clipboard API failed, using fallback:", error);
    
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
        showStatus(
          currentLang === "pt"
            ? "Conteúdo copiado!"
            : "Content copied!"
        );
      } else {
        throw new Error("execCommand failed");
      }
    } catch (err) {
      console.error("Fallback copy failed:", err);
      showStatus(
        currentLang === "pt"
          ? "Não foi possível copiar. Tente selecionar e copiar manualmente."
          : "Unable to copy. Please select and copy manually.",
        true
      );
    } finally {
      document.body.removeChild(textArea);
    }
  }
}

// ==================== PAYWALL MANAGEMENT ====================
function showPaywall() {
  els.paywallOverlay.classList.remove("hidden");
  document.body.style.overflow = "hidden";
  
  // Focus management for accessibility
  els.upgradeBtn.focus();
}

function hidePaywall() {
  els.paywallOverlay.classList.add("hidden");
  document.body.style.overflow = "";
  
  // Return focus to generate button
  els.generateBtn.focus();
}

function handlePlanActivation() {
  if (!currentUser) {
    showStatus(
      currentLang === "pt"
        ? "Inicie sessão com o Google antes de ativar o plano."
        : "Please sign in with Google before activating the plan.",
      true
    );
    return;
  }
  
  billing.activatePlan(currentUser);
  hidePaywall();
  updateQuotaUI();
  
  showStatus(
    currentLang === "pt"
      ? "Plano profissional ativado com sucesso!"
      : "Professional plan activated successfully!"
  );
}

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
  // Language toggle
  els.langToggle.addEventListener("click", (e) => {
    const btn = e.target.closest(".lang-btn");
    if (!btn) return;
    applyLanguage(btn.dataset.lang);
  });
  
  // Tab switching
  els.tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => handleTabClick(btn.dataset.tab));
  });
  
  // Form submission
  els.form.addEventListener("submit", (e) => {
    e.preventDefault();
    generateContent();
  });
  
  // Copy all button
  els.copyAllBtn.addEventListener("click", copyAllContent);
  
  // Sign out button
  els.signOutBtn.addEventListener("click", () => {
    auth.signOut();
  });
  
  // Paywall buttons
  els.alreadyPaidBtn.addEventListener("click", handlePlanActivation);
  
  // Close paywall when clicking overlay
  els.paywallOverlay.addEventListener("click", (e) => {
    if (e.target === els.paywallOverlay) {
      hidePaywall();
    }
  });
  
  // Close paywall with Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !els.paywallOverlay.classList.contains("hidden")) {
      hidePaywall();
    }
  });
  
  // Input validation for number fields
  const numberFields = [els.fieldBedrooms, els.fieldBathrooms, els.fieldKitchens, els.fieldParking, els.fieldArea];
  numberFields.forEach(field => {
    field.addEventListener("input", () => {
      if (field.value < 0) field.value = 0;
      if (field.value > 999) field.value = 999;
    });
  });
  
  // Prevent form submission on Enter in textareas
  els.fieldHighlights.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
    }
  });
  
  els.fieldExtras.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
    }
  });
  
  // Auto-focus on headline field
  els.fieldHeadline.addEventListener("focus", () => {
    els.fieldHeadline.select();
  });
  
  // Help tooltip for form
  const helpTooltip = document.createElement("div");
  helpTooltip.className = "hint";
  helpTooltip.style.cssText = "text-align: center; margin-top: 4px; font-size: 0.7rem; opacity: 0.7;";
  helpTooltip.textContent = currentLang === "pt"
    ? "💡 Dica: Preencha pelo menos 3-4 campos para melhores resultados!"
    : "💡 Tip: Fill in at least 3-4 fields for best results!";
  
  els.form.appendChild(helpTooltip);
}

// ==================== EXPOSE GLOBAL FUNCTIONS ====================
// Make Google auth callback available globally
window.handleGoogleCredential = (response) => {
  try {
    const credential = response?.credential || response;
    if (!credential) {
      console.warn("No credential received from Google");
      showStatus(
        currentLang === "pt"
          ? "Erro no login do Google. Tente novamente."
          : "Google login error. Please try again.",
        true
      );
      return;
    }
    
    auth.handleGoogleCredential(credential);
  } catch (error) {
    console.error("Error handling Google credential:", error);
    showStatus(
      currentLang === "pt"
        ? "Erro ao processar login. Tente novamente."
        : "Error processing login. Please try again.",
      true
    );
  }
};

// ==================== INITIALIZE APPLICATION ====================
// Start the application when DOM is loaded
document.addEventListener("DOMContentLoaded", init);

// Load saved form data on startup
window.addEventListener("load", () => {
  loadFormData();
});

// Handle page visibility changes
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    // Page became visible again, refresh quota
    updateQuotaUI();
  }
});