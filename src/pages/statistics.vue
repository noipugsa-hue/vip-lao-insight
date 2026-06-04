<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useLotteryType } from '../composables/useLotteryType'
import { useLaoFormulaAdvanced } from '../composables/useLaoFormulaAdvanced'
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore'

const router = useRouter()
const { waitForAuth } = useAuth()
const { selectedLotteryType } = useLotteryType()
const { analyzeMirrorNumbers, analyzeRepeatingNumbers, analyzeTriples } = useLaoFormulaAdvanced()
const db = useNuxtApp().$db

// ข้อมูลผลหวยทั้งหมด
const lotteryResults = ref<any[]>([])
const isLoading = ref(false)

// จำนวนงวดที่จะแสดง
const displayLimit = ref(20)

// โหลดข้อมูล
const loadData = async () => {
  try {
    isLoading.value = true

    const q = query(
      collection(db, 'lotteryResults'),
      where('lotteryType', '==', selectedLotteryType.value.id),
      orderBy('fetchedAt', 'desc')
    )

    const snapshot = await getDocs(q)
    lotteryResults.value = snapshot.docs.map((doc) => doc.data()).slice(0, displayLimit.value)
  } catch (error) {
    console.error('Error loading data:', error)
  } finally {
    isLoading.value = false
  }
}

// วิเคราะห์ความถี่ของตัวเลข 0-9
const digitFrequency = computed(() => {
  const freq: Record<string, number> = {}
  for (let i = 0; i <= 9; i++) {
    freq[i.toString()] = 0
  }

  lotteryResults.value.forEach((result) => {
    const digits = result.threeDigit.split('')
    digits.forEach((digit: string) => {
      freq[digit] = (freq[digit] || 0) + 1
    })
  })

  return Object.entries(freq)
    .map(([digit, count]) => ({ digit, count }))
    .sort((a, b) => b.count - a.count)
})

// ตัวเลขที่ออกบ่อย/น้อย
const hotDigits = computed(() => digitFrequency.value.slice(0, 5))
const coldDigits = computed(() => digitFrequency.value.slice(-5).reverse())

// วิเคราะห์ความถี่ของเลข 3 ตัว
const numberFrequency = computed(() => {
  const freq: Record<string, number> = {}

  lotteryResults.value.forEach((result) => {
    const num = result.threeDigit
    freq[num] = (freq[num] || 0) + 1
  })

  return Object.entries(freq)
    .map(([number, count]) => ({ number, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
})

// วิเคราะห์เลข 2 ตัว
const twoDigitFrequency = computed(() => {
  const freq: Record<string, number> = {}

  lotteryResults.value.forEach((result) => {
    if (result.twoDigit) {
      const num = result.twoDigit
      freq[num] = (freq[num] || 0) + 1
    }
  })

  return Object.entries(freq)
    .map(([number, count]) => ({ number, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
})

// วิเคราะห์คู่/คี่
const oddEvenStats = computed(() => {
  let oddCount = 0
  let evenCount = 0

  lotteryResults.value.forEach((result) => {
    const lastDigit = parseInt(result.threeDigit.slice(-1))
    if (lastDigit % 2 === 0) {
      evenCount++
    } else {
      oddCount++
    }
  })

  const total = oddCount + evenCount
  return {
    odd: { count: oddCount, percent: total > 0 ? (oddCount / total) * 100 : 0 },
    even: { count: evenCount, percent: total > 0 ? (evenCount / total) * 100 : 0 },
  }
})

// วิเคราะห์เลขสูง/ต่ำ
const highLowStats = computed(() => {
  let highCount = 0 // 500-999
  let midCount = 0 // 250-499
  let lowCount = 0 // 000-249

  lotteryResults.value.forEach((result) => {
    const num = parseInt(result.threeDigit)
    if (num >= 500) {
      highCount++
    } else if (num >= 250) {
      midCount++
    } else {
      lowCount++
    }
  })

  const total = highCount + midCount + lowCount
  return {
    high: { count: highCount, percent: total > 0 ? (highCount / total) * 100 : 0 },
    mid: { count: midCount, percent: total > 0 ? (midCount / total) * 100 : 0 },
    low: { count: lowCount, percent: total > 0 ? (lowCount / total) * 100 : 0 },
  }
})

// วิเคราะห์เลขกลับกัน (Mirror Numbers) 🪞
const mirrorAnalysis = computed(() => {
  const history = lotteryResults.value.map(r => r.threeDigit)
  const mirrorScores = analyzeMirrorNumbers(history)

  return Object.entries(mirrorScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([number, score]) => ({ number, score: Math.round(score) }))
})

// วิเคราะห์เลขซ้ำ (Repeating Numbers) 🔁
const repeatingAnalysis = computed(() => {
  const history = lotteryResults.value.map(r => r.threeDigit)
  const repeatingData = analyzeRepeatingNumbers(history)

  return Object.entries(repeatingData.frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([number, score]) => ({ number, score: Math.round(score) }))
})

// วิเคราะห์ชุด 3 ตัวเลข (Triple Analysis) 🎯
const tripleAnalysis = computed(() => {
  const history = lotteryResults.value.map(r => r.threeDigit)
  const tripleScores = analyzeTriples(history)

  return Object.entries(tripleScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([sortedDigits, score]) => ({ sortedDigits, score: Math.round(score) }))
})

// คำนวณค่า max สำหรับ scale bar chart
const maxFrequency = computed(() => {
  if (digitFrequency.value.length === 0) return 0
  return Math.max(...digitFrequency.value.map((d) => d.count))
})

const maxNumberFrequency = computed(() => {
  if (numberFrequency.value.length === 0) return 0
  return Math.max(...numberFrequency.value.map((n) => n.count))
})

// Mount
onMounted(async () => {
  const currentUser = await waitForAuth()
  if (!currentUser) {
    await router.push('/login')
    return
  }

  await loadData()
})
</script>

<template>
  <NuxtLayout name="main">
    <div class="max-w-6xl mx-auto space-y-6">
      <!-- Header -->
      <div class="text-center">
        <h1 class="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          📊 สถิติและกราฟ - 9 สูตรวิเคราะห์
        </h1>
        <p class="text-gray-600 dark:text-gray-300 mt-2">วิเคราะห์สถิติหวยแบบละเอียด {{ displayLimit }} งวดย้อนหลัง</p>
        <div class="mt-3 flex flex-wrap justify-center gap-2 text-sm">
          <span class="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">🔥 Hot/Cold</span>
          <span class="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">📈 Gap Analysis</span>
          <span class="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">🔗 Pairs</span>
          <span class="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full">🪞 Mirror</span>
          <span class="px-3 py-1 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 rounded-full">🔁 Repeating</span>
          <span class="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full">🎯 Triple</span>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="text-center py-12">
        <div class="text-2xl">⏳</div>
        <div class="text-gray-500 dark:text-gray-400 mt-2">กำลังโหลดข้อมูล...</div>
      </div>

      <template v-else>
        <!-- ความถี่ตัวเลข 0-9 (Bar Chart) -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h2 class="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">📈 ความถี่ตัวเลข 0-9</h2>
          <div class="space-y-3">
            <div v-for="item in digitFrequency" :key="item.digit" class="space-y-1">
              <div class="flex items-center justify-between text-sm">
                <span class="font-bold text-gray-700 dark:text-gray-200 w-8">{{ item.digit }}</span>
                <span class="text-gray-600 dark:text-gray-300">{{ item.count }} ครั้ง</span>
              </div>
              <div class="bg-gray-200 dark:bg-gray-700 rounded-full h-6 overflow-hidden">
                <div
                  class="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full flex items-center justify-end px-2"
                  :style="{ width: `${maxFrequency > 0 ? (item.count / maxFrequency) * 100 : 0}%` }"
                >
                  <span class="text-white text-xs font-semibold">{{ item.count }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Hot & Cold Numbers -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Hot Digits -->
          <div class="bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl shadow-lg p-6">
            <h2 class="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">🔥 ตัวเลขร้อนแรง (ออกบ่อย)</h2>
            <div class="space-y-3">
              <div
                v-for="(item, index) in hotDigits"
                :key="item.digit"
                class="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl p-4"
              >
                <div class="flex items-center gap-3">
                  <span class="text-2xl">{{ index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅' }}</span>
                  <span class="text-3xl font-bold text-red-600">{{ item.digit }}</span>
                </div>
                <span class="text-lg font-semibold text-gray-700 dark:text-gray-200">{{ item.count }} ครั้ง</span>
              </div>
            </div>
          </div>

          <!-- Cold Digits -->
          <div class="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl shadow-lg p-6">
            <h2 class="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">❄️ ตัวเลขเย็นชา (ออกน้อย)</h2>
            <div class="space-y-3">
              <div
                v-for="item in coldDigits"
                :key="item.digit"
                class="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl p-4"
              >
                <div class="flex items-center gap-3">
                  <span class="text-2xl">❄️</span>
                  <span class="text-3xl font-bold text-blue-600">{{ item.digit }}</span>
                </div>
                <span class="text-lg font-semibold text-gray-700 dark:text-gray-200">{{ item.count }} ครั้ง</span>
              </div>
            </div>
          </div>
        </div>

        <!-- เลข 3 ตัวที่ออกบ่อย -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h2 class="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">🎯 เลข 3 ตัวที่ออกบ่อยสุด</h2>
          <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div
              v-for="item in numberFrequency"
              :key="item.number"
              class="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-700 dark:to-gray-600 rounded-xl p-4 text-center"
            >
              <div class="text-3xl font-bold text-purple-600 mb-1">{{ item.number }}</div>
              <div class="text-sm text-gray-600 dark:text-gray-300">{{ item.count }} ครั้ง</div>
            </div>
          </div>
        </div>

        <!-- เลข 2 ตัวที่ออกบ่อย -->
        <div v-if="twoDigitFrequency.length > 0" class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h2 class="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">🎲 เลข 2 ตัวที่ออกบ่อยสุด</h2>
          <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div
              v-for="item in twoDigitFrequency"
              :key="item.number"
              class="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-700 dark:to-gray-600 rounded-xl p-4 text-center"
            >
              <div class="text-3xl font-bold text-green-600 mb-1">{{ item.number }}</div>
              <div class="text-sm text-gray-600 dark:text-gray-300">{{ item.count }} ครั้ง</div>
            </div>
          </div>
        </div>

        <!-- Pattern Analysis -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- คู่/คี่ -->
          <div class="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl shadow-lg p-6">
            <h2 class="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">🔢 วิเคราะห์คู่/คี่ (ตัวหลัง)</h2>

            <div class="space-y-4">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <span class="font-semibold text-gray-700 dark:text-gray-200">เลขคี่</span>
                  <span class="text-sm text-gray-600 dark:text-gray-300">{{ oddEvenStats.odd.count }} ครั้ง ({{ oddEvenStats.odd.percent.toFixed(1) }}%)</span>
                </div>
                <div class="bg-gray-200 dark:bg-gray-700 rounded-full h-8 overflow-hidden">
                  <div
                    class="bg-gradient-to-r from-yellow-500 to-orange-500 h-full rounded-full flex items-center justify-center"
                    :style="{ width: `${oddEvenStats.odd.percent}%` }"
                  >
                    <span class="text-white font-bold text-sm">{{ oddEvenStats.odd.percent.toFixed(1) }}%</span>
                  </div>
                </div>
              </div>

              <div>
                <div class="flex items-center justify-between mb-2">
                  <span class="font-semibold text-gray-700 dark:text-gray-200">เลขคู่</span>
                  <span class="text-sm text-gray-600 dark:text-gray-300">{{ oddEvenStats.even.count }} ครั้ง ({{ oddEvenStats.even.percent.toFixed(1) }}%)</span>
                </div>
                <div class="bg-gray-200 dark:bg-gray-700 rounded-full h-8 overflow-hidden">
                  <div
                    class="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full flex items-center justify-center"
                    :style="{ width: `${oddEvenStats.even.percent}%` }"
                  >
                    <span class="text-white font-bold text-sm">{{ oddEvenStats.even.percent.toFixed(1) }}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- สูง/กลาง/ต่ำ -->
          <div class="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl shadow-lg p-6">
            <h2 class="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">📊 วิเคราะห์เลขสูง/กลาง/ต่ำ</h2>

            <div class="space-y-4">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <span class="font-semibold text-gray-700 dark:text-gray-200">สูง (500-999)</span>
                  <span class="text-sm text-gray-600 dark:text-gray-300">{{ highLowStats.high.count }} ครั้ง ({{ highLowStats.high.percent.toFixed(1) }}%)</span>
                </div>
                <div class="bg-gray-200 dark:bg-gray-700 rounded-full h-6 overflow-hidden">
                  <div
                    class="bg-gradient-to-r from-red-500 to-pink-500 h-full rounded-full"
                    :style="{ width: `${highLowStats.high.percent}%` }"
                  ></div>
                </div>
              </div>

              <div>
                <div class="flex items-center justify-between mb-2">
                  <span class="font-semibold text-gray-700 dark:text-gray-200">กลาง (250-499)</span>
                  <span class="text-sm text-gray-600 dark:text-gray-300">{{ highLowStats.mid.count }} ครั้ง ({{ highLowStats.mid.percent.toFixed(1) }}%)</span>
                </div>
                <div class="bg-gray-200 dark:bg-gray-700 rounded-full h-6 overflow-hidden">
                  <div
                    class="bg-gradient-to-r from-yellow-500 to-orange-500 h-full rounded-full"
                    :style="{ width: `${highLowStats.mid.percent}%` }"
                  ></div>
                </div>
              </div>

              <div>
                <div class="flex items-center justify-between mb-2">
                  <span class="font-semibold text-gray-700 dark:text-gray-200">ต่ำ (000-249)</span>
                  <span class="text-sm text-gray-600 dark:text-gray-300">{{ highLowStats.low.count }} ครั้ง ({{ highLowStats.low.percent.toFixed(1) }}%)</span>
                </div>
                <div class="bg-gray-200 dark:bg-gray-700 rounded-full h-6 overflow-hidden">
                  <div
                    class="bg-gradient-to-r from-blue-500 to-cyan-500 h-full rounded-full"
                    :style="{ width: `${highLowStats.low.percent}%` }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- สูตรใหม่: Mirror Numbers 🪞 -->
        <div v-if="mirrorAnalysis.length > 0" class="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl shadow-lg p-6">
          <h2 class="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">🪞 เลขกลับกัน (Mirror Numbers)</h2>
          <p class="text-sm text-gray-600 dark:text-gray-300 mb-4">เลขที่มีแนวโน้มออกเป็นเลขกลับกัน เช่น 123 → 321</p>
          <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div
              v-for="item in mirrorAnalysis"
              :key="item.number"
              class="bg-white dark:bg-gray-800 rounded-xl p-4 text-center"
            >
              <div class="text-3xl font-bold text-indigo-600 mb-1">{{ item.number }}</div>
              <div class="text-xs text-gray-500 dark:text-gray-400">Score: {{ item.score }}</div>
            </div>
          </div>
        </div>

        <!-- สูตรใหม่: Repeating Numbers 🔁 -->
        <div v-if="repeatingAnalysis.length > 0" class="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl shadow-lg p-6">
          <h2 class="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">🔁 เลขซ้ำ (Repeating Numbers)</h2>
          <p class="text-sm text-gray-600 dark:text-gray-300 mb-4">เลขที่มีตัวเลขซ้ำกัน เช่น 111, 222, 112, 223</p>
          <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div
              v-for="item in repeatingAnalysis"
              :key="item.number"
              class="bg-white dark:bg-gray-800 rounded-xl p-4 text-center"
            >
              <div class="text-3xl font-bold text-teal-600 mb-1">{{ item.number }}</div>
              <div class="text-xs text-gray-500 dark:text-gray-400">Score: {{ item.score }}</div>
            </div>
          </div>
        </div>

        <!-- สูตรใหม่: Triple Analysis 🎯 -->
        <div v-if="tripleAnalysis.length > 0" class="bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl shadow-lg p-6">
          <h2 class="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">🎯 ชุด 3 ตัวเลข (Triple Analysis)</h2>
          <p class="text-sm text-gray-600 dark:text-gray-300 mb-4">ชุดตัวเลข 3 ตัวที่มักออกด้วยกัน (ไม่สนใจลำดับ)</p>
          <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div
              v-for="item in tripleAnalysis"
              :key="item.sortedDigits"
              class="bg-white dark:bg-gray-800 rounded-xl p-4 text-center"
            >
              <div class="text-3xl font-bold text-orange-600 mb-1">{{ item.sortedDigits }}</div>
              <div class="text-xs text-gray-500 dark:text-gray-400">Score: {{ item.score }}</div>
            </div>
          </div>
        </div>

        <!-- ผลหวยย้อนหลัง -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h2 class="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">📋 ผลหวย {{ Math.min(10, lotteryResults.length) }} งวดย้อนหลัง</h2>
          <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div
              v-for="(result, index) in lotteryResults.slice(0, 10)"
              :key="index"
              class="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 text-center"
            >
              <div class="text-2xl font-bold text-blue-600">{{ result.threeDigit }}</div>
              <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ result.date }}</div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </NuxtLayout>
</template>
