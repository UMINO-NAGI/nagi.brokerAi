// js/auth.js
import { auth, db } from './firebase-config.js';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { doc, getDoc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { verificarAssinatura, criarUsuarioPadrao } from './subscription.js';

// Função de login com Google
export async function loginComGoogle() {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error('Erro no login:', error);
    throw error;
  }
}

// Função de logout
export async function logout() {
  await signOut(auth);
}

// Observer global que será usado em toda a app
export function initAuthObserver(callback) {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      // Usuário logado: garantir que existe no Firestore
      const userRef = doc(db, 'usuarios', user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        await criarUsuarioPadrao(user);
      }
      // Verificar assinatura e retornar dados
      const subscription = await verificarAssinatura(user.uid);
      callback({ user, subscription });
    } else {
      callback(null);
    }
  });
}