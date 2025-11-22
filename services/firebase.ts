import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCsUL76t3io_Qk3kUw5KIllOkVUhzz5sVc",
  authDomain: "orbita-gs-mobile.firebaseapp.com",
  databaseURL: "https://orbita-gs-mobile-default-rtdb.firebaseio.com",
  projectId: "orbita-gs-mobile",
  storageBucket: "orbita-gs-mobile.firebasestorage.app",
  messagingSenderId: "805556251246",
  appId: "1:805556251246:web:67f55cfe7d869e6dbdd47f"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getDatabase(app);
