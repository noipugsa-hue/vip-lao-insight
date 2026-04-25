<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const STORAGE_KEY = 'vip_lao_history'
const history = ref<string[]>([])

// โหลดประวัติ
onMounted(() => {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) history.value = JSON.parse(saved)
})

// คำนวณความถี่ของแต่ละหลัก
const digitFrequency = computed(() => {
  const freq: Record<string, number> = {}
  for (let i = 0; i < 10; i++) {
    freq[i.toString()] = 0
  }

  // นับจาก 5 งวดล่าสุด
  const last5 = history.value.slice(0, 5)
  last5.forEach(num => {
    num.split('').forEach(digit => {
      freq[digit]++
    })
  })

  return freq
})

// Top 5 เลขที่ออกบ่อยสุด
const top5Digits = computed(() => {
  return Object.entries(digitFrequency.value)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
})

// สร้างเลข 3 ตัวจาก top 5
const recommended3Digit = computed(() => {
  const digits = top5Digits.value.map(([digit]) => digit)
  const combinations: string[] = []

  // สุ่มสร้างชุดเลข 3 ตัว
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      for (let k = 0; k < 3; k++) {
        if (i !== j && j !== k && i !== k) {
          const num = digits[i] + digits[j] + digits[k]
          if (!combinations.includes(num)) {
            combinations.push(num)
          }
        }
      }
    }
  }

  return combinations.slice(0, 6)
})

// สร้างเลข 2 ตัวจาก top 5
const recommended2Digit = computed(() => {
  const digits = top5Digits.value.map(([digit]) => digit)
  const combinations: string[] = []

  for (let i = 0; i < digits.length; i++) {
    for (let j = 0; j < digits.length; j++) {
      if (i !== j) {
        const num = digits[i] + digits[j]
        if (!combinations.includes(num)) {
          combinations.push(num)
        }
      }
    }
  }

  return combinations.slice(0, 8)
})
</script>

<template>
  <NuxtLayout name="main">
    <div class="max-w-3xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-6">
        <div class="text-5xl mb-3">🏆</div>
        <h1 class="text-3xl font-bold text-gray-800 mb-2">วิน5รวม</h1>
        <p class="text-gray-600">เลขที่ออกบ่อยใน 5 งวดล่าสุด</p>
      </div>

      <!-- No Data -->
      <div v-if="history.length === 0" class="text-center py-12 bg-white/90 backdrop-blur rounded-2xl shadow-lg">
        <div class="text-6xl mb-4">📝</div>
        <h3 class="text-xl font-bold text-gray-700 mb-2">ยังไม่มีข้อมูล</h3>
        <p class="text-gray-500 mb-6">กรุณาไปที่หน้า "ใส่เลขเอง" เพื่อเพิ่มเลขย้อนหลัง</p>
        <NuxtLink
          to="/manual"
          class="inline-block px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold shadow-lg hover:from-green-600 hover:to-green-700 transition"
        >
          ✏️ ไปใส่เลขเอง
        </NuxtLink>
      </div>

      <!-- Has Data -->
      <div v-else class="space-y-6">
        <!-- Last 5 Numbers -->
        <div class="bg-white/90 backdrop-blur rounded-2xl shadow-lg p-6">
          <h2 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span class="text-2xl">📊</span>
            5 งวดล่าสุด
          </h2>
          <div class="grid grid-cols-5 gap-3">
            <div
              v-for="(num, index) in history.slice(0, 5)"
              :key="index"
              class="text-center"
            >
              <div class="text-xs text-gray-500 mb-1">งวด {{ index + 1 }}</div>
              <div class="px-4 py-3 bg-gradient-to-r from-blue-400 to-blue-600 text-white rounded-xl font-bold text-lg shadow-md">
                {{ num }}
              </div>
            </div>
          </div>
        </div>

        <!-- Top 5 Most Frequent Digits -->
        <div class="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl shadow-lg p-6">
          <h2 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span class="text-2xl">🔥</span>
            Top 5 เลขที่ออกบ่อยสุด
          </h2>
          <div class="grid grid-cols-5 gap-4">
            <div
              v-for="([digit, count], index) in top5Digits"
              :key="digit"
              class="text-center"
            >
              <div class="relative">
                <div
                  class="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg"
                  :class="index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                         index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-600' :
                         index === 2 ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
                         'bg-gradient-to-r from-green-400 to-green-600'"
                >
                  {{ digit }}
                </div>
                <div
                  v-if="index < 3"
                  class="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold"
                >
                  {{ index + 1 }}
                </div>
              </div>
              <div class="mt-2 text-sm font-semibold text-gray-600">
                ออก {{ count }} ครั้ง
              </div>
            </div>
          </div>
        </div>

        <!-- Recommended 3-Digit -->
        <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl shadow-lg p-6">
          <h2 class="text-lg font-bold text-green-800 mb-4 flex items-center gap-2">
            <span class="text-2xl">🎯</span>
            เลข 3 ตัวแนะนำ (จาก Top 5)
          </h2>
          <div class="flex flex-wrap gap-3 justify-center">
            <span
              v-for="num in recommended3Digit"
              :key="num"
              class="px-5 py-2 bg-gradient-to-r from-green-400 to-green-600 text-white rounded-xl font-semibold text-lg shadow-md"
            >
              {{ num }}
            </span>
          </div>
        </div>

        <!-- Recommended 2-Digit -->
        <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-lg p-6">
          <h2 class="text-lg font-bold text-blue-800 mb-4 flex items-center gap-2">
            <span class="text-2xl">💎</span>
            เลข 2 ตัวแนะนำ (จาก Top 5)
          </h2>
          <div class="flex flex-wrap gap-3 justify-center">
            <span
              v-for="num in recommended2Digit"
              :key="num"
              class="px-4 py-2 bg-gradient-to-r from-blue-400 to-blue-600 text-white rounded-lg font-semibold shadow-md"
            >
              {{ num }}
            </span>
          </div>
        </div>

        <!-- Digit Frequency Chart -->
        <div class="bg-white/90 backdrop-blur rounded-2xl shadow-lg p-6">
          <h2 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span class="text-2xl">📈</span>
            กราฟความถี่ (0-9)
          </h2>
          <div class="space-y-2">
            <div
              v-for="i in 10"
              :key="i-1"
              class="flex items-center gap-3"
            >
              <span class="w-8 font-bold text-gray-700">{{ i-1 }}</span>
              <div class="flex-1 bg-gray-200 rounded-full h-8 relative overflow-hidden">
                <div
                  class="bg-gradient-to-r from-green-400 to-green-600 h-full rounded-full flex items-center justify-end pr-3 text-white font-semibold text-sm transition-all"
                  :style="{ width: `${(digitFrequency[(i-1).toString()] / Math.max(...Object.values(digitFrequency))) * 100}%` }"
                >
                  {{ digitFrequency[(i-1).toString()] }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>
