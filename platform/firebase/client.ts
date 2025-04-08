import { initializeApp, getApp, getApps } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyANGpLsMxpf7Y5eMcpcofSwyTBvq4rNDPE",
  authDomain: "prepwise-87683.firebaseapp.com",
  projectId: "prepwise-87683",
  storageBucket: "prepwise-87683.firebasestorage.app",
  messagingSenderId: "170887552861",
  appId: "1:170887552861:web:c78098052b3c974bb352b4",
  measurementId: "G-ZBMHVH4F98"
};

// Creates a firebase instance if it does not exist already
const app = !getApps.length ? initializeApp(firebaseConfig) : getApp();

// Initializes Firebase Authentication for user login/signup. Initializes Cloud Firestore database to store and retrieve data.
export const auth = getAuth(app);
export const db = getFirestore(app);