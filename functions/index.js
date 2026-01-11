const functions = require("firebase-functions");
const admin = require("firebase-admin");
const mercadopago = require("mercadopago");

admin.initializeApp();
const db = admin.firestore();

// CONFIGURAÇÃO MERCADO PAGO
// Master 0: Aqui você colará seu token depois
mercadopago.configurations.setAccessToken("SEU_ACCESS_TOKEN_AQUI");

// 1. FUNÇÃO QUE O APP CHAMA PARA COMPRAR
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
    notification_url: "https://us-central1-master0casino.cloudfunctions.net/webhookPagamento", 
    back_urls: {
      success: "https://master0casino.web.app/sucesso",
    },
    auto_return: "approved",
  };

  try {
    const res = await mercadopago.preferences.create(preference);
    return { init_point: res.body.init_point };
  } catch (error) {
    throw new functions.https.HttpsError('internal', "Erro no Mercado Pago.");
  }
});

// 2. FUNÇÃO QUE RECEBE O AVISO DO BANCO (WEBHOOK)
exports.webhookPagamento = functions.https.onRequest(async (req, res) => {
  const { query } = req;
  const topic = query.topic || query.type;

  if (topic === 'payment') {
    const paymentId = query.id || query['data.id'];
    
    try {
      const paymentInfo = await mercadopago.payment.findById(paymentId);
      
      if (paymentInfo.body.status === 'approved') {
        const uid = paymentInfo.body.metadata.user_id;
        const fichasGanhas = paymentInfo.body.metadata.valor_fichas;

        // Adiciona as fichas automaticamente ao jogador
        const userRef = db.collection('jogadores').doc(uid);
        await userRef.update({
          fichas: admin.firestore.FieldValue.increment(fichasGanhas)
        });
        
        console.log(`✅ Pagamento aprovado: ${fichasGanhas} fichas para ${uid}`);
      }
    } catch (e) {
      console.error("Erro Webhook:", e);
    }
  }
  res.status(200).send("OK");
});