<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useLotteryHistory, type LotteryResult } from '../composables/useLotteryHistory'

definePageMeta({
  layout: 'main'
})

const router = useRouter()
const { waitForAuth } = useAuth()
const { results, currentResult, loading, error, fetchLatestResult, fetchMultipleResults, checkNumber } = useLotteryHistory()

const selectedResult = ref<LotteryResult | null>(null)
const checkingNumber = ref('')
const checkResults = ref<{ name: string, amount: number }[]>([])
const showCheckModal = ref(false)

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

// Check authentication and load data on mount
onMounted(async () => {
  const user = await waitForAuth()
  if (!user) {
    await router.push('/login')
    return
  }

  // โหลดงวดล่าสุดและย้อนหลัง 10 งวด
  await loadResults()
})

const loadResults = async () => {
  await fetchMultipleResults(10)
  if (results.value.length > 0) {
    selectedResult.value = results.value[0]
  }
}

const selectResult = (result: LotteryResult) => {
  selectedResult.value = result
}

const doCheckNumber = () => {
  if (!selectedResult.value) {
    showAlert('กรุณาเลือกงวดที่ต้องการตรวจ', 'warning')
    return
  }

  if (!checkingNumber.value || checkingNumber.value.length !== 6) {
    showAlert('กรุณาใส่เลข 6 หลัก', 'error')
    return
  }

  const prizes = checkNumber(checkingNumber.value, selectedResult.value)
  checkResults.value = prizes

  if (prizes.length > 0) {
    const totalAmount = prizes.reduce((sum, p) => sum + p.amount, 0)
    showAlert(`🎉 ยินดีด้วย! ถูกรางวัล ${prizes.length} รางวัล รวม ${totalAmount.toLocaleString()} บาท`, 'success')
  } else {
    showAlert('❌ ไม่ถูกรางวัล', 'error')
  }

  showCheckModal.value = true
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('th-TH').format(amount)
}
</script>

<template>
  <div class="max-w-7xl mx-auto">
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
        <div class="text-6xl animate-bounce-slow">🎫</div>
      </div>
      <h1 class="text-4xl md:text-5xl font-black text-gray-800 dark:text-gray-100 mb-3">
        ผลหวยรัฐบาลย้อนหลัง
      </h1>
      <p class="text-lg text-gray-600 dark:text-gray-300">
        ตรวจผลรางวัลหวยรัฐบาลไทย
      </p>
    </div>

    <!-- Loading State -->
    <div v-if="loading && results.length === 0" class="text-center py-12">
      <div class="text-6xl mb-4 animate-spin">⚙️</div>
      <p class="text-xl text-gray-600 dark:text-gray-400">กำลังโหลดข้อมูล...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error && results.length === 0" class="bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-xl p-6 text-center">
      <div class="text-5xl mb-3">❌</div>
      <h3 class="text-xl font-bold text-red-800 dark:text-red-300 mb-2">เกิดข้อผิดพลาด</h3>
      <p class="text-red-600 dark:text-red-400">{{ error }}</p>
      <button
        @click="loadResults"
        class="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow transition"
      >
        ลองใหม่
      </button>
    </div>

    <!-- Main Content -->
    <div v-else-if="results.length > 0" class="space-y-6">
      <!-- Check Number Section -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border-2 border-blue-200 dark:border-blue-900">
        <h2 class="text-2xl font-black text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
          <span class="text-3xl">🔍</span>
          ตรวจสอบเลข
        </h2>
        <div class="flex flex-col md:flex-row gap-4">
          <div class="flex-1">
            <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              เลือกงวด
            </label>
            <select
              v-model="selectedResult"
              class="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-400/50 font-semibold"
            >
              <option v-for="result in results" :key="result.date" :value="result">
                งวดวันที่ {{ result.date }}
              </option>
            </select>
          </div>
          <div class="flex-1">
            <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              เลข 6 หลัก
            </label>
            <input
              v-model="checkingNumber"
              type="text"
              maxlength="6"
              placeholder="ใส่เลข 6 หลัก"
              class="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-400/50 font-bold text-center text-2xl"
            />
          </div>
          <div class="flex items-end">
            <button
              @click="doCheckNumber"
              class="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-xl shadow-lg transition transform hover:scale-105"
            >
              ตรวจสอบ
            </button>
          </div>
        </div>

        <!-- Check Results -->
        <transition name="fade-scale">
          <div v-if="showCheckModal && checkResults.length > 0" class="mt-6 p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border-2 border-green-300 dark:border-green-700">
            <h3 class="text-xl font-black text-green-800 dark:text-green-300 mb-4 flex items-center gap-2">
              <span class="text-2xl">🎉</span>
              ยินดีด้วย! ถูกรางวัล
            </h3>
            <div class="space-y-2">
              <div v-for="(prize, index) in checkResults" :key="index" class="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                <span class="font-bold text-gray-800 dark:text-gray-200">{{ prize.name }}</span>
                <span class="text-green-600 dark:text-green-400 font-black text-lg">{{ formatCurrency(prize.amount) }} ฿</span>
              </div>
              <div class="pt-3 border-t-2 border-green-300 dark:border-green-700 flex justify-between items-center">
                <span class="text-lg font-black text-gray-800 dark:text-gray-200">รวมทั้งหมด</span>
                <span class="text-2xl font-black text-green-600 dark:text-green-400">
                  {{ formatCurrency(checkResults.reduce((sum, p) => sum + p.amount, 0)) }} ฿
                </span>
              </div>
            </div>
          </div>
          <div v-else-if="showCheckModal && checkResults.length === 0" class="mt-6 p-6 bg-red-50 dark:bg-red-900/20 rounded-xl border-2 border-red-300 dark:border-red-700 text-center">
            <div class="text-5xl mb-2">😢</div>
            <p class="text-xl font-bold text-red-800 dark:text-red-300">ไม่ถูกรางวัล</p>
            <p class="text-red-600 dark:text-red-400 mt-2">ลองใหม่งวดหน้านะ</p>
          </div>
        </transition>
      </div>

      <!-- Results List -->
      <div class="grid gap-6">
        <div
          v-for="result in results"
          :key="result.date"
          class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border-2 border-gray-200 dark:border-gray-700"
        >
          <!-- Header -->
          <div class="bg-gradient-to-r from-red-600 to-red-700 p-4">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-2xl font-black text-white">งวดประจำวันที่ {{ result.date }}</h3>
                <p class="text-red-100">งวดที่ {{ result.period || result.date }}</p>
              </div>
              <div class="text-4xl">🎰</div>
            </div>
          </div>

          <!-- Body -->
          <div class="p-6 space-y-6">
            <!-- รางวัลที่ 1 -->
            <div class="text-center p-6 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl border-2 border-yellow-300 dark:border-yellow-700">
              <div class="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">🏆 รางวัลที่ 1</div>
              <div class="text-5xl md:text-6xl font-black text-yellow-600 dark:text-yellow-400 mb-2 tracking-wider">
                {{ result.first }}
              </div>
              <div class="text-sm text-gray-600 dark:text-gray-400">รางวัลละ 6,000,000 บาท</div>
            </div>

            <!-- รางวัลใกล้เคียงรางวัลที่ 1 -->
            <div v-if="result.firstNear && result.firstNear.length > 0" class="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800">
              <div class="text-lg font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <span>🎯</span>
                รางวัลใกล้เคียงรางวัลที่ 1
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div v-for="num in result.firstNear" :key="num" class="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <div class="text-2xl font-black text-orange-600 dark:text-orange-400">{{ num }}</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">100,000 ฿</div>
                </div>
              </div>
            </div>

            <!-- รางวัลที่ 2 -->
            <div v-if="result.second && result.second.length > 0" class="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
              <div class="text-lg font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <span>🥈</span>
                รางวัลที่ 2
              </div>
              <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div v-for="num in result.second" :key="num" class="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <div class="text-xl font-black text-purple-600 dark:text-purple-400">{{ num }}</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">200,000 ฿</div>
                </div>
              </div>
            </div>

            <!-- รางวัลที่ 3 -->
            <div v-if="result.third && result.third.length > 0" class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <div class="text-lg font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <span>🥉</span>
                รางวัลที่ 3
              </div>
              <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div v-for="num in result.third" :key="num" class="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <div class="text-xl font-black text-blue-600 dark:text-blue-400">{{ num }}</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">80,000 ฿</div>
                </div>
              </div>
            </div>

            <!-- รางวัลที่ 4 และ 5 -->
            <div class="grid md:grid-cols-2 gap-4">
              <!-- รางวัลที่ 4 -->
              <div v-if="result.fourth && result.fourth.length > 0" class="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                <div class="text-base font-bold text-gray-700 dark:text-gray-300 mb-3">🎖️ รางวัลที่ 4</div>
                <div class="grid grid-cols-2 gap-2">
                  <div v-for="num in result.fourth" :key="num" class="text-center p-2 bg-white dark:bg-gray-800 rounded">
                    <div class="text-lg font-bold text-green-600 dark:text-green-400">{{ num }}</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">40,000 ฿</div>
                  </div>
                </div>
              </div>

              <!-- รางวัลที่ 5 -->
              <div v-if="result.fifth && result.fifth.length > 0" class="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-xl border border-pink-200 dark:border-pink-800">
                <div class="text-base font-bold text-gray-700 dark:text-gray-300 mb-3">🏅 รางวัลที่ 5</div>
                <div class="grid grid-cols-2 gap-2">
                  <div v-for="num in result.fifth" :key="num" class="text-center p-2 bg-white dark:bg-gray-800 rounded">
                    <div class="text-lg font-bold text-pink-600 dark:text-pink-400">{{ num }}</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">20,000 ฿</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- เลขหน้า 3 ตัว และ เลขท้าย 3 ตัว -->
            <div class="grid md:grid-cols-2 gap-4">
              <!-- เลขหน้า 3 ตัว -->
              <div v-if="result.runningNumberFront && result.runningNumberFront.length > 0" class="p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-xl border border-cyan-200 dark:border-cyan-800">
                <div class="text-base font-bold text-gray-700 dark:text-gray-300 mb-3">🔢 เลขหน้า 3 ตัว</div>
                <div class="flex flex-wrap gap-2">
                  <div v-for="num in result.runningNumberFront" :key="num" class="px-3 py-2 bg-white dark:bg-gray-800 rounded font-bold text-cyan-600 dark:text-cyan-400">
                    {{ num }}
                  </div>
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400 mt-2">รางวัลละ 4,000 บาท</div>
              </div>

              <!-- เลขท้าย 3 ตัว -->
              <div v-if="result.runningNumberBack && result.runningNumberBack.length > 0" class="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800">
                <div class="text-base font-bold text-gray-700 dark:text-gray-300 mb-3">🔢 เลขท้าย 3 ตัว</div>
                <div class="flex flex-wrap gap-2">
                  <div v-for="num in result.runningNumberBack" :key="num" class="px-3 py-2 bg-white dark:bg-gray-800 rounded font-bold text-indigo-600 dark:text-indigo-400">
                    {{ num }}
                  </div>
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400 mt-2">รางวัลละ 4,000 บาท</div>
              </div>
            </div>

            <!-- เลขท้าย 2 ตัว -->
            <div v-if="result.runningNumberBack2 && result.runningNumberBack2.length > 0" class="p-4 bg-teal-50 dark:bg-teal-900/20 rounded-xl border border-teal-200 dark:border-teal-800">
              <div class="text-base font-bold text-gray-700 dark:text-gray-300 mb-3">🎯 เลขท้าย 2 ตัว</div>
              <div class="flex flex-wrap gap-2">
                <div v-for="num in result.runningNumberBack2" :key="num" class="px-4 py-2 bg-white dark:bg-gray-800 rounded-lg font-black text-xl text-teal-600 dark:text-teal-400">
                  {{ num }}
                </div>
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400 mt-2">รางวัลละ 2,000 บาท</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 text-center">
      <div class="text-6xl mb-4">📭</div>
      <h3 class="text-2xl font-black text-gray-800 dark:text-gray-100 mb-2">
        ไม่มีข้อมูล
      </h3>
      <p class="text-gray-600 dark:text-gray-400 mb-6">
        ไม่พบข้อมูลผลหวย กรุณาลองใหม่อีกครั้ง
      </p>
      <button
        @click="loadResults"
        class="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-xl shadow-lg transition transform hover:scale-105"
      >
        โหลดข้อมูล
      </button>
    </div>
  </div>
</template>

<style scoped>
@keyframes bounce-slow {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.animate-bounce-slow {
  animation: bounce-slow 2s ease-in-out infinite;
}

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
