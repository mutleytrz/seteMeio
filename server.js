const express = require('express');
const mercadopago = require('mercadopago');
const admin = require('firebase-admin');
const cors = require('cors');
const path = require('path'); // ADICIONADO: Necessário para caminhos de arquivos
const app = express();

app.use(express.json());
app.use(cors());

// Serve os arquivos do seu jogo (Frontend) da pasta 'dist'
app.use(express.static(path.join(__dirname, 'dist')));

// Lendo a chave do Firebase
const serviceAccount = require("./chave-firebase.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

// Master 0: Access Token Mercado Pago
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
        excluded_payment_types: [{ id: "ticket" }],
        installments: 1
      },
      // URL do seu servidor na Render
      notification_url: "https://setemeio.onrender.com/webhook" 
    });
    res.json({ init_point: response.body.init_point });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rota do Webhook
app.post('/webhook', async (req, res) => {
  const { query } = req;
  const topic = query.topic || query.type;

  if (topic === 'payment') {
    const paymentId = query.id || query['data.id'];
    try {
      const paymentInfo = await mercadopago.payment.get(paymentId);
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

// ADICIONADO: Rota curinga para garantir que o site carregue em qualquer página
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Servidor Master 0 online na porta ${PORT}`));