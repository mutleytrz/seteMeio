const functions = require("firebase-functions");
const admin = require("firebase-admin");
const mercadopago = require("mercadopago");

admin.initializeApp();
const db = admin.firestore();

// CONFIGURAÇÃO MERCADO PAGO
// Master 0: Substitua pelo seu Access Token real quando tiver
mercadopago.configurations.setAccessToken("APP_USR-8733973950669281-011116-24e03d40f2b3226a454d3e232938f32c-250319792354");

// 1. FUNÇÃO QUE O APP CHAMA PARA COMPRAR (VIA RENDER)
exports.criarCheckout = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Precisa estar logado.');
  }

  const { amount, userId } = data;

  let preference = {
    items: [{
      title: `Recarga Master 0 - ${amount * 10} Fichas`,
      unit_price: Number(amount),
      quantity: 1,
    }],
    metadata: { 
      user_id: userId, 
      valor_fichas: amount * 10 
    },
    notification_url: "https://setemeio.onrender.com/webhook", 
    back_urls: {
      success: "https://master0casino.web.app/sucesso",
    },
    auto_return: "approved",
  };

  try {
    const res = await mercadopago.preferences.create(preference);
    return { init_point: res.body.init_point };
  } catch (error) {
    console.error("Erro MP:", error);
    throw new functions.https.HttpsError('internal', "Erro no Mercado Pago.");
  }
});

// 2. WEBHOOK ATUALIZADO PARA O NOVO SISTEMA
exports.webhookPagamento = functions.https.onRequest(async (req, res) => {
  const paymentId = req.query['data.id'] || req.query.id;

  if (paymentId) {
    try {
      const paymentInfo = await mercadopago.payment.findById(paymentId);
      
      if (paymentInfo.body.status === 'approved') {
        const uid = paymentInfo.body.metadata.user_id;
        const fichasGanhas = paymentInfo.body.metadata.valor_fichas;

        const userRef = db.collection('users').doc(uid); // Ajustado para sua coleção 'users'
        await userRef.update({
          balance: admin.firestore.FieldValue.increment(fichasGanhas)
        });
        
        console.log(`✅ Sucesso: ${fichasGanhas} fichas para ${uid}`);
      }
    } catch (e) {
      console.error("Erro no Webhook:", e);
    }
  }
  res.status(200).send("OK");
});