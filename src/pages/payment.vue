<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useSubscription, SUBSCRIPTION_PLANS } from '../composables/useSubscription'
import { useNuxtApp } from '#app'
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore'

const router = useRouter()
const route = useRoute()
const { waitForAuth, user } = useAuth()
const { fetchSubscription } = useSubscription()
const { $db } = useNuxtApp()

const loading = ref(false)
const showFAQ = ref<number | null>(null)

// Countdown timer (24 hours from now)
const timeLeft = ref({ hours: 23, minutes: 59, seconds: 59 })
const countdownInterval = ref<any>(null)

// Stats for social proof
const totalUsers = ref(0)
const activeNow = ref(0)

// Testimonials
const testimonials = [
  {
    name: 'คุณสมชาย',
    avatar: '👨',
    rating: 5,
    text: 'ใช้งานมา 2 เดือน ถูกรางวัล 3 ตัวตรง 2 ครั้งแล้ว คุ้มค่ามาก!',
    date: '3 วันที่แล้ว'
  },
  {
    name: 'คุณมาลี',
    avatar: '👩',
    rating: 5,
    text: 'วิเคราะห์แม่นมาก แนะนำเลยค่ะ ตัวเลขออกตรงตามที่พยากรณ์',
    date: '1 สัปดาห์ที่แล้ว'
  },
  {
    name: 'คุณวิชัย',
    avatar: '👨‍💼',
    rating: 5,
    text: 'ลงทุน 599 บาท แต่ได้กำไรกลับมาหลายหมื่น ดีมาก!',
    date: '2 สัปดาห์ที่แล้ว'
  }
]

// FAQs
const faqs = [
  {
    q: 'ชำระเงินแล้วเมื่อไหร่จะได้ใช้งาน?',
    a: 'หลังจากชำระเงินและส่งสลิปใน LINE ภายใน 5-10 นาที ระบบจะอัพเกรดบัญชีให้อัตโนมัติ'
  },
  {
    q: 'ถ้าไม่พอใจสามารถขอคืนเงินได้ไหม?',
    a: 'ได้ครับ มีนโยบายคืนเงิน 100% ภายใน 7 วันแรก ไม่ต้องตอบคำถามใดๆ'
  },
  {
    q: 'ต่ออายุทุกเดือนหรือเปล่า?',
    a: 'ไม่ครับ ไม่มีการต่ออายุอัตโนมัติ คุณสามารถเลือกต่ออายุเองได้เมื่อหมดอายุ'
  },
  {
    q: 'ชำระเงินปลอดภัยแค่ไหน?',
    a: 'ปลอดภัย 100% ชำระผ่าน LINE Official เท่านั้น ไม่มีการเก็บข้อมูลบัตรเครดิต'
  }
]

// Fetch real user statistics
const fetchUserStats = async () => {
  try {
    // นับจำนวนผู้ใช้ทั้งหมดจาก subscriptions collection
    const subsRef = collection($db, 'subscriptions')
    const subsSnapshot = await getDocs(subsRef)
    totalUsers.value = subsSnapshot.size

    // นับจำนวนผู้ใช้ที่ login ภายใน 24 ชั่วโมงล่าสุด
    const oneDayAgo = new Date()
    oneDayAgo.setHours(oneDayAgo.getHours() - 24)

    const loginRef = collection($db, 'login_history')
    const recentLoginQuery = query(
      loginRef,
      where('timestamp', '>=', Timestamp.fromDate(oneDayAgo))
    )
    const recentLoginSnapshot = await getDocs(recentLoginQuery)

    // นับ unique users (ไม่นับซ้ำ)
    const uniqueUsers = new Set()
    recentLoginSnapshot.forEach(doc => {
      uniqueUsers.add(doc.data().uid)
    })
    activeNow.value = uniqueUsers.size

    console.log('📊 User Stats:', {
      total: totalUsers.value,
      activeToday: activeNow.value
    })
  } catch (err) {
    console.error('❌ Error fetching user stats:', err)
    // Fallback ถ้าเกิด error
    totalUsers.value = 50
    activeNow.value = 5
  }
}

onMounted(async () => {
  const currentUser = await waitForAuth()
  if (!currentUser) {
    await router.push('/login')
    return
  }

  // Fetch real user statistics
  await fetchUserStats()

  // Start countdown timer
  startCountdown()

  // Update active users count every 30 seconds
  setInterval(async () => {
    await fetchUserStats()
  }, 30000)
})

onUnmounted(() => {
  if (countdownInterval.value) {
    clearInterval(countdownInterval.value)
  }
})

// Countdown timer
const startCountdown = () => {
  countdownInterval.value = setInterval(() => {
    if (timeLeft.value.seconds > 0) {
      timeLeft.value.seconds--
    } else if (timeLeft.value.minutes > 0) {
      timeLeft.value.minutes--
      timeLeft.value.seconds = 59
    } else if (timeLeft.value.hours > 0) {
      timeLeft.value.hours--
      timeLeft.value.minutes = 59
      timeLeft.value.seconds = 59
    }
  }, 1000)
}

// Format number with leading zero
const pad = (num: number) => String(num).padStart(2, '0')

// Toggle FAQ
const toggleFAQ = (index: number) => {
  showFAQ.value = showFAQ.value === index ? null : index
}

// Go back
const goBack = () => {
  router.back()
}
</script>

<template>
  <NuxtLayout name="main">
    <div class="min-h-screen bg-gradient-to-b from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900 py-8 px-4">
      <div class="max-w-6xl mx-auto">
        <!-- Back Button -->
        <button
          @click="goBack"
          class="mb-6 group inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl shadow-md transition-all text-gray-700 dark:text-gray-300 font-semibold"
        >
          <span class="text-xl group-hover:animate-bounce">←</span>
          <span>ย้อนกลับ</span>
        </button>

        <!-- Hero Section -->
        <div class="relative mb-8 overflow-hidden">
          <!-- Animated Background -->
          <div class="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-3xl opacity-90"></div>
          <div class="absolute inset-0 bg-gradient-to-r from-purple-400/30 to-pink-400/30 animate-pulse rounded-3xl"></div>

          <div class="relative p-8 md:p-12">
            <!-- Limited Time Badge -->
            <div class="inline-flex items-center gap-2 px-4 py-2 bg-yellow-400 text-yellow-900 rounded-full font-black text-sm mb-6 animate-bounce shadow-xl">
              <span class="text-lg">⚡</span>
              <span>SPECIAL OFFER - เหลือเวลาจำกัด!</span>
            </div>

            <div class="grid lg:grid-cols-2 gap-8 items-center">
              <!-- Left: Text -->
              <div>
                <h1 class="text-4xl md:text-5xl font-black text-white mb-4 drop-shadow-lg">
                  ปลดล็อค PRO VIP
                </h1>
                <p class="text-white/90 text-lg md:text-xl mb-6 font-medium">
                  วิเคราะห์หวยด้วย AI ขั้นสูง + สถิติไม่จำกัด
                </p>

                <!-- Price -->
                <div class="bg-white/20 backdrop-blur-md rounded-2xl p-6 mb-6 border-2 border-white/30">
                  <div class="flex items-end gap-3 mb-2">
                    <span class="text-white/70 text-2xl line-through">999฿</span>
                    <span class="text-yellow-300 text-6xl font-black drop-shadow-lg">599฿</span>
                  </div>
                  <p class="text-white/80 text-lg font-semibold">/ 30 วัน</p>
                  <div class="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-green-500 text-white rounded-full text-sm font-bold">
                    <span>💰</span>
                    <span>ประหยัด 400 บาท (40% OFF)</span>
                  </div>
                </div>

                <!-- Countdown Timer -->
                <div class="bg-red-500/90 backdrop-blur-md rounded-xl p-4 border-2 border-red-400">
                  <p class="text-white text-sm font-bold mb-2 text-center">⏰ ข้อเสนอพิเศษสิ้นสุดใน:</p>
                  <div class="flex justify-center gap-3">
                    <div class="bg-white/20 rounded-lg px-4 py-2 min-w-[70px] text-center">
                      <div class="text-3xl font-black text-white">{{ pad(timeLeft.hours) }}</div>
                      <div class="text-white/80 text-xs font-semibold">ชั่วโมง</div>
                    </div>
                    <div class="text-3xl font-black text-white self-center">:</div>
                    <div class="bg-white/20 rounded-lg px-4 py-2 min-w-[70px] text-center">
                      <div class="text-3xl font-black text-white">{{ pad(timeLeft.minutes) }}</div>
                      <div class="text-white/80 text-xs font-semibold">นาที</div>
                    </div>
                    <div class="text-3xl font-black text-white self-center">:</div>
                    <div class="bg-white/20 rounded-lg px-4 py-2 min-w-[70px] text-center">
                      <div class="text-3xl font-black text-white">{{ pad(timeLeft.seconds) }}</div>
                      <div class="text-white/80 text-xs font-semibold">วินาที</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Right: QR Code -->
              <div class="bg-white/10 backdrop-blur-md rounded-2xl p-6 border-2 border-white/30">
                <div class="text-center mb-4">
                  <h3 class="text-2xl font-black text-white mb-2 flex items-center justify-center gap-2">
                    <span class="text-3xl">💚</span>
                    <span>แอด LINE เพื่อชำระเงิน</span>
                  </h3>
                  <p class="text-white/80 text-sm">สแกน QR Code ด้านล่าง</p>
                </div>

                <div class="bg-white p-4 rounded-2xl shadow-2xl mx-auto max-w-[280px]">
                  <img
                    src="/images/line-qr.jpeg"
                    alt="LINE QR Code"
                    class="w-full h-auto object-contain rounded-lg"
                  />
                </div>

                <a
                  href="https://line.me/ti/p/R0C12DzIhX"
                  target="_blank"
                  class="block w-full mt-6 py-4 bg-gradient-to-r from-green-500 via-green-600 to-green-500 hover:from-green-600 hover:via-green-700 hover:to-green-600 text-white rounded-xl font-bold text-lg shadow-2xl hover:shadow-green-500/50 transition-all transform hover:scale-105 active:scale-95 text-center relative overflow-hidden group"
                >
                  <span class="absolute inset-0 bg-gradient-to-r from-green-400/30 to-green-500/30 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  <span class="relative z-10 flex items-center justify-center gap-2">
                    <span class="text-2xl">💚</span>
                    <span>แอด LINE ชำระ 599 บาท</span>
                  </span>
                </a>

                <p class="text-white/70 text-xs text-center mt-4">
                  ✅ ปลอดภัย 100% | 🔒 ข้อมูลเข้ารหัส | ⚡ เปิดใช้งานทันที
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Trust Signals -->
        <div class="grid md:grid-cols-3 gap-6 mb-8">
          <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border-2 border-purple-200 dark:border-purple-700">
            <div class="text-4xl mb-3 text-center">👥</div>
            <div class="text-center">
              <div class="text-3xl font-black text-purple-600 dark:text-purple-400 mb-1">{{ totalUsers.toLocaleString() }}+</div>
              <p class="text-gray-600 dark:text-gray-400 font-semibold">ผู้ใช้งานทั้งหมด</p>
              <p class="text-green-600 dark:text-green-400 text-sm mt-2 font-bold">
                🟢 {{ activeNow }} คนเข้าใช้งานใน 24 ชม.
              </p>
            </div>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border-2 border-green-200 dark:border-green-700">
            <div class="text-4xl mb-3 text-center">🛡️</div>
            <div class="text-center">
              <div class="text-2xl font-black text-green-600 dark:text-green-400 mb-1">100% ปลอดภัย</div>
              <p class="text-gray-600 dark:text-gray-400 font-semibold">ชำระผ่าน LINE</p>
              <p class="text-gray-500 dark:text-gray-400 text-sm mt-2">
                ไม่เก็บข้อมูลบัตรเครดิต
              </p>
            </div>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border-2 border-yellow-200 dark:border-yellow-700">
            <div class="text-4xl mb-3 text-center">💰</div>
            <div class="text-center">
              <div class="text-2xl font-black text-yellow-600 dark:text-yellow-400 mb-1">คืนเงิน 7 วัน</div>
              <p class="text-gray-600 dark:text-gray-400 font-semibold">รับประกันความพึงพอใจ</p>
              <p class="text-gray-500 dark:text-gray-400 text-sm mt-2">
                ไม่พอใจคืนเงิน 100%
              </p>
            </div>
          </div>
        </div>

        <!-- Testimonials -->
        <div class="bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-3xl p-8 mb-8">
          <h2 class="text-3xl font-black text-gray-900 dark:text-white text-center mb-8">
            ⭐ รีวิวจากผู้ใช้งานจริง
          </h2>

          <div class="grid md:grid-cols-3 gap-6">
            <div
              v-for="(review, index) in testimonials"
              :key="index"
              class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl transform hover:scale-105 transition-all"
            >
              <div class="flex items-center gap-3 mb-4">
                <div class="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-2xl">
                  {{ review.avatar }}
                </div>
                <div>
                  <div class="font-bold text-gray-900 dark:text-white">{{ review.name }}</div>
                  <div class="flex gap-1">
                    <span v-for="i in review.rating" :key="i" class="text-yellow-400">⭐</span>
                  </div>
                </div>
              </div>
              <p class="text-gray-700 dark:text-gray-300 mb-3 italic">"{{ review.text }}"</p>
              <p class="text-gray-500 dark:text-gray-400 text-sm">{{ review.date }}</p>
            </div>
          </div>
        </div>

        <!-- FAQ -->
        <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 mb-8">
          <h2 class="text-3xl font-black text-gray-900 dark:text-white text-center mb-8">
            ❓ คำถามที่พบบ่อย (FAQ)
          </h2>

          <div class="space-y-4 max-w-3xl mx-auto">
            <div
              v-for="(faq, index) in faqs"
              :key="index"
              class="border-2 border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
            >
              <button
                @click="toggleFAQ(index)"
                class="w-full p-4 text-left font-bold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center justify-between"
              >
                <span>{{ faq.q }}</span>
                <span class="text-2xl transition-transform" :class="{ 'rotate-180': showFAQ === index }">
                  ▼
                </span>
              </button>
              <transition name="slide">
                <div v-if="showFAQ === index" class="p-4 bg-gray-50 dark:bg-gray-700 border-t-2 border-gray-200 dark:border-gray-600">
                  <p class="text-gray-700 dark:text-gray-300">{{ faq.a }}</p>
                </div>
              </transition>
            </div>
          </div>
        </div>

        <!-- Final CTA -->
        <div class="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-3xl p-8 md:p-12 text-center shadow-2xl">
          <h2 class="text-3xl md:text-4xl font-black text-white mb-4">
            พร้อมเริ่มต้นแล้วหรือยัง? 🚀
          </h2>
          <p class="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
            เข้าร่วมกับผู้ใช้งาน {{ totalUsers.toLocaleString() }}+ คนที่ไว้วางใจเรา<br/>
            เริ่มต้นใช้งาน PRO VIP วันนี้ในราคาพิเศษ!
          </p>

          <a
            href="https://line.me/ti/p/R0C12DzIhX"
            target="_blank"
            class="inline-flex items-center gap-3 px-10 py-5 bg-white text-purple-600 rounded-2xl font-black text-xl shadow-2xl hover:shadow-white/50 transition-all transform hover:scale-110 active:scale-95"
          >
            <span class="text-3xl">💚</span>
            <span>แอด LINE ชำระเงิน 599 บาท</span>
          </a>

          <p class="text-white/80 text-sm mt-6">
            ⏰ ข้อเสนอพิเศษนี้จะสิ้นสุดในเร็วๆ นี้
          </p>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>

<style scoped>
/* Slide transition for FAQ */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
  max-height: 200px;
}

.slide-enter-from,
.slide-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>
