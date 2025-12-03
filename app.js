import { auth } from "./auth.js";
import { billing } from "./billing.js";
import { generateDescriptions } from "./contentGenerator.js";

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
  // NEW: login warning
  loginWarning: document.getElementById("login-warning"),
  loginWarningText: document.getElementById("login-warning-text"),
  // fields
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

  // labels & tabs (for i18n)
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

let currentLang = (navigator.language || "pt").toLowerCase().startsWith("pt")
  ? "pt"
  : "en";
let currentUser = auth.getCurrentUser();

/* GOOGLE AUTH CALLBACK BINDING
   Exposed globally so Google Identity Services can call it.
*/
window.handleGoogleCredential = (response) => {
  try {
    // Accept both the full response object and a raw credential string
    const credential =
      response && typeof response === "object"
        ? response.credential
        : response;

    if (!credential || typeof credential !== "string") {
      console.warn("Google credential callback without valid token", response);
      return;
    }

    auth.handleGoogleCredential(credential);
  } catch (err) {
    console.error("Error handling Google credential", err);
  }
};

/* AUTH HANDLING */

auth.onChange((user) => {
  currentUser = user;
  updateAuthUI();
  updateQuotaUI();
});

function updateAuthUI() {
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
    // hide login warning when authenticated
    if (els.loginWarning) {
      els.loginWarning.classList.add("hidden");
    }
  } else {
    els.authArea.classList.remove("hidden");
    els.userInfo.classList.add("hidden");
    // show login warning when not authenticated
    if (els.loginWarning) {
      els.loginWarning.classList.remove("hidden");
    }
  }

  // Only allow generations when user is logged in
  els.generateBtn.disabled = !currentUser;
}

/* BILLING / QUOTA */

function updateQuotaUI() {
  const remaining = billing.getRemaining(currentUser);
  if (remaining === Infinity || billing.hasActivePlan(currentUser)) {
    els.quotaCount.textContent = "∞";
    els.quotaCount.style.color = "#4ade80";
    if (currentLang === "pt") {
      els.quotaLabel.textContent = "Plano profissional ativo";
      if (els.loginWarningText) {
        els.loginWarningText.textContent =
          "Plano profissional ativo. Você já pode gerar descrições.";
      }
    } else {
      els.quotaLabel.textContent = "Pro plan active";
      if (els.loginWarningText) {
        els.loginWarningText.textContent =
          "Pro plan active. You can start generating descriptions.";
      }
    }
  } else {
    els.quotaCount.textContent = String(remaining);
    els.quotaCount.style.color = remaining === 0 ? "#fca5a5" : "#fb923c";
    if (currentLang === "pt") {
      els.quotaLabel.textContent = "Gerações gratuitas restantes:";
      if (!currentUser && els.loginWarningText) {
        els.loginWarningText.textContent =
          "Inicie sessão com o Google para começar a gerar descrições.";
      }
    } else {
      els.quotaLabel.textContent = "Free generations left:";
      if (!currentUser && els.loginWarningText) {
        els.loginWarningText.textContent =
          "Sign in with Google to start generating descriptions.";
      }
    }
  }
}

/* LANGUAGE */

function applyLanguage(lang) {
  currentLang = lang;

  // Toggle buttons
  els.langToggle
    .querySelectorAll(".lang-btn")
    .forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.lang === lang);
    });

  const isPt = lang === "pt";

  // Texts
  if (isPt) {
    els.formTitle.textContent = "Gerador inteligente de descrições imobiliárias";
    els.formSubtitle.textContent =
      "Insira os detalhes do imóvel e receba três versões prontas para anúncios, apresentações e discursos.";
    els.outputTitle.textContent = "Resultados gerados";
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
    els.labelExtras.textContent =
      "Observações / informações complementares";
    els.labelAudience.textContent = "Público-alvo";
    els.labelTone.textContent = "Tom da comunicação";
    els.generateBtn.textContent = "Gerar descrições";
    els.copyAllBtn.textContent = "Copiar todas as versões";
    els.tabShort.textContent = "Curta";
    els.tabMedium.textContent = "Média";
    els.tabLong.textContent = "Longa";
    els.paywallTitle.textContent = "Atualize o seu plano";
    els.paywallText.textContent =
      "Você já utilizou as 3 gerações gratuitas do NAGI REAL ESTATE ASSISTANT. Para continuar a criar descrições ilimitadas, ative o plano profissional.";
    els.paywallHint.textContent =
      'Após concluir o pagamento com sucesso, toque em "Já efetuei o pagamento" para ativar o seu plano nesta conta.';
    els.alreadyPaidBtn.textContent = "Já efetuei o pagamento";
    els.upgradeBtn.textContent = "Atualizar plano via PayPal";
    els.benefitsList.innerHTML = `
      <li>Gerações ilimitadas de descrições e discursos imobiliários</li>
      <li>Textos otimizados para anúncios online, impressos e apresentações</li>
      <li>Conteúdos sempre diferentes, persuasivos e encantadores</li>
    `;
  } else {
    els.formTitle.textContent = "Smart real estate copy generator";
    els.formSubtitle.textContent =
      "Enter the property details and get three ready-to-use versions for ads, presentations and sales pitches.";
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
    els.paywallTitle.textContent = "Upgrade your plan";
    els.paywallText.textContent =
      "You have already used the 3 free generations of NAGI REAL ESTATE ASSISTANT. To keep generating unlimited descriptions, activate the professional plan.";
    els.paywallHint.textContent =
      'After you successfully complete payment, tap "I have paid" to activate your plan for this account.';
    els.alreadyPaidBtn.textContent = "I have paid";
    els.upgradeBtn.textContent = "Upgrade via PayPal";
    els.benefitsList.innerHTML = `
      <li>Unlimited real estate descriptions and sales scripts</li>
      <li>Copy optimized for online ads, print materials and presentations</li>
      <li>Always fresh, persuasive and engaging content</li>
    `;
  }

  updateQuotaUI();
}

/* TABS */

function handleTabClick(tab) {
  els.tabButtons.forEach((btn) =>
    btn.classList.toggle("active", btn.dataset.tab === tab)
  );
  ["short", "medium", "long"].forEach((key) => {
    els.outputs[key].classList.toggle("active", key === tab);
  });
}

/* FORM HANDLING */

function collectFormData() {
  return {
    type: els.fieldType.value,
    headline: els.fieldHeadline.value,
    bedrooms: Number(els.fieldBedrooms.value || 0),
    bathrooms: Number(els.fieldBathrooms.value || 0),
    kitchens: Number(els.fieldKitchens.value || 0),
    parking: Number(els.fieldParking.value || 0),
    area: Number(els.fieldArea.value || 0),
    price: els.fieldPrice.value,
    address: els.fieldAddress.value,
    locationContext: els.fieldLocationContext.value,
    highlights: els.fieldHighlights.value,
    extras: els.fieldExtras.value,
    audience: els.fieldAudience.value,
    tone: els.fieldTone.value
  };
}

function ensureCanGenerate() {
  // Require login before any generation
  if (!currentUser) {
    showStatus(
      currentLang === "pt"
        ? "Inicie sessão com o Google para gerar descrições."
        : "Sign in with Google to generate descriptions.",
      true
    );
    return false;
  }

  if (billing.canGenerate(currentUser)) return true;
  showPaywall();
  return false;
}

function showStatus(text, isError = false) {
  els.statusMessage.textContent = text || "";
  els.statusMessage.style.color = isError ? "#fca5a5" : "#9ca3af";
  if (!text) return;
  setTimeout(() => {
    if (els.statusMessage.textContent === text) {
      els.statusMessage.textContent = "";
    }
  }, 2500);
}

/* PAYWALL */

function showPaywall() {
  els.paywallOverlay.classList.remove("hidden");
}

function hidePaywall() {
  els.paywallOverlay.classList.add("hidden");
}

/**
 * IMPORTANT:
 * Client-side code cannot confirm PayPal payments securely.
 * This "already paid" button only simulates plan activation on this device.
 * For real enforcement, you must validate the PayPal transaction on a backend
 * and only then call billing.activatePlan for the authenticated user.
 */
function handleAlreadyPaid() {
  if (!currentUser) {
    // Require login so activation is tied to a user account
    if (currentLang === "pt") {
      alert(
        "Inicie sessão com o Google antes de ativar o plano, para associar o pagamento à sua conta."
      );
    } else {
      alert(
        "Please sign in with Google before activating the plan so payment can be linked to your account."
      );
    }
    return;
  }

  billing.activatePlan(currentUser);
  hidePaywall();
  updateQuotaUI();
  if (currentLang === "pt") {
    showStatus("Plano profissional ativado neste dispositivo.");
  } else {
    showStatus("Pro plan activated on this device.");
  }
}

/* COPY */

async function copyAll() {
  const combined =
    [els.outputs.short, els.outputs.medium, els.outputs.long]
      .map((el) => el.textContent.trim())
      .filter(Boolean)
      .join("\n\n---\n\n") || "";

  if (!combined) {
    showStatus(
      currentLang === "pt"
        ? "Nenhum texto para copiar."
        : "No text to copy.",
      true
    );
    return;
  }

  try {
    await navigator.clipboard.writeText(combined);
    showStatus(
      currentLang === "pt"
        ? "Conteúdos copiados para a área de transferência."
        : "Content copied to clipboard."
    );
  } catch {
    showStatus(
      currentLang === "pt"
        ? "Não foi possível copiar automaticamente."
        : "Unable to copy automatically.",
      true
    );
  }
}

/* EVENT LISTENERS */

els.langToggle.addEventListener("click", (e) => {
  const btn = e.target.closest(".lang-btn");
  if (!btn) return;
  applyLanguage(btn.dataset.lang);
});

els.tabButtons.forEach((btn) =>
  btn.addEventListener("click", () => handleTabClick(btn.dataset.tab))
);

els.form.addEventListener("submit", (e) => {
  e.preventDefault();

  if (!ensureCanGenerate()) return;

  const data = collectFormData();
  const hasMinimum =
    data.type ||
    data.headline ||
    data.bedrooms ||
    data.bathrooms ||
    data.area ||
    data.address ||
    data.locationContext;

  if (!hasMinimum) {
    showStatus(
      currentLang === "pt"
        ? "Preencha pelo menos um campo principal do imóvel."
        : "Fill in at least one main property field.",
      true
    );
    return;
  }

  const results = generateDescriptions(data, currentLang);

  els.outputs.short.textContent = results.short;
  els.outputs.medium.textContent = results.medium;
  els.outputs.long.textContent = results.long;

  billing.registerGeneration(currentUser);
  updateQuotaUI();

  if (billing.isPaywalled(currentUser)) {
    // After this generation, user has reached the limit; next attempt will show paywall
    if (currentLang === "pt") {
      showStatus(
        "Limite gratuito atingido. A próxima geração exigirá a atualização do plano."
      );
    } else {
      showStatus(
        "Free limit reached. Next generation will require a plan upgrade."
      );
    }
  } else {
    showStatus(
      currentLang === "pt"
        ? "Novas descrições geradas com sucesso."
        : "New descriptions generated."
    );
  }
});

els.copyAllBtn.addEventListener("click", copyAll);

els.alreadyPaidBtn.addEventListener("click", handleAlreadyPaid);

// Simple overlay close when clicking outside content
els.paywallOverlay.addEventListener("click", (e) => {
  if (e.target === els.paywallOverlay) {
    hidePaywall();
  }
});

els.signOutBtn.addEventListener("click", () => {
  auth.signOut();
});

/* INITIALIZE */

applyLanguage(currentLang);
updateQuotaUI();
handleTabClick("short");