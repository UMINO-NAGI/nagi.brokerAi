import { nanoid } from "nanoid";

const STORAGE_KEY = "nagi_real_estate_auth";

function loadState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { users: {} };
    return JSON.parse(stored);
  } catch (error) {
    console.warn("Failed to load auth state:", error);
    return { users: {} };
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Failed to save auth state:", error);
  }
}

let state = loadState();
let currentUser = state.currentUser || null;

const listeners = new Set();

function decodeJwtPayload(token) {
  if (!token || typeof token !== "string") return null;
  
  const parts = token.split(".");
  if (parts.length < 2) return null;
  
  try {
    let base64 = parts[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    
    const padLength = 4 - (base64.length % 4);
    if (padLength < 4) base64 += "=".repeat(padLength);
    
    const json = atob(base64);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function handleGoogleCredential(credential) {
  if (!credential) return;
  
  const payload = decodeJwtPayload(credential);
  if (!payload) {
    console.error("Failed to decode JWT payload");
    return;
  }

  const user = {
    id: payload.sub || nanoid(),
    name: payload.name || payload.given_name || "Usuário",
    email: payload.email || null,
    avatar: payload.picture || null,
    provider: "google",
    createdAt: Date.now()
  };

  state.currentUser = user;
  state.users = state.users || {};
  
  if (!state.users[user.id]) {
    state.users[user.id] = {
      createdAt: Date.now(),
      lastLogin: Date.now()
    };
  } else {
    state.users[user.id].lastLogin = Date.now();
  }
  
  saveState(state);
  currentUser = user;
  notify();
}

function signOut() {
  if (currentUser) {
    console.log(`User ${currentUser.name} signed out`);
  }
  currentUser = null;
  state.currentUser = null;
  saveState(state);
  notify();
}

function notify() {
  listeners.forEach(callback => {
    try {
      callback(currentUser);
    } catch (error) {
      console.error("Auth listener error:", error);
    }
  });
}

function onChange(callback) {
  if (typeof callback !== "function") return () => {};
  
  listeners.add(callback);
  callback(currentUser);
  
  return () => listeners.delete(callback);
}

function getCurrentUser() {
  return currentUser;
}

function isAuthenticated() {
  return !!currentUser;
}

window.handleGoogleCredential = handleGoogleCredential;

export const auth = {
  onChange,
  getCurrentUser,
  isAuthenticated,
  handleGoogleCredential,
  signOut
};