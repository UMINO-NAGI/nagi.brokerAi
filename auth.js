import { nanoid } from "nanoid";

const STORAGE_KEY = "nagi_real_estate_auth";

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
let currentUser = state.currentUser || null;

const listeners = new Set();

/**
 * Notify listeners about auth changes
 */
function notify() {
  for (const cb of listeners) {
    try {
      cb(currentUser);
    } catch {
      // ignore
    }
  }
}

/**
 * Decode base64url JWT payload without validating (client convenience only)
 */
function decodeJwtPayload(token) {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const payload = parts[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(parts[1].length + ((4 - (parts[1].length % 4)) % 4), "=");
    const json = atob(payload);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Handle credential from Google Identity Services
 * Exposed as window.handleGoogleCredential in app.js
 */
function handleGoogleCredential(credential) {
  const payload = decodeJwtPayload(credential);
  if (!payload) return;

  const user = {
    id: payload.sub || nanoid(),
    name: payload.name || payload.given_name || "Usuário",
    email: payload.email || null,
    avatar: payload.picture || null,
    provider: "google"
  };

  state.currentUser = user;
  state.users = state.users || {};
  if (!state.users[user.id]) {
    state.users[user.id] = {
      createdAt: Date.now()
    };
  }
  saveState(state);
  currentUser = user;
  notify();
}

/**
 * Manual sign-out (client-side only, does not revoke Google session)
 */
function signOut() {
  currentUser = null;
  state.currentUser = null;
  saveState(state);
  notify();
}

/**
 * Subscribe to auth changes
 */
function onChange(callback) {
  listeners.add(callback);
  callback(currentUser);
  return () => listeners.delete(callback);
}

function getCurrentUser() {
  return currentUser;
}

export const auth = {
  onChange,
  getCurrentUser,
  handleGoogleCredential,
  signOut
};