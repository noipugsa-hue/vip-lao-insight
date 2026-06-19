<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useLotteryType } from '../composables/useLotteryType'
import { usePrecisionFormula, type PrecisionResult } from '../composables/usePrecisionFormula'
import { useAccuracyTracking } from '../composables/useAccuracyTracking'
import PrecisionModeResults from '../components/PrecisionModeResults.vue'

const router = useRouter()
const { waitForAuth, user } = useAuth()
const { selectedLotteryType, setLotteryType } = useLotteryType()
const { calculatePrecision } = usePrecisionFormula()
const { addPrediction } = useAccuracyTracking()

// State
const showLotterySelector = ref(false)
const history = ref<string[]>([])
const input = ref('')
const precisionResult = ref<PrecisionResult | null>(null)
const loading = ref(false)
const showInputSection = ref(true)

// Load history from localStorage
const loadHistory = () => {
  const key = `vip_lao_history_${selectedLotteryType.value.id}`
  const saved = localStorage.getItem(key)
  if (saved) {
    try {
      history.value = JSON.parse(saved)
    } catch (e) {
      console.error('Failed to load history', e)
      history.value = []
    }
  } else {
    history.value = []
  }
}

// Save history to localStorage
const saveHistory = () => {
  const key = `vip_lao_history_${selectedLotteryType.value.id}`
  localStorage.setItem(key, JSON.stringify(history.value))
}

// Add history number
const addHistory = () => {
  const trimmed = input.value.trim()
  if (!trimmed) return

  // Validate input (ต้องเป็นตัวเลข 3-6 หลัก)
  if (!/^\d{3,6}$/.test(trimmed)) {
    alert('กรุณากรอกตัวเลข 3-6 หลักเท่านั้น')
    return
  }

  // เพิ่มเข้า history (เติม 0 ข้างหน้าถ้าน้อยกว่า 3 หลัก)
  const number = trimmed.padStart(3, '0')

  // ป้องกันเลขซ้ำ
  if (history.value.includes(number)) {
    alert('เลขนี้มีอยู่ในประวัติแล้ว')
    return
  }

  history.value.unshift(number) // เพิ่มที่หัว list
  input.value = ''
  saveHistory()
}

// Remove history item
const removeHistory = (index: number) => {
  history.value.splice(index, 1)
  saveHistory()
}

// Clear all history
const clearHistory = () => {
  if (confirm('ยืนยันการลบข้อมูลทั้งหมด?')) {
    history.value = []
    precisionResult.value = null
    saveHistory()
  }
}

// Calculate precision
const calculate = () => {
  if (history.value.length < 3) {
    alert('กรุณากรอกเลขอย่างน้อย 3 งวด')
    return
  }

  loading.value = true

  setTimeout(() => {
    const result = calculatePrecision(history.value)
    precisionResult.value = result

    // Save to accuracy tracking
    result.hotNumbers.forEach(item => {
      addPrediction({
        number: item.number,
        confidence: item.confidence,
        lotteryType: selectedLotteryType.value.id,
        predictedAt: new Date().toISOString()
      })
    })

    result.twoDigits.forEach(item => {
      addPrediction({
        number: item.number,
        confidence: item.confidence,
        lotteryType: selectedLotteryType.value.id,
        predictedAt: new Date().toISOString()
      })
    })

    result.threeDigits.forEach(item => {
      addPrediction({
        number: item.number,
        confidence: item.confidence,
        lotteryType: selectedLotteryType.value.id,
        predictedAt: new Date().toISOString()
      })
    })

    loading.value = false
  }, 500)
}

// Watch lottery type change
watch(selectedLotteryType, () => {
  loadHistory()
  precisionResult.value = null
})

// Today string
const todayStr = computed(() => {
  return new Date().toLocaleDateString('th-TH')
})

onMounted(async () => {
  const currentUser = await waitForAuth()
  if (!currentUser) {
    await router.push('/login')
    return
  }

  loadHistory()
})
</script>

<template>
  <NuxtLayout name="main">
    <!-- Lottery Type Selector Modal -->
    <LotteryTypeSelector
      :show="showLotterySelector"
      @close="showLotterySelector = false"
    />

    <div class="min-h-screen p-4 md:p-6 space-y-6">
      <!-- Header -->
      <div class="relative group">
        <div class="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-3xl opacity-75 group-hover:opacity-100 transition duration-300 blur-xl"></div>

        <div class="relative bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-2xl">
          <div class="flex items-center justify-between flex-wrap gap-4">
            <div class="flex items-center gap-4">
              <div class="w-16 h-16 bg-gradient-to-br from-purple-500 via-pink-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span class="text-4xl">🎯</span>
              </div>
              <div>
                <h1 class="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600">
                  Precision Mode
                </h1>
                <p class="text-sm text-gray-600 dark:text-gray-400 font-semibold">
                  🔬 เลขน้อยแต่แม่น · เน้นคุณภาพมากกว่าปริมาณ
                </p>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex items-center gap-3">
              <button
                @click="showLotterySelector = true"
                class="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transform transition-all hover:scale-105"
              >
                <span class="text-lg mr-2">🎲</span>
                {{ selectedLotteryType.displayName }}
              </button>

              <button
                @click="router.push('/home')"
                class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl font-bold shadow-md hover:shadow-lg transform transition-all hover:scale-105"
              >
                <span class="text-lg mr-2">↩️</span>
                โหมดปกติ
              </button>
            </div>
          </div>

          <!-- Info Banner -->
          <div class="mt-6 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-2xl p-4 border-2 border-purple-300 dark:border-purple-700">
            <div class="flex items-start gap-3">
              <span class="text-2xl">💡</span>
              <div class="flex-1 text-sm text-purple-700 dark:text-purple-300">
                <p class="font-bold mb-1">Precision Mode คืออะไร?</p>
                <p>โหมดนี้ใช้อัลกอริทึมแม่นยำสูง คำนวณเฉพาะเลขที่มีโอกาสออกสูงสุด (Confidence > 70%) จำกัด 3-5 ชุดเท่านั้น พร้อมแสดงเหตุผลและ % โอกาสชัดเจน</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Input Section -->
      <div class="relative group">
        <button
          @click="showInputSection = !showInputSection"
          class="w-full mb-4 px-6 py-4 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 hover:from-purple-600 hover:via-pink-600 hover:to-blue-600 text-white rounded-2xl font-black text-lg shadow-xl hover:shadow-2xl transform transition-all hover:scale-105 active:scale-95 flex items-center justify-between"
        >
          <span class="flex items-center gap-3">
            <span class="text-2xl">{{ showInputSection ? '🔽' : '▶️' }}</span>
            <span>ใส่เลขย้อนหลัง</span>
          </span>
          <span class="px-3 py-1 bg-white/20 rounded-full text-sm">{{ history.length }} งวด</span>
        </button>

        <div v-if="showInputSection" class="relative">
          <div class="absolute -inset-0.5 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-3xl opacity-75 transition duration-300 blur-sm"></div>

          <div class="relative bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-2xl">
            <h2 class="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-4">
              📊 ใส่เลขย้อนหลัง (อย่างน้อย 3 งวด)
            </h2>

            <!-- Input + Add Button -->
            <div class="flex gap-3 mb-4">
              <input
                v-model="input"
                type="text"
                inputmode="numeric"
                pattern="[0-9]*"
                maxlength="6"
                placeholder="เลข 3-6 หลัก"
                @keyup.enter="addHistory"
                class="flex-1 px-4 py-4 border-2 border-purple-200 dark:border-purple-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-purple-500/50 focus:border-purple-500 transition-all text-center text-2xl font-bold"
              />
              <button
                @click="addHistory"
                :disabled="!input.trim()"
                class="px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transform transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span class="text-xl">➕</span>
              </button>
            </div>

            <!-- History List -->
            <div v-if="history.length > 0" class="mb-4">
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">เลขย้อนหลัง {{ history.length }} งวด:</p>
              <div class="max-h-60 overflow-y-auto space-y-2 pr-2">
                <div
                  v-for="(num, index) in history"
                  :key="index"
                  class="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 rounded-xl px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <span class="font-mono text-2xl font-bold text-purple-600 dark:text-purple-400">{{ num }}</span>
                  <button
                    @click="removeHistory(index)"
                    class="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-bold transition-colors"
                  >
                    ลบ
                  </button>
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-3">
              <button
                @click="calculate"
                :disabled="history.length < 3 || loading"
                class="flex-1 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-black text-lg shadow-lg hover:shadow-xl transform transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span v-if="loading">⏳ กำลังคำนวณ...</span>
                <span v-else>🎯 คำนวณแบบแม่นยำสูง</span>
              </button>

              <button
                @click="clearHistory"
                :disabled="history.length === 0"
                class="px-6 py-4 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transform transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🗑️
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Results Section -->
      <div v-if="precisionResult && precisionResult.hotNumbers.length > 0">
        <PrecisionModeResults :result="precisionResult" />
      </div>

      <!-- Empty State -->
      <div v-else-if="!precisionResult || precisionResult.hotNumbers.length === 0" class="text-center py-12">
        <div class="inline-block">
          <div class="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center mb-6 shadow-xl">
            <span class="text-6xl">🎯</span>
          </div>
          <h3 class="text-2xl font-black text-gray-900 dark:text-white mb-2">
            พร้อมคำนวณเลขแม่นยำสูง
          </h3>
          <p class="text-gray-600 dark:text-gray-400 mb-6">
            ใส่เลขย้อนหลังอย่างน้อย 3 งวด แล้วกดคำนวณ
          </p>
          <div class="inline-flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <div class="flex items-center gap-2">
              <span class="text-lg">✓</span>
              <span>เลขน้อย</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-lg">✓</span>
              <span>แม่นสูง</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-lg">✓</span>
              <span>แสดง %</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>

<style scoped>
/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

::-webkit-scrollbar-thumb {
  background: #a855f7;
  border-radius: 10px;
}

::-webkit-scrollbar-thumb:hover {
  background: #9333ea;
}

.dark ::-webkit-scrollbar-track {
  background: #374151;
}

.dark ::-webkit-scrollbar-thumb {
  background: #9333ea;
}

.dark ::-webkit-scrollbar-thumb:hover {
  background: #7e22ce;
}
</style>
