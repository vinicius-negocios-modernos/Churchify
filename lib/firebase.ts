
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

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

/**
 * Salva um episódio no Firestore (Completo ou Parcial)
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
 * Marca um episódio como "Sem Mídia"
 */
export const markAsNoMedia = async (episodeId: string, campusId: string, dateStr: string, timeStr: string) => {
  return saveEpisode(episodeId, {
    campusId,
    date: dateStr, // Importante salvar a data para ordenação se for um evento extra
    time: timeStr,
    status: 'no-media'
  });
};
