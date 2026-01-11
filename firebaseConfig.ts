import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// As suas chaves que você acabou de pegar
const firebaseConfig = {
  apiKey: "AIzaSyBtX_GcH_-6xPC8NbjmaOuqFI_qZ_yMB68",
  authDomain: "master0casino.firebaseapp.com",
  projectId: "master0casino",
  storageBucket: "master0casino.firebasestorage.app",
  messagingSenderId: "250319792354",
  appId: "1:250319792354:web:75afc1b52b2f27a8c756bb",
  measurementId: "G-MSVWXVFX7B"
};

// Inicializando o Firebase
const app = initializeApp(firebaseConfig);

// Exportando as ferramentas que vamos usar no jogo
export const auth = getAuth(app);
export const db = getFirestore(app);