<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useVipResult } from '../composables/useVipResult'

const { twoDigits, loadResult } = useVipResult()
const STORAGE_KEY = 'vip_lao_history'
const history = ref<string[]>([])

// โหลดข้อมูล
onMounted(() => {
  loadResult()
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) history.value = JSON.parse(saved)
})

// สร้างเลข 00-99 ทั้งหมด
const allNumbers = computed(() => {
  const numbers = []
  for (let i = 0; i < 100; i++) {
    numbers.push(i.toString().padStart(2, '0'))
  }
  return numbers
})

// คำนวณความถี่ของเลข 2 ตัว
const numberFrequency = computed(() => {
  const freq: Record<string, number> = {}

  // เริ่มต้นทุกเลขเป็น 0
  allNumbers.value.forEach(num => {
    freq[num] = 0
  })

  // นับจากประวัติ (นับทุกคู่ที่เป็นไปได้จากเลข 3 ตัว)
  history.value.forEach(num => {
    if (num.length === 3) {
      // นับ 2 ตัวแรก
      const first2 = num.slice(0, 2)
      freq[first2]++

      // นับ 2 ตัวหลัง
      const last2 = num.slice(1, 3)
      freq[last2]++
    }
  })

  return freq
})

// เลขที่แนะนำ (จากผลลัพธ์)
const recommendedNumbers = computed(() => {
  return twoDigits.value || []
})

// Hot numbers (ออกบ่อย)
const hotNumbers = computed(() => {
  return Object.entries(numberFrequency.value)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([num]) => num)
})

// Cold numbers (ไม่เคยออก)
const coldNumbers = computed(() => {
  return Object.entries(numberFrequency.value)
    .filter(([_, count]) => count === 0)
    .map(([num]) => num)
    .slice(0, 20)
})

// จัดกลุ่มตัวเลขเป็น 10x10
const numbersGrid = computed(() => {
  const grid = []
  for (let i = 0; i < 10; i++) {
    const row = []
    for (let j = 0; j < 10; j++) {
      const num = (i * 10 + j).toString().padStart(2, '0')
      row.push({
        num,
        count: numberFrequency.value[num] || 0,
        isRecommended: recommendedNumbers.value.includes(num)
      })
    }
    grid.push(row)
  }
  return grid
})
</script>

<template>
  <NuxtLayout name="main">
    <div class="max-w-6xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-6">
        <div class="text-5xl mb-3">🎯</div>
        <h1 class="text-3xl font-bold text-gray-800 mb-2">เลข 00-99</h1>
        <p class="text-gray-600">แสดงเลข 2 ตัวทั้งหมดพร้อมสถิติ</p>
      </div>

      <!-- Recommended Numbers -->
      <div v-if="recommendedNumbers.length > 0" class="mb-6 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl shadow-lg p-6">
        <h2 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span class="text-2xl">⭐</span>
          เลขแนะนำวันนี้
        </h2>
        <div class="flex flex-wrap gap-3 justify-center">
          <span
            v-for="num in recommendedNumbers"
            :key="num"
            class="px-5 py-3 bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 rounded-xl font-bold text-xl shadow-lg animate-pulse"
          >
            {{ num }}
          </span>
        </div>
      </div>

      <!-- Hot & Cold Numbers -->
      <div class="grid md:grid-cols-2 gap-6 mb-6">
        <!-- Hot Numbers -->
        <div class="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl shadow-lg p-6">
          <h2 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span class="text-2xl">🔥</span>
            Hot Numbers (ออกบ่อย)
          </h2>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="num in hotNumbers"
              :key="num"
              class="px-3 py-2 bg-gradient-to-r from-red-400 to-orange-500 text-white rounded-lg font-semibold text-sm shadow-md"
            >
              {{ num }}
            </span>
          </div>
          <p v-if="hotNumbers.length === 0" class="text-gray-500 text-sm">ยังไม่มีข้อมูล</p>
        </div>

        <!-- Cold Numbers -->
        <div class="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl shadow-lg p-6">
          <h2 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span class="text-2xl">❄️</span>
            Cold Numbers (ไม่เคยออก)
          </h2>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="num in coldNumbers"
              :key="num"
              class="px-3 py-2 bg-gradient-to-r from-blue-400 to-cyan-500 text-white rounded-lg font-semibold text-sm shadow-md"
            >
              {{ num }}
            </span>
          </div>
        </div>
      </div>

      <!-- Full 00-99 Grid -->
      <div class="bg-white/90 backdrop-blur rounded-2xl shadow-lg p-6">
        <h2 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span class="text-2xl">📊</span>
          ตารางเลข 00-99 ทั้งหมด
        </h2>
        <div class="overflow-x-auto">
          <table class="w-full border-collapse">
            <tbody>
              <tr v-for="(row, i) in numbersGrid" :key="i">
                <td
                  v-for="cell in row"
                  :key="cell.num"
                  class="border border-gray-200 p-2 text-center transition-all hover:scale-110 cursor-pointer"
                  :class="{
                    'bg-gradient-to-r from-yellow-300 to-yellow-500 text-gray-900 font-bold shadow-lg': cell.isRecommended,
                    'bg-gradient-to-r from-red-200 to-orange-200': !cell.isRecommended && cell.count > 2,
                    'bg-gradient-to-r from-green-100 to-green-200': !cell.isRecommended && cell.count > 0 && cell.count <= 2,
                    'bg-gray-50': !cell.isRecommended && cell.count === 0
                  }"
                >
                  <div class="text-lg font-semibold">{{ cell.num }}</div>
                  <div v-if="cell.count > 0" class="text-xs text-gray-600">{{ cell.count }}x</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Legend -->
        <div class="mt-4 flex flex-wrap gap-4 text-sm">
          <div class="flex items-center gap-2">
            <div class="w-6 h-6 bg-gradient-to-r from-yellow-300 to-yellow-500 rounded"></div>
            <span class="text-gray-600">เลขแนะนำ</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-6 h-6 bg-gradient-to-r from-red-200 to-orange-200 rounded"></div>
            <span class="text-gray-600">ออกบ่อย (&gt;2)</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-6 h-6 bg-gradient-to-r from-green-100 to-green-200 rounded"></div>
            <span class="text-gray-600">ออกบ้าง (1-2)</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-6 h-6 bg-gray-50 border border-gray-200 rounded"></div>
            <span class="text-gray-600">ไม่เคยออก</span>
          </div>
        </div>
      </div>

      <!-- Info -->
      <div class="mt-6 p-4 bg-blue-50 rounded-xl text-sm text-gray-600">
        <p class="font-semibold mb-2">💡 วิธีใช้งาน:</p>
        <ul class="space-y-1 text-xs">
          <li>• ตารางแสดงเลข 2 ตัวทั้งหมด 00-99</li>
          <li>• สีเหลือง = เลขแนะนำจากระบบคำนวณ</li>
          <li>• สีแดง-ส้ม = เลขที่ออกบ่อยจากประวัติ</li>
          <li>• สีเขียว = เลขที่ออกบ้าง</li>
          <li>• ตัวเลขด้านล่าง = จำนวนครั้งที่ออก</li>
        </ul>
      </div>
    </div>
  </NuxtLayout>
</template>
