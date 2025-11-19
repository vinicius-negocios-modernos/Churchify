import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';

// ------------------------------------------------------------------
// ATENÇÃO: Substitua estas chaves pelas do seu projeto Firebase Console
// ------------------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyCuUh5NASnKv_TGjHKyWxjwzy18ZQWvbTE",
  authDomain: "churchify-84f06.firebaseapp.com",
  projectId: "churchify-84f06",
  storageBucket: "churchify-84f06.firebasestorage.app",
  messagingSenderId: "18436780440",
  appId: "1:18436780440:web:2ddb23a7a4ac9de124fbed",
  measurementId: "G-V4ZG2L3F56"
};

// Inicialização segura (evita crash se a config estiver vazia)
export const isFirebaseConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY";

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);

/**
 * Salva um episódio no Firestore
 */
export const saveEpisode = async (episodeId: string, data: any) => {
  try {
    await setDoc(doc(db, 'episodes', episodeId), {
      ...data,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.error("Erro ao salvar episódio:", error);
    throw error;
  }
};

/**
 * Upload de imagem Base64 para o Storage e retorna a URL pública
 */
export const uploadImageToStorage = async (base64Data: string, path: string): Promise<string> => {
  try {
    const storageRef = ref(storage, path);
    // Remove o prefixo data:image/png;base64, se existir
    const cleanBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
    
    await uploadString(storageRef, cleanBase64, 'base64', {
      contentType: 'image/png'
    });
    
    const url = await getDownloadURL(storageRef);
    return url;
  } catch (error) {
    console.error("Erro no upload da imagem:", error);
    throw error;
  }
};