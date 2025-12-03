function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function formatList(text) {
  if (!text) return "";
  return text
    .split(/[;,.\\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .join(", ");
}

function baseData(raw) {
  const {
    type,
    headline,
    bedrooms,
    bathrooms,
    kitchens,
    parking,
    area,
    price,
    address,
    locationContext,
    highlights,
    extras,
    audience,
    tone
  } = raw;

  const details = [];

  if (bedrooms) details.push(`${bedrooms} quarto${bedrooms > 1 ? "s" : ""}`);
  if (bathrooms)
    details.push(`${bathrooms} banheiro${bathrooms > 1 ? "s" : ""}`);
  if (kitchens)
    details.push(`${kitchens} cozinha${kitchens > 1 ? "s" : ""}`);
  if (parking)
    details.push(
      `${parking} vaga${parking > 1 ? "s" : ""} de garagem`
    );
  if (area) details.push(`${area} m² de área`);

  const formattedHighlights = formatList(highlights);
  const formattedExtras = extras?.trim() || "";
  const formattedLocation = address || locationContext || "";
  const fullType = type || "imóvel";

  return {
    fullType,
    headline: headline?.trim() || "",
    details,
    detailsJoined: details.join(" · "),
    price: price?.trim() || "",
    formattedHighlights,
    formattedExtras,
    formattedLocation,
    audience,
    tone
  };
}

/* PORTUGUÊS */

function generateShortPt(d) {
  const intros = [
    `Encante-se com este ${d.fullType}${d.headline ? `: ${d.headline}` : ""}.`,
    `Apresentamos um ${d.fullType}${d.headline ? ` – ${d.headline}` : ""} preparado para surpreender.`,
    `Uma oportunidade única de ${d.fullType}${d.headline ? `: ${d.headline}` : ""}.`
  ];

  const detailSegment = d.detailsJoined
    ? ` Com ${d.detailsJoined}${d.formattedLocation ? `, em ${d.formattedLocation}` : ""}.`
    : d.formattedLocation
    ? ` Localizado em ${d.formattedLocation}.`
    : "";

  const highlightSegment = d.formattedHighlights
    ? ` Destaques: ${d.formattedHighlights}.`
    : "";

  const priceSegment = d.price ? ` Valor: ${d.price}.` : "";

  return `${rand(intros)}${detailSegment}${highlightSegment}${priceSegment}`.trim();
}

function generateMediumPt(d) {
  const intros = [
    `Este ${d.fullType}${d.headline ? `, ${d.headline},` : ""} combina conforto, estilo e uma localização estratégica.`,
    `Pensado para quem valoriza qualidade de vida, este ${d.fullType}${d.headline ? ` – ${d.headline}` : ""} reúne o que há de melhor na região.`,
    `Se procura um ${d.fullType} completo${d.headline ? `, ${d.headline}` : ""}, esta pode ser a solução ideal para si.`
  ];

  const detailSegment = d.detailsJoined
    ? ` Distribuído em ${d.detailsJoined}${d.formattedLocation ? `, situa-se em ${d.formattedLocation}` : ""}.`
    : d.formattedLocation
    ? ` Situado em ${d.formattedLocation}, oferece uma envolvente prática e agradável.`
    : "";

  const highlightSegment = d.formattedHighlights
    ? ` Entre os principais diferenciais, destacam-se: ${d.formattedHighlights}.`
    : "";

  const audienceSegment = (() => {
    switch (d.audience) {
      case "familias":
        return ` Perfeito para famílias que procuram segurança, conforto e proximidade de serviços essenciais.`;
      case "investidores":
        return ` Uma excelente opção para investidores que procuram rentabilidade e valorização a médio e longo prazo.`;
      case "jovens":
        return ` Ideal para jovens profissionais que desejam praticidade, mobilidade e um espaço moderno para viver.`;
      case "luxo":
        return ` Direcionado a um público exigente, que valoriza exclusividade, sofisticação e detalhes de alto padrão.`;
      case "aluguel":
        return ` Uma escolha estratégica tanto para quem deseja arrendar com segurança como para quem procura boa liquidez no mercado.`;
      default:
        return ` Uma oportunidade completa para quem valoriza um bom negócio e um espaço bem cuidado.`;
    }
  })();

  const priceSegment = d.price
    ? ` Condições atrativas, com valor de ${d.price}.`
    : "";

  const extrasSegment = d.formattedExtras
    ? ` Informação adicional: ${d.formattedExtras}.`
    : "";

  return (
    rand(intros) +
    detailSegment +
    highlightSegment +
    audienceSegment +
    priceSegment +
    extrasSegment
  ).trim();
}

function generateLongPt(d) {
  const opening = [
    `Imagine viver em um ${d.fullType}${d.headline ? ` onde ${d.headline.toLowerCase()}` : ""}, pensado em cada detalhe para proporcionar conforto, funcionalidade e uma experiência verdadeiramente marcante.`,
    `Este ${d.fullType}${d.headline ? `, ${d.headline},` : ""} foi cuidadosamente preparado para oferecer muito mais do que um simples espaço físico: trata-se de um convite a um novo estilo de vida.`,
    `Mais do que um ${d.fullType}, este imóvel representa uma oportunidade rara para quem deseja unir bem-estar, praticidade e um cenário perfeito para criar novas histórias.`
  ];

  const structure = d.detailsJoined
    ? ` A configuração do imóvel contempla ${d.detailsJoined}, criando ambientes bem distribuídos e versáteis, prontos para se adaptarem às necessidades do dia a dia.`
    : "";

  const location = d.formattedLocation
    ? ` Inserido em ${d.formattedLocation}, o imóvel beneficia de uma envolvente completa, com acesso facilitado a serviços, comércio, transportes e tudo o que é essencial para uma rotina equilibrada.`
    : "";

  const highlights = d.formattedHighlights
    ? ` Entre os principais destaques, vale ressaltar ${d.formattedHighlights}, características que acrescentam valor, conforto e personalidade ao espaço.`
    : "";

  const toneSegment = (() => {
    switch (d.tone) {
      case "premium":
        return ` Cada acabamento, escolha de material e solução arquitetônica reforça a sensação de exclusividade, criando um ambiente sofisticado, acolhedor e alinhado às expectativas de um público de alto padrão.`;
      case "emocional":
        return ` Cada ambiente foi pensado para acolher momentos especiais, celebrações em família, encontros com amigos e rotinas tranquilas, permitindo que este espaço se transforme no cenário perfeito para as próximas memórias.`;
      case "objetivo":
        return ` A distribuição inteligente dos espaços e a combinação de diferenciais físicos tornam este imóvel uma solução prática, eficiente e altamente funcional para o uso diário.`;
      default:
        return ` O equilíbrio entre estética, conforto e funcionalidade torna este imóvel uma proposta encantadora para quem não abre mão de viver bem.`;
    }
  })();

  const audience = (() => {
    switch (d.audience) {
      case "familias":
        return ` Para famílias, o imóvel oferece ambientes acolhedores, áreas bem dimensionadas e um contexto ideal para quem procura segurança, tranquilidade e proximidade de escolas, serviços e lazer.`;
      case "investidores":
        return ` Para investidores, este ativo representa uma combinação interessante entre potencial de valorização, boa procura na região e ótimas perspetivas de retorno, seja para revenda como para arrendamento.`;
      case "jovens":
        return ` Para jovens profissionais, a localização estratégica e a praticidade dos espaços tornam o dia a dia mais fluido, com mobilidade facilitada e um ambiente moderno para viver, trabalhar e receber amigos.`;
      case "luxo":
        return ` Para um público que valoriza luxo e exclusividade, cada detalhe deste imóvel contribui para uma experiência diferenciada, que se destaca tanto pela estética como pela qualidade da construção e dos acabamentos.`;
      case "aluguel":
        return ` No mercado de arrendamento, este imóvel destaca-se pela ótima relação entre localização, estrutura e potencial de ocupação, sendo uma escolha sólida para quem procura rendimento recorrente e previsível.`;
      default:
        return ` Seja para moradia própria ou investimento, trata-se de uma oportunidade consistente, bem localizada e com excelentes fundamentos de valorização.`;
    }
  })();

  const price = d.price
    ? ` Em relação às condições comerciais, o imóvel está disponível por ${d.price}, refletindo o conjunto de atributos que o tornam uma opção diferenciada dentro do mercado.`
    : "";

  const extras = d.formattedExtras
    ? ` Como complemento, é importante destacar: ${d.formattedExtras}.`
    : "";

  const closingOptions = [
    ` Se este perfil de imóvel faz sentido para o seu momento, vale a pena conhecer pessoalmente cada ambiente e sentir de perto tudo o que ele pode oferecer.`,
    ` Para compreender todo o potencial deste imóvel, nada substitui uma visita: cada detalhe foi pensado para surpreender positivamente.`,
    ` Se procura um imóvel que una razão e emoção na tomada de decisão, este pode ser o próximo grande passo.`
  ];

  return (
    rand(opening) +
    structure +
    location +
    highlights +
    toneSegment +
    audience +
    price +
    extras +
    " " +
    rand(closingOptions)
  ).trim();
}

/* ENGLISH */

function generateShortEn(d) {
  const intros = [
    `Discover this ${d.fullType}${d.headline ? `: ${d.headline}` : ""}.`,
    `Introducing a ${d.fullType}${d.headline ? ` – ${d.headline}` : ""} designed to impress.`,
    `A unique opportunity: ${d.fullType}${d.headline ? `, ${d.headline}` : ""}.`
  ];

  const detailSegment = d.detailsJoined
    ? ` Featuring ${d.detailsJoined}${d.formattedLocation ? ` in ${d.formattedLocation}` : ""}.`
    : d.formattedLocation
    ? ` Located in ${d.formattedLocation}.`
    : "";

  const highlightSegment = d.formattedHighlights
    ? ` Highlights: ${d.formattedHighlights}.`
    : "";

  const priceSegment = d.price ? ` Price: ${d.price}.` : "";

  return `${rand(intros)}${detailSegment}${highlightSegment}${priceSegment}`.trim();
}

function generateMediumEn(d) {
  const intros = [
    `This ${d.fullType}${d.headline ? `, ${d.headline},` : ""} blends comfort, style and a strategic location.`,
    `Created for those who value quality of life, this ${d.fullType}${d.headline ? ` – ${d.headline}` : ""} brings together some of the best features in the area.`,
    `If you're looking for a well-rounded ${d.fullType}${d.headline ? `, ${d.headline}` : ""}, this may be the ideal match.`
  ];

  const detailSegment = d.detailsJoined
    ? ` The layout includes ${d.detailsJoined}${d.formattedLocation ? `, set in ${d.formattedLocation}` : ""}.`
    : d.formattedLocation
    ? ` Set in ${d.formattedLocation}, it offers a convenient and pleasant surroundings.`
    : "";

  const highlightSegment = d.formattedHighlights
    ? ` Key features include: ${d.formattedHighlights}.`
    : "";

  const audienceSegment = (() => {
    switch (d.audience) {
      case "familias":
        return ` Perfect for families seeking safety, comfort and proximity to everyday amenities.`;
      case "investidores":
        return ` An excellent option for investors looking for long-term value and solid rental demand.`;
      case "jovens":
        return ` Ideal for young professionals who want practicality, mobility and a modern place to live.`;
      case "luxo":
        return ` Tailored to demanding buyers who appreciate exclusivity, sophistication and high-end finishes.`;
      case "aluguel":
        return ` A smart choice both for those looking to rent safely and for owners seeking strong market liquidity.`;
      default:
        return ` A complete opportunity for anyone who values a well-maintained property and a good deal.`;
    }
  })();

  const priceSegment = d.price
    ? ` Attractive terms available, with a price of ${d.price}.`
    : "";

  const extrasSegment = d.formattedExtras
    ? ` Additional information: ${d.formattedExtras}.`
    : "";

  return (
    rand(intros) +
    detailSegment +
    highlightSegment +
    audienceSegment +
    priceSegment +
    extrasSegment
  ).trim();
}

function generateLongEn(d) {
  const opening = [
    `Imagine living in a ${d.fullType}${d.headline ? ` where ${d.headline.toLowerCase()}` : ""}, with every detail carefully planned to deliver comfort, functionality and a truly memorable experience.`,
    `This ${d.fullType}${d.headline ? `, ${d.headline},` : ""} was designed to offer far more than just a physical space: it is an invitation to a new lifestyle.`,
    `More than just a ${d.fullType}, this property is a rare opportunity for those who want to combine well-being, convenience and the perfect backdrop for new stories.`
  ];

  const structure = d.detailsJoined
    ? ` The layout features ${d.detailsJoined}, creating well-balanced and versatile areas that easily adapt to everyday routines.`
    : "";

  const location = d.formattedLocation
    ? ` Set in ${d.formattedLocation}, the property benefits from a complete surroundings with easy access to services, shops, transport and everything needed for a balanced routine.`
    : "";

  const highlights = d.formattedHighlights
    ? ` Among the main highlights you will find ${d.formattedHighlights}, elements that add value, comfort and personality to every room.`
    : "";

  const toneSegment = (() => {
    switch (d.tone) {
      case "premium":
        return ` Every finish, material and architectural decision reinforces a sense of exclusivity, creating a refined, welcoming environment that meets the expectations of a high-end audience.`;
      case "emocional":
        return ` Each room was thought out to host special moments, family gatherings and relaxed everyday life, turning this space into the perfect stage for your next memories.`;
      case "objetivo":
        return ` The clever layout and strong physical attributes make this a practical, efficient and highly functional property for daily use.`;
      default:
        return ` The balance between aesthetics, comfort and functionality makes this a truly charming proposal for those who refuse to compromise on quality of life.`;
    }
  })();

  const audience = (() => {
    switch (d.audience) {
      case "familias":
        return ` For families, it offers welcoming rooms, well-sized areas and an ideal context for those seeking safety, tranquillity and proximity to schools, services and leisure.`;
      case "investidores":
        return ` For investors, this asset represents an attractive blend of appreciation potential, strong demand and compelling prospects both for resale and rental.`;
      case "jovens":
        return ` For young professionals, the strategic location and practical layout simplify everyday life, with great mobility and a modern setting to live, work and entertain.`;
      case "luxo":
        return ` For those who value luxury and exclusivity, every detail contributes to a distinctive experience that stands out both for design and construction quality.`;
      case "aluguel":
        return ` In the rental market, this property stands out thanks to its strong combination of location, layout and occupancy potential, making it a sound choice for consistent income.`;
      default:
        return ` Whether for your own use or as an investment, this is a solid opportunity with excellent fundamentals and a highly attractive profile.`;
    }
  })();

  const price = d.price
    ? ` In commercial terms, the property is offered at ${d.price}, reflecting the full set of attributes that make it stand out in the market.`
    : "";

  const extras = d.formattedExtras
    ? ` Additionally, it is worth noting: ${d.formattedExtras}.`
    : "";

  const closingOptions = [
    ` To truly understand everything this property can offer, nothing replaces an in-person visit to experience each space up close.`,
    ` If this profile matches what you're looking for, scheduling a viewing is the best next step to confirm how well it fits your plans.`,
    ` If you're seeking a property where both reason and emotion align, this may well be your next big move.`
  ];

  return (
    rand(opening) +
    structure +
    location +
    highlights +
    toneSegment +
    audience +
    price +
    extras +
    " " +
    rand(closingOptions)
  ).trim();
}

/**
 * Main API
 */
export function generateDescriptions(input, lang = "pt") {
  const d = baseData(input);
  const isPt = (lang || "").toLowerCase().startsWith("pt");

  if (isPt) {
    return {
      short: generateShortPt(d),
      medium: generateMediumPt(d),
      long: generateLongPt(d)
    };
  }

  return {
    short: generateShortEn(d),
    medium: generateMediumEn(d),
    long: generateLongEn(d)
  };
}