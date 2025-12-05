function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function formatList(text) {
    if (!text || typeof text !== 'string') return '';
    
    return text
        .split(/[,;.\n]/)
        .map(item => item.trim())
        .filter(item => item.length > 0)
        .join(', ');
}

function processInputData(raw) {
    const {
        type = 'imóvel',
        headline = '',
        bedrooms = 0,
        bathrooms = 0,
        area = 0,
        parking = 0,
        price = '',
        location = '',
        highlights = '',
        audience = 'familias',
        tone = 'profissional'
    } = raw;

    // Processar detalhes
    const details = [];
    if (bedrooms > 0) details.push(`${bedrooms} quarto${bedrooms > 1 ? 's' : ''}`);
    if (bathrooms > 0) details.push(`${bathrooms} banheiro${bathrooms > 1 ? 's' : ''}`);
    if (area > 0) details.push(`${area} m²`);
    if (parking > 0) details.push(`${parking} vaga${parking > 1 ? 's' : ''} de garagem`);

    return {
        type,
        headline: headline.trim(),
        details,
        detailsText: details.join(' · '),
        price: price.trim(),
        location: location.trim(),
        highlights: formatList(highlights),
        audience,
        tone
    };
}

// Português
function generateShortPT(data) {
    const intros = [
        `✨ ${data.headline || `Excelente ${data.type}`}!`,
        `🏡 ${data.headline || `Oportunidade única de ${data.type}`}!`,
        `🌟 ${data.headline || `${data.type.charAt(0).toUpperCase() + data.type.slice(1)} exclusivo`}!`
    ];
    
    let description = getRandomItem(intros);
    
    if (data.details.length > 0) {
        description += ` ${data.detailsText}.`;
    }
    
    if (data.location) {
        description += ` Localizado em ${data.location}.`;
    }
    
    if (data.highlights) {
        description += ` Destaques: ${data.highlights}.`;
    }
    
    if (data.price) {
        description += ` Valor: ${data.price}.`;
    }
    
    return description;
}

function generateMediumPT(data) {
    const intros = [
        `Apresentamos ${data.headline ? data.headline.toLowerCase() : `este ${data.type} excepcional`}, uma oportunidade única no mercado imobiliário.`,
        `Este ${data.type} ${data.headline ? `- ${data.headline}` : 'de destaque'} combina qualidade, conforto e localização privilegiada.`,
        `Descubra ${data.headline ? data.headline.toLowerCase() : `este ${data.type} diferenciado`}, preparado para superar suas expectativas.`
    ];
    
    let description = getRandomItem(intros);
    
    if (data.details.length > 0) {
        description += ` Composto por ${data.detailsText}, oferece espaços bem distribuídos e funcionais.`;
    }
    
    if (data.location) {
        description += ` Situado em ${data.location}, desfruta de uma localização estratégica com fácil acesso a todos os serviços.`;
    }
    
    if (data.highlights) {
        description += ` Entre suas características especiais destacam-se: ${data.highlights}.`;
    }
    
    // Tom
    const tones = {
        profissional: ` Uma proposta séria e bem estruturada, ideal para quem busca segurança e qualidade no investimento.`,
        emocional: ` Um espaço que convida a criar memórias e viver momentos especiais em família.`,
        luxuoso: ` Cada detalhe foi pensado para proporcionar uma experiência única de conforto e sofisticação.`,
        direto: ` Excelente custo-benefício, pronto para uso imediato.`
    };
    
    description += tones[data.tone] || tones.profissional;
    
    if (data.price) {
        description += ` Disponível por ${data.price}.`;
    }
    
    return description;
}

function generateLongPT(data) {
    const intros = [
        `Imagine-se em ${data.headline ? data.headline.toLowerCase() : `um ${data.type} que reúne tudo o que você procura`}. Esta é mais do que uma propriedade; é a concretização do seu projeto de vida.`,
        `Este ${data.type} ${data.headline ? `- ${data.headline}` : ''} representa a perfeita harmonia entre localização, conforto e potencial de valorização.`,
        `Prepare-se para conhecer ${data.headline ? data.headline.toLowerCase() : `um ${data.type} que redefine os padrões de excelência`} no mercado imobiliário.`
    ];
    
    let description = getRandomItem(intros);
    
    // Estrutura
    if (data.details.length > 0) {
        description += ` A propriedade conta com ${data.detailsText}, proporcionando ambientes amplos, iluminados e perfeitamente adaptados às necessidades contemporâneas.`;
    }
    
    // Localização
    if (data.location) {
        description += ` Localizado no coração de ${data.location}, você estará a poucos passos de tudo o que precisa: comércio, serviços, escolas e opções de lazer.`;
    }
    
    // Características especiais
    if (data.highlights) {
        description += ` Entre os diferenciais que tornam esta propriedade única, destacamos: ${data.highlights}.`;
    }
    
    // Público-alvo
    const audiences = {
        familias: ` Perfeito para famílias que buscam segurança, tranquilidade e qualidade de vida, com espaços generosos para crescer e criar memórias.`,
        investidores: ` Uma oportunidade excepcional para investidores inteligentes, com alto potencial de valorização e excelente rentabilidade.`,
        jovens: ` Ideal para jovens profissionais que valorizam praticidade, localização e um ambiente moderno para viver e trabalhar.`,
        luxo: ` Para quem exige o melhor: acabamentos premium, design sofisticado e exclusividade em cada detalhe.`
    };
    
    description += audiences[data.audience] || '';
    
    // Tom
    const tones = {
        profissional: ` Esta propriedade representa um investimento sólido e seguro, com características que garantem valorização constante ao longo do tempo.`,
        emocional: ` Mais do que paredes e teto, este é um lar que acolhe sonhos, celebra conquistas e se transforma no palco das suas melhores histórias.`,
        luxuoso: ` Cada centímetro foi cuidadosamente planejado para oferecer uma experiência de vida excepcional, onde o luxo se encontra com a funcionalidade.`,
        direto: ` Propriedade em excelente estado, com documentação regularizada e pronto para negociação imediata.`
    };
    
    description += tones[data.tone] || tones.profissional;
    
    // Preço
    if (data.price) {
        description += ` O valor de ${data.price} reflete a qualidade e o potencial desta excelente oportunidade.`;
    }
    
    // Encerramento
    const closings = [
        ` Agende sua visita e descubra pessoalmente porque esta propriedade é a escolha certa para você.`,
        ` Não perca esta oportunidade única de adquirir um imóvel que reúne qualidade, localização e potencial de valorização.`,
        ` Entre em contato hoje mesmo para mais informações e para agendar uma visita personalizada.`
    ];
    
    description += getRandomItem(closings);
    
    return description;
}

// Inglês
function generateShortEN(data) {
    const intros = [
        `✨ ${data.headline || `Excellent ${data.type}`}!`,
        `🏡 ${data.headline || `Unique ${data.type} opportunity`}!`,
        `🌟 ${data.headline || `Exclusive ${data.type}`}!`
    ];
    
    let description = getRandomItem(intros);
    
    if (data.details.length > 0) {
        description += ` ${data.detailsText}.`;
    }
    
    if (data.location) {
        description += ` Located in ${data.location}.`;
    }
    
    if (data.highlights) {
        description += ` Highlights: ${data.highlights}.`;
    }
    
    if (data.price) {
        description += ` Price: ${data.price}.`;
    }
    
    return description;
}

function generateMediumEN(data) {
    const intros = [
        `We present ${data.headline ? data.headline.toLowerCase() : `this exceptional ${data.type}`}, a unique opportunity in the real estate market.`,
        `This ${data.type} ${data.headline ? `- ${data.headline}` : ''} combines quality, comfort and a privileged location.`,
        `Discover ${data.headline ? data.headline.toLowerCase() : `this differentiated ${data.type}`}, ready to exceed your expectations.`
    ];
    
    let description = getRandomItem(intros);
    
    if (data.details.length > 0) {
        description += ` Composed of ${data.detailsText}, it offers well-distributed and functional spaces.`;
    }
    
    if (data.location) {
        description += ` Situated in ${data.location}, it enjoys a strategic location with easy access to all services.`;
    }
    
    if (data.highlights) {
        description += ` Among its special features are: ${data.highlights}.`;
    }
    
    const tones = {
        profissional: ` A serious and well-structured proposal, ideal for those seeking security and quality in their investment.`,
        emocional: ` A space that invites you to create memories and live special moments with family.`,
        luxuoso: ` Every detail was designed to provide a unique experience of comfort and sophistication.`,
        direto: ` Excellent cost-benefit, ready for immediate use.`
    };
    
    description += tones[data.tone] || tones.profissional;
    
    if (data.price) {
        description += ` Available for ${data.price}.`;
    }
    
    return description;
}

function generateLongEN(data) {
    const intros = [
        `Imagine yourself in ${data.headline ? data.headline.toLowerCase() : `a ${data.type} that brings together everything you're looking for`}. This is more than a property; it's the realization of your life project.`,
        `This ${data.type} ${data.headline ? `- ${data.headline}` : ''} represents the perfect harmony between location, comfort and appreciation potential.`,
        `Get ready to discover ${data.headline ? data.headline.toLowerCase() : `a ${data.type} that redefines excellence standards`} in the real estate market.`
    ];
    
    let description = getRandomItem(intros);
    
    if (data.details.length > 0) {
        description += ` The property features ${data.detailsText}, providing spacious, bright environments perfectly adapted to contemporary needs.`;
    }
    
    if (data.location) {
        description += ` Located in the heart of ${data.location}, you'll be steps away from everything you need: commerce, services, schools and leisure options.`;
    }
    
    if (data.highlights) {
        description += ` Among the differentials that make this property unique, we highlight: ${data.highlights}.`;
    }
    
    const audiences = {
        familias: ` Perfect for families looking for security, tranquility and quality of life, with generous spaces to grow and create memories.`,
        investidores: ` An exceptional opportunity for smart investors, with high appreciation potential and excellent profitability.`,
        jovens: ` Ideal for young professionals who value practicality, location and a modern environment to live and work.`,
        luxo: ` For those who demand the best: premium finishes, sophisticated design and exclusivity in every detail.`
    };
    
    description += audiences[data.audience] || '';
    
    const tones = {
        profissional: ` This property represents a solid and safe investment, with characteristics that guarantee constant appreciation over time.`,
        emocional: ` More than walls and a roof, this is a home that welcomes dreams, celebrates achievements and becomes the stage for your best stories.`,
        luxuoso: ` Every centimeter was carefully planned to offer an exceptional living experience, where luxury meets functionality.`,
        direto: ` Property in excellent condition, with regular documentation and ready for immediate negotiation.`
    };
    
    description += tones[data.tone] || tones.profissional;
    
    if (data.price) {
        description += ` The price of ${data.price} reflects the quality and potential of this excellent opportunity.`;
    }
    
    const closings = [
        ` Schedule your visit and discover personally why this property is the right choice for you.`,
        ` Don't miss this unique opportunity to acquire a property that combines quality, location and appreciation potential.`,
        ` Contact us today for more information and to schedule a personalized visit.`
    ];
    
    description += getRandomItem(closings);
    
    return description;
}

export function generateDescriptions(input, lang = 'pt') {
    try {
        const data = processInputData(input || {});
        
        if (lang === 'en') {
            return {
                short: generateShortEN(data),
                medium: generateMediumEN(data),
                long: generateLongEN(data)
            };
        }
        
        // Padrão: português
        return {
            short: generateShortPT(data),
            medium: generateMediumPT(data),
            long: generateLongPT(data)
        };
    } catch (error) {
        console.error("Error generating descriptions:", error);
        
        const errorMsg = lang === 'en' 
            ? "Error generating description. Please try again."
            : "Erro ao gerar descrição. Por favor, tente novamente.";
        
        return {
            short: errorMsg,
            medium: errorMsg,
            long: errorMsg
        };
    }
}