const express = require('express');
const path = require('path');
const cors = require('cors');
const admin = require('firebase-admin');

const app = express();

// Middlewares básicos
app.use(cors());
app.use(express.json());

// --- CONFIGURAÇÃO DO FIREBASE (MASTER 0) ---
let serviceAccount;

if (process.env.FIREBASE_CONFIG) {
    try {
        serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);
    } catch (err) {
        console.error("Erro ao processar FIREBASE_CONFIG:", err);
    }
} else {
    try {
        serviceAccount = require('./chave-firebase.json');
    } catch (err) {
        console.warn("Aviso: Rodando sem chave local (esperado na Render).");
    }
}

if (serviceAccount) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log("✅ Firebase Master 0 Conectado!");
    } catch (err) {
        console.error("Erro ao inicializar Firebase Admin:", err);
    }
}

// --- SERVINDO O FRONTEND (EXPO WEB) ---

// 1. Primeiro, serve os arquivos reais da pasta 'dist' (js, css, imagens)
app.use(express.static(path.join(__dirname, 'dist')));

// 2. SOLUÇÃO À PROVA DE ERROS PARA EXPRESS 5:
// Em vez de usar strings complexas como '/(.*)' ou ':splat*', 
// usamos um middleware simples que entrega o index.html para qualquer rota.
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// --- INICIALIZAÇÃO DO SERVIDOR ---
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 SERVIDOR MASTER 0 NO AR!`);
    console.log(`🔗 Porta oficial Render: ${PORT}`);
    console.log(`📂 Servindo arquivos de: ${path.join(__dirname, 'dist')}`);
});