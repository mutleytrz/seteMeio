const express = require('express');
const path = require('path');
const cors = require('cors');
const admin = require('firebase-admin');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// --- CONFIGURAÇÃO DO FIREBASE (MASTER 0) ---
let serviceAccount;

if (process.env.FIREBASE_CONFIG) {
    try {
        // Na Render, lemos a variável de ambiente que você configurou
        serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);
    } catch (err) {
        console.error("Erro ao processar FIREBASE_CONFIG:", err);
    }
} else {
    try {
        // No seu PC local, ele tenta usar o arquivo
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

// 1. Serve os arquivos estáticos da pasta 'dist'
app.use(express.static(path.join(__dirname, 'dist')));

// 2. CORREÇÃO EXPRESS 5: Rota curinga corrigida de '*' para '/(.*)'
// Isso evita o erro "PathError: Missing parameter name"
app.get('/(.*)', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// --- INICIALIZAÇÃO DO SERVIDOR ---
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 SERVIDOR MASTER 0 NO AR!`);
    console.log(`🔗 Porta oficial Render: ${PORT}`);
    console.log(`📂 Servindo arquivos de: ${path.join(__dirname, 'dist')}`);
});