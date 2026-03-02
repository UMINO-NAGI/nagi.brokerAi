// api/verify-payment.js
import admin from 'firebase-admin';

// Inicializa Firebase Admin SDK (apenas uma vez)
if (!admin.apps.length) {
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    } catch (error) {
        console.error('Firebase admin initialization error:', error);
    }
}

const db = admin.firestore();

export default async function handler(req, res) {
    // Garantir resposta JSON
    res.setHeader('Content-Type', 'application/json');

    try {
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        const { orderID, planID, userUID } = req.body;
        if (!orderID || !planID || !userUID) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // PayPal credentials do ambiente
        const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
        const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
        if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
            return res.status(500).json({ error: 'PayPal credentials not configured' });
        }

        // Obter token de acesso do PayPal
        const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
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
            throw new Error(tokenData.error_description || 'Failed to get PayPal token');
        }
        const accessToken = tokenData.access_token;

        // Capturar a ordem
        const captureResponse = await fetch(`https://api-m.paypal.com/v2/checkout/orders/${orderID}/capture`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        const captureData = await captureResponse.json();
        if (!captureResponse.ok) {
            throw new Error(captureData.message || 'Capture failed');
        }

        // Verificar se o valor capturado corresponde ao plano
        const capturedAmount = captureData.purchase_units[0].payments.captures[0].amount.value;
        const expectedAmount = planID; // planID é o preço, ex: "19.99"
        if (capturedAmount !== expectedAmount) {
            throw new Error(`Amount mismatch: expected ${expectedAmount}, got ${capturedAmount}`);
        }

        // Calcular data de expiração baseada no plano
        let monthsToAdd = 0;
        if (planID === '19.99') monthsToAdd = 1;
        else if (planID === '49.99') monthsToAdd = 3;
        else if (planID === '199.00') monthsToAdd = 12;
        else throw new Error('Invalid plan');

        const now = new Date();
        const premiumUntil = new Date(now.setMonth(now.getMonth() + monthsToAdd));

        // Atualizar Firestore
        const userRef = db.collection('users').doc(userUID);
        await userRef.set({
            premiumUntil: admin.firestore.Timestamp.fromDate(premiumUntil),
            email: (await userRef.get()).exists ? undefined : (await getEmailFromAuth(userUID)) // opcional
        }, { merge: true });

        return res.status(200).json({ success: true, premiumUntil: premiumUntil.toISOString() });

    } catch (error) {
        console.error('Payment verification error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}

// Helper para obter email do Firebase Auth (opcional)
async function getEmailFromAuth(uid) {
    try {
        const user = await admin.auth().getUser(uid);
        return user.email;
    } catch {
        return null;
    }
}