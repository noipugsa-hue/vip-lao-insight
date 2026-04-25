<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import { useLaoFormulaAdvanced } from '../composables/useLaoFormulaAdvanced'
import { useVipResult } from '../composables/useVipResult'
import { useRouter } from 'vue-router'
import { useVipPopup } from '../composables/useVipPopup'
import { useLotteryType } from '../composables/useLotteryType'

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

/* ✅ โหลดข้อมูลที่เคยเพิ่มไว้ */
onMounted(() => {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) history.value = JSON.parse(saved)
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
</script>

<template>
<div class="max-w-5xl mx-auto p-6">
  <!-- Lottery Type Selector Modal -->
  <LotteryTypeSelector
    :show="showLotterySelector"
    @close="showLotterySelector = false"
  />

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