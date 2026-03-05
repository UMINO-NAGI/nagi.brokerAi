// api/verify-payment.js
import admin from 'firebase-admin';

// Inicializa Firebase Admin (apenas uma vez)
if (!admin.apps.length) {
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log('✅ Firebase Admin inicializado');
    } catch (error) {
        console.error('❌ Erro ao inicializar Firebase Admin:', error);
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
        return res.status(400).json({ error: 'Campos obrigatórios faltando' });
    }

    // Credenciais PayPal (do arquivo integrações.txt)
    const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
    const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
        return res.status(500).json({ error: 'Credenciais PayPal não configuradas' });
    }

    try {
        // Obter token de acesso PayPal
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
            throw new Error(tokenData.error_description || 'Falha na autenticação PayPal');
        }

        const accessToken = tokenData.access_token;

        // Capturar o pagamento
        const captureResponse = await fetch(`https://api-m.paypal.com/v2/checkout/orders/${orderID}/capture`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        const captureData = await captureResponse.json();

        if (!captureResponse.ok) {
            throw new Error(captureData.message || 'Falha na captura do pagamento');
        }

        // Verificar valor
        const capturedAmount = captureData.purchase_units[0].payments.captures[0].amount.value;
        
        // Mapear planos
        let monthsToAdd = 0;
        if (planID === '19.99') monthsToAdd = 1;
        else if (planID === '49.99') monthsToAdd = 3;
        else if (planID === '199.00') monthsToAdd = 12;
        else throw new Error('Plano inválido');

        if (capturedAmount !== planID) {
            throw new Error(`Valor incorreto: esperado ${planID}, recebido ${capturedAmount}`);
        }

        // Calcular data de expiração
        const now = new Date();
        const premiumUntil = new Date(now.setMonth(now.getMonth() + monthsToAdd));

        // Atualizar Firestore
        const userRef = db.collection('users').doc(userUID);
        await userRef.set({
            premiumUntil: admin.firestore.Timestamp.fromDate(premiumUntil),
            lastPayment: admin.firestore.Timestamp.now(),
            plan: planID
        }, { merge: true });

        console.log(`✅ Premium ativado para ${userUID} até ${premiumUntil}`);

        return res.status(200).json({ 
            success: true, 
            premiumUntil: premiumUntil.toISOString() 
        });

    } catch (error) {
        console.error('❌ Erro na verificação:', error);
        return res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
}