<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'

const router = useRouter()
const { waitForAuth } = useAuth()
const isChecking = ref(true)

onMounted(async () => {
  console.log('🔍 Checking auth...')
  try {
    // รอให้ Firebase Auth พร้อม
    const currentUser = await waitForAuth()
    console.log('👤 Current user:', currentUser)

    // ถ้ายังไม่ได้ login ให้ไปหน้า login
    if (!currentUser) {
      console.log('❌ Not logged in, redirecting to /login')
      await router.push('/login')
    } else {
      // ถ้า login แล้วให้ไปหน้า home
      console.log('✅ Logged in, redirecting to /home')
      await router.push('/home')
    }
  } catch (error) {
    console.error('❗ Auth error:', error)
    await router.push('/login')
  }

  isChecking.value = false
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-green-900 to-green-700 text-yellow-400 flex items-center justify-center">
    <div class="text-center">
      <div v-if="isChecking" class="text-3xl font-bold mb-4">
        กำลังตรวจสอบ... 🔐
      </div>
      <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-yellow-400 mx-auto"></div>
    </div>
  </div>
</template>