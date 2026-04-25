<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useLoginStats } from '../composables/useLoginStats'

definePageMeta({
  layout: false
})

const { login, register } = useAuth()
const { recordLogin } = useLoginStats()
const router = useRouter()

const email = ref('')
const password = ref('')
const isLoginMode = ref(true)

const alert = ref({
  show: false,
  message: '',
  type: 'success' as 'success' | 'error'
})

const showAlert = (message: string, type: 'success' | 'error' = 'success') => {
  alert.value = { show: true, message, type }
  setTimeout(() => { alert.value.show = false }, 4000)
}

const loginUser = async () => {
  if (!email.value || !password.value) {
    showAlert('กรุณากรอก Email และ Password', 'error')
    return
  }
  try {
    const userCredential = await login(email.value, password.value)

    // บันทึกสถิติการ login
    await recordLogin(userCredential.uid, email.value)

    showAlert('เข้าสู่ระบบสำเร็จ 🎉', 'success')
    setTimeout(() => router.push('/home'), 1000)
  } catch (e: any) {
    showAlert('Email หรือ Password ไม่ถูกต้อง', 'error')
  }
}

const registerUser = async () => {
  if (!email.value || !password.value) {
    showAlert('กรุณากรอก Email และ Password', 'error')
    return
  }
  if (password.value.length < 6) {
    showAlert('Password ต้องมีอย่างน้อย 6 ตัวอักษร', 'error')
    return
  }
  try {
    const userCredential = await register(email.value, password.value)

    // บันทึกสถิติการ register (นับเป็น login ครั้งแรก)
    await recordLogin(userCredential.uid, email.value)

    showAlert('สมัครสมาชิกสำเร็จ 🎉 กำลังเข้าสู่ระบบ...', 'success')
    setTimeout(() => router.push('/home'), 1500)
  } catch (e: any) {
    if (e.code === 'auth/email-already-in-use') {
      showAlert('อีเมลนี้ถูกใช้งานแล้ว', 'error')
    } else {
      showAlert('สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่', 'error')
    }
  }
}

const switchMode = () => {
  isLoginMode.value = !isLoginMode.value
  email.value = ''
  password.value = ''
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 flex items-center justify-center p-4 relative overflow-hidden">
    <!-- Animated Background Patterns -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute top-10 left-10 w-72 h-72 bg-yellow-400/10 rounded-full blur-3xl animate-float"></div>
      <div class="absolute bottom-20 right-20 w-96 h-96 bg-green-400/10 rounded-full blur-3xl animate-float-delayed"></div>
      <div class="absolute top-1/2 left-1/3 w-64 h-64 bg-yellow-300/5 rounded-full blur-2xl animate-pulse"></div>
    </div>

    <!-- VIP Alert -->
    <transition name="fade-slide">
      <div
        v-if="alert.show"
        :class="[
          'fixed top-8 left-1/2 -translate-x-1/2 px-8 py-4 rounded-2xl font-bold text-white text-lg shadow-2xl z-50 text-center backdrop-blur-sm',
          alert.type === 'success' ? 'vip-success' : 'vip-error'
        ]"
      >
        {{ alert.message }}
      </div>
    </transition>

    <!-- Main Container -->
    <div class="w-full max-w-5xl flex flex-col md:flex-row items-center gap-8 relative z-10">

      <!-- Left: Tao Wessuwan Image -->
      <div class="hidden md:flex flex-1 justify-center items-center">
        <div class="relative">
          <div class="absolute inset-0 bg-yellow-400/20 blur-3xl rounded-full animate-pulse-slow"></div>
          <img
            src="/images/tao-wessuwan.png"
            alt="ท้าวเวสสุวรรณ"
            class="relative h-[500px] object-contain drop-shadow-2xl animate-float-slow"
          />
        </div>
      </div>

      <!-- Right: Login/Register Form -->
      <div class="flex-1 w-full max-w-md">
        <div class="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 relative overflow-hidden border-4 border-yellow-400/30">

          <!-- Decorative Corner -->
          <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-400/20 to-transparent rounded-bl-full"></div>
          <div class="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-green-400/20 to-transparent rounded-tr-full"></div>

          <!-- Header -->
          <div class="text-center mb-8 relative">
            <div class="inline-block mb-4">
              <div class="text-6xl animate-bounce-slow">🎰</div>
            </div>
            <h1 class="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-600 via-yellow-500 to-green-600 drop-shadow-lg mb-2 animate-gradient">
              VIP LAO INSIGHT
            </h1>
            <p class="text-gray-600 font-semibold">
              {{ isLoginMode ? 'เข้าสู่ระบบเพื่อใช้งาน' : 'สมัครสมาชิกใหม่' }}
            </p>
          </div>

          <!-- Tab Switcher -->
          <div class="flex gap-2 mb-6 p-1 bg-gray-100 rounded-xl">
            <button
              @click="isLoginMode = true"
              :class="[
                'flex-1 py-3 rounded-lg font-bold transition-all duration-300',
                isLoginMode
                  ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg scale-105'
                  : 'text-gray-600 hover:text-gray-800'
              ]"
            >
              🔑 เข้าสู่ระบบ
            </button>
            <button
              @click="isLoginMode = false"
              :class="[
                'flex-1 py-3 rounded-lg font-bold transition-all duration-300',
                !isLoginMode
                  ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-lg scale-105'
                  : 'text-gray-600 hover:text-gray-800'
              ]"
            >
              ✨ สมัครสมาชิก
            </button>
          </div>

          <!-- Form -->
          <div class="space-y-4">
            <!-- Email -->
            <div class="relative">
              <div class="absolute left-4 top-1/2 -translate-y-1/2 text-2xl">📧</div>
              <input
                v-model="email"
                type="email"
                placeholder="อีเมล"
                class="w-full pl-14 pr-4 py-4 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-green-400/50 focus:border-green-500 text-gray-900 font-semibold placeholder-gray-400 transition-all"
              />
            </div>

            <!-- Password -->
            <div class="relative">
              <div class="absolute left-4 top-1/2 -translate-y-1/2 text-2xl">🔐</div>
              <input
                v-model="password"
                type="password"
                placeholder="รหัสผ่าน (อย่างน้อย 6 ตัว)"
                class="w-full pl-14 pr-4 py-4 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-green-400/50 focus:border-green-500 text-gray-900 font-semibold placeholder-gray-400 transition-all"
              />
            </div>

            <!-- Submit Button -->
            <button
              v-if="isLoginMode"
              @click="loginUser"
              class="w-full py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
            >
              <span class="text-2xl">🚀</span>
              เข้าสู่ระบบ
            </button>

            <button
              v-else
              @click="registerUser"
              class="w-full py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
            >
              <span class="text-2xl">⭐</span>
              สมัครสมาชิก
            </button>
          </div>

          <!-- Info Text -->
          <div class="mt-6 text-center text-sm text-gray-500">
            <p v-if="isLoginMode">
              ยังไม่มีบัญชี?
              <button @click="switchMode" class="text-yellow-600 hover:text-yellow-700 font-bold underline">
                สมัครสมาชิกที่นี่
              </button>
            </p>
            <p v-else>
              มีบัญชีอยู่แล้ว?
              <button @click="switchMode" class="text-green-600 hover:text-green-700 font-bold underline">
                เข้าสู่ระบบที่นี่
              </button>
            </p>
          </div>

          <!-- VIP Badge -->
          <div class="mt-6 text-center">
            <div class="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full shadow-lg">
              <span class="text-xl">👑</span>
              <span class="text-white font-bold text-sm">VIP EXCLUSIVE ACCESS</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Animations */
@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(5deg); }
}

@keyframes float-delayed {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-30px) rotate(-5deg); }
}

@keyframes float-slow {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-15px); }
}

@keyframes bounce-slow {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes pulse-slow {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.1); }
}

@keyframes gradient {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.animate-float {
  animation: float 6s ease-in-out infinite;
}

.animate-float-delayed {
  animation: float-delayed 8s ease-in-out infinite;
}

.animate-float-slow {
  animation: float-slow 4s ease-in-out infinite;
}

.animate-bounce-slow {
  animation: bounce-slow 2s ease-in-out infinite;
}

.animate-pulse-slow {
  animation: pulse-slow 3s ease-in-out infinite;
}

.animate-gradient {
  background-size: 200% 200%;
  animation: gradient 3s ease infinite;
}

/* Alert Transitions */
.fade-slide-enter-active, .fade-slide-leave-active {
  transition: all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translate(-50%, -30px) scale(0.8);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translate(-50%, -30px) scale(0.8);
}

/* VIP Success Alert */
.vip-success {
  background: linear-gradient(135deg, #10b981, #34d399, #6ee7b7);
  box-shadow: 0 10px 40px rgba(16, 185, 129, 0.5), 0 0 30px rgba(52, 211, 153, 0.3);
  animation: pulse-glow 2s ease-in-out infinite;
}

/* VIP Error Alert */
.vip-error {
  background: linear-gradient(135deg, #ef4444, #f87171, #fca5a5);
  box-shadow: 0 10px 40px rgba(239, 68, 68, 0.5), 0 0 30px rgba(248, 113, 113, 0.3);
  animation: pulse-glow 2s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 10px 40px currentColor, 0 0 30px currentColor;
  }
  50% {
    box-shadow: 0 15px 60px currentColor, 0 0 50px currentColor;
  }
}
</style>
