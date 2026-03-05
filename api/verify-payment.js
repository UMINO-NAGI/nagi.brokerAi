// api/verify-payment.js
import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (error) {
    console.error('Erro ao inicializar Firebase Admin:', error);
  }
}

const db = admin.firestore();

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { orderID, planID, userUID } = req.body;

    if (!orderID || !planID || !userUID) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando' });
    }

    // Obter access token do PayPal
    const auth = Buffer.from(
      `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
    ).toString('base64');

    const tokenResponse = await fetch('https://api-m.paypal.com/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) {
      throw new Error(tokenData.error_description || 'Falha na autenticação do PayPal');
    }

    // Capturar o pagamento
    const captureResponse = await fetch(
      `https://api-m.paypal.com/v2/checkout/orders/${orderID}/capture`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const captureData = await captureResponse.json();
    if (!captureResponse.ok) {
      throw new Error(captureData.message || 'Falha na captura do pagamento');
    }

    // Verificar valor
    const capturedAmount = captureData.purchase_units[0].payments.captures[0].amount.value;
    if (capturedAmount !== planID) {
      throw new Error(`Valor incorreto. Esperado: ${planID}, Recebido: ${capturedAmount}`);
    }

    // Calcular data de expiração
    let months = 0;
    if (planID === '19.99') months = 1;
    else if (planID === '49.99') months = 3;
    else if (planID === '199.00') months = 12;
    else throw new Error('Plano inválido');

    const premiumUntil = new Date();
    premiumUntil.setMonth(premiumUntil.getMonth() + months);

    // Atualizar Firestore
    await db.collection('users').doc(userUID).set({
      premiumUntil: admin.firestore.Timestamp.fromDate(premiumUntil),
      email: (await admin.auth().getUser(userUID)).email,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    return res.status(200).json({ 
      success: true, 
      premiumUntil: premiumUntil.toISOString() 
    });

  } catch (error) {
    console.error('Erro no verify-payment:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}