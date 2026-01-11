const express = require('express');
const mercadopago = require('mercadopago');
const admin = require('firebase-admin');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());

// Lendo a chave que aparece na sua imagem
const serviceAccount = require("./chave-firebase.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

// Master 0: Substitua pelo seu Access Token de PRODUÇÃO do Mercado Pago
mercadopago.configurations.setAccessToken("APP_USR-cc37a432-6364-43d9-a377-d08c0c36eae2");

// Rota para criar o pagamento
app.post('/checkout', async (req, res) => {
  const { userId, amount } = req.body;
  try {
    const response = await mercadopago.preferences.create({
      items: [{
        title: `Fichas Master 0`,
        unit_price: Number(amount),
        quantity: 1,
      }],
      metadata: { user_id: userId, valor_fichas: amount * 10 },
      payment_methods: {
        excluded_payment_types: [{ id: "ticket" }], // Sem boleto
        installments: 1
      },
      // URL que o Render vai te dar depois para confirmar o pagamento
      notification_url: "SUA_URL_DO_RENDER_AQUI/webhook" 
    });
    res.json({ init_point: response.body.init_point });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rota que recebe o aviso do banco (Webhook)
app.post('/webhook', async (req, res) => {
  const { query } = req;
  const topic = query.topic || query.type;

  if (topic === 'payment') {
    const paymentId = query.id || query['data.id'];
    try {
      const paymentInfo = await mercadopago.payment.findById(paymentId);
      if (paymentInfo.body.status === 'approved') {
        const uid = paymentInfo.body.metadata.user_id;
        const fichasGanhas = paymentInfo.body.metadata.valor_fichas;

        const userRef = db.collection('jogadores').doc(uid);
        await userRef.update({
          fichas: admin.firestore.FieldValue.increment(fichasGanhas)
        });
        console.log(`✅ Dinheiro na conta! Fichas entregues ao: ${uid}`);
      }
    } catch (e) { console.error("Erro no webhook:", e); }
  }
  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor Master 0 online na porta ${PORT}`));