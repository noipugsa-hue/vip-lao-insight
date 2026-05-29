import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore, initializeFirestore, memoryLocalCache } from 'firebase/firestore'
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

// Initialize Firestore with MEMORY-ONLY cache (NO IndexedDB persistence)
// This completely bypasses offline persistence and fixes Error 400 WebSocket issues
let db
try {
  console.log('🔧 Initializing Firestore with MEMORY-ONLY cache (no IndexedDB)...')

  db = initializeFirestore(app, {
    // CRITICAL: Use memory cache ONLY - no IndexedDB persistence at all
    localCache: memoryLocalCache(),
    ignoreUndefinedProperties: true,
    // Force long polling to completely avoid WebSocket/Listen stream errors
    experimentalForceLongPolling: true,
    experimentalAutoDetectLongPolling: false
  })

  console.log('✅ Firestore initialized with MEMORY-ONLY cache (no offline support)')
  console.log('✅ Using HTTP long polling instead of WebSocket')
  console.log('⚠️  Offline mode is DISABLED - requires internet connection')
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
