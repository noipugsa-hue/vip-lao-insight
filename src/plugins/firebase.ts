import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { defineNuxtPlugin } from '#app'

// ใส่ค่าที่ได้จาก Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyBRSAaSf_rt1CH7EH2cHnBg-JEkEaEK0Fs",
  authDomain: "kinetic-abbey-408904.firebaseapp.com",
  projectId: "kinetic-abbey-408904",
  storageBucket: "kinetic-abbey-408904.firebasestorage.app",
  messagingSenderId: "645681488426",
  appId: "1:645681488426:web:971cadc2329dfde1a4d953",
  measurementId: "G-N08RDRZZV7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

export default defineNuxtPlugin(() => {
  return {
    provide: {
      firebase: app,
      auth,
      db
    }
  }
})