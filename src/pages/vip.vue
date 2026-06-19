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
      Numora Lotto AI
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

      <!-- ปุ่มสมัครซื้อเลข - Enhanced Version -->
      <div class="mt-8 p-8 bg-gradient-to-br from-red-500 via-pink-500 to-purple-600 rounded-3xl shadow-2xl relative overflow-hidden">
        <!-- Animated Background Pattern -->
        <div class="absolute inset-0 opacity-10">
          <div class="absolute top-0 left-0 w-40 h-40 bg-white rounded-full blur-3xl animate-pulse-slow"></div>
          <div class="absolute bottom-0 right-0 w-40 h-40 bg-white rounded-full blur-3xl animate-pulse-slow-delayed"></div>
        </div>

        <div class="relative z-10">
          <!-- Social Proof Counter -->
          <div class="flex justify-center gap-6 mb-6">
            <div class="bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-3 text-center">
              <div class="text-3xl font-black text-white drop-shadow-lg animate-count-up">12,847</div>
              <div class="text-xs text-white/80 font-semibold">คนสมัครแล้ว</div>
            </div>
            <div class="bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-3 text-center">
              <div class="text-3xl font-black text-yellow-300 drop-shadow-lg">4.8⭐</div>
              <div class="text-xs text-white/80 font-semibold">คะแนนรีวิว</div>
            </div>
          </div>

          <!-- Main Heading -->
          <div class="text-center mb-5">
            <h3 class="text-3xl md:text-4xl font-black text-white mb-3 drop-shadow-2xl animate-text-glow">
              🎰 พร้อมลุ้นรางวัลใหญ่?
            </h3>
            <p class="text-white text-lg font-bold mb-2">
              💎 สมัครซื้อเลขออนไลน์วันนี้
            </p>
            <p class="text-yellow-300 text-sm font-semibold animate-pulse">
              🎁 โบนัสต้อนรับ 100 บาท สำหรับสมาชิกใหม่!
            </p>
          </div>

          <!-- Benefits Grid -->
          <div class="grid grid-cols-2 gap-3 mb-6">
            <div class="bg-white/15 backdrop-blur-sm rounded-xl p-3 text-center transform hover:scale-105 transition-all">
              <div class="text-2xl mb-1">💸</div>
              <div class="text-xs text-white font-bold">ถอนขั้นต่ำ 1 บาท</div>
            </div>
            <div class="bg-white/15 backdrop-blur-sm rounded-xl p-3 text-center transform hover:scale-105 transition-all">
              <div class="text-2xl mb-1">⚡</div>
              <div class="text-xs text-white font-bold">โอนไว 1 นาที</div>
            </div>
            <div class="bg-white/15 backdrop-blur-sm rounded-xl p-3 text-center transform hover:scale-105 transition-all">
              <div class="text-2xl mb-1">🔒</div>
              <div class="text-xs text-white font-bold">ปลอดภัย 100%</div>
            </div>
            <div class="bg-white/15 backdrop-blur-sm rounded-xl p-3 text-center transform hover:scale-105 transition-all">
              <div class="text-2xl mb-1">💯</div>
              <div class="text-xs text-white font-bold">จ่ายจริง ไม่โกง</div>
            </div>
          </div>

          <!-- Main CTA Button -->
          <a
            href="https://af1.racha-lottoaf.com/?openExternalBrowser=1#/register?af=f8b877b2-23c2-3382-b460-3599780c1bc9"
            target="_blank"
            rel="noopener noreferrer"
            class="block w-full py-5 px-8 bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-gray-900 font-black text-2xl rounded-2xl shadow-2xl transform transition-all hover:scale-105 hover:shadow-3xl active:scale-95 text-center relative overflow-hidden group animate-pulse-button-strong"
          >
            <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
            <span class="relative z-10 flex items-center justify-center gap-3">
              <span class="text-3xl animate-bounce-slow">🚀</span>
              <span>คลิกสมัครเลย!</span>
              <span class="text-3xl">💰</span>
            </span>
          </a>

          <!-- Secondary CTA -->
          <div class="mt-3 text-center">
            <a
              href="https://af1.racha-lottoaf.com/?openExternalBrowser=1#/register?af=f8b877b2-23c2-3382-b460-3599780c1bc9"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 text-white text-sm font-bold hover:text-yellow-300 transition-colors underline"
            >
              <span>📱</span>
              <span>ดูวิธีการสมัครและซื้อเลข</span>
            </a>
          </div>

          <!-- Trust Badges -->
          <div class="mt-6 flex flex-wrap items-center justify-center gap-4 text-white/90 text-sm">
            <div class="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
              <span class="text-lg">✅</span>
              <span class="font-semibold">รองรับทุกธนาคาร</span>
            </div>
            <div class="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
              <span class="text-lg">⚡</span>
              <span class="font-semibold">ฝาก-ถอนออโต้</span>
            </div>
            <div class="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
              <span class="text-lg">🎁</span>
              <span class="font-semibold">โปรโมชั่นเพียบ</span>
            </div>
          </div>

          <!-- Success Story Ticker -->
          <div class="mt-6 bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div class="flex items-center gap-3 text-sm">
              <div class="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span class="text-xl">🎉</span>
              </div>
              <div class="flex-1">
                <p class="text-white font-bold text-xs">คุณ นัท*** ถูกรางวัลที่ 1 เมื่อ 2 ชม. ที่แล้ว</p>
                <p class="text-yellow-300 text-lg font-black">ชนะ 500,000 บาท! 💰</p>
              </div>
            </div>
          </div>
        </div>
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

/* Pulse animation สำหรับปุ่มซื้อเลข */
@keyframes pulse-button {
  0%, 100% { transform: scale(1); box-shadow: 0 10px 40px rgba(234, 179, 8, 0.5); }
  50% { transform: scale(1.02); box-shadow: 0 15px 60px rgba(234, 179, 8, 0.7); }
}
.animate-pulse-button {
  animation: pulse-button 2s ease-in-out infinite;
}

/* === NEW ENHANCED ANIMATIONS === */

/* Pulse animation ช้าสำหรับ background blobs */
@keyframes pulse-slow {
  0%, 100% { transform: scale(1); opacity: 0.1; }
  50% { transform: scale(1.2); opacity: 0.2; }
}
.animate-pulse-slow {
  animation: pulse-slow 4s ease-in-out infinite;
}

/* Pulse animation ช้าแบบ delayed */
.animate-pulse-slow-delayed {
  animation: pulse-slow 4s ease-in-out infinite;
  animation-delay: 2s;
}

/* Count up number animation */
@keyframes count-up {
  0% { transform: scale(0.8); opacity: 0; }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); opacity: 1; }
}
.animate-count-up {
  animation: count-up 1.5s ease-out;
}

/* Text glow effect */
@keyframes text-glow {
  0%, 100% {
    text-shadow:
      0 0 10px rgba(255, 255, 255, 0.5),
      0 0 20px rgba(255, 255, 255, 0.3),
      0 0 30px rgba(255, 255, 0, 0.3);
  }
  50% {
    text-shadow:
      0 0 20px rgba(255, 255, 255, 0.8),
      0 0 30px rgba(255, 255, 255, 0.5),
      0 0 40px rgba(255, 255, 0, 0.5);
  }
}
.animate-text-glow {
  animation: text-glow 2s ease-in-out infinite;
}

/* Strong pulse for main CTA button */
@keyframes pulse-button-strong {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 10px 50px rgba(234, 179, 8, 0.6);
  }
  25% {
    transform: scale(1.03);
    box-shadow: 0 15px 70px rgba(234, 179, 8, 0.8);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 20px 90px rgba(234, 179, 8, 1);
  }
  75% {
    transform: scale(1.03);
    box-shadow: 0 15px 70px rgba(234, 179, 8, 0.8);
  }
}
.animate-pulse-button-strong {
  animation: pulse-button-strong 2s ease-in-out infinite;
}

/* Shimmer effect for button */
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
.animate-shimmer {
  animation: shimmer 3s ease-in-out infinite;
}

/* Slow bounce for emoji */
@keyframes bounce-slow {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
.animate-bounce-slow {
  animation: bounce-slow 1.5s ease-in-out infinite;
}

/* Hover shadow expansion */
.hover\:shadow-3xl:hover {
  box-shadow: 0 25px 100px -10px rgba(234, 179, 8, 0.8);
}
</style>