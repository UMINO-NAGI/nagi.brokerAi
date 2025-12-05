import { nanoid } from "nanoid";

const STORAGE_KEY = "nagi_broker_ai_auth";

function loadState() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return { users: {} };
        return JSON.parse(stored);
    } catch (error) {
        console.error("Error loading auth state:", error);
        return { users: {} };
    }
}

function saveState(state) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
        console.error("Error saving auth state:", error);
    }
}

let state = loadState();
let currentUser = state.currentUser || null;

const listeners = new Set();

function decodeJwtPayload(token) {
    if (!token) return null;
    
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        
        const base64Url = parts[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error("Error decoding JWT:", error);
        return null;
    }
}

function handleGoogleCredential(credential) {
    console.log("Google credential received:", credential);
    
    const payload = decodeJwtPayload(credential);
    if (!payload) {
        console.error("Failed to decode Google credential");
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
    
    console.log("User authenticated:", user);
    
    // Salvar no state
    state.currentUser = user;
    state.users = state.users || {};
    
    if (!state.users[user.id]) {
        state.users[user.id] = {
            createdAt: Date.now(),
            lastLogin: Date.now(),
            loginCount: 1
        };
    } else {
        state.users[user.id].lastLogin = Date.now();
        state.users[user.id].loginCount = (state.users[user.id].loginCount || 0) + 1;
    }
    
    saveState(state);
    
    // Atualizar currentUser e notificar listeners
    currentUser = user;
    notify();
}

function signOut() {
    console.log("User signing out");
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
            console.error("Error in auth listener:", error);
        }
    });
}

function onChange(callback) {
    if (typeof callback !== "function") {
        console.error("Auth onChange callback must be a function");
        return () => {};
    }
    
    listeners.add(callback);
    
    // Chamar imediatamente com o estado atual
    callback(currentUser);
    
    return () => listeners.delete(callback);
}

function getCurrentUser() {
    return currentUser;
}

function isAuthenticated() {
    return !!currentUser;
}

// Expor para uso global
window.handleGoogleCredential = handleGoogleCredential;

export const auth = {
    onChange,
    getCurrentUser,
    isAuthenticated,
    handleGoogleCredential,
    signOut
};