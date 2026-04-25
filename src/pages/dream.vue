<script setup lang="ts">
import { ref } from 'vue'
import { useDreamPrediction } from '../composables/useDreamPrediction'

const dreamText = ref('')
const { isAnalyzing, dreamResult, error, analyzeDream } = useDreamPrediction()

const handleAnalyze = () => {
  if (dreamText.value.trim().length < 5) {
    alert('กรุณาใส่เนื้อหาฝันอย่างน้อย 5 ตัวอักษร')
    return
  }
  analyzeDream(dreamText.value)
}

const getConfidenceColor = (confidence: number) => {
  if (confidence >= 80) return 'from-green-500 to-green-600'
  if (confidence >= 60) return 'from-yellow-500 to-yellow-600'
  return 'from-gray-400 to-gray-500'
}
</script>

<template>
  <NuxtLayout name="main">
    <div class="max-w-2xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-6">
        <div class="text-6xl mb-3">💭</div>
        <h1 class="text-3xl font-bold text-gray-800 mb-2">
          ทำนายฝัน
        </h1>
        <p class="text-gray-600">
          ใส่เนื้อหาฝันของคุณ แล้ว AI จะวิเคราะห์และให้เลขโชคดี
        </p>
      </div>

      <!-- Input Form -->
      <div class="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <label class="block text-sm font-semibold text-gray-700 mb-2">
          🌙 เล่าฝันของคุณ
        </label>
        <textarea
          v-model="dreamText"
          :disabled="isAnalyzing"
          class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition resize-none text-gray-900 text-base"
          rows="6"
          placeholder="ตอนนี้ที่ฝันไป ฉันเห็น..."
        ></textarea>

        <button
          @click="handleAnalyze"
          :disabled="isAnalyzing || dreamText.trim().length < 5"
          class="w-full mt-4 px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold text-lg shadow-lg hover:from-purple-600 hover:to-pink-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="!isAnalyzing">✨ วิเคราะห์ฝัน</span>
          <span v-else class="flex items-center justify-center gap-2">
            <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            กำลังวิเคราะห์...
          </span>
        </button>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="bg-red-50 border-2 border-red-200 rounded-2xl p-4 mb-6">
        <p class="text-red-600 text-center">⚠️ {{ error }}</p>
      </div>

      <!-- Results -->
      <div v-if="dreamResult" class="space-y-4 animate-fadeIn">
        <!-- Interpretation -->
        <div class="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 shadow-lg">
          <div class="flex items-center gap-2 mb-3">
            <span class="text-2xl">🔮</span>
            <h2 class="text-lg font-bold text-purple-800">ความหมายของฝัน</h2>
          </div>
          <p class="text-gray-700 leading-relaxed">{{ dreamResult.interpretation }}</p>

          <div class="mt-4 flex items-center justify-between">
            <div class="text-sm text-gray-600">
              สัญลักษณ์ที่พบ: <strong class="text-purple-700">{{ dreamResult.keywords.join(', ') }}</strong>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-600">ความมั่นใจ:</span>
              <span
                class="px-3 py-1 rounded-full text-white font-bold text-sm bg-gradient-to-r"
                :class="getConfidenceColor(dreamResult.confidence)"
              >
                {{ dreamResult.confidence }}%
              </span>
            </div>
          </div>
        </div>

        <!-- Lucky Numbers - 2 Digits -->
        <div class="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-6 shadow-lg">
          <div class="flex items-center gap-2 mb-4">
            <span class="text-2xl">🎯</span>
            <h2 class="text-lg font-bold text-yellow-800">เลขโชคดี 2 ตัว</h2>
          </div>
          <div class="grid grid-cols-3 gap-3">
            <div
              v-for="num in dreamResult.luckyNumbers.twoDigit"
              :key="num"
              class="bg-white/70 rounded-xl p-4 shadow-md text-center"
            >
              <span class="text-2xl font-bold text-yellow-700">{{ num }}</span>
            </div>
          </div>
        </div>

        <!-- Lucky Numbers - 3 Digits -->
        <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 shadow-lg">
          <div class="flex items-center gap-2 mb-4">
            <span class="text-2xl">🎲</span>
            <h2 class="text-lg font-bold text-blue-800">เลขโชคดี 3 ตัว</h2>
          </div>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div
              v-for="num in dreamResult.luckyNumbers.threeDigit"
              :key="num"
              class="bg-white/70 rounded-xl p-4 shadow-md text-center"
            >
              <span class="text-2xl font-bold text-blue-700">{{ num }}</span>
            </div>
          </div>
        </div>

        <!-- Lucky Numbers - 4 Digits -->
        <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 shadow-lg">
          <div class="flex items-center gap-2 mb-4">
            <span class="text-2xl">🎰</span>
            <h2 class="text-lg font-bold text-green-800">เลขโชคดี 4 ตัว</h2>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div
              v-for="num in dreamResult.luckyNumbers.fourDigit"
              :key="num"
              class="bg-white/70 rounded-xl p-4 shadow-md text-center"
            >
              <span class="text-2xl font-bold text-green-700">{{ num }}</span>
            </div>
          </div>
        </div>

        <!-- Disclaimer -->
        <div class="bg-gray-50 rounded-2xl p-4 text-center">
          <p class="text-xs text-gray-500">
            ℹ️ การทำนายนี้เป็นเพียงความบันเทิงเท่านั้น ไม่รับประกันความถูกต้อง
          </p>
        </div>
      </div>

      <!-- Initial State -->
      <div v-else-if="!isAnalyzing && !error" class="text-center py-12">
        <div class="text-6xl mb-4">🌙</div>
        <h3 class="text-xl font-bold text-gray-700 mb-2">เริ่มต้นทำนายฝัน</h3>
        <p class="text-gray-500">ใส่เนื้อหาฝันของคุณด้านบนแล้วกดปุ่มวิเคราะห์</p>
      </div>
    </div>
  </NuxtLayout>
</template>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.5s ease-out;
}
</style>
