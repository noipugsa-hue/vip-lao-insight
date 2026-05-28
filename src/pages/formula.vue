<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useLotteryFormula, type FormulaResult, type FormulaConfig } from '../composables/useLotteryFormula'
import { useLotteryType } from '../composables/useLotteryType'
import { useAuth } from '../composables/useAuth'
import { useRouter } from 'vue-router'
import { useDarkMode } from '../composables/useDarkMode'

/* @ts-ignore - Nuxt auto-imported compiler macro */
definePageMeta({
  layout: false
})

const { user, waitForAuth } = useAuth()
const router = useRouter()
const { selectedLotteryType } = useLotteryType()
const { isDark, toggleDarkMode } = useDarkMode()
const showLotterySelector = ref(false)

// Open mobile menu by triggering event to main layout
const openMobileMenu = () => {
  window.dispatchEvent(new CustomEvent('open-mobile-menu'))
}

const {
  FORMULAS,
  DEFAULT_SETTINGS,
  calculateStatisticsFormula,
  calculateFixedFormula,
  calculateProbabilityFormula,
  calculateDaypowerFormula,
  saveFormulaResult,
  loadFormulaResults,
  saveFormulaSettings,
  loadFormulaSettings,
  saveActiveFormula,
  loadActiveFormula
} = useLotteryFormula()

// State
const selectedFormulaId = ref<string>('statistics')
const calculationResult = ref<FormulaResult | null>(null)
const showSuccess = ref(false)
const isCalculating = ref(false)

// Settings for each formula
const statisticsSettings = ref(DEFAULT_SETTINGS.statisticsFormula)
const fixedSettings = ref(DEFAULT_SETTINGS.fixedFormula)
const probabilitySettings = ref(DEFAULT_SETTINGS.probabilityFormula)
const daypowerSettings = ref(DEFAULT_SETTINGS.daypowerFormula)

// History data
const history = ref<string[]>([])

// Computed
const selectedFormula = computed<FormulaConfig | undefined>(() => {
  return FORMULAS.find((f) => f.id === selectedFormulaId.value)
})

const currentSettings = computed(() => {
  switch (selectedFormulaId.value) {
    case 'statistics':
      return statisticsSettings.value
    case 'fixed':
      return fixedSettings.value
    case 'probability':
      return probabilitySettings.value
    case 'daypower':
      return daypowerSettings.value
    default:
      return {}
  }
})

const confidenceColor = computed(() => {
  if (!calculationResult.value) return 'gray'
  const conf = calculationResult.value.confidence
  if (conf >= 80) return 'green'
  if (conf >= 60) return 'yellow'
  return 'gray'
})

// Load history from localStorage
const loadHistory = () => {
  const storageKey = `vip_lao_history_${selectedLotteryType.value.id}`
  const saved = localStorage.getItem(storageKey)
  if (saved) {
    const parsed = JSON.parse(saved)
    if (Array.isArray(parsed)) {
      history.value = parsed.slice(0, 30) // Max 30 periods
    }
  }
}

// Calculate based on selected formula
const calculate = () => {
  if (history.value.length < 3) {
    alert('ต้องมีข้อมูลหวยย้อนหลังอย่างน้อย 3 งวด')
    return
  }

  isCalculating.value = true

  try {
    let result: FormulaResult | null = null

    switch (selectedFormulaId.value) {
      case 'statistics':
        result = calculateStatisticsFormula(history.value, statisticsSettings.value)
        break
      case 'fixed':
        result = calculateFixedFormula(history.value, fixedSettings.value)
        break
      case 'probability':
        result = calculateProbabilityFormula(history.value, probabilitySettings.value)
        break
      case 'daypower':
        result = calculateDaypowerFormula(history.value, new Date(), daypowerSettings.value)
        break
    }

    if (result) {
      result.lotteryType = selectedLotteryType.value.id
      calculationResult.value = result
      saveFormulaResult(result)

      // Show success message
      showSuccess.value = true
      setTimeout(() => {
        showSuccess.value = false
      }, 2000)
    }
  } catch (error) {
    console.error('Error calculating:', error)
    alert('เกิดข้อผิดพลาดในการคำนวณ')
  } finally {
    isCalculating.value = false
  }
}

// Select formula
const selectFormula = (formulaId: string) => {
  selectedFormulaId.value = formulaId
  saveActiveFormula(formulaId)
  calculationResult.value = null
}

// Handle fixed numbers input
const handleFixedNumbersInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  const val = target.value.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n))
  fixedSettings.value.fixedNumbers = val
}

// Load saved settings
const loadSavedSettings = () => {
  const statSettings = loadFormulaSettings('statistics')
  if (statSettings) statisticsSettings.value = statSettings

  const fixSettings = loadFormulaSettings('fixed')
  if (fixSettings) fixedSettings.value = fixSettings

  const probSettings = loadFormulaSettings('probability')
  if (probSettings) probabilitySettings.value = probSettings

  const daySettings = loadFormulaSettings('daypower')
  if (daySettings) daypowerSettings.value = daySettings
}

// Save settings when changed
watch(statisticsSettings, (val) => {
  saveFormulaSettings('statistics', val)
}, { deep: true })

watch(fixedSettings, (val) => {
  saveFormulaSettings('fixed', val)
}, { deep: true })

watch(probabilitySettings, (val) => {
  saveFormulaSettings('probability', val)
}, { deep: true })

watch(daypowerSettings, (val) => {
  saveFormulaSettings('daypower', val)
}, { deep: true })

// Watch lottery type changes
watch(() => selectedLotteryType.value.id, () => {
  loadHistory()
  calculationResult.value = null
})

onMounted(async () => {
  await waitForAuth()
  if (!user.value) {
    router.push('/login')
    return
  }

  // Load saved formula
  selectedFormulaId.value = loadActiveFormula()

  // Load saved settings
  loadSavedSettings()

  // Load history
  loadHistory()
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-cyan-100 via-purple-50 to-blue-100 dark:bg-gradient-to-b dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 px-4">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <!-- Back Button -->
        <div class="mb-6">
          <button
            @click="router.push('/home')"
            class="group inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-2xl font-bold shadow-xl hover:shadow-2xl transform transition-all hover:scale-105 active:scale-95"
          >
            <span class="text-2xl group-hover:animate-bounce">←</span>
            <span>ย้อนกลับหน้าหลัก</span>
          </button>
        </div>

        <div class="mb-4">
          <h1 class="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-2">
            🧪 สูตรหวย
          </h1>
          <p class="text-gray-600 dark:text-gray-300">
            คำนวณเลขหวยด้วยสูตรต่างๆ แบบละเอียด
          </p>
        </div>
      </div>

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
          ✅ คำนวณสำเร็จ!
        </div>
      </Transition>

      <!-- Lottery Type Selector Button -->
      <button
        @click="showLotterySelector = true"
        class="w-full mb-6 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg shadow-lg font-semibold text-lg transition-all flex items-center justify-center gap-2"
        >
          <span class="text-xl">🎲</span>
          <span>{{ selectedLotteryType.displayName }}</span>
          <span class="text-sm opacity-80">(คลิกเพื่อเปลี่ยน)</span>
      </button>

      <!-- Formula Selector Cards -->
      <div class="mb-4">
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            v-for="formula in FORMULAS"
            :key="formula.id"
            @click="selectFormula(formula.id)"
            class="p-6 rounded-2xl shadow-lg transition-all transform hover:scale-105 text-left"
            :class="[
              selectedFormulaId === formula.id
                ? 'bg-gradient-to-br from-green-400 to-emerald-600 text-white shadow-xl ring-4 ring-green-300'
                : 'bg-white/90 dark:bg-gray-800 text-gray-800 dark:text-white hover:shadow-xl'
            ]"
          >
            <div class="text-4xl mb-3">{{ formula.icon }}</div>
            <div class="font-bold text-lg mb-2">{{ formula.displayName }}</div>
            <div class="text-sm opacity-80">{{ formula.description }}</div>
          </button>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <!-- Left: Settings Panel -->
          <div class="bg-white/90 dark:bg-gray-800 backdrop-blur rounded-2xl shadow-lg p-6">
            <h2 class="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <span>⚙️</span>
              <span>การตั้งค่า</span>
            </h2>

            <!-- Statistics Settings -->
            <div v-if="selectedFormulaId === 'statistics'" class="space-y-4">
              <div>
                <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  จำนวนงวดที่วิเคราะห์
                </label>
                <input
                  v-model.number="statisticsSettings.periodsToAnalyze"
                  type="number"
                  min="5"
                  max="30"
                  class="w-full px-4 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
                <p class="text-xs text-gray-500 mt-1">แนะนำ: 10-15 งวด</p>
              </div>

              <div class="flex items-center gap-2">
                <input
                  v-model="statisticsSettings.focusOnHot"
                  type="checkbox"
                  id="focusHot"
                  class="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                />
                <label for="focusHot" class="text-sm text-gray-700 dark:text-gray-300">
                  เน้นเลขร้อน
                </label>
              </div>

              <div class="flex items-center gap-2">
                <input
                  v-model="statisticsSettings.analyzeDigitPosition"
                  type="checkbox"
                  id="analyzePosition"
                  class="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                />
                <label for="analyzePosition" class="text-sm text-gray-700 dark:text-gray-300">
                  วิเคราะห์ตำแหน่งหลัก
                </label>
              </div>
            </div>

            <!-- Fixed Settings -->
            <div v-if="selectedFormulaId === 'fixed'" class="space-y-4">
              <div>
                <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  เลขคงที่ (คั่นด้วยเครื่องหมายจุลภาค)
                </label>
                <input
                  :value="fixedSettings.fixedNumbers.join(',')"
                  @input="handleFixedNumbersInput"
                  type="text"
                  placeholder="7,8,3"
                  class="w-full px-4 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
                <p class="text-xs text-gray-500 mt-1">ตัวอย่าง: 7,8,3 หรือ 5,10,15</p>
              </div>

              <div>
                <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  จำนวนหลัก
                </label>
                <div class="flex gap-2">
                  <button
                    @click="fixedSettings.targetDigits = 2"
                    class="flex-1 py-2 rounded-lg font-semibold transition"
                    :class="[
                      fixedSettings.targetDigits === 2
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    ]"
                  >
                    2 ตัว
                  </button>
                  <button
                    @click="fixedSettings.targetDigits = 3"
                    class="flex-1 py-2 rounded-lg font-semibold transition"
                    :class="[
                      fixedSettings.targetDigits === 3
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    ]"
                  >
                    3 ตัว
                  </button>
                </div>
              </div>
            </div>

            <!-- Probability Settings -->
            <div v-if="selectedFormulaId === 'probability'" class="space-y-4">
              <div class="flex items-center gap-2">
                <input
                  v-model="probabilitySettings.useAddition"
                  type="checkbox"
                  id="useAddition"
                  class="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                />
                <label for="useAddition" class="text-sm text-gray-700 dark:text-gray-300">
                  ใช้การบวกตัวเลข
                </label>
              </div>

              <div class="flex items-center gap-2">
                <input
                  v-model="probabilitySettings.reduceToSingleDigit"
                  type="checkbox"
                  id="reduceSingle"
                  class="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                />
                <label for="reduceSingle" class="text-sm text-gray-700 dark:text-gray-300">
                  ลดเป็นเลขหลักเดียว
                </label>
              </div>
            </div>

            <!-- Daypower Settings -->
            <div v-if="selectedFormulaId === 'daypower'" class="space-y-4">
              <div class="flex items-center gap-2">
                <input
                  v-model="daypowerSettings.useDayOfWeek"
                  type="checkbox"
                  id="useDayWeek"
                  class="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                />
                <label for="useDayWeek" class="text-sm text-gray-700 dark:text-gray-300">
                  ใช้เลขประจำวัน
                </label>
              </div>

              <div class="flex items-center gap-2">
                <input
                  v-model="daypowerSettings.combineWithHotNumbers"
                  type="checkbox"
                  id="combineHot"
                  class="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                />
                <label for="combineHot" class="text-sm text-gray-700 dark:text-gray-300">
                  รวมกับเลขร้อน
                </label>
              </div>

              <div>
                <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  กำหนดเลขกำลังเอง (หรือเว้นว่างใช้วันอัตโนมัติ)
                </label>
                <input
                  v-model.number="daypowerSettings.powerNumberOverride"
                  type="number"
                  min="0"
                  max="9"
                  placeholder="ไม่ระบุ (ใช้อัตโนมัติ)"
                  class="w-full px-4 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>

            <!-- Calculate Button -->
            <button
              @click="calculate"
              :disabled="isCalculating || history.length < 3"
              class="w-full mt-6 py-4 rounded-xl font-bold text-lg shadow-lg transition transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              :class="[
                isCalculating || history.length < 3
                  ? 'bg-gray-400 text-gray-700'
                  : 'bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 text-white'
              ]"
            >
              <span v-if="isCalculating">⏳ กำลังคำนวณ...</span>
              <span v-else-if="history.length < 3">📝 ต้องมีข้อมูล 3 งวดขึ้นไป</span>
              <span v-else>🔮 คำนวณทำนาย</span>
            </button>

            <!-- Info -->
            <div class="mt-4 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-sm text-gray-600 dark:text-gray-400">
              <p class="font-semibold mb-2">💡 ข้อมูลสูตร:</p>
              <p class="text-xs leading-relaxed">{{ selectedFormula?.description }}</p>
            </div>

            <!-- History Status (Moved Here) -->
            <div class="mt-6 p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border-2 border-purple-200 dark:border-purple-800">
              <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                <span>📚</span>
                <span>สถานะข้อมูล</span>
              </h3>
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-gray-700 dark:text-gray-300">
                    มีข้อมูลหวยย้อนหลัง: <span class="font-bold text-purple-600">{{ history.length }} งวด</span>
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    ต้องการอย่างน้อย 3 งวดเพื่อคำนวณ
                  </p>
                </div>
                <div class="text-4xl">
                  {{ history.length >= 10 ? '🟢' : history.length >= 3 ? '🟡' : '🔴' }}
                </div>
              </div>
            </div>
          </div> <!-- Close left settings panel (line 257) -->

          <!-- Right: Results -->
          <div class="space-y-6">
            <!-- Results Display -->
            <div v-if="calculationResult" class="space-y-4">
              <!-- Confidence Badge -->
              <div class="bg-white/90 dark:bg-gray-800 backdrop-blur rounded-2xl shadow-lg p-6">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-2xl font-bold text-gray-800 dark:text-white">
                  🎯 ผลการคำนวณ
                </h2>
                <span
                  class="px-4 py-2 rounded-full font-bold text-sm"
                  :class="{
                    'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300': confidenceColor === 'green',
                    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300': confidenceColor === 'yellow',
                    'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300': confidenceColor === 'gray'
                  }"
                >
                  ความมั่นใจ {{ calculationResult.confidence }}%
                </span>
              </div>

              <!-- 2-Digit Predictions -->
              <div v-if="calculationResult.predictions.twoDigits.length > 0" class="mb-6">
                <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-3">
                  📊 เลข 2 ตัว ({{ calculationResult.predictions.twoDigits.length }} ชุด)
                </h3>
                <div class="grid grid-cols-4 gap-3">
                  <div
                    v-for="(num, idx) in calculationResult.predictions.twoDigits"
                    :key="idx"
                    class="px-4 py-4 rounded-xl text-center font-bold text-2xl shadow-lg transition-all transform hover:scale-105"
                    :class="[
                      idx === 0
                        ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-gray-900'
                        : idx === 1
                        ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white'
                        : 'bg-gradient-to-br from-purple-400 to-purple-600 text-white'
                    ]"
                  >
                    {{ num }}
                  </div>
                </div>
              </div>

              <!-- 3-Digit Predictions -->
              <div v-if="calculationResult.predictions.threeDigits.length > 0">
                <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-3">
                  🎲 เลข 3 ตัว ({{ calculationResult.predictions.threeDigits.length }} ชุด)
                </h3>
                <div class="grid grid-cols-3 gap-3">
                  <div
                    v-for="(num, idx) in calculationResult.predictions.threeDigits"
                    :key="idx"
                    class="px-4 py-4 rounded-xl text-center font-bold text-2xl shadow-lg transition-all transform hover:scale-105"
                    :class="[
                      idx === 0
                        ? 'bg-gradient-to-br from-blue-400 to-blue-600 text-white'
                        : 'bg-gradient-to-br from-indigo-400 to-indigo-600 text-white'
                    ]"
                  >
                    {{ num }}
                  </div>
                </div>
              </div>
            </div> <!-- Close confidence badge container (line 450) -->

            <!-- Explanation -->
            <div class="bg-white/90 dark:bg-gray-800 backdrop-blur rounded-2xl shadow-lg p-6">
              <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-3">
                📝 ขั้นตอนการคำนวณ
              </h3>
              <div class="space-y-2">
                <div
                  v-for="(step, idx) in calculationResult.explanation"
                  :key="idx"
                  class="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                >
                  <span class="text-purple-600 dark:text-purple-400 font-bold">{{ idx + 1 }}.</span>
                  <span>{{ step }}</span>
                </div>
              </div>
            </div> <!-- Close explanation container (line 513) -->
          </div> <!-- Close v-if results display (line 448) -->

          <!-- Empty State -->
          <div v-else class="bg-white/90 dark:bg-gray-800 backdrop-blur rounded-2xl shadow-lg p-16 text-center flex flex-col items-center justify-center min-h-[500px]">
            <div class="text-9xl mb-8 animate-pulse">🎲</div>
            <h3 class="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-4">
              ยังไม่มีผลการคำนวณ
            </h3>
            <p class="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-md">
              เลือกสูตรที่ต้องการ ปรับการตั้งค่า แล้วกดคำนวณ
            </p>
            <div class="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4 mb-6 max-w-md">
              <p class="text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center gap-2">
                <span>💡</span>
                <span>ต้องมีข้อมูลหวยย้อนหลังอย่างน้อย 3 งวด</span>
              </p>
            </div>
          </div> <!-- Close empty state -->
        </div> <!-- Close Results container -->
      </div> <!-- Close Main Content Grid -->
    </div> <!-- Close max-w-7xl container -->
  </div> <!-- Close min-h-screen wrapper -->
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
</style>

function definePageMeta(arg0: { layout: string }) {
  throw new Error('Function not implemented.')
}
