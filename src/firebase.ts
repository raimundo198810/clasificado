import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";

// Config values matching firebase-applet-config.json
const firebaseConfig = {
  apiKey: "AIzaSyBM5PS4SVFNsSdHFr1hJgcNRrrMaFlx0UQ",
  authDomain: "eng-lambda-n6ppv.firebaseapp.com",
  projectId: "eng-lambda-n6ppv",
  storageBucket: "eng-lambda-n6ppv.firebasestorage.app",
  messagingSenderId: "9704863029",
  appId: "1:9704863029:web:4e99ca524ad5d2ba6d487c"
};

// Initialize Firebase application
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize custom-named Firestore instance
export const db = initializeFirestore(app, {}, "ai-studio-bae4df66-18fa-4482-8d6d-b21ec5e49560");
