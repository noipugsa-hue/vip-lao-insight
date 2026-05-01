<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useLoginStats } from '../composables/useLoginStats'
import { useLotteryHistory, type GovernmentLotteryResult } from '../composables/useLotteryHistory'

definePageMeta({
  layout: false
})

const { login, register, loginWithGoogle } = useAuth()
const { recordLogin } = useLoginStats()
const router = useRouter()

const email = ref('')
const password = ref('')
const isLoginMode = ref(true)

// Lottery popup state
const showLotteryPopup = ref(false)
const { results, loading: lotteryLoading, error: lotteryError, fetchMultipleResults } = useLotteryHistory()

// Load lottery results when popup opens
const openLotteryPopup = async () => {
  showLotteryPopup.value = true
  if (results.value.length === 0) {
    await fetchMultipleResults(1)
  }
}

const closeLotteryPopup = () => {
  showLotteryPopup.value = false
}

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

const loginWithGoogleAccount = async () => {
  try {
    const userCredential = await loginWithGoogle()

    // บันทึกสถิติการ login
    await recordLogin(userCredential.uid, userCredential.email || 'google-user')

    showAlert('เข้าสู่ระบบด้วย Google สำเร็จ 🎉', 'success')
    setTimeout(() => router.push('/home'), 1000)
  } catch (e: any) {
    if (e.code === 'auth/popup-closed-by-user') {
      showAlert('คุณได้ปิดหน้าต่าง Google Sign-In', 'error')
    } else if (e.code === 'auth/cancelled-popup-request') {
      // ไม่แสดง error ถ้ายกเลิก
    } else {
      showAlert('เข้าสู่ระบบด้วย Google ไม่สำเร็จ', 'error')
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
  <div class="min-h-screen bg-gradient-to-br from-orange-900 via-red-900 to-amber-900 flex items-center justify-center p-4 relative overflow-hidden">
    <!-- Animated Background Patterns -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute top-10 left-10 w-72 h-72 bg-orange-500/20 rounded-full blur-3xl animate-float"></div>
      <div class="absolute bottom-20 right-20 w-96 h-96 bg-red-500/20 rounded-full blur-3xl animate-float-delayed"></div>
      <div class="absolute top-1/2 left-1/3 w-64 h-64 bg-orange-400/15 rounded-full blur-2xl animate-pulse"></div>
      <div class="absolute top-1/3 right-1/4 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl animate-float-slow"></div>
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
      <div class="flex flex-1 justify-center items-center">
        <div class="relative">
          <div class="absolute inset-0 bg-yellow-400/20 blur-3xl rounded-full animate-pulse-slow"></div>
          <img
            src="/images/tao-wessuwan.png"
            alt="ท้าวเวสสุวรรณ"
            class="relative h-[300px] md:h-[500px] object-contain drop-shadow-2xl animate-float-slow"
          />
        </div>
      </div>

      <!-- Right: Login/Register Form -->
      <div class="flex-1 w-full max-w-md">
        <div class="bg-white/98 backdrop-blur-xl rounded-3xl shadow-2xl p-8 relative overflow-hidden border border-orange-200/30 ring-2 ring-orange-500/20">

          <!-- Decorative Corner -->
          <div class="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-orange-400/15 to-transparent rounded-bl-full"></div>
          <div class="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-red-400/15 to-transparent rounded-tr-full"></div>

          <!-- Premium Glow Effects -->
          <div class="absolute -top-20 -right-20 w-40 h-40 bg-orange-500/30 rounded-full blur-3xl"></div>
          <div class="absolute -bottom-20 -left-20 w-40 h-40 bg-red-500/30 rounded-full blur-3xl"></div>

          <!-- Header -->
          <div class="text-center mb-8 relative">
            <div class="inline-block mb-4 relative">
              <div class="absolute inset-0 bg-orange-500/30 blur-2xl rounded-full animate-pulse-slow"></div>
              <div class="relative text-6xl animate-bounce-slow">🎰</div>
            </div>
            <h1 class="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-red-500 to-amber-600 drop-shadow-lg mb-2 animate-gradient">
              LOTTOAI
            </h1>
          </div>

          <!-- Tab Switcher -->
          <div class="flex gap-2 mb-6 p-1 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl shadow-inner">
            <button
              @click="isLoginMode = true"
              :class="[
                'flex-1 py-3 rounded-lg font-bold transition-all duration-300 relative overflow-hidden',
                isLoginMode
                  ? 'bg-gradient-to-r from-orange-600 via-red-600 to-orange-600 text-white shadow-xl scale-105 shadow-orange-500/50'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
              ]"
            >
              <span class="relative z-10">🔑 เข้าสู่ระบบ</span>
              <div v-if="isLoginMode" class="absolute inset-0 bg-gradient-to-r from-orange-400/50 to-red-400/50 animate-pulse"></div>
            </button>
            <button
              @click="isLoginMode = false"
              :class="[
                'flex-1 py-3 rounded-lg font-bold transition-all duration-300 relative overflow-hidden',
                !isLoginMode
                  ? 'bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500 text-white shadow-xl scale-105 shadow-pink-500/50'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
              ]"
            >
              <span class="relative z-10">✨ สมัครสมาชิก</span>
              <div v-if="!isLoginMode" class="absolute inset-0 bg-gradient-to-r from-pink-400/50 to-orange-400/50 animate-pulse"></div>
            </button>
          </div>

          <!-- Form -->
          <div class="space-y-4">
            <!-- Email -->
            <div class="relative group">
              <div class="absolute left-4 top-1/2 -translate-y-1/2 text-2xl transition-transform group-focus-within:scale-110">📧</div>
              <input
                v-model="email"
                type="email"
                placeholder="อีเมล"
                class="w-full pl-14 pr-4 py-4 border-2 border-orange-200/50 rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-orange-400/30 focus:border-orange-500 text-gray-900 font-semibold placeholder-gray-400 transition-all bg-white/80 hover:bg-white"
              />
            </div>

            <!-- Password -->
            <div class="relative group">
              <div class="absolute left-4 top-1/2 -translate-y-1/2 text-2xl transition-transform group-focus-within:scale-110">🔐</div>
              <input
                v-model="password"
                type="password"
                placeholder="รหัสผ่าน (อย่างน้อย 6 ตัว)"
                class="w-full pl-14 pr-4 py-4 border-2 border-orange-200/50 rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-orange-400/30 focus:border-orange-500 text-gray-900 font-semibold placeholder-gray-400 transition-all bg-white/80 hover:bg-white"
              />
            </div>

            <!-- Submit Button -->
            <button
              v-if="isLoginMode"
              @click="loginUser"
              class="w-full py-4 bg-gradient-to-r from-orange-600 via-red-600 to-amber-600 hover:from-orange-700 hover:via-red-700 hover:to-amber-700 text-white rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 relative overflow-hidden group"
            >
              <span class="absolute inset-0 bg-gradient-to-r from-orange-400/50 to-red-400/50 opacity-0 group-hover:opacity-100 transition-opacity"></span>
              <span class="text-2xl relative z-10">🚀</span>
              <span class="relative z-10">เข้าสู่ระบบ</span>
            </button>

            <button
              v-else
              @click="registerUser"
              class="w-full py-4 bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500 hover:from-pink-600 hover:via-rose-600 hover:to-orange-600 text-white rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 relative overflow-hidden group"
            >
              <span class="absolute inset-0 bg-gradient-to-r from-pink-400/50 to-orange-400/50 opacity-0 group-hover:opacity-100 transition-opacity"></span>
              <span class="text-2xl relative z-10">⭐</span>
              <span class="relative z-10">สมัครสมาชิก</span>
            </button>

            <!-- Divider -->
            <div class="relative my-6">
              <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t-2 border-gray-200"></div>
              </div>
              <div class="relative flex justify-center text-sm">
                <span class="px-4 bg-white text-gray-500 font-semibold">หรือ</span>
              </div>
            </div>

            <!-- Google Sign-In Button -->
            <button
              @click="loginWithGoogleAccount"
              class="w-full py-4 bg-white hover:bg-gray-50 border-2 border-orange-200 hover:border-orange-400 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3 group"
            >
              <svg class="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span class="text-gray-700">เข้าสู่ระบบด้วย Google</span>
            </button>
          </div>

          <!-- Info Text -->
          <div class="mt-6 text-center text-sm text-gray-500">
            <p v-if="isLoginMode">
              ยังไม่มีบัญชี?
              <button @click="switchMode" class="text-orange-600 hover:text-orange-700 font-bold underline transition-colors">
                สมัครสมาชิกที่นี่
              </button>
            </p>
            <p v-else>
              มีบัญชีอยู่แล้ว?
              <button @click="switchMode" class="text-orange-600 hover:text-orange-700 font-bold underline transition-colors">
                เข้าสู่ระบบที่นี่
              </button>
            </p>
          </div>

          <!-- VIP Badge -->
          <div class="mt-6 text-center">
            <div class="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-500 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 cursor-default">
              <span class="text-xl animate-pulse">👑</span>
              <span class="text-white font-black text-sm tracking-wide">VIP EXCLUSIVE ACCESS</span>
            </div>
          </div>

          <!-- View Lottery Results (No Login Required) -->
          <div class="mt-6 text-center">
            <button
              @click="openLotteryPopup"
              class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 via-red-500 to-amber-500 hover:from-orange-600 hover:via-red-600 hover:to-amber-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 active:scale-95 relative overflow-hidden group"
            >
              <span class="absolute inset-0 bg-gradient-to-r from-orange-400/30 to-amber-400/30 opacity-0 group-hover:opacity-100 transition-opacity"></span>
              <span class="text-xl relative z-10">🎫</span>
              <span class="relative z-10">ดูผลหวยย้อนหลัง</span>
            </button>
            <p class="text-xs text-gray-500 mt-2 font-medium">ไม่ต้อง Login</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Lottery Popup Modal -->
    <transition name="modal-fade">
      <div
        v-if="showLotteryPopup"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        @click.self="closeLotteryPopup"
      >
        <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border-2 border-orange-200/30">
          <!-- Header -->
          <div class="bg-gradient-to-r from-orange-600 via-red-600 to-amber-600 p-6 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="text-4xl">🎫</span>
              <div>
                <h2 class="text-2xl font-black text-white drop-shadow-lg">ผลหวยรัฐบาลงวดล่าสุด</h2>
                <p class="text-purple-100 text-sm font-medium">ตรวจผลรางวัลหวยรัฐบาลไทย</p>
              </div>
            </div>
            <button
              @click="closeLotteryPopup"
              class="text-white hover:bg-white/20 rounded-full p-2 transition"
            >
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Content -->
          <div class="flex-1 overflow-y-auto p-6">
            <!-- Loading State -->
            <div v-if="lotteryLoading && results.length === 0" class="text-center py-12">
              <div class="text-6xl mb-4 animate-spin">⚙️</div>
              <p class="text-xl text-gray-600 dark:text-gray-400">กำลังโหลดข้อมูล...</p>
            </div>

            <!-- Error State -->
            <div v-else-if="lotteryError && results.length === 0" class="bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-xl p-6 text-center">
              <div class="text-5xl mb-3">❌</div>
              <h3 class="text-xl font-bold text-red-800 dark:text-red-300 mb-2">เกิดข้อผิดพลาด</h3>
              <p class="text-red-600 dark:text-red-400">{{ lotteryError }}</p>
            </div>

            <!-- Results -->
            <div v-else-if="results.length > 0" class="space-y-6">
              <div
                v-for="result in results"
                :key="result.date"
                class="space-y-4"
              >
                <!-- Date Header -->
                <div class="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-xl p-4">
                  <div class="flex items-center justify-between">
                    <div>
                      <h3 class="text-xl font-black text-gray-800 dark:text-gray-100">งวดประจำวันที่ {{ result.date }}</h3>
                      <p class="text-gray-600 dark:text-gray-300 text-sm">งวดที่ {{ result.period || result.date }}</p>
                    </div>
                    <div class="text-3xl">🎰</div>
                  </div>
                </div>

                <!-- รางวัลที่ 1 -->
                <div class="text-center p-6 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl border-2 border-yellow-300 dark:border-yellow-700">
                  <div class="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">🏆 รางวัลที่ 1</div>
                  <div class="text-4xl md:text-5xl font-black text-yellow-600 dark:text-yellow-400 mb-2 tracking-wider">
                    {{ result.first }}
                  </div>
                  <div class="text-sm text-gray-600 dark:text-gray-400">6,000,000 บาท</div>
                </div>

                <!-- รางวัลใกล้เคียงรางวัลที่ 1 -->
                <div v-if="result.firstNear && result.firstNear.length > 0" class="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800">
                  <div class="text-base font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <span>🎯</span>
                    รางวัลใกล้เคียงรางวัลที่ 1
                  </div>
                  <div class="flex flex-wrap gap-2">
                    <div v-for="num in result.firstNear" :key="num" class="px-4 py-2 bg-white dark:bg-gray-800 rounded-lg">
                      <div class="text-xl font-black text-orange-600 dark:text-orange-400">{{ num }}</div>
                      <div class="text-xs text-gray-500 dark:text-gray-400">100,000 ฿</div>
                    </div>
                  </div>
                </div>

                <!-- รางวัลท้าย 2 ตัว -->
                <div v-if="result.runningNumberBack2 && result.runningNumberBack2.length > 0" class="p-4 bg-teal-50 dark:bg-teal-900/20 rounded-xl border border-teal-200 dark:border-teal-800">
                  <div class="text-base font-bold text-gray-700 dark:text-gray-300 mb-3">🎯 เลขท้าย 2 ตัว</div>
                  <div class="flex flex-wrap gap-2">
                    <div v-for="num in result.runningNumberBack2" :key="num" class="px-4 py-2 bg-white dark:bg-gray-800 rounded-lg font-black text-xl text-teal-600 dark:text-teal-400">
                      {{ num }}
                    </div>
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400 mt-2">รางวัลละ 2,000 บาท</div>
                </div>

                <!-- เลขท้าย 3 ตัว -->
                <div class="grid md:grid-cols-2 gap-4">
                  <div v-if="result.runningNumberFront && result.runningNumberFront.length > 0" class="p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-xl border border-cyan-200 dark:border-cyan-800">
                    <div class="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">🔢 เลขหน้า 3 ตัว</div>
                    <div class="flex flex-wrap gap-2">
                      <div v-for="num in result.runningNumberFront" :key="num" class="px-3 py-1 bg-white dark:bg-gray-800 rounded font-bold text-cyan-600 dark:text-cyan-400">
                        {{ num }}
                      </div>
                    </div>
                    <div class="text-xs text-gray-500 dark:text-gray-400 mt-2">4,000 ฿</div>
                  </div>

                  <div v-if="result.runningNumberBack && result.runningNumberBack.length > 0" class="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800">
                    <div class="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">🔢 เลขท้าย 3 ตัว</div>
                    <div class="flex flex-wrap gap-2">
                      <div v-for="num in result.runningNumberBack" :key="num" class="px-3 py-1 bg-white dark:bg-gray-800 rounded font-bold text-indigo-600 dark:text-indigo-400">
                        {{ num }}
                      </div>
                    </div>
                    <div class="text-xs text-gray-500 dark:text-gray-400 mt-2">4,000 ฿</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div v-else class="text-center py-12">
              <div class="text-6xl mb-4">📭</div>
              <h3 class="text-2xl font-black text-gray-800 dark:text-gray-100 mb-2">ไม่มีข้อมูล</h3>
              <p class="text-gray-600 dark:text-gray-400">ไม่พบข้อมูลผลหวย กรุณาลองใหม่อีกครั้ง</p>
            </div>
          </div>

          <!-- Footer -->
          <div class="border-t border-orange-200 dark:border-gray-700 p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:bg-gray-900 space-y-3">
            <button
              @click="closeLotteryPopup"
              class="w-full py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold rounded-xl transition shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <span class="text-xl">🔑</span>
              <span>เข้าสู่ระบบเพื่อใช้งานเพิ่มเติม</span>
            </button>
            <button
              @click="closeLotteryPopup"
              class="w-full py-3 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-bold rounded-xl transition shadow hover:shadow-lg border-2 border-gray-300 dark:border-gray-600"
            >
              ปิด
            </button>
          </div>
        </div>
      </div>
    </transition>
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

/* Modal Transitions */
.modal-fade-enter-active, .modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from, .modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .bg-white,
.modal-fade-leave-active .bg-white {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.modal-fade-enter-from .bg-white,
.modal-fade-leave-to .bg-white {
  transform: scale(0.9);
  opacity: 0;
}
</style>
