<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const STORAGE_KEY = 'vip_lao_history'
const history = ref<string[]>([])

onMounted(() => {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) history.value = JSON.parse(saved)
})

const trends = computed(() => {
  if (history.value.length < 3) return null

  const recent = history.value.slice(0, 5)
  const digits = recent.join('').split('')

  const freq: Record<string, number> = {}
  digits.forEach(d => freq[d] = (freq[d] || 0) + 1)

  const hot = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([d]) => d)
  const cold = Array.from({length: 10}, (_, i) => i.toString()).filter(d => !freq[d])

  return { hot, cold, total: history.value.length }
})
</script>

<template>
  <NuxtLayout name="main">
    <div class="max-w-3xl mx-auto">
      <div class="text-center mb-6">
        <div class="text-5xl mb-3">🔍</div>
        <h1 class="text-3xl font-bold text-gray-800 mb-2">วิเคราะห์แนวโน้ม</h1>
      </div>

      <div v-if="!trends" class="text-center py-12 bg-white/90 rounded-2xl shadow-lg">
        <p class="text-gray-500">ยังไม่มีข้อมูลเพียงพอสำหรับวิเคราะห์</p>
      </div>

      <div v-else class="space-y-6">
        <div class="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl shadow-lg p-6">
          <h2 class="text-lg font-bold mb-4">🔥 เลขร้อน (Hot)</h2>
          <div class="flex gap-3">
            <span v-for="d in trends.hot" :key="d" class="px-6 py-3 bg-gradient-to-r from-red-400 to-orange-500 text-white rounded-xl font-bold text-2xl">{{ d }}</span>
          </div>
        </div>

        <div class="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl shadow-lg p-6">
          <h2 class="text-lg font-bold mb-4">❄️ เลขเย็น (Cold)</h2>
          <div class="flex flex-wrap gap-2">
            <span v-for="d in trends.cold" :key="d" class="px-4 py-2 bg-gradient-to-r from-blue-400 to-cyan-500 text-white rounded-lg font-semibold">{{ d }}</span>
          </div>
        </div>

        <div class="bg-white/90 rounded-2xl shadow-lg p-6">
          <h2 class="text-lg font-bold mb-4">📊 สถิติ</h2>
          <p class="text-gray-600">จำนวนงวดทั้งหมด: <span class="font-bold">{{ trends.total }}</span></p>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>
