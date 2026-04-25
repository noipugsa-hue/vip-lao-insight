<script setup lang="ts">
import { ref, computed } from 'vue'
import { lotteryTypes } from '../composables/useLotteryType'

const results = ref<Record<string, string>>({})

lotteryTypes.forEach(type => {
  results.value[type.id] = ''
})

const filledResults = computed(() => {
  return Object.entries(results.value).filter(([_, v]) => v.length === 3)
})
</script>

<template>
  <NuxtLayout name="main">
    <div class="max-w-4xl mx-auto">
      <div class="text-center mb-6">
        <div class="text-5xl mb-3">⚖️</div>
        <h1 class="text-3xl font-bold text-gray-800 mb-2">เปรียบเทียบผล</h1>
      </div>

      <div class="space-y-4">
        <div v-for="type in lotteryTypes" :key="type.id" class="bg-white/90 rounded-2xl shadow-lg p-4">
          <label class="block font-semibold text-gray-700 mb-2">{{ type.displayName }}</label>
          <input v-model="results[type.id]" type="text" maxlength="3" placeholder="000" class="w-full px-4 py-2 border-2 border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" style="color: #111827 !important;" />
        </div>
      </div>

      <div v-if="filledResults.length > 0" class="mt-6 bg-white/90 rounded-2xl shadow-lg p-6">
        <h2 class="text-lg font-bold mb-4 text-gray-800">📊 ผลลัพธ์</h2>
        <div class="space-y-2">
          <div v-for="[id, num] in filledResults" :key="id" class="flex justify-between p-3 bg-gray-50 rounded-lg">
            <span class="text-gray-700">{{ lotteryTypes.find(t => t.id === id)?.displayName }}</span>
            <span class="font-bold text-gray-900">{{ num }}</span>
          </div>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>
