const STORAGE_KEY = "nagi_real_estate_billing";
const FREE_LIMIT = 3;

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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
  }
  return state[key];
}

function canGenerate(user) {
  const rec = getUserRecord(user);
  if (rec.planActive) return true;
  return rec.used < FREE_LIMIT;
}

function getRemaining(user) {
  const rec = getUserRecord(user);
  if (rec.planActive) return Infinity;
  return Math.max(0, FREE_LIMIT - (rec.used || 0));
}

function registerGeneration(user) {
  const rec = getUserRecord(user);
  rec.used = (rec.used || 0) + 1;
  saveState(state);
}

function isPaywalled(user) {
  const rec = getUserRecord(user);
  return !rec.planActive && (rec.used || 0) >= FREE_LIMIT;
}

function activatePlan(user) {
  const rec = getUserRecord(user);
  rec.planActive = true;
  saveState(state);
}

function hasActivePlan(user) {
  const rec = getUserRecord(user);
  return !!rec.planActive;
}

export const billing = {
  canGenerate,
  getRemaining,
  registerGeneration,
  isPaywalled,
  activatePlan,
  hasActivePlan,
  FREE_LIMIT
};

