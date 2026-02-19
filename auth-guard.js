// js/auth-guard.js
import { auth } from './firebase-config.js';
import { verificarAssinatura } from './subscription.js';

// Função a ser chamada no início de páginas protegidas
export async function protegerPagina() {
  return new Promise((resolve, reject) => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      unsubscribe();
      if (!user) {
        // Redireciona para login
        window.location.href = '/index.html';
        return;
      }

      const sub = await verificarAssinatura(user.uid);
      if (!sub.ativa) {
        // Redireciona para planos com mensagem
        sessionStorage.setItem('redirectMessage', 'Sua assinatura está inativa ou expirada. Escolha um plano.');
        window.location.href = '/index.html#planos';
        return;
      }

      resolve(user);
    }, reject);
  });
}

// Exemplo de uso em dashboard.html:
// import { protegerPagina } from './js/auth-guard.js';
// protegerPagina().then(user => { ... });