import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBtX_GcH_-6xPC8NbjmaOuqFI_qZ_yMB68",
  authDomain: "master0casino.firebaseapp.com",
  projectId: "master0casino",
  storageBucket: "master0casino.firebasestorage.app",
  messagingSenderId: "250319792354",
  appId: "1:250319792354:web:75afc1b52b2f27a8c756bb",
  measurementId: "G-MSVWXVFX7B"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const API_URL = "https://setemeio.onrender.com";

export const gerarPixCobranca = async (valor: any, userId: any): Promise<any> => {
  try {
    const response = await fetch(`${API_URL}/gerar-pix`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ valor, userId }),
    });
    if (!response.ok) throw new Error('Erro no servidor');
    return await response.json();
  } catch (error) {
    console.log("Erro no PIX:", error);
    return null;
  }
};