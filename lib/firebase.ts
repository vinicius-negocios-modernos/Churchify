import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Configuração do Firebase
// 1. Vá em console.firebase.google.com
// 2. Crie um projeto
// 3. Adicione um app Web (ícone </>)
// 4. Copie as configurações e cole abaixo
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Verificação de segurança para evitar tela branca se as chaves não forem configuradas
const isConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY_HERE";

if (!isConfigured) {
  console.warn("⚠️ O Firebase não está configurado! Edite o arquivo lib/firebase.ts com suas chaves.");
}

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);