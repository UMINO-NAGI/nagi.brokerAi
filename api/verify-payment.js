// api/verify-payment.js
// Função para validar pagamentos PayPal e atualizar Firestore

import admin from 'firebase-admin';

// Inicializa Firebase Admin (apenas uma vez)
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
    res.setHeader('Content-Type', 'application/json');

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { orderID, planID, userUID } = req.body;
    if (!orderID || !planID || !userUID) {
        return res.status(400).json({ error: 'Campos obrigatórios ausentes' });
    }

    // Credenciais do PayPal (do ambiente)
    const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
    const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
        return res.status(500).json({ error: 'Credenciais PayPal não configuradas' });
    }

    // Obter token de acesso PayPal
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
    let accessToken;
    try {
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
            throw new Error(tokenData.error_description || 'Falha ao obter token PayPal');
        }
        accessToken = tokenData.access_token;
    } catch (error) {
        console.error('Erro token PayPal:', error);
        return res.status(500).json({ error: 'Autenticação PayPal falhou' });
    }

    // Capturar a ordem
    try {
        const captureResponse = await fetch(`https://api-m.paypal.com/v2/checkout/orders/${orderID}/capture`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        const captureData = await captureResponse.json();
        if (!captureResponse.ok) {
            throw new Error(captureData.message || 'Falha na captura');
        }

        // Verificar valor
        const capturedAmount = captureData.purchase_units[0].payments.captures[0].amount.value;
        if (capturedAmount !== planID) {
            throw new Error(`Valor incorreto: esperado ${planID}, recebido ${capturedAmount}`);
        }

        // Calcular data de expiração
        let monthsToAdd = 0;
        if (planID === '19.99') monthsToAdd = 1;
        else if (planID === '49.99') monthsToAdd = 3;
        else if (planID === '199.00') monthsToAdd = 12;
        else throw new Error('Plano inválido');

        const now = new Date();
        const premiumUntil = new Date(now.setMonth(now.getMonth() + monthsToAdd));

        // Atualizar Firestore
        const userRef = db.collection('users').doc(userUID);
        await userRef.set({
            premiumUntil: admin.firestore.Timestamp.fromDate(premiumUntil),
            lastPayment: admin.firestore.Timestamp.now()
        }, { merge: true });

        return res.status(200).json({ success: true, premiumUntil: premiumUntil.toISOString() });
    } catch (error) {
        console.error('Erro na verificação do pagamento:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}