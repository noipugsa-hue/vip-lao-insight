import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore, initializeFirestore, CACHE_SIZE_UNLIMITED } from 'firebase/firestore'
import { defineNuxtPlugin } from '#app'

// ใส่ค่าที่ได้จาก Firebase Console
const firebaseConfig = {
  apiKey: 'AIzaSyBRSAaSf_rt1CH7EH2cHnBg-JEkEaEK0Fs',
  authDomain: 'kinetic-abbey-408904.firebaseapp.com',
  projectId: 'kinetic-abbey-408904',
  storageBucket: 'kinetic-abbey-408904.firebasestorage.app',
  messagingSenderId: '645681488426',
  appId: '1:645681488426:web:971cadc2329dfde1a4d953',
  measurementId: 'G-N08RDRZZV7',
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)

// Initialize Firestore with settings to avoid offline persistence issues
let db
try {
  // Try to initialize with custom settings
  // IMPORTANT: experimentalForceLongPolling = true to bypass WebSocket Error 400
  db = initializeFirestore(app, {
    cacheSizeBytes: CACHE_SIZE_UNLIMITED,
    ignoreUndefinedProperties: true,
    // Force long polling to completely avoid WebSocket/Listen stream errors
    experimentalForceLongPolling: true,
    experimentalAutoDetectLongPolling: false
  })
  console.log('✅ Firestore initialized with long polling (bypass WebSocket Error 400)')
} catch (error: any) {
  // If already initialized, get the existing instance
  console.warn('⚠️ Firestore already initialized, using existing instance:', error.message)
  db = getFirestore(app)
}

// Add error listener for Firestore
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason?.message?.includes('PERMISSION_DENIED') ||
        event.reason?.message?.includes('Missing or insufficient permissions')) {
      console.warn('🔒 Firestore permission denied - user may not be authenticated yet')
      event.preventDefault() // Prevent error from bubbling up
    }
  })
}

export default defineNuxtPlugin(() => {
  return {
    provide: {
      firebase: app,
      auth,
      db,
    },
  }
})
