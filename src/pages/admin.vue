<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import { useLaoFormulaAdvanced } from '../composables/useLaoFormulaAdvanced'
import { useVipResult } from '../composables/useVipResult'
import { useRouter } from 'vue-router'
import { useVipPopup } from '../composables/useVipPopup'
import { useLotteryType } from '../composables/useLotteryType'
import { useLotteryFetcher, type LotteryResult } from '../composables/useLotteryFetcher'
import { useBalance } from '../composables/useBalance'

definePageMeta({
  layout: false // ปิด layout เพราะหน้านี้เป็นหน้าเก่า
})

const { vipPopup, showPopup } = useVipPopup()
const router = useRouter()
const STORAGE_KEY = 'vip_lao_history'
const { selectedLotteryType } = useLotteryType()
const showLotterySelector = ref(false)

const history = ref<string[]>([])
const input = ref('')
const confidence = ref(0)

const { calculateAdvanced } = useLaoFormulaAdvanced()
const { setResult } = useVipResult()

// Lottery Fetcher
const {
  isFetching,
  error: fetchError,
  lastResult,
  fetchAndSave,
  fetchDemoAndSave,
  fetchScraperAndSave,
  getLatestFromFirestore,
  getAllFromFirestore,
  manualAddResult
} = useLotteryFetcher()

const lotteryResults = ref<LotteryResult[]>([])
const manualInput = ref({
  threeDigit: '',
  date: new Date().toISOString().split('T')[0],
  period: ''
})
const autoFetchEnabled = ref(false)
const autoFetchInterval = ref<NodeJS.Timeout | null>(null)

// Balance Management
const {
  isFetching: isFetchingBalance,
  error: balanceError,
  balanceData,
  fetchBalance,
  getCachedBalance,
  formatBalance
} = useBalance()

/* ✅ โหลดข้อมูลที่เคยเพิ่มไว้ */
onMounted(async () => {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) history.value = JSON.parse(saved)

  // โหลดข้อมูลหวยจาก Firestore
  await loadLotteryResults()

  // โหลดยอดเงินจาก cache
  const cached = getCachedBalance()
  if (!cached) {
    // ถ้าไม่มี cache ให้ดึงใหม่
    await fetchBalance()
  }
})

/* ✅ บันทึกทุกครั้งที่ history เปลี่ยน */
watch(history, (val) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
}, { deep: true })

const addHistory = () => {
  const value = input.value.trim()
  if (!/^\d{3}$/.test(value)) {
    alert('ใส่เลข 3 ตัวเท่านั้น')
    return
  }
  history.value.unshift(value) // 🔥 เพิ่มจริง
  input.value = ''
}

const calculate = async () => {
  if (history.value.length < 5) {
    alert('กรุณาใส่เลขย้อนหลังอย่างน้อย 5 งวด สำหรับความแม่นยำสูง')
    return
  }

  // 1. คำนวณเลขด้วยสูตรขั้นสูง
  const result = calculateAdvanced(history.value)
  confidence.value = result.confidence

  setResult(result.hot, result.twoDigits, result.threeDigits)

  // 2. แสดง popup VIP ผลลัพธ์พร้อมความมั่นใจ
  showPopup(
  `🎯 Hot Numbers: ${result.hot.join(', ')}
   💎 ความมั่นใจ: ${result.confidence}%
   2 ตัว: ${result.twoDigits.slice(0, 6).join(', ')}
   3 ตัว: ${result.threeDigits.slice(0, 4).join(', ')}`,
  'info',
  20000 // popup แสดง 20 วินาที
)

  // ✅ ให้ Vue re-render ก่อนหน่วงเวลา
  await nextTick()

  // 3. หน่วงเวลา 20 วินาที
  await new Promise(resolve => setTimeout(resolve, 20000))

  // 4. ไปหน้า VIP
  await router.push('/vip')
}

const clearHistory = () => {
  if (!confirm('ต้องการล้างเลขย้อนหลังทั้งหมดใช่หรือไม่?')) return
  history.value = []
  localStorage.removeItem(STORAGE_KEY)
}

// ฟังก์ชันสำหรับดึงข้อมูลหวย
const fetchLotteryNow = async () => {
  const success = await fetchAndSave()
  if (success) {
    showPopup('✅ ดึงข้อมูลหวยสำเร็จ!', 'success', 3000)
    await loadLotteryResults()
  } else {
    showPopup(`❌ ${fetchError.value || 'เกิดข้อผิดพลาด'}`, 'error', 5000)
  }
}

const fetchDemoNow = async () => {
  const success = await fetchDemoAndSave()
  if (success) {
    showPopup('✅ ดึงข้อมูล Demo สำเร็จ! (ข้อมูลทดสอบ)', 'success', 3000)
    await loadLotteryResults()
  } else {
    showPopup(`❌ ${fetchError.value || 'เกิดข้อผิดพลาด'}`, 'error', 5000)
  }
}

const fetchScraperNow = async () => {
  const success = await fetchScraperAndSave()
  if (success) {
    showPopup('✅ ดึงข้อมูลด้วย Puppeteer สำเร็จ!', 'success', 3000)
    await loadLotteryResults()
  } else {
    showPopup(`❌ ${fetchError.value || 'เกิดข้อผิดพลาด'}`, 'error', 5000)
  }
}

const loadLotteryResults = async () => {
  lotteryResults.value = await getAllFromFirestore(10)
}

const addManualLottery = async () => {
  if (!/^\d{3}$/.test(manualInput.value.threeDigit)) {
    showPopup('❌ กรุณาใส่เลข 3 ตัวที่ถูกต้อง', 'error', 3000)
    return
  }

  const success = await manualAddResult(
    manualInput.value.threeDigit,
    manualInput.value.date,
    manualInput.value.period || 'manual'
  )

  if (success) {
    showPopup('✅ เพิ่มผลหวยสำเร็จ!', 'success', 3000)
    manualInput.value.threeDigit = ''
    manualInput.value.period = ''
    await loadLotteryResults()
  } else {
    showPopup('❌ เกิดข้อผิดพลาดในการเพิ่มข้อมูล', 'error', 3000)
  }
}

const toggleAutoFetch = () => {
  autoFetchEnabled.value = !autoFetchEnabled.value

  if (autoFetchEnabled.value) {
    // ดึงข้อมูลทุก 1 ชั่วโมง
    autoFetchInterval.value = setInterval(async () => {
      console.log('🔄 Auto-fetching lottery data...')
      await fetchLotteryNow()
    }, 60 * 60 * 1000) // 1 hour
    showPopup('✅ เปิดการดึงข้อมูลอัตโนมัติแล้ว (ทุก 1 ชั่วโมง)', 'success', 3000)
  } else {
    if (autoFetchInterval.value) {
      clearInterval(autoFetchInterval.value)
      autoFetchInterval.value = null
    }
    showPopup('⏸️ ปิดการดึงข้อมูลอัตโนมัติแล้ว', 'info', 3000)
  }
}

// Balance functions
const refreshBalance = async (useMock: boolean = false) => {
  const result = await fetchBalance(undefined, undefined, useMock)
  if (result) {
    if (useMock) {
      showPopup('✅ สร้างข้อมูลจำลองสำเร็จ!', 'info', 3000)
    } else {
      showPopup('✅ อัปเดตยอดเงินสำเร็จ!', 'success', 3000)
    }
  } else {
    showPopup(`❌ ${balanceError.value || 'ไม่สามารถดึงยอดเงินได้'}`, 'error', 5000)
  }
}

const testLogin = async () => {
  try {
    showPopup('🔍 กำลังทดสอบการ login... (จะเปิด browser ให้ดู)', 'info', 5000)

    const response = await fetch('/api/balance/test-login')
    const data = await response.json()

    if (data.success) {
      showPopup(`✅ ทดสอบเสร็จสิ้น!\nยอดเงิน: ${formatBalance(data.data.balance)} บาท\nดูรายละเอียดใน Console`, 'success', 10000)
      console.log('Test result:', data)
    } else {
      showPopup(`❌ ทดสอบล้มเหลว: ${data.message}`, 'error', 10000)
      console.error('Test error:', data)
    }
  } catch (error: any) {
    showPopup(`❌ เกิดข้อผิดพลาด: ${error.message}`, 'error', 5000)
    console.error('Test error:', error)
  }
}

// Cleanup interval on unmount
onMounted(() => {
  return () => {
    if (autoFetchInterval.value) {
      clearInterval(autoFetchInterval.value)
    }
  }
})
</script>

<template>
<div class="max-w-7xl mx-auto p-6 space-y-6">
  <!-- Lottery Type Selector Modal -->
  <LotteryTypeSelector
    :show="showLotterySelector"
    @close="showLotterySelector = false"
  />

  <!-- ส่วนดึงข้อมูลหวยอัตโนมัติ -->
  <div class="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl shadow-2xl p-6 text-white">
    <h2 class="text-3xl font-bold mb-4 flex items-center gap-2">
      <span>🤖</span>
      <span>ระบบดึงข้อมูลหวยอัตโนมัติ</span>
    </h2>

    <div class="grid md:grid-cols-2 gap-6">
      <!-- ฝั่งซ้าย: ควบคุมการดึงข้อมูล -->
      <div class="space-y-4">
        <div class="bg-white/10 backdrop-blur rounded-lg p-4">
          <h3 class="font-semibold mb-3 text-xl">⚡ ดึงข้อมูลทันที</h3>
          <div class="space-y-2">
            <button
              @click="fetchLotteryNow"
              :disabled="isFetching"
              class="w-full bg-yellow-400 hover:bg-yellow-500 disabled:bg-gray-400 text-black py-3 rounded-lg font-bold text-lg shadow transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <span v-if="!isFetching">🎯 ดึงจาก racha-lotto.net</span>
              <span v-else class="flex items-center gap-2">
                <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                กำลังดึงข้อมูล...
              </span>
            </button>
            <button
              @click="fetchScraperNow"
              :disabled="isFetching"
              class="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white py-2 rounded-lg font-semibold shadow transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <span v-if="!isFetching">🤖 ดึงด้วย Puppeteer (Auto)</span>
              <span v-else>กำลัง scrape...</span>
            </button>
            <button
              @click="fetchDemoNow"
              :disabled="isFetching"
              class="w-full bg-cyan-400 hover:bg-cyan-500 disabled:bg-gray-400 text-black py-2 rounded-lg font-semibold shadow transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <span v-if="!isFetching">🧪 ทดสอบระบบ (Demo)</span>
              <span v-else>กำลังทดสอบ...</span>
            </button>
          </div>
          <p class="text-xs mt-2 opacity-70 text-center">
            💡 Puppeteer: local only | Demo: ทุกที่ | Manual: แนะนำสำหรับ production
          </p>
        </div>

        <div class="bg-white/10 backdrop-blur rounded-lg p-4">
          <h3 class="font-semibold mb-3 text-xl">⏰ ดึงอัตโนมัติ (ทุก 1 ชั่วโมง)</h3>
          <button
            @click="toggleAutoFetch"
            :class="[
              'w-full py-3 rounded-lg font-bold text-lg shadow transition-all active:scale-95',
              autoFetchEnabled
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-green-500 hover:bg-green-600'
            ]"
          >
            <span v-if="!autoFetchEnabled">▶️ เปิดใช้งาน</span>
            <span v-else>⏸️ ปิดใช้งาน</span>
          </button>
          <p class="text-sm mt-2 text-center opacity-80">
            สถานะ: <strong>{{ autoFetchEnabled ? '🟢 เปิดอยู่' : '🔴 ปิดอยู่' }}</strong>
          </p>
        </div>

        <div class="bg-white/10 backdrop-blur rounded-lg p-4">
          <h3 class="font-semibold mb-3 text-xl">✏️ เพิ่มเลขด้วยตัวเอง</h3>
          <div class="space-y-2">
            <input
              v-model="manualInput.threeDigit"
              type="text"
              inputmode="numeric"
              pattern="[0-9]*"
              maxlength="3"
              placeholder="เลข 3 ตัว"
              @input="manualInput.threeDigit = manualInput.threeDigit.replace(/\D/g, '')"
              class="w-full px-4 py-2 rounded-lg bg-white/20 text-white placeholder-white/60 border border-white/30 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400"
            />
            <input
              v-model="manualInput.date"
              type="date"
              class="w-full px-4 py-2 rounded-lg bg-white/20 text-white border border-white/30 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400"
            />
            <input
              v-model="manualInput.period"
              type="text"
              placeholder="งวด (ไม่บังคับ)"
              class="w-full px-4 py-2 rounded-lg bg-white/20 text-white placeholder-white/60 border border-white/30 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400"
            />
            <button
              @click="addManualLottery"
              class="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-lg font-semibold shadow transition-all active:scale-95"
            >
              ➕ เพิ่มผลหวย
            </button>
          </div>
        </div>
      </div>

      <!-- ฝั่งขวา: แสดงผลหวยที่บันทึกไว้ -->
      <div class="bg-white/10 backdrop-blur rounded-lg p-4">
        <h3 class="font-semibold mb-3 text-xl">📋 ผลหวยที่บันทึกไว้ (10 งวดล่าสุด)</h3>
        <div class="space-y-2 max-h-96 overflow-y-auto">
          <div
            v-for="(result, index) in lotteryResults"
            :key="index"
            class="bg-white/20 backdrop-blur rounded-lg p-3 border border-white/30"
          >
            <div class="flex justify-between items-center">
              <div>
                <p class="font-bold text-2xl text-yellow-300">{{ result.threeDigit }}</p>
                <p class="text-sm opacity-80">{{ result.date }} • {{ result.period }}</p>
              </div>
              <div class="text-right">
                <span class="text-xs bg-white/20 px-2 py-1 rounded">{{ result.source }}</span>
              </div>
            </div>
          </div>
          <div v-if="lotteryResults.length === 0" class="text-center py-8 opacity-60">
            ยังไม่มีข้อมูลหวย
          </div>
        </div>
      </div>
    </div>

    <!-- แสดง error ถ้ามี -->
    <div v-if="fetchError" class="mt-4 bg-red-500/20 border border-red-500 rounded-lg p-3 text-center">
      ⚠️ {{ fetchError }}
    </div>
  </div>

  <!-- ส่วนแสดงยอดเงิน -->
  <div class="bg-gradient-to-r from-green-600 to-emerald-800 rounded-xl shadow-2xl p-6 text-white">
    <h2 class="text-2xl font-bold mb-4 flex items-center gap-2">
      <span>💰</span>
      <span>ยอดเงินคงเหลือ</span>
    </h2>

    <div class="grid md:grid-cols-2 gap-4">
      <!-- ยอดเงิน -->
      <div class="bg-white/10 backdrop-blur rounded-lg p-6 text-center">
        <p class="text-sm opacity-80 mb-2">ยอดเงินปัจจุบัน</p>
        <div v-if="balanceData" class="space-y-2">
          <p class="text-5xl font-bold text-yellow-300 animate-pulse">
            {{ formatBalance(balanceData.balance) }}
          </p>
          <p class="text-xl font-semibold">บาท</p>
          <p class="text-xs opacity-70 mt-2">
            อัปเดตเมื่อ: {{ new Date(balanceData.fetchedAt).toLocaleString('th-TH') }}
          </p>
        </div>
        <div v-else-if="isFetchingBalance" class="py-8">
          <div class="flex items-center justify-center gap-2">
            <svg class="animate-spin h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>กำลังดึงยอดเงิน...</span>
          </div>
        </div>
        <div v-else class="py-8 text-center opacity-60">
          <p>ยังไม่มีข้อมูล</p>
          <p class="text-sm mt-2">คลิกปุ่มรีเฟรชเพื่อดึงข้อมูล</p>
        </div>
      </div>

      <!-- ควบคุม -->
      <div class="space-y-3">
        <button
          @click="refreshBalance(false)"
          :disabled="isFetchingBalance"
          class="w-full bg-yellow-400 hover:bg-yellow-500 disabled:bg-gray-400 text-black py-3 rounded-lg font-bold text-lg shadow transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <span v-if="!isFetchingBalance">🔄 รีเฟรชยอดเงิน (จริง)</span>
          <span v-else>กำลังดึงข้อมูล...</span>
        </button>

        <button
          @click="refreshBalance(true)"
          :disabled="isFetchingBalance"
          class="w-full bg-cyan-400 hover:bg-cyan-500 disabled:bg-gray-400 text-black py-2 rounded-lg font-semibold shadow transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <span v-if="!isFetchingBalance">🧪 ใช้ข้อมูลจำลอง (Mock)</span>
          <span v-else>กำลังสร้างข้อมูล...</span>
        </button>

        <button
          @click="testLogin"
          class="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-lg font-semibold shadow transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          🔍 ทดสอบการ Login (Debug Mode)
        </button>

        <div class="bg-white/10 backdrop-blur rounded-lg p-4 text-sm">
          <p class="font-semibold mb-2">ℹ️ ข้อมูล</p>
          <ul class="space-y-1 opacity-80">
            <li v-if="balanceData">• Username: {{ balanceData.username }}</li>
            <li v-if="balanceData">• แหล่งข้อมูล: {{ balanceData.source }}</li>
            <li>• ระบบจะพยายามดึงผ่าน HTTP → Puppeteer → Mock</li>
            <li>• ข้อมูลจะถูก cache เป็นเวลา 5 นาที</li>
            <li class="text-yellow-300">• แนะนำ: ใช้ Mock Data ถ้า Puppeteer มีปัญหา</li>
          </ul>
        </div>

        <div v-if="balanceError" class="bg-orange-500/20 border border-orange-500 rounded-lg p-3 text-sm">
          ⚠️ {{ balanceError }}
        </div>
      </div>
    </div>
  </div>

  <div class="flex gap-6 bg-white/80 backdrop-blur rounded-xl shadow-lg p-6 items-stretch">

    <!-- ซ้าย: รูปท้าวเวสสุวรรณ -->
    <div class="hidden md:flex w-1/3 justify-center items-center">
      <img
        src="/images/tao-wessuwan.png"
        alt="ท้าวเวสสุวรรณ"
        class="h-full max-h-[520px] object-contain drop-shadow-xl"
      />
    </div>

    <!-- ขวา: เนื้อหา -->
    <div class="flex-1">
      <!-- ปุ่มเลือกประเภทหวย -->
      <button
        @click="showLotterySelector = true"
        class="w-full mb-4 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg shadow-lg font-semibold text-lg transition-all flex items-center justify-center gap-2"
      >
        <span class="text-xl">📊</span>
        <span>{{ selectedLotteryType.displayName }}</span>
        <span class="text-sm opacity-80">(คลิกเพื่อเปลี่ยน)</span>
      </button>

      <h1 class="text-2xl font-bold text-vipGreen mb-2">
        Admin – สูตรขั้นสูง {{ selectedLotteryType.displayName }} VIP
      </h1>

      <!-- Confidence Badge -->
      <div v-if="confidence > 0" class="mb-4 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-lg">
        <span class="text-xl">💎</span>
        <span class="text-white font-bold text-sm">ความมั่นใจ: {{ confidence }}%</span>
      </div>

      <!-- Input + เพิ่มเลข -->
      <div class="flex gap-2 mb-4 items-center">
        <div class="relative flex-1">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-green-700 text-lg pointer-events-none">🔢</span>
          <input
            v-model="input"
            type="text"
            inputmode="numeric"
            pattern="[0-9]*"
            maxlength="3"
            placeholder="เลข 3 ตัว"
            @input="input = input.replace(/\D/g, '')"
            class="w-full pl-10 pr-3 py-2 rounded border-2 border-vipGreen bg-green-50 text-gray-900 focus:ring-2 focus:ring-vipGold"
          />
        </div>
        <button
          @click="addHistory"
          class="bg-vipGreen hover:bg-green-700 text-white px-4 py-2 rounded font-semibold shadow"
        >
          เพิ่ม
        </button>
      </div>

      <!-- ประวัติเลขย้อนหลัง -->
      <ul class="mb-4 grid grid-cols-2 gap-2 text-sm">
        <li
          v-for="(h, index) in history.slice(0, 6)"
          :key="h"
          :class="[
            'rounded text-center font-semibold transition-all flex justify-center items-center relative overflow-hidden cursor-default',
            index === 0
              ? 'px-4 py-1 shadow-2xl animate-glow-vip text-white' // 🔥 งวดล่าสุด
              : index === 1
              ? 'bg-yellow-400 text-black px-3 py-1 shadow-md scale-95 font-bold animate-pop-slow' // ⭐ งวดรอง
              : 'bg-green-100 text-green-900 px-3 py-1 text-opacity-70 backdrop-blur-sm' // 🍀 งวดเก่า
          ]"
        >
          <span v-if="index === 0" class="absolute inset-0 rounded -z-10 shadow-[0_0_25px_rgba(255,255,0,0.7),0_0_50px_rgba(255,0,0,0.5)]"></span>
          <span v-if="index === 0" class="mr-1">🔥</span>
          <span v-else-if="index === 1" class="mr-1">⭐</span>
          {{ h }}
        </li>
      </ul>

      <!-- ปุ่มคำนวณสูตรวันนี้ -->
      <button
        @click="calculate"
        class="w-full bg-yellow-400 hover:bg-yellow-500 text-black py-4 rounded-lg font-bold text-lg shadow active:scale-95 transition"
      >
        🔮 คำนวณสูตรวันนี้
      </button>

      <!-- ปุ่มล้างประวัติ -->
      <div class="relative mt-3">
  <button
    type="button"
    @click="clearHistory"
    class="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded font-semibold"
  >
    ล้างเลขย้อนหลัง
  </button>

  <!-- VIP Popup แสดงใต้ปุ่ม -->
  <transition name="vip-popup">
  <div
    v-if="vipPopup.show"
     :class="[
      'absolute left-1/2 -translate-x-1/2 mt-2 px-6 py-3 rounded-xl shadow-2xl font-bold text-lg text-white animate-popup-glow animate-rainbow min-w-[350px] text-center whitespace-pre-line',
      vipPopup.type === 'success' ? 'bg-green-500' :
      vipPopup.type === 'error' ? 'bg-red-500' :
      'bg-blue-500'
    ]"
  >
    {{ vipPopup.message }}
  </div>
</transition>
</div>
    </div>
  </div>
</div>
</template>

<style scoped>
/* Glow + Rainbow สำหรับงวดล่าสุด */
@keyframes glow-vip {
  0% { background: linear-gradient(90deg, #ff0000, #ffff00, #ff00ff); background-size: 200% 200%; }
  50% { background-position: 100% 0; }
  100% { background-position: 0 0; }
}
.animate-glow-vip {
  animation: glow-vip 1.5s linear infinite, pulse 1s ease-in-out infinite;
  color: white;
  text-shadow: 0 0 10px #fff, 0 0 20px #ff0, 0 0 30px #f0f, 0 0 40px #f00;
}

/* Pop เล็กสำหรับงวดรอง */
@keyframes pop-slow {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
.animate-pop-slow {
  animation: pop-slow 1.5s ease-in-out infinite;
}

/* Pulse เล็ก ๆ */
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}
@keyframes popup-glow {
  0%, 100% { box-shadow: 0 0 10px #fff, 0 0 20px #ff0, 0 0 30px #0ff, 0 0 40px #f0f; }
  50% { box-shadow: 0 0 20px #fff, 0 0 30px #ff0, 0 0 40px #0ff, 0 0 50px #f0f; }
}
.animate-popup-glow {
  animation: popup-glow 2s ease-in-out infinite;
}

@keyframes rainbow {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
.animate-rainbow {
  background: linear-gradient(270deg, #ff0000, #ff0, #0f0, #0ff, #00f, #f0f);
  background-size: 600% 600%;
  animation: rainbow 3s ease infinite;
}
</style>