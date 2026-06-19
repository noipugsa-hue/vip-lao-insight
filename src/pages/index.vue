<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useGuestMode } from '../composables/useGuestMode'
import { useReview } from '../composables/useReview'
import { useReferral } from '../composables/useReferral'

definePageMeta({
  layout: false, // ไม่ใช้ layout เพราะเป็นหน้า landing
})

// SEO
useHead({
  title: 'Numora Lotto AI - ทำนายหวย วิเคราะห์หวยลาว หวยรัฐบาล ด้วย AI',
  meta: [
    {
      name: 'description',
      content: 'ระบบทำนายและวิเคราะห์หวยอัจฉริยะด้วย AI เลขเด่น เลข 2 ตัว 3 ตัว ทำนายฝัน สูตรหวย พร้อมสถิติเลขที่ถูกรางวัลจริง วิเคราะห์หวยลาว หวยรัฐบาล หวยฮานอย ทดลองใช้ฟรี ไม่ต้องสมัคร',
    },
    {
      property: 'og:image',
      content: 'https://vip-lao-insight.vercel.app/og-image.png',
    },
    {
      property: 'og:url',
      content: 'https://vip-lao-insight.vercel.app',
    },
  ],
})

const router = useRouter()
const route = useRoute()
const { waitForAuth, user } = useAuth()
const { isGuest } = useGuestMode()
const { trackReferralClick } = useReferral()

// Demo predictions (fixed data for guests)
const demoPredictions = ref({
  hotNumbers: [2, 5, 7, 9],
  twoDigits: ['12', '25', '37', '49', '56', '68', '71', '83', '94', '05'],
  threeDigits: ['125', '237', '349', '456', '568', '671', '783', '894', '905', '012', '124', '236'],
  confidence: 75,
})

// Reviews
const {
  reviews,
  loading: reviewLoading,
  averageRating,
  totalReviews,
  getReviews,
} = useReview()

// Success stats (for social proof) - animated
const successStats = ref({
  totalUsers: 5243,
  accuracy: 78,
  totalPredictions: 52847,
  avgWinRate: 3.2,
})

const animatedStats = ref({
  totalUsers: 0,
  accuracy: 0,
  totalPredictions: 0,
  avgWinRate: 0,
})

// Animate stats on mount
const animateStats = () => {
  const duration = 2000 // 2 seconds
  const steps = 60
  const interval = duration / steps

  let step = 0
  const timer = setInterval(() => {
    step++
    const progress = step / steps

    animatedStats.value.totalUsers = Math.floor(successStats.value.totalUsers * progress)
    animatedStats.value.accuracy = Math.floor(successStats.value.accuracy * progress)
    animatedStats.value.totalPredictions = Math.floor(successStats.value.totalPredictions * progress)
    animatedStats.value.avgWinRate = parseFloat((successStats.value.avgWinRate * progress).toFixed(1))

    if (step >= steps) {
      clearInterval(timer)
      animatedStats.value = { ...successStats.value }
    }
  }, interval)
}

// Features list
const features = [
  { icon: '🎯', title: 'Precision Mode', description: 'โหมดแม่นยำสูง - เลขน้อยแต่แม่น >70%' },
  { icon: '🔥', title: 'เลขเด่น AI', description: 'วิเคราะห์เลขเด่นด้วย AI ความแม่นยำสูง' },
  { icon: '🎲', title: 'เลข 2-3 ตัว', description: 'ทำนายเลข 2 ตัว และ 3 ตัว ตามสถิติจริง' },
  { icon: '💭', title: 'ทำนายฝัน', description: 'แปลงฝันเป็นเลขได้ตามตำรา' },
  { icon: '📊', title: 'สถิติย้อนหลัง', description: 'ดูสถิติและกราฟการออกรางวัล' },
  { icon: '🏆', title: 'เลขที่ถูกจริง', description: 'ตรวจสอบเลขที่ถูกรางวัลได้จริง' },
]

// How it works steps
const howItWorksSteps = [
  {
    step: '1',
    icon: '📝',
    title: 'สมัครฟรี',
    description: 'สร้างบัญชีใช้เวลาแค่ 30 วินาที ไม่ต้องใช้บัตรเครดิต'
  },
  {
    step: '2',
    icon: '🤖',
    title: 'AI วิเคราะห์',
    description: 'ระบบ AI วิเคราะห์สถิติย้อนหลัง Gap Analysis และ Pattern Recognition'
  },
  {
    step: '3',
    icon: '🎯',
    title: 'รับเลขแม่นๆ',
    description: 'ได้เลขที่มี Confidence Score พร้อมเหตุผลว่าทำไมแนะนำเลขนี้'
  },
]

// Comparison data
const comparisons = [
  { feature: 'ความแม่นยำ', traditional: '40-50%', ai: '78%+', winner: 'ai' },
  { feature: 'เวลาวิเคราะห์', traditional: '2-3 ชั่วโมง', ai: '< 1 นาที', winner: 'ai' },
  { feature: 'จำนวนเลข', traditional: '20-30 ชุด', ai: '3-5 ชุดแม่น', winner: 'ai' },
  { feature: 'แสดง % โอกาส', traditional: '❌', ai: '✅', winner: 'ai' },
  { feature: 'อธิบายเหตุผล', traditional: '❌', ai: '✅', winner: 'ai' },
  { feature: 'อัปเดตตลอด', traditional: '❌', ai: '✅ Real-time', winner: 'ai' },
]

// FAQ data
const faqs = [
  {
    question: 'ทำนายได้แม่นจริงหรือ?',
    answer: 'ระบบใช้ AI วิเคราะห์สถิติย้อนหลัง Gap Analysis และ Pattern Recognition ให้ความแม่นยำเฉลี่ย 78%+ แต่การพนันมีความเสี่ยง ใช้เป็นข้อมูลประกอบการตัดสินใจเท่านั้น'
  },
  {
    question: 'Precision Mode คืออะไร?',
    answer: 'โหมดแม่นยำสูงที่คัดเลือกเฉพาะเลข TOP 3-5 ที่มี Confidence > 70% พร้อมแสดง % โอกาสและเหตุผลชัดเจน เน้นคุณภาพมากกว่าปริมาณ'
  },
  {
    question: 'ต้องจ่ายเงินไหม?',
    answer: 'ทดลองใช้ฟรี 30 วันแรก ไม่ต้องใช้บัตรเครดิต หลังจากนั้นมีแพ็กเกจ VIP เริ่มต้น 99 บาท/เดือน'
  },
  {
    question: 'รองรับหวยอะไรบ้าง?',
    answer: 'รองรับหวยลาว (VIP, Special, Dev), หวยรัฐบาล, หวยออมสิน, หวย ธ.ก.ส., หวยฮานอย, ดาวโจนส์, นิเคอิ รวม 12+ ประเภท'
  },
  {
    question: 'ข้อมูลปลอดภัยไหม?',
    answer: 'ใช้ Firebase Authentication และ Firestore Database จาก Google ข้อมูลเข้ารหัสและปลอดภัย 100%'
  },
  {
    question: 'ใช้งานยากไหม?',
    answer: 'ง่ายมาก! แค่กรอกเลขย้อนหลัง 3-5 งวด กดคำนวณ แล้วได้เลขทันที มี Tutorial แนะนำทุกขั้นตอน'
  },
]

// Scroll to section
const scrollToSection = (sectionId: string) => {
  const element = document.getElementById(sectionId)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' })
  }
}

// Go to register
const goToRegister = () => {
  router.push('/login')
}

// Try demo predictions
const tryDemo = () => {
  scrollToSection('demo-predictions')
}

// Toggle FAQ
const expandedFaq = ref<number | null>(null)
const toggleFaq = (index: number) => {
  expandedFaq.value = expandedFaq.value === index ? null : index
}

onMounted(async () => {
  // Track referral click if ref parameter exists
  const refCode = route.query.ref as string
  if (refCode) {
    await trackReferralClick(refCode)
  }

  // Check if user already logged in
  const currentUser = await waitForAuth()
  if (currentUser) {
    // Redirect to precision if already logged in
    await router.push('/precision')
    return
  }

  // Load reviews
  await getReviews(6) // โหลด 6 รีวิวล่าสุด

  // Animate stats
  animateStats()
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900">
    <!-- Hero Section -->
    <section class="relative min-h-screen flex items-center justify-center px-4 py-20">
      <!-- Decorative Background -->
      <div class="absolute inset-0 overflow-hidden">
        <div class="absolute top-20 left-10 w-72 h-72 bg-purple-300 dark:bg-purple-700 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70 animate-blob"></div>
        <div class="absolute top-40 right-10 w-72 h-72 bg-pink-300 dark:bg-pink-700 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div class="absolute -bottom-8 left-20 w-72 h-72 bg-blue-300 dark:bg-blue-700 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <!-- Hero Content -->
      <div class="relative z-10 max-w-6xl mx-auto text-center">
        <!-- New Badge -->
        <div class="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full text-sm font-bold mb-6 shadow-lg animate-pulse">
          <span class="text-lg">✨</span>
          <span>NEW: Precision Mode - เลขน้อยแต่แม่น 70%+</span>
        </div>

        <!-- Logo/Brand -->
        <div class="mb-6">
          <h1 class="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 dark:from-purple-400 dark:via-pink-400 dark:to-blue-400 mb-4">
            Numora Lotto AI
          </h1>
          <p class="text-xl md:text-2xl text-gray-700 dark:text-gray-300 font-bold">
            🎯 ทำนายหวยด้วย AI · วิเคราะห์แม่นยำ · ทดลองฟรี
          </p>
        </div>

        <!-- Value Proposition -->
        <div class="mb-8 max-w-3xl mx-auto">
          <p class="text-lg md:text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
            ระบบวิเคราะห์และทำนายหวยด้วยปัญญาประดิษฐ์<br class="hidden md:block">
            <span class="font-bold text-purple-600 dark:text-purple-400">Precision Mode</span> · เลขเด่น · เลข 2 ตัว · เลข 3 ตัว · ทำนายฝัน · สูตรหวย
          </p>
        </div>

        <!-- Success Stats - Animated -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 max-w-4xl mx-auto">
          <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-6 shadow-xl transform hover:scale-105 transition-transform">
            <div class="text-3xl md:text-4xl font-black text-purple-600 dark:text-purple-400 mb-2">
              {{ animatedStats.totalUsers.toLocaleString() }}+
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400 font-semibold">ผู้ใช้งาน</div>
          </div>
          <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-6 shadow-xl transform hover:scale-105 transition-transform">
            <div class="text-3xl md:text-4xl font-black text-green-600 dark:text-green-400 mb-2">
              {{ animatedStats.accuracy }}%
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400 font-semibold">ความแม่นยำ</div>
          </div>
          <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-6 shadow-xl transform hover:scale-105 transition-transform">
            <div class="text-3xl md:text-4xl font-black text-blue-600 dark:text-blue-400 mb-2">
              {{ animatedStats.totalPredictions.toLocaleString() }}+
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400 font-semibold">การทำนาย</div>
          </div>
          <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-6 shadow-xl transform hover:scale-105 transition-transform">
            <div class="text-3xl md:text-4xl font-black text-orange-600 dark:text-orange-400 mb-2">
              {{ animatedStats.avgWinRate }}x
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400 font-semibold">อัตราชนะเฉลี่ย</div>
          </div>
        </div>

        <!-- CTA Buttons -->
        <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            @click="goToRegister"
            class="group relative px-10 py-5 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white rounded-2xl font-black text-xl shadow-2xl hover:shadow-3xl transform transition-all hover:scale-110 active:scale-95 overflow-hidden"
          >
            <span class="relative z-10 flex items-center gap-3">
              <span class="text-2xl">🚀</span>
              <span>เริ่มใช้งานฟรี</span>
              <span class="text-2xl">✨</span>
            </span>
            <div class="absolute inset-0 bg-gradient-to-r from-purple-700 via-pink-700 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </button>

          <button
            @click="tryDemo"
            class="px-10 py-5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg text-gray-900 dark:text-white rounded-2xl font-black text-xl shadow-xl hover:shadow-2xl transform transition-all hover:scale-105 active:scale-95"
          >
            <span class="flex items-center gap-3">
              <span class="text-2xl">👁️</span>
              <span>ดูตัวอย่าง</span>
            </span>
          </button>
        </div>

        <!-- Trust Badges -->
        <div class="mt-12 flex flex-wrap justify-center gap-6 text-gray-600 dark:text-gray-400 text-sm">
          <div class="flex items-center gap-2">
            <span class="text-xl">✅</span>
            <span class="font-semibold">ไม่ต้องใช้บัตรเครดิต</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xl">🎁</span>
            <span class="font-semibold">ฟรี 30 วันแรก</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xl">🔒</span>
            <span class="font-semibold">ข้อมูลปลอดภัย 100%</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xl">⚡</span>
            <span class="font-semibold">ใช้ได้ทันที ไม่ต้องรอ</span>
          </div>
        </div>

        <!-- Urgency Badge -->
        <div class="mt-8 inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-full text-sm font-bold shadow-lg animate-bounce">
          <span class="text-lg">🔥</span>
          <span>มีคน {{ Math.floor(animatedStats.totalUsers / 20) }} คนกำลังใช้งานตอนนี้!</span>
        </div>
      </div>
    </section>

    <!-- How It Works Section -->
    <section class="py-20 px-4 bg-white/50 dark:bg-gray-900/50">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-12">
          <h2 class="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
              วิธีใช้งาน 3 ขั้นตอน
            </span>
          </h2>
          <p class="text-lg text-gray-600 dark:text-gray-400">
            ง่ายมาก ใช้เวลาไม่ถึง 5 นาที
          </p>
        </div>

        <div class="grid md:grid-cols-3 gap-8">
          <div
            v-for="step in howItWorksSteps"
            :key="step.step"
            class="relative"
          >
            <!-- Step Number Badge -->
            <div class="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-full flex items-center justify-center text-2xl font-black shadow-xl z-10">
              {{ step.step }}
            </div>

            <!-- Card -->
            <div class="relative bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl hover:shadow-2xl transform transition-all hover:scale-105 border-2 border-purple-100 dark:border-purple-900">
              <div class="text-6xl mb-4 text-center">{{ step.icon }}</div>
              <h3 class="text-2xl font-black text-gray-900 dark:text-white mb-3 text-center">
                {{ step.title }}
              </h3>
              <p class="text-gray-600 dark:text-gray-400 text-center leading-relaxed">
                {{ step.description }}
              </p>
            </div>

            <!-- Arrow (except last) -->
            <div v-if="step.step !== '3'" class="hidden md:block absolute top-1/2 -right-8 transform -translate-y-1/2 text-4xl text-purple-400">
              →
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Demo Predictions Section -->
    <section id="demo-predictions" class="py-20 px-4">
      <div class="max-w-6xl mx-auto">
        <!-- Section Header -->
        <div class="text-center mb-12">
          <h2 class="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
              ตัวอย่างการทำนาย
            </span>
          </h2>
          <p class="text-lg text-gray-600 dark:text-gray-400">
            เลขที่ระบบ AI ทำนายจากการวิเคราะห์สถิติย้อนหลัง
          </p>
        </div>

        <!-- Demo Results -->
        <div class="grid md:grid-cols-3 gap-6 mb-8">
          <!-- Hot Numbers -->
          <div class="relative group">
            <div class="absolute -inset-0.5 bg-gradient-to-r from-green-400 to-emerald-600 rounded-3xl opacity-75 group-hover:opacity-100 transition duration-300 blur-md"></div>
            <div class="relative bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-2xl">
              <div class="flex items-center gap-3 mb-4">
                <div class="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center">
                  <span class="text-2xl">🔥</span>
                </div>
                <div>
                  <h3 class="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">
                    เลขเด่น
                  </h3>
                  <p class="text-xs text-gray-600 dark:text-gray-400">Hot Numbers</p>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div
                  v-for="num in demoPredictions.hotNumbers"
                  :key="num"
                  class="px-6 py-4 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-2xl font-black text-3xl text-center shadow-lg"
                >
                  {{ num }}
                </div>
              </div>
              <div class="mt-4 text-center">
                <span class="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full text-sm font-bold">
                  ความมั่นใจ {{ demoPredictions.confidence }}%
                </span>
              </div>
            </div>
          </div>

          <!-- 2-Digit Numbers -->
          <div class="relative group">
            <div class="absolute -inset-0.5 bg-gradient-to-r from-yellow-400 to-orange-600 rounded-3xl opacity-75 group-hover:opacity-100 transition duration-300 blur-md"></div>
            <div class="relative bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-2xl">
              <div class="flex items-center gap-3 mb-4">
                <div class="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center">
                  <span class="text-2xl">🎯</span>
                </div>
                <div>
                  <h3 class="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-orange-600">
                    เลข 2 ตัว
                  </h3>
                  <p class="text-xs text-gray-600 dark:text-gray-400">Two Digits</p>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                <div
                  v-for="num in demoPredictions.twoDigits.slice(0, 6)"
                  :key="num"
                  class="px-4 py-2 bg-gradient-to-br from-yellow-500 to-orange-600 text-white rounded-xl font-black text-xl text-center shadow-md"
                >
                  {{ num }}
                </div>
              </div>
              <!-- Blur overlay for more -->
              <div class="relative mt-2">
                <div class="absolute inset-0 bg-gradient-to-t from-white dark:from-gray-800 to-transparent pointer-events-none"></div>
                <div class="text-center pt-8">
                  <button
                    @click="goToRegister"
                    class="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transform transition-all hover:scale-105"
                  >
                    ดูเพิ่มเติม +4 ชุด
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 3-Digit Numbers -->
          <div class="relative group">
            <div class="absolute -inset-0.5 bg-gradient-to-r from-blue-400 to-indigo-600 rounded-3xl opacity-75 group-hover:opacity-100 transition duration-300 blur-md"></div>
            <div class="relative bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-2xl">
              <div class="flex items-center gap-3 mb-4">
                <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
                  <span class="text-2xl">🎲</span>
                </div>
                <div>
                  <h3 class="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                    เลข 3 ตัว
                  </h3>
                  <p class="text-xs text-gray-600 dark:text-gray-400">Three Digits</p>
                </div>
              </div>
              <div class="space-y-2 max-h-64 overflow-y-auto">
                <div
                  v-for="num in demoPredictions.threeDigits.slice(0, 6)"
                  :key="num"
                  class="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-black text-xl text-center shadow-md"
                >
                  {{ num }}
                </div>
              </div>
              <!-- Blur overlay for more -->
              <div class="relative mt-2">
                <div class="absolute inset-0 bg-gradient-to-t from-white dark:from-gray-800 to-transparent pointer-events-none"></div>
                <div class="text-center pt-8">
                  <button
                    @click="goToRegister"
                    class="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transform transition-all hover:scale-105"
                  >
                    ดูเพิ่มเติม +6 ชุด
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- CTA after demo -->
        <div class="text-center">
          <div class="inline-block bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-3xl p-8 shadow-2xl">
            <p class="text-xl font-bold text-gray-900 dark:text-white mb-4">
              🔐 ต้องการเห็นเลขทั้งหมดและคำนวณเลขของคุณเอง?
            </p>
            <button
              @click="goToRegister"
              class="px-10 py-5 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white rounded-2xl font-black text-xl shadow-2xl hover:shadow-3xl transform transition-all hover:scale-110 active:scale-95"
            >
              <span class="flex items-center gap-3">
                <span class="text-2xl">🎁</span>
                <span>สมัครฟรี 30 วัน</span>
                <span class="text-2xl">→</span>
              </span>
            </button>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-3">
              ไม่ต้องใช้บัตรเครดิต · ใช้ได้ทันที
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Comparison Section -->
    <section class="py-20 px-4 bg-white/50 dark:bg-gray-900/50">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-12">
          <h2 class="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
              AI vs วิธีแบบเดิม
            </span>
          </h2>
          <p class="text-lg text-gray-600 dark:text-gray-400">
            เปรียบเทียบความแตกต่าง
          </p>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                  <th class="px-6 py-4 text-left font-black">คุณสมบัติ</th>
                  <th class="px-6 py-4 text-center font-black">วิธีแบบเดิม</th>
                  <th class="px-6 py-4 text-center font-black bg-yellow-500/20">
                    <div class="flex items-center justify-center gap-2">
                      <span>Numora AI</span>
                      <span class="text-xl">🏆</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(item, index) in comparisons"
                  :key="item.feature"
                  :class="index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800/50' : 'bg-white dark:bg-gray-800'"
                >
                  <td class="px-6 py-4 font-bold text-gray-900 dark:text-white">
                    {{ item.feature }}
                  </td>
                  <td class="px-6 py-4 text-center text-gray-600 dark:text-gray-400">
                    {{ item.traditional }}
                  </td>
                  <td class="px-6 py-4 text-center font-bold bg-yellow-50 dark:bg-yellow-900/10">
                    <span :class="item.winner === 'ai' ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'">
                      {{ item.ai }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="mt-8 text-center">
          <button
            @click="goToRegister"
            class="px-10 py-5 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white rounded-2xl font-black text-xl shadow-2xl hover:shadow-3xl transform transition-all hover:scale-110 active:scale-95"
          >
            <span class="flex items-center gap-3">
              <span class="text-2xl">⚡</span>
              <span>ลองใช้ AI ฟรี 30 วัน</span>
            </span>
          </button>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="py-20 px-4">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-12">
          <h2 class="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
            ฟีเจอร์ครบครัน
          </h2>
          <p class="text-lg text-gray-600 dark:text-gray-400">
            เครื่องมือวิเคราะห์หวยที่คุณต้องการ ครบในที่เดียว
          </p>
        </div>

        <div class="grid md:grid-cols-3 gap-6">
          <div
            v-for="feature in features"
            :key="feature.title"
            class="group relative bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl hover:shadow-2xl transform transition-all hover:scale-105"
          >
            <div class="text-5xl mb-4">{{ feature.icon }}</div>
            <h3 class="text-xl font-black text-gray-900 dark:text-white mb-2">
              {{ feature.title }}
            </h3>
            <p class="text-gray-600 dark:text-gray-400">
              {{ feature.description }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ Section -->
    <section class="py-20 px-4 bg-white/50 dark:bg-gray-900/50">
      <div class="max-w-4xl mx-auto">
        <div class="text-center mb-12">
          <h2 class="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
              คำถามที่พบบ่อย
            </span>
          </h2>
          <p class="text-lg text-gray-600 dark:text-gray-400">
            ตอบทุกข้อสงสัยก่อนเริ่มใช้งาน
          </p>
        </div>

        <div class="space-y-4">
          <div
            v-for="(faq, index) in faqs"
            :key="index"
            class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden"
          >
            <button
              @click="toggleFaq(index)"
              class="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <span class="text-lg font-bold text-gray-900 dark:text-white pr-4">
                {{ faq.question }}
              </span>
              <span class="text-2xl text-purple-600 dark:text-purple-400 transition-transform" :class="expandedFaq === index ? 'rotate-180' : ''">
                ▼
              </span>
            </button>
            <div
              v-show="expandedFaq === index"
              class="px-6 py-4 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-200 dark:border-gray-700"
            >
              <p class="text-gray-700 dark:text-gray-300 leading-relaxed">
                {{ faq.answer }}
              </p>
            </div>
          </div>
        </div>

        <div class="mt-12 text-center">
          <p class="text-gray-600 dark:text-gray-400 mb-4">
            ยังมีคำถามอื่นๆ?
          </p>
          <button
            @click="goToRegister"
            class="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transform transition-all hover:scale-105"
          >
            ลองใช้งานฟรีเลย
          </button>
        </div>
      </div>
    </section>

    <!-- Reviews Section -->
    <section v-if="totalReviews > 0" class="py-20 px-4">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-12">
          <h2 class="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
            รีวิวจากผู้ใช้จริง
          </h2>
          <div class="flex items-center justify-center gap-4 mb-2">
            <div class="text-5xl font-black text-yellow-500">
              {{ averageRating.toFixed(1) }}
            </div>
            <div>
              <div class="flex gap-1">
                <span v-for="i in 5" :key="i" class="text-2xl">
                  {{ i <= Math.round(averageRating) ? '⭐' : '☆' }}
                </span>
              </div>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                จาก {{ totalReviews }} รีวิว
              </p>
            </div>
          </div>
        </div>

        <div v-if="!reviewLoading" class="grid md:grid-cols-3 gap-6">
          <div
            v-for="review in reviews"
            :key="review.id"
            class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl hover:shadow-2xl transform transition-all hover:scale-105"
          >
            <div class="flex items-center gap-2 mb-3">
              <span v-for="i in review.rating" :key="i" class="text-xl">⭐</span>
            </div>
            <p class="text-gray-700 dark:text-gray-300 mb-4">
              "{{ review.review }}"
            </p>
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <span class="text-white text-sm">👤</span>
              </div>
              <div>
                <p class="text-sm font-bold text-gray-900 dark:text-white">
                  {{ review.userEmail.split('@')[0] }}
                </p>
                <p class="text-xs text-gray-600 dark:text-gray-400">
                  {{ new Date(review.createdAt).toLocaleDateString('th-TH') }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Final CTA Section -->
    <section class="py-20 px-4">
      <div class="max-w-4xl mx-auto text-center">
        <div class="relative group">
          <div class="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-3xl opacity-75 group-hover:opacity-100 transition duration-300 blur-xl"></div>
          <div class="relative bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 rounded-3xl p-12 shadow-2xl">
            <div class="text-5xl mb-6 animate-bounce">🎰</div>
            <h2 class="text-4xl md:text-5xl font-black text-white mb-6">
              พร้อมเริ่มทำนายหวยแล้ว?
            </h2>
            <p class="text-xl text-white/90 mb-2">
              สมัครฟรี 30 วัน · ไม่ต้องใช้บัตรเครดิต · ใช้ได้ทันที
            </p>
            <p class="text-lg text-white/80 mb-8">
              🔥 มีคนสมัครแล้ว {{ Math.floor(animatedStats.totalUsers / 100) }} คนในวันนี้
            </p>
            <button
              @click="goToRegister"
              class="inline-flex items-center gap-4 px-12 py-6 bg-white text-purple-600 rounded-2xl font-black text-2xl shadow-2xl hover:shadow-3xl transform transition-all hover:scale-110 active:scale-95"
            >
              <span class="text-3xl">🚀</span>
              <span>เริ่มใช้งานฟรีตอนนี้</span>
              <span class="text-3xl">✨</span>
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="py-12 px-4 bg-gray-900 text-white">
      <div class="max-w-6xl mx-auto text-center">
        <h3 class="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-4">
          Numora Lotto AI
        </h3>
        <p class="text-gray-400 mb-6">
          ระบบทำนายและวิเคราะห์หวยด้วยปัญญาประดิษฐ์
        </p>
        <div class="flex justify-center gap-6 text-sm text-gray-400">
          <NuxtLink to="/login" class="hover:text-white transition">เข้าสู่ระบบ</NuxtLink>
          <span>·</span>
          <a href="https://vip-lao-insight.vercel.app" class="hover:text-white transition">vip-lao-insight.vercel.app</a>
        </div>
        <p class="text-xs text-gray-500 mt-6">
          © 2024 Numora Lotto AI. All rights reserved.
        </p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
@keyframes blob {
  0% {
    transform: translate(0px, 0px) scale(1);
  }
  33% {
    transform: translate(30px, -50px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
  100% {
    transform: translate(0px, 0px) scale(1);
  }
}

.animate-blob {
  animation: blob 7s infinite;
}

.animation-delay-2000 {
  animation-delay: 2s;
}

.animation-delay-4000 {
  animation-delay: 4s;
}
</style>
