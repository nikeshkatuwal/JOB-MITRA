import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD8mV8eBFyCe-UryItr3i4_rOdsrtJqR8Y",
  authDomain: "job-mitra-df689.firebaseapp.com",
  projectId: "job-mitra-df689",
  storageBucket: "job-mitra-df689.firebasestorage.app",
  messagingSenderId: "1080381802221",
  appId: "1:1080381802221:web:787c47956a76ff37b6aee4",
  measurementId: "G-QY24KZCQD1"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();