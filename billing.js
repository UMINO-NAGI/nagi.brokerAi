const STORAGE_KEY = "nagi_broker_ai_billing";
const FREE_LIMIT = 1; // Apenas 1 geração gratuita

function loadState() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return {};
        return JSON.parse(stored);
    } catch (error) {
        console.error("Error loading billing state:", error);
        return {};
    }
}

function saveState(state) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
        console.error("Error saving billing state:", error);
    }
}

let state = loadState();

function getUserKey(user) {
    if (user && user.id) return `user_${user.id}`;
    return "anonymous";
}

function getUserRecord(user) {
    const key = getUserKey(user);
    if (!state[key]) {
        state[key] = {
            used: 0,
            planActive: false,
            planExpiresAt: null,
            paymentVerified: false
        };
        saveState(state);
    }
    return state[key];
}

function canGenerate(user) {
    if (!user) return false;
    const rec = getUserRecord(user);
    
    // Se tem plano ativo e não expirou
    if (rec.planActive && rec.planExpiresAt) {
        const now = Date.now();
        if (now < rec.planExpiresAt) {
            return true;
        } else {
            // Plano expirado
            rec.planActive = false;
            saveState(state);
            return false;
        }
    }
    
    // Versão gratuita
    return rec.used < FREE_LIMIT;
}

function getRemaining(user) {
    if (!user) return FREE_LIMIT;
    const rec = getUserRecord(user);
    
    if (rec.planActive && rec.planExpiresAt && Date.now() < rec.planExpiresAt) {
        return Infinity;
    }
    
    return Math.max(0, FREE_LIMIT - (rec.used || 0));
}

function registerGeneration(user) {
    if (!user) return;
    const rec = getUserRecord(user);
    rec.used = (rec.used || 0) + 1;
    saveState(state);
}

function isPaywalled(user) {
    if (!user) return false;
    const rec = getUserRecord(user);
    
    // Verificar se plano expirou
    if (rec.planActive && rec.planExpiresAt && Date.now() > rec.planExpiresAt) {
        rec.planActive = false;
        saveState(state);
    }
    
    return !rec.planActive && (rec.used || 0) >= FREE_LIMIT;
}

function activateMonthlyPlan(user) {
    if (!user) return false;
    
    const rec = getUserRecord(user);
    const now = Date.now();
    const oneMonth = 30 * 24 * 60 * 60 * 1000; // 30 dias em milissegundos
    
    rec.planActive = true;
    rec.paymentVerified = true;
    rec.planExpiresAt = now + oneMonth;
    rec.used = 0; // Resetar contador
    
    saveState(state);
    return true;
}

function hasActivePlan(user) {
    if (!user) return false;
    const rec = getUserRecord(user);
    
    if (rec.planActive && rec.planExpiresAt) {
        const now = Date.now();
        if (now < rec.planExpiresAt) {
            return true;
        } else {
            // Plano expirado
            rec.planActive = false;
            saveState(state);
            return false;
        }
    }
    
    return false;
}

function getPlanExpiry(user) {
    if (!user) return null;
    const rec = getUserRecord(user);
    return rec.planExpiresAt;
}

function getPlanStatus(user) {
    if (!user) return { active: false, expiresAt: null, used: 0, freeLimit: FREE_LIMIT };
    
    const rec = getUserRecord(user);
    const now = Date.now();
    const active = rec.planActive && rec.planExpiresAt && now < rec.planExpiresAt;
    
    return {
        active,
        expiresAt: rec.planExpiresAt,
        used: rec.used || 0,
        freeLimit: FREE_LIMIT,
        paymentVerified: rec.paymentVerified || false
    };
}

export const billing = {
    canGenerate,
    getRemaining,
    registerGeneration,
    isPaywalled,
    activateMonthlyPlan,
    hasActivePlan,
    getPlanExpiry,
    getPlanStatus,
    FREE_LIMIT
};