import { ref } from 'vue'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, type User } from 'firebase/auth'
import { useNuxtApp } from '#app'

const user = ref<User | null>(null)

export const useAuth = () => {
  const nuxtApp = useNuxtApp()
  const auth = nuxtApp.$auth

  const login = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    user.value = cred.user
  }

  const register = async (email: string, password: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    user.value = cred.user
  }

  const logout = async () => {
    await auth.signOut()
    user.value = null
  }

  return { user, login, register, logout }
}