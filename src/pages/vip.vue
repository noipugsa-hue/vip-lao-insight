<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useVipResult } from '../composables/useVipResult'
import { useAuth } from '../composables/useAuth'
import { useVipPopup } from '../composables/useVipPopup'
import { useLotteryType } from '../composables/useLotteryType'

definePageMeta({
  layout: false // ปิด layout เพราะหน้านี้เป็นหน้าเก่า
})

const { vipPopup, showPopup } = useVipPopup()
const router = useRouter()
const { hotNumbers, twoDigits, threeDigits, calculatedAt, loadResult } = useVipResult()
const { user, logout } = useAuth()
const { selectedLotteryType } = useLotteryType()
const showLotterySelector = ref(false)
// โหลดเลข VIP หลัง login
onMounted(async () => {
  if (!user.value) {
    router.push('/login')
  } else {
    try {
    loadResult()
    showPopup('โหลดเลข VIP สำเร็จ 🎉', 'success')
  } catch (e) {
    showPopup('โหลดเลข VIP ล้มเหลว ❌', 'error')
  }
  }
})

// Logout + ไปหน้า Login
const handleLogout = async () => {
  await logout()
  router.push('/login')
}

const todayStr = computed(() => {
  const now = new Date()
  return now.toLocaleDateString('th-TH')
})
</script>

<template>
  <!-- Lottery Type Selector Modal -->
  <LotteryTypeSelector
    :show="showLotterySelector"
    @close="showLotterySelector = false"
  />

  <!-- VIP Popup -->
  <transition name="vip-popup">
    <div
      v-if="vipPopup.show"
      :class="[
        'fixed top-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl shadow-2xl text-white font-bold text-lg z-50 animate-popup-glow animate-rainbow',
        vipPopup.type === 'success' ? 'bg-green-500' : 'bg-red-500'
      ]"
    >
      {{ vipPopup.message }}
    </div>
  </transition>

  <!-- Floating VIP User Badge -->
  <div v-if="user" class="fixed top-16 right-4 flex items-center gap-3 z-50">
    <span class="text-red-600 font-bold px-3 py-1 rounded-full bg-red-100 shadow-lg drop-shadow-lg animate-glow-user">
      {{ user.email }}
    </span>
    <button
      @click="handleLogout"
      class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl shadow-lg font-semibold transition transform hover:scale-105"
    >
      Logout
    </button>
  </div>

  <!-- เลข VIP / ผลลัพธ์ Glow/Pop -->
  <div class="p-6 max-w-xl mx-auto mt-28">
    <!-- ปุ่มเลือกประเภทหวย -->
    <button
      @click="showLotterySelector = true"
      class="w-full mb-4 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg shadow-lg font-semibold text-lg transition-all flex items-center justify-center gap-2"
    >
      <span class="text-xl">📊</span>
      <span>{{ selectedLotteryType.displayName }}</span>
      <span class="text-sm opacity-80">(คลิกเพื่อเปลี่ยน)</span>
    </button>

    <!-- Header -->
    <h1 class="text-3xl font-extrabold text-yellow-400 mb-2 text-center drop-shadow-lg">
      VIP Lao Insight
      <span
        class="text-white text-lg font-bold block mt-1 text-center animate-rainbow-glow"
      >
        หวย{{ selectedLotteryType.displayName }}ประจำวันที่ {{ todayStr }}
      </span>
    </h1>

    <p v-if="calculatedAt" class="text-xs opacity-60 mb-6 text-center">
      คำนวณล่าสุด: {{ calculatedAt }}
    </p>

    <!-- ผลลัพธ์เลขสูตร -->
    <div v-if="hotNumbers.length" class="space-y-6">
      <!-- เลขเด่น -->
      <div class="bg-green-700/20 rounded-xl p-4 shadow-lg flex flex-wrap justify-center gap-3">
        <h2 class="w-full text-lg font-bold text-green-900 mb-2 text-center drop-shadow">
          เลขเด่น
        </h2>
        <span
          v-for="n in hotNumbers"
          :key="n"
          class="relative px-5 py-2 rounded-full text-white font-bold text-lg bg-gradient-to-r from-green-400 via-green-600 to-green-500 shadow-lg animate-glow"
        >
          🔥 {{ n }}
        </span>
      </div>

      <!-- เลข 3 ตัว -->
      <div class="bg-blue-700/20 rounded-xl p-4 shadow-lg flex flex-wrap justify-center gap-3">
        <h2 class="w-full text-lg font-bold text-blue-900 mb-2 text-center drop-shadow">
          เลข 3 ตัว
        </h2>
        <span
          v-for="n in threeDigits"
          :key="n"
          class="relative px-4 py-2 rounded-full text-white font-semibold text-lg bg-gradient-to-r from-blue-400 via-blue-600 to-blue-500 shadow-md animate-pop"
        >
          🔢 {{ n }}
        </span>
      </div>

      <!-- ชุด 2 ตัว -->
      <div class="bg-yellow-700/20 rounded-xl p-4 shadow-lg flex flex-wrap justify-center gap-3">
        <h2 class="w-full text-lg font-bold text-yellow-900 mb-2 text-center drop-shadow">
          ชุด 2 ตัว
        </h2>
        <span
          v-for="n in twoDigits"
          :key="n"
          class="relative px-4 py-2 rounded-full text-black font-bold bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 shadow-md animate-pop-slow"
        >
          🎯 {{ n }}
        </span>
      </div>
    </div>

    <p v-else class="opacity-50 text-center text-lg mt-6">
      ยังไม่มีการคำนวณวันนี้
    </p>
  </div>
</template>

<style scoped>
/* Glow animation สำหรับเลขเด่น */
@keyframes glow { 0%,100%{box-shadow:0 0 10px #fff,0 0 20px #0f0,0 0 30px #0c0} 50%{box-shadow:0 0 20px #fff,0 0 30px #0f0,0 0 40px #0c0} }
.animate-glow { animation: glow 2s ease-in-out infinite; }

/* Pop / Bounce สำหรับเลข 3 ตัว */
@keyframes pop {0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}
.animate-pop {animation: pop 1.2s ease-in-out infinite;}

/* Pop ช้า สำหรับเลข 2 ตัว */
@keyframes pop-slow {0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
.animate-pop-slow {animation: pop-slow 1.5s ease-in-out infinite;}

/* Glow สำหรับ floating user badge */
@keyframes glow-user {0%,100%{box-shadow:0 0 5px #fff,0 0 10px #f00,0 0 15px #c00}50%{box-shadow:0 0 10px #fff,0 0 15px #f00,0 0 20px #c00}}
.animate-glow-user {animation: glow-user 2s ease-in-out infinite;}

/* Popup VIP */
@keyframes popup-glow {0%,100%{transform:scale(1);box-shadow:0 0 10px #fff,0 0 20px #0f0}50%{transform:scale(1.05);box-shadow:0 0 20px #fff,0 0 30px #0f0}}
.animate-popup-glow {animation: popup-glow 1.2s ease-in-out infinite;}

@keyframes rainbow {0%{filter:hue-rotate(0deg)}50%{filter:hue-rotate(180deg)}100%{filter:hue-rotate(360deg)}}
.animate-rainbow {animation: rainbow 5s linear infinite;}

/* Transition smooth */
.vip-popup-enter-active, .vip-popup-leave-active {transition: opacity 0.5s, transform 0.5s;}
.vip-popup-enter-from, .vip-popup-leave-to {opacity:0; transform:translateY(-10px);}
</style>