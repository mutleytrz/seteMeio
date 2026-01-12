const express = require('express');
const path = require('path');
const cors = require('cors');
const admin = require('firebase-admin');

const app = express();
app.use(cors());
app.use(express.json());

// --- LÓGICA DE CONEXÃO MASTER 0 ---
let serviceAccount;

if (process.env.FIREBASE_CONFIG) {
    // Aqui ele lê a variável que você colou na imagem 4
    serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);
} else {
    // Aqui ele tenta ler no seu PC (o arquivo vermelho)
    try {
        serviceAccount = require('./chave-firebase.json');
    } catch (e) {
        console.log("Aguardando configuração de ambiente...");
    }
}

if (serviceAccount) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log("✅ Firebase Master 0 Conectado!");
}

// Serve os arquivos do jogo
app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 Cassino Master 0 rodando na porta ${PORT}`);
});