<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useVipResult } from '../composables/useVipResult'
import { useLotteryType } from '../composables/useLotteryType'
import { useEngineSettings } from '../composables/useEngineSettings'
import { usePatternRecognition } from '../composables/usePatternRecognition'
import { useAccuracyTracking } from '../composables/useAccuracyTracking'

const router = useRouter()
const { waitForAuth } = useAuth()

const history = ref<string[]>([])

const { hotNumbers, twoDigits, threeDigits, lotteryType, calculatedAt, loadResult } = useVipResult()
const { selectedLotteryType } = useLotteryType()
const { settings } = useEngineSettings()
const { accuracyStats } = useAccuracyTracking()

// สร้าง storage key แบบ dynamic ตามประเภทหวย
const getStorageKey = (lotteryId: string) => `vip_lao_history_${lotteryId}`

// โหลดข้อมูลตามประเภทหวย
const loadDataForLotteryType = (lotteryId: string) => {
  // โหลด history สำหรับประเภทหวยนี้
  const storageKey = getStorageKey(lotteryId)
  const saved = localStorage.getItem(storageKey)
  if (saved) {
    history.value = JSON.parse(saved)
  } else {
    history.value = []
  }

  // โหลดผลลัพธ์การคำนวณสำหรับประเภทหวยนี้
  loadResult(lotteryId)
}

onMounted(async () => {
  // ตรวจสอบ authentication ก่อน
  const currentUser = await waitForAuth()
  if (!currentUser) {
    // ถ้ายังไม่ได้ login ให้ไปหน้า login
    await router.push('/login')
    return
  }

  // โหลดข้อมูลสำหรับประเภทหวยที่เลือกอยู่
  loadDataForLotteryType(selectedLotteryType.value.id)
})

// Watch lottery type changes
watch(() => selectedLotteryType.value.id, (newType) => {
  loadDataForLotteryType(newType)
})

const todayStr = computed(() => {
  const now = new Date()
  return now.toLocaleDateString('th-TH')
})

// ใช้ Pattern Recognition สำหรับคำนวณ confidence
const { calculateOverallConfidence } = usePatternRecognition(history.value)

// คำนวณ confidence สำหรับ Hot Numbers
const hotNumbersWithConfidence = computed(() => {
  return hotNumbers.value.map(num => ({
    number: num,
    confidence: calculateOverallConfidence([String(num)])
  }))
})

// คำนวณ confidence สำหรับ 3 ตัว
const threeDigitsWithConfidence = computed(() => {
  return threeDigits.value.map(num => ({
    number: num,
    confidence: calculateOverallConfidence([num])
  }))
})

// คำนวณ confidence สำหรับ 2 ตัว
const twoDigitsWithConfidence = computed(() => {
  return twoDigits.value.map(num => ({
    number: num,
    confidence: calculateOverallConfidence([num])
  }))
})

// ฟังก์ชันกำหนดสีตาม confidence level
const getConfidenceColor = (confidence: number) => {
  if (confidence >= 80) return 'from-green-500 to-green-600'
  if (confidence >= 60) return 'from-yellow-500 to-yellow-600'
  return 'from-gray-400 to-gray-500'
}

const getConfidenceBarColor = (confidence: number) => {
  if (confidence >= 80) return 'bg-green-500'
  if (confidence >= 60) return 'bg-yellow-500'
  return 'bg-gray-400'
}
</script>

<template>
  <NuxtLayout name="main">
    <div class="max-w-2xl mx-auto">
      <!-- Lottery Type & Date Header -->
      <div class="text-center mb-6">
        <h1 class="text-2xl font-bold text-gray-800 mb-2">
          เลือกประเภทหวย แล้วใส่เลข 3-6 หลัก
        </h1>
        <p class="text-sm text-gray-600">
          {{ selectedLotteryType.displayName }} · {{ todayStr }}
        </p>
        <div class="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm text-xs text-gray-600">
          <span>Engine: <strong>{{ settings.calculationMode }}</strong></span>
          <span>·</span>
          <span>Level: <strong class="text-green-600">{{ settings.accuracyLevel }}/10</strong></span>
        </div>
        <div v-if="accuracyStats.total > 0" class="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-50 to-pink-50 rounded-full shadow-sm text-xs">
          <span class="text-purple-700">ความแม่นโดยรวม: <strong>{{ accuracyStats.accuracy }}%</strong></span>
        </div>
      </div>

      <!-- Results Display -->
      <div v-if="hotNumbers.length" class="space-y-4">
        <!-- Hot Numbers -->
        <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 shadow-lg">
          <div class="flex items-center gap-2 mb-4">
            <span class="text-2xl">🔥</span>
            <h2 class="text-lg font-bold text-green-800">เลขเด่น (Hot Numbers)</h2>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              v-for="item in hotNumbersWithConfidence"
              :key="item.number"
              class="bg-white/70 rounded-xl p-4 shadow-md"
            >
              <div class="flex items-center justify-between mb-2">
                <span
                  class="px-6 py-2 bg-gradient-to-r text-white rounded-full font-bold text-2xl shadow-lg"
                  :class="getConfidenceColor(item.confidence)"
                >
                  {{ item.number }}
                </span>
                <span class="text-sm font-bold" :class="item.confidence >= 80 ? 'text-green-600' : item.confidence >= 60 ? 'text-yellow-600' : 'text-gray-600'">
                  {{ item.confidence }}%
                </span>
              </div>
              <div class="flex items-center gap-2">
                <div class="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    class="h-full rounded-full transition-all"
                    :class="getConfidenceBarColor(item.confidence)"
                    :style="{ width: `${item.confidence}%` }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 3-Digit Numbers -->
        <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 shadow-lg">
          <div class="flex items-center gap-2 mb-4">
            <span class="text-2xl">🎲</span>
            <h2 class="text-lg font-bold text-blue-800">เลข 3 ตัว</h2>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div
              v-for="item in threeDigitsWithConfidence"
              :key="item.number"
              class="bg-white/70 rounded-xl p-3 shadow-md flex items-center justify-between"
            >
              <span
                class="px-5 py-2 bg-gradient-to-r text-white rounded-xl font-bold text-lg shadow-md"
                :class="getConfidenceColor(item.confidence)"
              >
                {{ item.number }}
              </span>
              <div class="flex items-center gap-2 flex-1 ml-3">
                <div class="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    class="h-full rounded-full transition-all"
                    :class="getConfidenceBarColor(item.confidence)"
                    :style="{ width: `${item.confidence}%` }"
                  ></div>
                </div>
                <span class="text-xs font-bold min-w-[40px] text-right" :class="item.confidence >= 80 ? 'text-green-600' : item.confidence >= 60 ? 'text-yellow-600' : 'text-gray-600'">
                  {{ item.confidence }}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 2-Digit Numbers -->
        <div class="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-6 shadow-lg">
          <div class="flex items-center gap-2 mb-4">
            <span class="text-2xl">🎯</span>
            <h2 class="text-lg font-bold text-yellow-800">ชุด 2 ตัว</h2>
          </div>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div
              v-for="item in twoDigitsWithConfidence"
              :key="item.number"
              class="bg-white/70 rounded-xl p-3 shadow-md"
            >
              <div class="flex items-center justify-between mb-2">
                <span
                  class="px-4 py-1 bg-gradient-to-r text-white rounded-lg font-bold text-lg shadow-md"
                  :class="getConfidenceColor(item.confidence)"
                >
                  {{ item.number }}
                </span>
                <span class="text-xs font-bold" :class="item.confidence >= 80 ? 'text-green-600' : item.confidence >= 60 ? 'text-yellow-600' : 'text-gray-600'">
                  {{ item.confidence }}%
                </span>
              </div>
              <div class="flex items-center gap-2">
                <div class="flex-1 bg-gray-200 rounded-full h-1.5">
                  <div
                    class="h-full rounded-full transition-all"
                    :class="getConfidenceBarColor(item.confidence)"
                    :style="{ width: `${item.confidence}%` }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Confidence Legend -->
        <div class="bg-white/90 rounded-2xl p-4 shadow-lg">
          <h3 class="text-sm font-bold text-gray-700 mb-3 text-center">คำอธิบายความมั่นใจ (Confidence Score)</h3>
          <div class="grid grid-cols-3 gap-3 text-xs">
            <div class="text-center">
              <div class="flex items-center justify-center gap-2 mb-1">
                <div class="w-3 h-3 rounded-full bg-green-500"></div>
                <span class="font-bold text-green-600">≥ 80%</span>
              </div>
              <p class="text-gray-600">มั่นใจสูง</p>
            </div>
            <div class="text-center">
              <div class="flex items-center justify-center gap-2 mb-1">
                <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span class="font-bold text-yellow-600">60-79%</span>
              </div>
              <p class="text-gray-600">มั่นใจปานกลาง</p>
            </div>
            <div class="text-center">
              <div class="flex items-center justify-center gap-2 mb-1">
                <div class="w-3 h-3 rounded-full bg-gray-400"></div>
                <span class="font-bold text-gray-600">&lt; 60%</span>
              </div>
              <p class="text-gray-600">มั่นใจต่ำ</p>
            </div>
          </div>
        </div>

        <!-- Calculation Info -->
        <div v-if="calculatedAt" class="text-center text-xs text-gray-500">
          คำนวณล่าสุด: {{ calculatedAt }}
        </div>

        <!-- Buy Numbers CTA -->
        <div class="mt-8 p-6 bg-gradient-to-br from-red-500 via-pink-500 to-purple-600 rounded-2xl shadow-2xl">
          <div class="text-center mb-4">
            <h3 class="text-2xl font-black text-white mb-2 drop-shadow-lg">
              🎰 พร้อมลุ้นรางวัลใหญ่?
            </h3>
            <p class="text-white/90 text-sm font-semibold">
              สมัครซื้อเลขออนไลน์ได้แล้ววันนี้!
            </p>
          </div>

          <a
            href="https://af1.racha-lottoaf.com/?openExternalBrowser=1#/register?af=f8b877b2-23c2-3382-b460-3599780c1bc9"
            target="_blank"
            rel="noopener noreferrer"
            class="block w-full py-4 px-6 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-900 font-black text-xl rounded-xl shadow-2xl transform transition-all hover:scale-105 active:scale-95 text-center"
            style="animation: pulse-button 2s ease-in-out infinite;"
          >
            <span class="mr-2">🚀</span>
            คลิกสมัครซื้อเลขที่นี่
            <span class="ml-2">💰</span>
          </a>

          <div class="mt-4 flex items-center justify-center gap-2 text-white/80 text-xs">
            <span>✅</span>
            <span>ปลอดภัย | รวดเร็ว | ถอนง่าย</span>
          </div>
        </div>
      </div>

      <!-- No Results -->
      <div v-else class="text-center py-12">
        <div class="text-6xl mb-4">🎲</div>
        <h3 class="text-xl font-bold text-gray-700 mb-2">ยังไม่มีผลการคำนวณ</h3>
        <p class="text-gray-500 mb-6">ไปที่หน้า "ใส่เลขเอง" เพื่อเริ่มคำนวณเลขหวย</p>
        <NuxtLink
          to="/manual"
          class="inline-block px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold shadow-lg hover:from-green-600 hover:to-green-700 transition"
        >
          ✏️ ไปใส่เลขเอง
        </NuxtLink>
      </div>
    </div>
  </NuxtLayout>
</template>
