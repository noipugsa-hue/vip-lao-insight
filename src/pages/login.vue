<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'

definePageMeta({
  layout: false // ปิด layout สำหรับหน้า login
})

const { login, register } = useAuth()
const router = useRouter()

const email = ref('')
const password = ref('')

const alert = ref({
  show: false,
  message: '',
  type: 'success' // 'success' | 'error'
})

const showAlert = (message: string, type: 'success' | 'error' = 'success') => {
  alert.value = { show: true, message, type }
  setTimeout(() => { alert.value.show = false }, 3000)
}

// Login
const loginUser = async () => {
  if (!email.value || !password.value) { showAlert('กรุณากรอก Email และ Password', 'error'); return }
  try {
    await login(email.value, password.value)
    showAlert('เข้าสู่ระบบสำเร็จ 🎉', 'success')
    router.push('/home')
  } catch (e: any) {
    showAlert('Email หรือ Password ไม่ถูกต้อง', 'error')
  }
}

// Register
const registerUser = async () => {
  if (!email.value || !password.value) { showAlert('กรุณากรอก Email และ Password', 'error'); return }
  try {
    await register(email.value, password.value)
    showAlert('สมัครสมาชิกสำเร็จ 🎉', 'success')
  } catch (e: any) {
    showAlert('สมัครสมาชิกไม่สำเร็จ', 'error')
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-green-900 to-green-700 flex items-center justify-center p-6">
    <div class="w-full max-w-md bg-white rounded-xl shadow-lg p-6 relative">

      <!-- VIP Alert: Floating / Glow / Rainbow -->
      <transition name="fade">
        <div
          v-if="alert.show"
          :class="[
            'fixed top-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl font-bold text-white text-lg shadow-2xl z-50 animate-bounce-glow text-center',
            alert.type === 'success' ? 'vip-success' : 'vip-error'
          ]"
        >
          {{ alert.message }}
        </div>
      </transition>

      <h1 class="text-2xl font-bold mb-6 text-center text-red-600 drop-shadow-lg">
        เข้าสู่ระบบ VIP
      </h1>

      <!-- Email -->
      <input
        v-model="email"
        type="email"
        placeholder="อีเมล"
        class="mb-3 w-full p-3 border rounded shadow-inner focus:outline-none focus:ring-2 focus:ring-green-400 text-gray-900 font-semibold placeholder-gray-400"
      />

      <!-- Password -->
      <input
        v-model="password"
        type="password"
        placeholder="รหัสผ่าน"
        class="mb-4 w-full p-3 border rounded shadow-inner focus:outline-none focus:ring-2 focus:ring-green-400 text-gray-900 font-semibold placeholder-gray-400"
      />

      <!-- Buttons -->
      <div class="flex gap-2">
        <button
          @click="loginUser"
          class="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded font-bold transition-all shadow-md hover:scale-105"
        >
          Login
        </button>
        <button
          @click="registerUser"
          class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded font-bold transition-all shadow-md hover:scale-105"
        >
          Register
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Fade-in / fade-out */
.fade-enter-active, .fade-leave-active { transition: all 0.5s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-20px); }
.fade-enter-to, .fade-leave-from { opacity: 1; transform: translateY(0); }

/* Glow + Rainbow Background */
@keyframes rainbow {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.vip-success {
  background: linear-gradient(90deg, #00ff99, #00ccff, #66ff33, #ffdd00, #ff0066);
  background-size: 300% 300%;
  animation: rainbow 3s ease infinite;
  box-shadow: 0 0 15px #00ff99, 0 0 30px #00ccff;
}

.vip-error {
  background: linear-gradient(90deg, #ff4d4d, #ff0000, #ff6666, #ff1a1a);
  background-size: 300% 300%;
  animation: rainbow 3s ease infinite;
  box-shadow: 0 0 15px #ff4d4d, 0 0 30px #ff0000;
}

/* Bounce + Glow Animation */
@keyframes bounce-glow {
  0%, 100% { transform: translateY(0); box-shadow: 0 0 10px #fff, 0 0 20px currentColor; }
  50% { transform: translateY(-8px); box-shadow: 0 0 20px #fff, 0 0 40px currentColor; }
}
.animate-bounce-glow {
  animation: bounce-glow 1.2s ease-in-out infinite;
}
</style>
