<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useLaoFormula } from '../composables/useLaoFormula'
import { useVipResult } from '../composables/useVipResult'
import { useRouter } from 'vue-router'
import { useLotteryType } from '../composables/useLotteryType'

const router = useRouter()
const { selectedLotteryType } = useLotteryType()
const showLotterySelector = ref(false)

const history = ref<string[]>([])
const input = ref('')
const showSuccess = ref(false)

const { getHotNumbers, cutColdNumbers, mixFormula, generateThreeDigits } = useLaoFormula()
const { setResult, clearResult } = useVipResult()

// สร้าง storage key แบบ dynamic ตามประเภทหวย
const getStorageKey = (lotteryId: string) => `vip_lao_history_${lotteryId}`

/* โหลดข้อมูลที่เคยเพิ่มไว้ */
onMounted(() => {
  const storageKey = getStorageKey(selectedLotteryType.value.id)
  const saved = localStorage.getItem(storageKey)
  if (saved) history.value = JSON.parse(saved)
})

/* บันทึกทุกครั้งที่ history เปลี่ยน */
watch(history, (val) => {
  const storageKey = getStorageKey(selectedLotteryType.value.id)
  localStorage.setItem(storageKey, JSON.stringify(val))
}, { deep: true })

/* เคลียร์ข้อมูลเมื่อเปลี่ยนประเภทหวย */
watch(() => selectedLotteryType.value.id, (newType, oldType) => {
  if (oldType && newType !== oldType) {
    // เคลียร์ history ของประเภทเก่า
    history.value = []

    // เคลียร์ผลลัพธ์การคำนวณเก่า
    clearResult()

    // โหลด history ของประเภทใหม่
    const storageKey = getStorageKey(newType)
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      history.value = JSON.parse(saved)
    }

    // แจ้งเตือนผู้ใช้
    console.log(`เปลี่ยนจาก ${oldType} เป็น ${newType} - ล้างข้อมูลเก่าแล้ว`)
  }
})

const addHistory = () => {
  const value = input.value.trim()
  if (!/^\d{3}$/.test(value)) {
    alert('ใส่เลข 3 ตัวเท่านั้น')
    return
  }
  history.value.unshift(value)
  input.value = ''
}

const calculate = async () => {
  if (history.value.length < 3) {
    alert('กรุณาใส่เลขย้อนหลังอย่างน้อย 3 งวด')
    return
  }

  // คำนวณเลข
  const hot = getHotNumbers(history.value)
  const cut = cutColdNumbers(history.value)
  const two = mixFormula(hot, cut)
  const three = generateThreeDigits(hot, cut)

  // เก็บผลลัพธ์พร้อมประเภทหวย
  setResult(hot, two, three, selectedLotteryType.value.id)

  // แสดง success message
  showSuccess.value = true
  setTimeout(() => {
    showSuccess.value = false
  }, 2000)

  // ไปหน้า home
  setTimeout(() => {
    router.push('/home')
  }, 2000)
}

const clearHistory = () => {
  if (!confirm('ต้องการล้างเลขย้อนหลังทั้งหมดใช่หรือไม่?')) return
  history.value = []
  const storageKey = getStorageKey(selectedLotteryType.value.id)
  localStorage.removeItem(storageKey)
}
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
        🎯 คำนวณสำเร็จ! กำลังไปหน้าหลัก...
      </div>
    </Transition>

    <div class="max-w-2xl mx-auto">
      <!-- Lottery Type Selector Button -->
      <button
        @click="showLotterySelector = true"
        class="w-full mb-4 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg shadow-lg font-semibold text-lg transition-all flex items-center justify-center gap-2"
      >
        <span class="text-xl">📊</span>
        <span>{{ selectedLotteryType.displayName }}</span>
        <span class="text-sm opacity-80">(คลิกเพื่อเปลี่ยน)</span>
      </button>

      <!-- Main Card -->
      <div class="bg-white/90 backdrop-blur rounded-2xl shadow-lg p-6">
        <h1 class="text-2xl font-bold text-gray-800 mb-6 text-center">
          ✏️ ใส่เลขย้อนหลัง - {{ selectedLotteryType.displayName }}
        </h1>

        <!-- Input + Add Button -->
        <div class="flex gap-2 mb-6">
          <div class="relative flex-1">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-green-700 text-xl pointer-events-none">🔢</span>
            <input
              v-model="input"
              type="text"
              inputmode="numeric"
              pattern="[0-9]*"
              maxlength="3"
              placeholder="เลข 3 ตัว"
              @input="input = input.replace(/\D/g, '')"
              @keyup.enter="addHistory"
              class="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-green-200 bg-green-50 text-gray-900 text-lg font-semibold focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
            />
          </div>
          <button
            @click="addHistory"
            class="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold shadow-lg transition transform active:scale-95"
          >
            เพิ่ม
          </button>
        </div>

        <!-- History Display -->
        <div v-if="history.length > 0" class="mb-6">
          <h3 class="text-sm font-semibold text-gray-600 mb-3">เลขย้อนหลัง (6 งวดล่าสุด)</h3>
          <div class="grid grid-cols-3 gap-3">
            <div
              v-for="(h, index) in history.slice(0, 6)"
              :key="index"
              class="px-4 py-3 rounded-xl text-center font-bold text-lg transition-all"
              :class="[
                index === 0
                  ? 'bg-gradient-to-r from-red-400 to-red-600 text-white shadow-lg animate-pulse'
                  : index === 1
                  ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 shadow-md'
                  : 'bg-gray-100 text-gray-600'
              ]"
            >
              <div class="text-xs opacity-70 mb-1">
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
          <p class="text-sm">กรอกเลข 3 ตัวแล้วกดเพิ่ม</p>
        </div>

        <!-- Action Buttons -->
        <div class="space-y-3">
          <button
            @click="calculate"
            :disabled="history.length < 3"
            class="w-full py-4 rounded-xl font-bold text-lg shadow-lg transition transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            :class="history.length >= 3
              ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-gray-900'
              : 'bg-gray-300 text-gray-500'"
          >
            🔮 คำนวณสูตรวันนี้
          </button>

          <button
            v-if="history.length > 0"
            @click="clearHistory"
            class="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold shadow transition"
          >
            🗑️ ล้างเลขย้อนหลัง
          </button>
        </div>

        <!-- Info -->
        <div class="mt-6 p-4 bg-blue-50 rounded-xl text-sm text-gray-600">
          <p class="font-semibold mb-2">💡 วิธีใช้งาน:</p>
          <ul class="space-y-1 text-xs">
            <li>1. กรอกเลข 3 ตัวของงวดย้อนหลัง</li>
            <li>2. ใส่อย่างน้อย 3 งวด (แนะนำ 6 งวด)</li>
            <li>3. กดคำนวณสูตรวันนี้</li>
            <li>4. ดูผลลัพธ์ที่หน้าหลัก</li>
          </ul>
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
</style>
