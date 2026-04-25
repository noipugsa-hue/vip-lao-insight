<script setup lang="ts">
import { ref, computed } from 'vue'

const currentDate = new Date()
const currentYear = ref(currentDate.getFullYear())
const currentMonth = ref(currentDate.getMonth())

const monthNames = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']

const daysInMonth = computed(() => {
  const firstDay = new Date(currentYear.value, currentMonth.value, 1)
  const lastDay = new Date(currentYear.value, currentMonth.value + 1, 0)

  const days = []
  const startOffset = firstDay.getDay()

  for (let i = 0; i < startOffset; i++) {
    days.push(null)
  }

  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(i)
  }

  return days
})

const prevMonth = () => {
  if (currentMonth.value === 0) {
    currentMonth.value = 11
    currentYear.value--
  } else {
    currentMonth.value--
  }
}

const nextMonth = () => {
  if (currentMonth.value === 11) {
    currentMonth.value = 0
    currentYear.value++
  } else {
    currentMonth.value++
  }
}

// วันที่ออกหวย (ตัวอย่าง: วันที่ 1 และ 16)
const isLotteryDay = (day: number | null) => {
  if (!day) return false
  return day === 1 || day === 16
}
</script>

<template>
  <NuxtLayout name="main">
    <div class="max-w-4xl mx-auto">
      <div class="text-center mb-6">
        <div class="text-5xl mb-3">📅</div>
        <h1 class="text-3xl font-bold text-gray-800 mb-2">ปฏิทินออกผลหวย</h1>
      </div>

      <div class="bg-white/90 rounded-2xl shadow-lg p-6">
        <div class="flex items-center justify-between mb-6">
          <button @click="prevMonth" class="px-4 py-2 bg-gray-200 rounded-lg font-semibold">◀</button>
          <h2 class="text-xl font-bold">{{ monthNames[currentMonth] }} {{ currentYear + 543 }}</h2>
          <button @click="nextMonth" class="px-4 py-2 bg-gray-200 rounded-lg font-semibold">▶</button>
        </div>

        <div class="grid grid-cols-7 gap-2">
          <div v-for="day in ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']" :key="day" class="text-center font-bold text-gray-600 py-2">
            {{ day }}
          </div>

          <div v-for="(day, i) in daysInMonth" :key="i" class="aspect-square">
            <div v-if="day" class="w-full h-full flex items-center justify-center rounded-lg transition-all" :class="isLotteryDay(day) ? 'bg-gradient-to-r from-yellow-300 to-yellow-500 text-gray-900 font-bold shadow-lg' : 'bg-gray-50 hover:bg-gray-100'">
              {{ day }}
            </div>
          </div>
        </div>

        <div class="mt-6 p-4 bg-yellow-50 rounded-xl">
          <p class="text-sm text-gray-600">
            <span class="inline-block w-4 h-4 bg-gradient-to-r from-yellow-300 to-yellow-500 rounded mr-2"></span>
            วันออกหวย (ตัวอย่าง: วันที่ 1 และ 16 ของทุกเดือน)
          </p>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>
