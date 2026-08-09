import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// 1. Dosya yükleme için gerekli olan Storage servisini import et
import { getStorage } from "firebase/storage"; 

const firebaseConfig = {
  apiKey: "AIzaSyAOBKlPpCY6bcp_o0bUY0T_YZXnsD-y-dY",
  authDomain: "otoweb-a8709.firebaseapp.com",
  projectId: "otoweb-a8709",
  storageBucket: "otoweb-a8709.firebasestorage.app",
  messagingSenderId: "436331700423",
  appId: "1:436331700423:web:ab9868341978dfb9fa5ee2",
  measurementId: "G-FCSEVRR228"
};

// Next.js (SSR) kontrolü
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// 2. Servisleri tanımla
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app); // Storage burada tanımlandı!

// 3. Hepsini tek seferde tertemiz dışarı aktar
export { auth, db, storage };
export default app;