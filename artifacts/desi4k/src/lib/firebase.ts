import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBYNU7wTq9_1-TdIVuG-yxAlKjeFb9Rm_M",
  authDomain: "video-cms-b7c1e.firebaseapp.com",
  projectId: "video-cms-b7c1e",
  storageBucket: "video-cms-b7c1e.firebasestorage.app",
  messagingSenderId: "991575420179",
  appId: "1:991575420179:web:23459a09aa36f868e37ee6",
  measurementId: "G-S9R2HDC5FZ"
};

export const firebaseApp = initializeApp(firebaseConfig);
export const db = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);
