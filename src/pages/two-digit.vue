<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useTwoDigitPrediction } from '../composables/useTwoDigitPrediction'
import { useLotteryType } from '../composables/useLotteryType'

const { selectedLotteryType } = useLotteryType()
const showLotterySelector = ref(false)

const history = ref<string[]>([])
const input = ref('')
const showSuccess = ref(false)
const predictions = ref<any>(null)

const {
  analyzeFrequency,
  getHotNumbers,
  getColdNumbers,
  analyzePattern,
  predictNextNumbers
} = useTwoDigitPrediction()

// สร้าง storage key แบบ dynamic ตามประเภทหวย
const getStorageKey = (lotteryId: string) => `two_digit_history_${lotteryId}`

// โหลดข้อมูลที่เคยเพิ่มไว้
onMounted(() => {
  const storageKey = getStorageKey(selectedLotteryType.value.id)
  const saved = localStorage.getItem(storageKey)
  if (saved) {
    history.value = JSON.parse(saved)
    // ถ้ามีข้อมูล ให้คำนวณทันที
    if (history.value.length >= 3) {
      calculatePrediction()
    }
  }
})

// บันทึกทุกครั้งที่ history เปลี่ยน
watch(history, (val) => {
  const storageKey = getStorageKey(selectedLotteryType.value.id)
  localStorage.setItem(storageKey, JSON.stringify(val))
}, { deep: true })

// เคลียร์ข้อมูลเมื่อเปลี่ยนประเภทหวย
watch(() => selectedLotteryType.value.id, (newType, oldType) => {
  if (oldType && newType !== oldType) {
    history.value = []
    predictions.value = null

    const storageKey = getStorageKey(newType)
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      history.value = JSON.parse(saved)
      if (history.value.length >= 3) {
        calculatePrediction()
      }
    }

    console.log(`เปลี่ยนจาก ${oldType} เป็น ${newType}`)
  }
})

const addHistory = () => {
  const value = input.value.trim()
  if (!/^\d{2}$/.test(value)) {
    alert('ใส่เลข 2 ตัวเท่านั้น (00-99)')
    return
  }
  history.value.unshift(value)
  input.value = ''

  // คำนวณทันทีถ้ามีข้อมูลพอ
  if (history.value.length >= 3) {
    calculatePrediction()
  }
}

const calculatePrediction = () => {
  if (history.value.length < 3) {
    alert('กรุณาใส่เลขย้อนหลังอย่างน้อย 3 งวด')
    return
  }

  // ทำนายเลขงวดถัดไป
  predictions.value = predictNextNumbers(history.value, 8)

  // แสดง success message
  showSuccess.value = true
  setTimeout(() => {
    showSuccess.value = false
  }, 2000)
}

const clearHistory = () => {
  if (!confirm('ต้องการล้างเลขย้อนหลังทั้งหมดใช่หรือไม่?')) return
  history.value = []
  predictions.value = null
  const storageKey = getStorageKey(selectedLotteryType.value.id)
  localStorage.removeItem(storageKey)
}

const deleteHistoryItem = (index: number) => {
  history.value.splice(index, 1)
  if (history.value.length >= 3) {
    calculatePrediction()
  } else {
    predictions.value = null
  }
}

// Computed properties
const hotNumbers = computed(() => {
  return history.value.length >= 3 ? getHotNumbers(history.value, 5) : []
})

const coldNumbers = computed(() => {
  return history.value.length >= 3 ? getColdNumbers(history.value, 5) : []
})

const pattern = computed(() => {
  return history.value.length >= 3 ? analyzePattern(history.value) : null
})

// Format confidence level
const confidenceColor = computed(() => {
  if (!predictions.value) return 'gray'
  const conf = predictions.value.confidence
  if (conf >= 70) return 'green'
  if (conf >= 50) return 'yellow'
  return 'orange'
})
</script>

<template>
  <NuxtLayout name="main">
    <!-- Lottery Type Selector Modal -->
    <LotteryTypeSelector
      :show="showLotterySelector"
      @close="showLotterySelector = false"
    />

    <!-- Success Message -->
    <Transition name="fade">
      <div
        v-if="showSuccess"
        class="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-xl font-bold"
      >
        🎯 คำนวณสำเร็จ!
      </div>
    </Transition>

    <div class="max-w-4xl mx-auto">
      <!-- Lottery Type Selector Button -->
      <button
        @click="showLotterySelector = true"
        class="w-full mb-4 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg shadow-lg font-semibold text-lg transition-all flex items-center justify-center gap-2"
      >
        <span class="text-xl">🎲</span>
        <span>{{ selectedLotteryType.displayName }}</span>
        <span class="text-sm opacity-80">(คลิกเพื่อเปลี่ยน)</span>
      </button>

      <!-- Main Container -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <!-- Left: Input & History -->
        <div class="bg-white/90 backdrop-blur rounded-2xl shadow-lg p-6">
          <h1 class="text-2xl font-bold text-gray-800 mb-6 text-center">
            🔢 บันทึกเลข 2 ตัวย้อนหลัง
          </h1>

          <!-- Input + Add Button -->
          <div class="flex gap-2 mb-6">
            <div class="relative flex-1">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-purple-700 text-xl pointer-events-none">🎯</span>
              <input
                v-model="input"
                type="text"
                inputmode="numeric"
                pattern="[0-9]*"
                maxlength="2"
                placeholder="เลข 2 ตัว (00-99)"
                @input="input = input.replace(/\D/g, '')"
                @keyup.enter="addHistory"
                class="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-purple-200 bg-purple-50 text-gray-900 text-lg font-semibold focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
              />
            </div>
            <button
              @click="addHistory"
              class="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold shadow-lg transition transform active:scale-95"
            >
              เพิ่ม
            </button>
          </div>

          <!-- History Display -->
          <div v-if="history.length > 0" class="mb-6">
            <h3 class="text-sm font-semibold text-gray-600 mb-3 flex justify-between items-center">
              <span>เลขย้อนหลัง ({{ history.length }} งวด)</span>
              <button
                @click="clearHistory"
                class="text-xs text-red-600 hover:text-red-700 font-semibold"
              >
                🗑️ ล้างทั้งหมด
              </button>
            </h3>
            <div class="grid grid-cols-4 gap-2 max-h-96 overflow-y-auto">
              <div
                v-for="(h, index) in history"
                :key="index"
                class="relative group px-3 py-3 rounded-xl text-center font-bold text-lg transition-all"
                :class="[
                  index === 0
                    ? 'bg-gradient-to-r from-red-400 to-red-600 text-white shadow-lg animate-pulse'
                    : index === 1
                    ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 shadow-md'
                    : index === 2
                    ? 'bg-gradient-to-r from-blue-400 to-blue-600 text-white shadow'
                    : 'bg-gray-100 text-gray-700'
                ]"
              >
                <button
                  @click="deleteHistoryItem(index)"
                  class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
                <div class="text-[10px] opacity-70 mb-1">
                  {{ index === 0 ? '🔥 ล่าสุด' : index === 1 ? '⭐ รอง' : `งวด ${index + 1}` }}
                </div>
                {{ h }}
              </div>
            </div>
          </div>

          <!-- No History -->
          <div v-else class="text-center py-8 text-gray-400">
            <div class="text-5xl mb-3">📝</div>
            <p>ยังไม่มีเลขย้อนหลัง</p>
            <p class="text-sm">กรอกเลข 2 ตัวแล้วกดเพิ่ม</p>
          </div>

          <!-- Calculate Button -->
          <button
            v-if="history.length >= 3"
            @click="calculatePrediction"
            class="w-full py-4 rounded-xl font-bold text-lg shadow-lg transition transform active:scale-95 bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 text-white"
          >
            🔮 คำนวณทำนายงวดถัดไป
          </button>

          <!-- Info -->
          <div class="mt-6 p-4 bg-blue-50 rounded-xl text-sm text-gray-600">
            <p class="font-semibold mb-2">💡 วิธีใช้งาน:</p>
            <ul class="space-y-1 text-xs">
              <li>1. กรอกเลข 2 ตัวของงวดย้อนหลัง (00-99)</li>
              <li>2. ใส่อย่างน้อย 3 งวด (แนะนำ 10 งวดขึ้นไป)</li>
              <li>3. ระบบจะคำนวณทำนายเลขงวดถัดไปอัตโนมัติ</li>
              <li>4. ยิ่งมีข้อมูลมาก ความแม่นยำยิ่งสูง</li>
            </ul>
          </div>
        </div>

        <!-- Right: Predictions & Analysis -->
        <div class="space-y-4">
          <!-- Predictions -->
          <div v-if="predictions" class="bg-white/90 backdrop-blur rounded-2xl shadow-lg p-6">
            <h2 class="text-xl font-bold text-gray-800 mb-4 flex items-center justify-between">
              <span>🎯 เลขทำนายงวดถัดไป</span>
              <span
                class="text-sm px-3 py-1 rounded-full font-semibold"
                :class="{
                  'bg-green-100 text-green-700': confidenceColor === 'green',
                  'bg-yellow-100 text-yellow-700': confidenceColor === 'yellow',
                  'bg-orange-100 text-orange-700': confidenceColor === 'orange'
                }"
              >
                {{ predictions.confidence }}%
              </span>
            </h2>

            <div v-if="predictions.predictions.length > 0" class="grid grid-cols-4 gap-3 mb-4">
              <div
                v-for="(num, idx) in predictions.predictions"
                :key="idx"
                class="px-4 py-4 rounded-xl text-center font-bold text-2xl transition-all transform hover:scale-105"
                :class="[
                  idx === 0
                    ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-gray-900 shadow-xl'
                    : idx === 1
                    ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-lg'
                    : idx === 2
                    ? 'bg-gradient-to-br from-red-400 to-red-600 text-white shadow-lg'
                    : 'bg-gradient-to-br from-purple-400 to-purple-600 text-white shadow-md'
                ]"
              >
                {{ num }}
              </div>
            </div>

            <p class="text-xs text-gray-500 text-center">{{ predictions.message }}</p>
          </div>

          <!-- Hot Numbers -->
          <div v-if="hotNumbers.length > 0" class="bg-white/90 backdrop-blur rounded-2xl shadow-lg p-6">
            <h3 class="text-lg font-bold text-gray-800 mb-3">🔥 เลขที่ออกบ่อย</h3>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="num in hotNumbers"
                :key="num"
                class="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-bold"
              >
                {{ num }}
              </span>
            </div>
          </div>

          <!-- Cold Numbers -->
          <div v-if="coldNumbers.length > 0" class="bg-white/90 backdrop-blur rounded-2xl shadow-lg p-6">
            <h3 class="text-lg font-bold text-gray-800 mb-3">❄️ เลขที่ไม่ค่อยออก</h3>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="num in coldNumbers.slice(0, 5)"
                :key="num"
                class="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-bold"
              >
                {{ num }}
              </span>
            </div>
          </div>

          <!-- Pattern Analysis -->
          <div v-if="pattern" class="bg-white/90 backdrop-blur rounded-2xl shadow-lg p-6">
            <h3 class="text-lg font-bold text-gray-800 mb-3">📊 วิเคราะห์รูปแบบ</h3>

            <div class="space-y-3 text-sm">
              <!-- Even/Odd -->
              <div>
                <div class="flex justify-between mb-1">
                  <span class="text-gray-600">เลขคู่ vs เลขคี่</span>
                  <span class="font-semibold">{{ pattern.evenOddPattern.even }} : {{ pattern.evenOddPattern.odd }}</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div
                    class="bg-blue-500 h-2 rounded-full"
                    :style="{ width: `${(pattern.evenOddPattern.even / (pattern.evenOddPattern.even + pattern.evenOddPattern.odd)) * 100}%` }"
                  ></div>
                </div>
              </div>

              <!-- Range -->
              <div>
                <div class="flex justify-between mb-1">
                  <span class="text-gray-600">ช่วงตัวเลข</span>
                </div>
                <div class="grid grid-cols-3 gap-2 text-center text-xs">
                  <div class="p-2 bg-green-100 text-green-700 rounded">
                    <div class="font-bold">{{ pattern.rangePattern.low }}</div>
                    <div>00-33</div>
                  </div>
                  <div class="p-2 bg-yellow-100 text-yellow-700 rounded">
                    <div class="font-bold">{{ pattern.rangePattern.mid }}</div>
                    <div>34-66</div>
                  </div>
                  <div class="p-2 bg-red-100 text-red-700 rounded">
                    <div class="font-bold">{{ pattern.rangePattern.high }}</div>
                    <div>67-99</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-if="!predictions && history.length < 3" class="bg-white/90 backdrop-blur rounded-2xl shadow-lg p-6 text-center text-gray-400">
            <div class="text-5xl mb-3">🔮</div>
            <p>กรอกเลขย้อนหลังอย่างน้อย 3 งวด</p>
            <p class="text-sm">เพื่อเริ่มคำนวณทำนายเลข</p>
          </div>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Custom scrollbar */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 10px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
