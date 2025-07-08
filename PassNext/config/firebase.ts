// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAUad-Vb1dqSE9lKA1QzL75euNqjr8i8Po",
  authDomain: "passnest-2c9e6.firebaseapp.com",
  databaseURL: "https://passnest-2c9e6-default-rtdb.firebaseio.com",
  projectId: "passnest-2c9e6",
  storageBucket: "passnest-2c9e6.firebasestorage.app",
  messagingSenderId: "718983596210",
  appId: "1:718983596210:web:094672c6338aeffa5961ab",
  measurementId: "G-0C71Q56ZHS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
const auth = getAuth(app);

export { auth };