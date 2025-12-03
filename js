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
    if (els.loginWarningText) {
      els.loginWarningText.textContent =
        "Inicie sessão com o Google para começar a gerar descrições.";
    }
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
    if (els.loginWarningText) {
      els.loginWarningText.textContent =
        "Sign in with Google to start generating descriptions.";
    }
  }

  updateQuotaUI();
}

function ensureCanGenerate() {
  // Require login before any generation
  if (!currentUser) {
    const msgPt = "Inicie sessão com o Google para gerar descrições.";
    const msgEn = "Sign in with Google to generate descriptions.";
    const message = currentLang === "pt" ? msgPt : msgEn;

    showStatus(message, true);
    alert(message);
    return false;
  }

  if (billing.canGenerate(currentUser)) return true;
  showPaywall();
  return false;
}

