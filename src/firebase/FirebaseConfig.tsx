import { initializeApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaV3Provider, AppCheck } from "firebase/app-check";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Validate Firebase configuration
console.log('🔧 Firebase Configuration:', {
  hasApiKey: !!firebaseConfig.apiKey,
  hasAuthDomain: !!firebaseConfig.authDomain,
  hasProjectId: !!firebaseConfig.projectId,
  hasStorageBucket: !!firebaseConfig.storageBucket,
  hasMessagingSenderId: !!firebaseConfig.messagingSenderId,
  hasAppId: !!firebaseConfig.appId,
  projectId: firebaseConfig.projectId
});

// Check for missing configuration
const missingConfig = Object.entries(firebaseConfig)
  .filter(([key, value]) => !value)
  .map(([key]) => key);

if (missingConfig.length > 0) {
  console.error('❌ Missing Firebase configuration:', missingConfig);
  console.error('Please check your .env file and ensure all REACT_APP_FIREBASE_* variables are set');
}

const RECAPTCHA_KEY = process.env.REACT_APP_RECAPTCHA_KEY || "";

const firebaseApp = initializeApp(firebaseConfig);

let appCheck: AppCheck | null;
try {
  appCheck = initializeAppCheck(firebaseApp, {
    provider: new ReCaptchaV3Provider(RECAPTCHA_KEY),
    isTokenAutoRefreshEnabled: true
  });
} catch (error) {
  console.warn('App Check initialization failed:', error);
  appCheck = null;
}

const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

export { firebaseApp, auth, db, appCheck };