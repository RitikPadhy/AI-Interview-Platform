import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const initFirebaseAdmin = () => {
    const apps  = getApps();

    // Checks if Firebase admin is already initialized, if not, initiliazeApp() is called with credentials from the environment file, and returns an object with auth(Firebase authentication) and db(Firebase database)
     if(!apps.length)
    {
        initializeApp({
            credential: cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
            })
        })
    }

    return {
        auth: getAuth(),
        db: getFirestore()
    }
}

// Extracts db and auth from initFirebaseAdmin and exports them
export const { auth, db } = initFirebaseAdmin();