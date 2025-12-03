const STORAGE_KEY = "nagi_real_estate_billing";
const FREE_LIMIT = 3;

function loadState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return {};
    return JSON.parse(stored);
  } catch (error) {
    console.warn("Failed to load billing state:", error);
    return {};
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Failed to save billing state:", error);
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
    state[key] = { used: 0, planActive: false };
    saveState(state);
  }
  return state[key];
}

function canGenerate(user) {
  if (!user) return false;
  const rec = getUserRecord(user);
  return rec.planActive || rec.used < FREE_LIMIT;
}

function getRemaining(user) {
  if (!user) return FREE_LIMIT;
  const rec = getUserRecord(user);
  if (rec.planActive) return Infinity;
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
  return !rec.planActive && (rec.used || 0) >= FREE_LIMIT;
}

function activatePlan(user) {
  if (!user) return;
  const rec = getUserRecord(user);
  rec.planActive = true;
  saveState(state);
}

function hasActivePlan(user) {
  if (!user) return false;
  const rec = getUserRecord(user);
  return !!rec.planActive;
}

function resetUser(user) {
  if (!user) return;
  const key = getUserKey(user);
  delete state[key];
  saveState(state);
}

export const billing = {
  canGenerate,
  getRemaining,
  registerGeneration,
  isPaywalled,
  activatePlan,
  hasActivePlan,
  resetUser,
  FREE_LIMIT
};