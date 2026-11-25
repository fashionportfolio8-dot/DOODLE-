import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAqBpkOG-6KdN4hJHoabliCnew0W7s0cVk",
  authDomain: "doodle-f5c77.firebaseapp.com",
  projectId: "doodle-f5c77",
  storageBucket: "doodle-f5c77.firebasestorage.app",
  messagingSenderId: "793047378097",
  appId: "1:793047378097:web:b2f5fe74d2bf296c969a90",
  measurementId: "G-ZF3WD3FGLN"
};

const app = initializeApp(firebaseConfig, "doodle-outpost-ai-agent");
export const auth = getAuth(app);
export const db = getFirestore(app);
export const ADMIN_EMAIL = "chandegaraharsh464@gmail.com";