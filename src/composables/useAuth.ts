import { ref } from 'vue'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, type User } from 'firebase/auth'
import { useNuxtApp } from '#app'

const user = ref<User | null>(null)
const isAuthReady = ref(false)

export const useAuth = () => {
  const nuxtApp = useNuxtApp()
  const auth = nuxtApp.$auth

  // เช็คสถานะ authentication
  if (!isAuthReady.value) {
    onAuthStateChanged(auth, (currentUser) => {
      user.value = currentUser
      isAuthReady.value = true
    })
  }

  const login = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    user.value = cred.user
    return cred.user // return user object
  }

  const register = async (email: string, password: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    user.value = cred.user
    return cred.user // return user object
  }

  const logout = async () => {
    await auth.signOut()
    user.value = null
  }

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({
      prompt: 'select_account'
    })
    const cred = await signInWithPopup(auth, provider)
    user.value = cred.user
    return cred.user
  }

  // รอให้ auth พร้อม
  const waitForAuth = () => {
    return new Promise<User | null>((resolve) => {
      if (isAuthReady.value) {
        resolve(user.value)
      } else {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
          user.value = currentUser
          isAuthReady.value = true
          unsubscribe()
          resolve(currentUser)
        })
      }
    })
  }

  return { user, isAuthReady, login, register, logout, loginWithGoogle, waitForAuth }
}