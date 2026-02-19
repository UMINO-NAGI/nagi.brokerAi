// app.js - Ponto de entrada principal
import { iniciarUI } from './js/ui.js';
import { abrirPainelAdmin } from './js/admin.js';
import { auth } from './js/firebase-config.js';
import { logout } from './js/auth.js';

// Expor funções globais se necessário (para botões onclick)
window.logout = logout;
window.abrirPainelAdmin = abrirPainelAdmin;

// Iniciar a interface quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
  iniciarUI();
});

// Opcional: tratar erros não capturados
window.addEventListener('unhandledrejection', (event) => {
  console.error('Erro não tratado:', event.reason);
  alert('Ocorreu um erro inesperado. Tente novamente.');
});