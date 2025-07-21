// Import the functions you need from the SDKs you need
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from "firebase/app";
import { Auth, getAuth, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Import getReactNativePersistence - this is the key for persistence!
let getReactNativePersistence: any;

try {
  // Try to import getReactNativePersistence from firebase/auth
  const firebaseAuth = require('firebase/auth');
  getReactNativePersistence = firebaseAuth.getReactNativePersistence;
} catch (error) {
  console.log('Could not import getReactNativePersistence:', error);
}

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  databaseURL: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  projectId: "XXXXXXXXXXXXXXX",
  storageBucket: "XXXXXXXXXXXXXXXXXXXXXX",
  messagingSenderId: "XXXXXXXXXXXXXXXXXXXX",
  appId: "XXXXXXXXXXXXXXXXXXXXXXXXXXX",
  measurementId: "XXXXXXXXXXXXXXXXX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with proper React Native persistence
let auth: Auth;

try {
  if (getReactNativePersistence) {
    // Use the official React Native persistence method
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage)
    });
    console.log('✅ Firebase Auth initialized with React Native persistence');
  } else {
    // Fallback: Set AsyncStorage globally and use basic initialization
    (global as any).AsyncStorage = ReactNativeAsyncStorage;
    auth = initializeAuth(app);
    console.log('⚠️ Firebase Auth initialized with global AsyncStorage fallback');
  }
  
  // Ensure auth state is properly loaded by checking current user after init
  setTimeout(() => {
    const currentUser = auth.currentUser;
    console.log('Current user after Firebase init:', currentUser ? `Restored user: ${currentUser.uid}` : 'No user restored');
  }, 1000);
  
} catch (error) {
  console.log('Auth already initialized, using existing instance:', error);
  auth = getAuth(app);
}

// Initialize Firestore
const db = getFirestore(app);

export { auth, db };

