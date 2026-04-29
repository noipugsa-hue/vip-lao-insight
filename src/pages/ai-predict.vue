<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useUsageLimit } from '../composables/useUsageLimit'
import { useLotteryType } from '../composables/useLotteryType'
import { useLaoFormulaAdvanced } from '../composables/useLaoFormulaAdvanced'

definePageMeta({
  layout: 'main'
})

const router = useRouter()
const { waitForAuth } = useAuth()
const { canUse, useOnce, remainingUses, usageText, usagePercentage, timeUntilReset, isVIP } = useUsageLimit()
const { selectedType } = useLotteryType()
const { calculateAdvanced } = useLaoFormulaAdvanced()

const loading = ref(false)
const showResult = ref(false)
const prediction = ref<any>(null)

// Helper function to get storage key
const getStorageKey = (lotteryId: string) => `vip_lao_history_${lotteryId}`

// Helper function to get history for lottery type
const getHistoryForType = (lotteryId: string): string[] => {
  if (import.meta.client) {
    const storageKey = getStorageKey(lotteryId)
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      return JSON.parse(saved)
    }
  }
  return []
}

// Alert state
const alert = ref({
  show: false,
  message: '',
  type: 'success' as 'success' | 'error' | 'warning'
})

const showAlert = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
  alert.value = { show: true, message, type }
  setTimeout(() => { alert.value.show = false }, 4000)
}

// Check authentication on mount
onMounted(async () => {
  const user = await waitForAuth()
  if (!user) {
    await router.push('/login')
  }
})

// Predict function
const predictNumbers = async () => {
  if (!canUse.value) {
    showAlert(`⛔ คุณใช้ครบ ${30} ครั้งแล้ววันนี้ กรุณารออีก ${timeUntilReset.value}`, 'warning')
    return
  }

  loading.value = true
  showResult.value = false

  try {
    // Use one prediction
    const allowed = await useOnce()
    if (!allowed) {
      showAlert(`⛔ คุณใช้ครบ ${30} ครั้งแล้ววันนี้`, 'error')
      loading.value = false
      return
    }

    // Simulate processing time for better UX
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Get history and calculate predictions
    const history = getHistoryForType(selectedType.value)
    const result = calculateAdvanced(history)

    prediction.value = result
    showResult.value = true
    showAlert('🎯 พยากรณ์เสร็จสิ้น!', 'success')
  } catch (error) {
    showAlert('❌ เกิดข้อผิดพลาด กรุณาลองใหม่', 'error')
    console.error('Prediction error:', error)
  } finally {
    loading.value = false
  }
}

// Get color based on confidence
const getConfidenceColor = (confidence: number) => {
  if (confidence >= 80) return 'text-green-600 dark:text-green-400'
  if (confidence >= 60) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-orange-600 dark:text-orange-400'
}

const getConfidenceBadge = (confidence: number) => {
  if (confidence >= 80) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
  if (confidence >= 60) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
  return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
}

// Determine if we should show upgrade prompt
const shouldShowUpgrade = computed(() => {
  return !isVIP.value && remainingUses.value <= 10
})
</script>

<template>
  <div class="max-w-6xl mx-auto">
    <!-- Alert -->
    <transition name="fade-slide">
      <div
        v-if="alert.show"
        :class="[
          'fixed top-8 left-1/2 -translate-x-1/2 px-8 py-4 rounded-2xl font-bold text-white text-lg shadow-2xl z-50 text-center backdrop-blur-sm',
          alert.type === 'success' ? 'bg-gradient-to-r from-green-600 to-green-700' :
          alert.type === 'warning' ? 'bg-gradient-to-r from-yellow-600 to-yellow-700' :
          'bg-gradient-to-r from-red-600 to-red-700'
        ]"
      >
        {{ alert.message }}
      </div>
    </transition>

    <!-- Header -->
    <div class="text-center mb-8">
      <div class="inline-block mb-4">
        <div class="text-6xl animate-bounce-slow">🤖</div>
      </div>
      <h1 class="text-4xl md:text-5xl font-black text-gray-800 dark:text-gray-100 mb-3">
        AI Prediction
      </h1>
      <p class="text-lg text-gray-600 dark:text-gray-300">
        ระบบพยากรณ์เลขด้วย AI ขั้นสูง
      </p>
    </div>

    <!-- Usage Counter Card -->
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6 border-2 border-purple-200 dark:border-purple-900">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-3">
          <span class="text-3xl">{{ isVIP ? '♾️' : '🎯' }}</span>
          <div>
            <h3 class="text-lg font-bold text-gray-800 dark:text-gray-100">
              {{ isVIP ? 'สมาชิก VIP' : 'การใช้งานวันนี้' }}
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ isVIP ? 'ใช้งานได้ไม่จำกัด' : `เหลืออีก ${remainingUses} ครั้ง` }}
            </p>
          </div>
        </div>
        <div class="text-right">
          <div :class="[
            'text-3xl font-black',
            isVIP ? 'text-yellow-500' : remainingUses > 10 ? 'text-green-600 dark:text-green-400' :
            remainingUses > 5 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
          ]">
            {{ usageText }}
          </div>
          <p v-if="!isVIP" class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            รีเซ็ตใน {{ timeUntilReset }}
          </p>
        </div>
      </div>

      <!-- Progress Bar (Free users only) -->
      <div v-if="!isVIP" class="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          :class="[
            'h-full transition-all duration-500 rounded-full',
            usagePercentage < 70 ? 'bg-gradient-to-r from-green-500 to-green-600' :
            usagePercentage < 90 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
            'bg-gradient-to-r from-red-500 to-red-600'
          ]"
          :style="{ width: `${usagePercentage}%` }"
        ></div>
      </div>

      <!-- Upgrade Prompt -->
      <div v-if="shouldShowUpgrade" class="mt-4 p-4 bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-xl">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="text-2xl">⚡</span>
            <div>
              <p class="font-bold text-purple-900 dark:text-purple-300">ใช้งานใกล้หมดแล้ว!</p>
              <p class="text-sm text-purple-700 dark:text-purple-400">อัพเกรดเป็น VIP เพื่อใช้งานไม่จำกัด</p>
            </div>
          </div>
          <NuxtLink
            to="/pricing"
            class="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-lg shadow-lg transition-all transform hover:scale-105"
          >
            อัพเกรด
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Lottery Type Selector -->
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6">
      <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
        🎰 เลือกประเภทหวย
      </label>
      <select
        v-model="selectedType"
        class="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-400/50 focus:border-purple-500 font-semibold"
      >
        <option value="government">หวยรัฐบาล</option>
        <option value="savings">หวยออมสิน</option>
        <option value="baac">หวย ธ.ก.ส.</option>
      </select>
    </div>

    <!-- Predict Button -->
    <button
      @click="predictNumbers"
      :disabled="loading || !canUse"
      :class="[
        'w-full py-6 rounded-2xl font-black text-xl shadow-2xl transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3 mb-6',
        loading ? 'bg-gray-400 cursor-wait' :
        !canUse ? 'bg-gray-400 cursor-not-allowed' :
        'bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-700 hover:via-pink-700 hover:to-indigo-700 text-white animate-pulse-glow'
      ]"
    >
      <span v-if="loading" class="text-3xl animate-spin">⚙️</span>
      <span v-else class="text-3xl">🔮</span>
      <span>{{ loading ? 'กำลังพยากรณ์...' : canUse ? 'พยากรณ์เลขด้วย AI' : 'ใช้งานครบแล้ววันนี้' }}</span>
    </button>

    <!-- Results -->
    <transition name="fade-scale">
      <div v-if="showResult && prediction" class="space-y-6">
        <!-- Hot Numbers -->
        <div class="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-2xl shadow-xl p-6 border-2 border-red-200 dark:border-red-900">
          <div class="flex items-center gap-3 mb-4">
            <span class="text-3xl">🔥</span>
            <div>
              <h3 class="text-2xl font-black text-red-700 dark:text-red-400">เลขร้อน</h3>
              <p class="text-sm text-red-600 dark:text-red-500">ออกบ่อยในช่วงที่ผ่านมา</p>
            </div>
          </div>
          <div class="flex flex-wrap gap-3">
            <div
              v-for="num in prediction.hot"
              :key="num"
              class="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 text-white text-2xl font-black rounded-xl shadow-lg transform hover:scale-110 transition-transform"
            >
              {{ num }}
            </div>
          </div>
        </div>

        <!-- Cold Numbers -->
        <div class="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl shadow-xl p-6 border-2 border-blue-200 dark:border-blue-900">
          <div class="flex items-center gap-3 mb-4">
            <span class="text-3xl">❄️</span>
            <div>
              <h3 class="text-2xl font-black text-blue-700 dark:text-blue-400">เลขเย็น</h3>
              <p class="text-sm text-blue-600 dark:text-blue-500">ไม่ออกมานาน อาจถึงคิว</p>
            </div>
          </div>
          <div class="flex flex-wrap gap-3">
            <div
              v-for="num in prediction.cold"
              :key="num"
              class="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 text-white text-2xl font-black rounded-xl shadow-lg transform hover:scale-110 transition-transform"
            >
              {{ num }}
            </div>
          </div>
        </div>

        <!-- Two Digits -->
        <div class="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl shadow-xl p-6 border-2 border-purple-200 dark:border-purple-900">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-3">
              <span class="text-3xl">🎲</span>
              <div>
                <h3 class="text-2xl font-black text-purple-700 dark:text-purple-400">เลข 2 ตัว</h3>
                <p class="text-sm text-purple-600 dark:text-purple-500">แนวทางเลข 2 ตัว</p>
              </div>
            </div>
            <span :class="['px-4 py-2 rounded-full font-bold text-sm', getConfidenceBadge(prediction.confidence)]">
              {{ prediction.confidence }}%
            </span>
          </div>
          <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            <div
              v-for="(num, index) in prediction.twoDigits"
              :key="index"
              class="flex items-center justify-center h-14 bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xl font-black rounded-xl shadow-lg transform hover:scale-110 transition-transform"
            >
              {{ num }}
            </div>
          </div>
        </div>

        <!-- Three Digits -->
        <div class="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl shadow-xl p-6 border-2 border-green-200 dark:border-green-900">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-3">
              <span class="text-3xl">🎯</span>
              <div>
                <h3 class="text-2xl font-black text-green-700 dark:text-green-400">เลข 3 ตัว</h3>
                <p class="text-sm text-green-600 dark:text-green-500">แนวทางเลข 3 ตัว</p>
              </div>
            </div>
            <span :class="['px-4 py-2 rounded-full font-bold text-sm', getConfidenceBadge(prediction.confidence)]">
              {{ prediction.confidence }}%
            </span>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            <div
              v-for="(num, index) in prediction.threeDigits"
              :key="index"
              class="flex items-center justify-center h-14 bg-gradient-to-br from-green-500 to-emerald-500 text-white text-xl font-black rounded-xl shadow-lg transform hover:scale-110 transition-transform"
            >
              {{ num }}
            </div>
          </div>
        </div>

        <!-- Disclaimer -->
        <div class="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-700 rounded-xl p-4">
          <div class="flex items-start gap-3">
            <span class="text-2xl">⚠️</span>
            <div class="text-sm text-yellow-800 dark:text-yellow-300">
              <p class="font-bold mb-1">คำเตือน</p>
              <p>ผลการพยากรณ์เป็นเพียงแนวทางเท่านั้น ไม่ใช่การการันตีผลลัพธ์ กรุณาใช้วิจารณญาณในการตัดสินใจ</p>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- No Usage Left -->
    <div v-if="!canUse && !showResult" class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
      <div class="text-6xl mb-4">⏰</div>
      <h3 class="text-2xl font-black text-gray-800 dark:text-gray-100 mb-2">
        ใช้งานครบแล้ววันนี้
      </h3>
      <p class="text-gray-600 dark:text-gray-400 mb-6">
        คุณสามารถใช้งานได้อีกครั้งใน {{ timeUntilReset }}
      </p>
      <NuxtLink
        to="/pricing"
        class="inline-block px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all transform hover:scale-105"
      >
        ⭐ อัพเกรดเป็น VIP เพื่อใช้งานไม่จำกัด
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>
/* Animations */
@keyframes bounce-slow {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 20px rgba(147, 51, 234, 0.5);
  }
  50% {
    box-shadow: 0 0 40px rgba(147, 51, 234, 0.8);
  }
}

.animate-bounce-slow {
  animation: bounce-slow 2s ease-in-out infinite;
}

.animate-pulse-glow {
  animation: pulse-glow 2s ease-in-out infinite;
}

/* Transitions */
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

.fade-scale-enter-active, .fade-scale-leave-active {
  transition: all 0.5s ease;
}

.fade-scale-enter-from {
  opacity: 0;
  transform: scale(0.9);
}

.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
</style>
