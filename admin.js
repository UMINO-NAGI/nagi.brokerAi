// js/admin.js
import { db } from './firebase-config.js';
import { collection, getDocs, doc, updateDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

export async function abrirPainelAdmin() {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50';
  modal.innerHTML = `
    <div class="bg-gray-900 rounded-xl p-6 max-w-4xl w-full max-h-[80vh] overflow-auto">
      <h2 class="text-2xl font-bold mb-4">Painel Administrativo</h2>
      <div id="admin-users-list" class="space-y-4">
        Carregando usuários...
      </div>
      <button id="fechar-admin" class="mt-4 px-4 py-2 bg-gray-700 rounded-lg">Fechar</button>
    </div>
  `;
  document.body.appendChild(modal);

  const listDiv = modal.querySelector('#admin-users-list');
  modal.querySelector('#fechar-admin').addEventListener('click', () => modal.remove());

  try {
    const querySnapshot = await getDocs(collection(db, 'usuarios'));
    let html = '';
    querySnapshot.forEach(docSnap => {
      const data = docSnap.data();
      const uid = docSnap.id;
      html += `
        <div class="border border-gray-700 p-4 rounded-lg">
          <p><strong>UID:</strong> ${uid}</p>
          <p><strong>Email:</strong> ${data.email || 'N/A'}</p>
          <p><strong>Nome:</strong> ${data.nome || 'N/A'}</p>
          <p><strong>Plano:</strong> ${data.plano || 'free'}</p>
          <p><strong>Status:</strong> ${data.status || 'free'}</p>
          <p><strong>Expira em:</strong> ${data.expiresAt ? new Date(data.expiresAt.seconds * 1000).toLocaleString() : 'Nunca'}</p>
          <div class="flex gap-2 mt-2">
            <button class="admin-set-active bg-green-600 px-3 py-1 rounded" data-uid="${uid}">Ativar (30 dias)</button>
            <button class="admin-set-expired bg-red-600 px-3 py-1 rounded" data-uid="${uid}">Marcar Expirado</button>
            <select class="admin-plan-select bg-gray-800 border rounded p-1">
              <option value="mensal" ${data.plano === 'mensal' ? 'selected' : ''}>Mensal</option>
              <option value="trimestral" ${data.plano === 'trimestral' ? 'selected' : ''}>Trimestral</option>
              <option value="anual" ${data.plano === 'anual' ? 'selected' : ''}>Anual</option>
            </select>
          </div>
        </div>
      `;
    });
    listDiv.innerHTML = html || 'Nenhum usuário encontrado.';

    listDiv.querySelectorAll('.admin-set-active').forEach(btn => {
      btn.addEventListener('click', async () => {
        const uid = btn.dataset.uid;
        const select = btn.parentElement.querySelector('.admin-plan-select');
        const plano = select.value;
        const dias = { mensal: 30, trimestral: 90, anual: 365 }[plano] || 30;
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + dias);
        await updateDoc(doc(db, 'usuarios', uid), {
          plano,
          status: 'active',
          expiresAt: expiryDate,
          updatedAt: serverTimestamp()
        });
        alert('Usuário ativado!');
        modal.remove();
        abrirPainelAdmin(); // recarrega
      });
    });

    listDiv.querySelectorAll('.admin-set-expired').forEach(btn => {
      btn.addEventListener('click', async () => {
        const uid = btn.dataset.uid;
        await updateDoc(doc(db, 'usuarios', uid), {
          status: 'expired',
          expiresAt: null,
          updatedAt: serverTimestamp()
        });
        alert('Usuário expirado!');
        modal.remove();
        abrirPainelAdmin();
      });
    });

  } catch (error) {
    console.error('Erro ao carregar admin:', error);
    listDiv.innerHTML = 'Erro ao carregar usuários. Verifique permissões.';
  }
}