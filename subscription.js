// js/subscription.js
import { db } from './firebase-config.js';
import { doc, getDoc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// Cria documento de usuário com valores padrão (free)
export async function criarUsuarioPadrao(user) {
  const userRef = doc(db, 'usuarios', user.uid);
  await setDoc(userRef, {
    email: user.email,
    nome: user.displayName || '',
    foto: user.photoURL || '',
    plano: 'free',
    status: 'free',
    expiresAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

// Verifica se o usuário tem assinatura ativa
export async function verificarAssinatura(uid) {
  try {
    const userRef = doc(db, 'usuarios', uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return { ativa: false, status: 'free', plano: 'free' };

    const data = userSnap.data();
    const agora = new Date();
    const expiresAt = data.expiresAt?.toDate ? data.expiresAt.toDate() : null;

    let ativa = false;
    if (data.status === 'active' && expiresAt && expiresAt > agora) {
      ativa = true;
    } else if (data.status === 'active' && expiresAt && expiresAt <= agora) {
      // Atualiza status para expired (opcional, pode ser feito por função cloud)
      // Por enquanto apenas informamos
      ativa = false;
    }

    return {
      ativa,
      status: data.status,
      plano: data.plano,
      expiresAt
    };
  } catch (error) {
    console.error('Erro ao verificar assinatura:', error);
    return { ativa: false, status: 'free', plano: 'free' };
  }
}

// Função auxiliar para formatar data (uso no admin)
export function formatarData(timestamp) {
  if (!timestamp) return 'Nunca';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('pt-BR');
}