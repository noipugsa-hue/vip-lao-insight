<script setup lang="ts">
import { computed } from 'vue'
import type { PrecisionNumber, PrecisionResult } from '../composables/usePrecisionFormula'

const props = defineProps<{
  result: PrecisionResult
}>()

/**
 * สีตาม confidence level
 */
const getConfidenceColor = (confidence: number) => {
  if (confidence >= 85) return 'from-green-500 to-emerald-600'
  if (confidence >= 75) return 'from-blue-500 to-indigo-600'
  if (confidence >= 65) return 'from-yellow-500 to-orange-600'
  return 'from-gray-500 to-gray-600'
}

const getConfidenceBadgeColor = (confidence: number) => {
  if (confidence >= 85) return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
  if (confidence >= 75) return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
  if (confidence >= 65) return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
  return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
}

const getConfidenceBarColor = (confidence: number) => {
  if (confidence >= 85) return 'bg-gradient-to-r from-green-500 to-emerald-600'
  if (confidence >= 75) return 'bg-gradient-to-r from-blue-500 to-indigo-600'
  if (confidence >= 65) return 'bg-gradient-to-r from-yellow-500 to-orange-600'
  return 'bg-gradient-to-r from-gray-500 to-gray-600'
}

const getConfidenceLabel = (confidence: number) => {
  if (confidence >= 85) return 'แม่นสูง'
  if (confidence >= 75) return 'แม่นยำ'
  if (confidence >= 65) return 'ดี'
  return 'ปานกลาง'
}

/**
 * Icon ตาม confidence
 */
const getConfidenceIcon = (confidence: number) => {
  if (confidence >= 85) return '🎯' // แม่นสูง
  if (confidence >= 75) return '⭐' // แม่นยำ
  if (confidence >= 65) return '✨' // ดี
  return '💫' // ปานกลาง
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- Overall Confidence -->
      <div class="col-span-1 md:col-span-3 relative group">
        <div class="absolute -inset-0.5 bg-gradient-to-r from-purple-400 to-pink-600 rounded-2xl opacity-75 group-hover:opacity-100 transition duration-300 blur-md"></div>
        <div class="relative bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span class="text-3xl">📊</span>
              </div>
              <div>
                <h3 class="text-2xl font-black text-gray-900 dark:text-white">
                  {{ result.overallConfidence }}%
                </h3>
                <p class="text-sm text-gray-600 dark:text-gray-400 font-semibold">
                  ความแม่นยำโดยรวม
                </p>
              </div>
            </div>
            <div class="text-right">
              <div :class="getConfidenceBadgeColor(result.overallConfidence)" class="px-4 py-2 rounded-xl font-bold text-lg shadow-md">
                {{ getConfidenceLabel(result.overallConfidence) }}
              </div>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">
                วิเคราะห์: {{ result.analysisDate }}
              </p>
            </div>
          </div>

          <!-- Progress Bar -->
          <div class="mt-4 relative h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
            <div
              :class="getConfidenceBarColor(result.overallConfidence)"
              class="h-full rounded-full transition-all duration-1000 ease-out relative"
              :style="{ width: `${result.overallConfidence}%` }"
            >
              <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-4 shadow-lg">
        <div class="flex items-center gap-3 mb-2">
          <span class="text-2xl">🔥</span>
          <h4 class="font-bold text-green-700 dark:text-green-300">เลขเด่น</h4>
        </div>
        <p class="text-3xl font-black text-green-600 dark:text-green-400">{{ result.hotNumbers.length }}</p>
        <p class="text-xs text-green-600/70 dark:text-green-400/70">ตัวเลขเด่นคุณภาพสูง</p>
      </div>

      <div class="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-4 shadow-lg">
        <div class="flex items-center gap-3 mb-2">
          <span class="text-2xl">🎯</span>
          <h4 class="font-bold text-blue-700 dark:text-blue-300">เลข 2 ตัว</h4>
        </div>
        <p class="text-3xl font-black text-blue-600 dark:text-blue-400">{{ result.twoDigits.length }}</p>
        <p class="text-xs text-blue-600/70 dark:text-blue-400/70">ชุดที่แนะนำ</p>
      </div>

      <div class="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-4 shadow-lg">
        <div class="flex items-center gap-3 mb-2">
          <span class="text-2xl">🎲</span>
          <h4 class="font-bold text-purple-700 dark:text-purple-300">เลข 3 ตัว</h4>
        </div>
        <p class="text-3xl font-black text-purple-600 dark:text-purple-400">{{ result.threeDigits.length }}</p>
        <p class="text-xs text-purple-600/70 dark:text-purple-400/70">ชุดที่แนะนำ</p>
      </div>
    </div>

    <!-- Hot Numbers (เลขเด่น) -->
    <div v-if="result.hotNumbers.length > 0" class="relative group">
      <div class="absolute -inset-0.5 bg-gradient-to-r from-green-400 to-emerald-600 rounded-3xl opacity-60 group-hover:opacity-100 transition duration-300 blur-md"></div>

      <div class="relative bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-green-900/20 rounded-3xl p-6 shadow-2xl">
        <!-- Header -->
        <div class="flex items-center gap-3 mb-6">
          <div class="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
            <span class="text-3xl">🔥</span>
          </div>
          <div>
            <h2 class="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">
              เลขเด่น TOP {{ result.hotNumbers.length }}
            </h2>
            <p class="text-sm text-green-700/70 dark:text-green-300/70 font-semibold">
              ตัวเลขที่มีโอกาสออกสูงสุด
            </p>
          </div>
        </div>

        <!-- Numbers Grid -->
        <div class="space-y-4">
          <div
            v-for="(item, index) in result.hotNumbers"
            :key="item.number"
            class="group/item relative"
          >
            <!-- Card Border Glow -->
            <div class="absolute -inset-0.5 rounded-2xl opacity-0 group-hover/item:opacity-75 transition duration-300 blur-sm"
                 :class="`bg-gradient-to-r ${getConfidenceColor(item.confidence)}`"></div>

            <div class="relative bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-xl transform transition-all hover:scale-102">
              <div class="flex items-center gap-4">
                <!-- Rank Badge -->
                <div class="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center font-black text-gray-600 dark:text-gray-300 shadow-md">
                  #{{ index + 1 }}
                </div>

                <!-- Number Display -->
                <div class="flex-shrink-0">
                  <div
                    :class="`px-8 py-4 bg-gradient-to-br ${getConfidenceColor(item.confidence)} text-white rounded-2xl font-black text-4xl shadow-2xl`"
                  >
                    {{ item.number }}
                  </div>
                </div>

                <!-- Info & Scores -->
                <div class="flex-1 min-w-0">
                  <!-- Confidence Badge -->
                  <div class="flex items-center gap-2 mb-2">
                    <span class="text-2xl">{{ getConfidenceIcon(item.confidence) }}</span>
                    <div :class="getConfidenceBadgeColor(item.confidence)" class="px-3 py-1.5 rounded-xl font-black text-xl shadow-md">
                      {{ item.confidence }}%
                    </div>
                    <span :class="getConfidenceBadgeColor(item.confidence)" class="px-3 py-1 rounded-full text-sm font-bold">
                      {{ getConfidenceLabel(item.confidence) }}
                    </span>
                  </div>

                  <!-- Reason -->
                  <p class="text-sm text-gray-700 dark:text-gray-300 font-semibold mb-3">
                    📌 {{ item.reason }}
                  </p>

                  <!-- Score Breakdown -->
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg px-2 py-1">
                      <p class="text-xs text-blue-600 dark:text-blue-400 font-bold">Gap</p>
                      <p class="text-sm font-black text-blue-700 dark:text-blue-300">{{ item.gapScore }}%</p>
                    </div>
                    <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg px-2 py-1">
                      <p class="text-xs text-purple-600 dark:text-purple-400 font-bold">ความถี่</p>
                      <p class="text-sm font-black text-purple-700 dark:text-purple-300">{{ item.freqScore.toFixed(0) }}%</p>
                    </div>
                    <div class="bg-pink-50 dark:bg-pink-900/20 rounded-lg px-2 py-1">
                      <p class="text-xs text-pink-600 dark:text-pink-400 font-bold">คู่</p>
                      <p class="text-sm font-black text-pink-700 dark:text-pink-300">{{ item.pairScore.toFixed(0) }}%</p>
                    </div>
                    <div class="bg-orange-50 dark:bg-orange-900/20 rounded-lg px-2 py-1">
                      <p class="text-xs text-orange-600 dark:text-orange-400 font-bold">รูปแบบ</p>
                      <p class="text-sm font-black text-orange-700 dark:text-orange-300">{{ item.patternScore.toFixed(0) }}%</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Progress Bar -->
              <div class="mt-4 relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
                <div
                  :class="getConfidenceBarColor(item.confidence)"
                  class="h-full rounded-full transition-all duration-1000 ease-out"
                  :style="{ width: `${item.confidence}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 2-Digit Numbers (เลข 2 ตัว) -->
    <div v-if="result.twoDigits.length > 0" class="relative group">
      <div class="absolute -inset-0.5 bg-gradient-to-r from-yellow-400 to-orange-600 rounded-3xl opacity-60 group-hover:opacity-100 transition duration-300 blur-md"></div>

      <div class="relative bg-gradient-to-br from-yellow-50 via-orange-50 to-yellow-100 dark:from-yellow-900/20 dark:via-orange-900/20 dark:to-yellow-900/20 rounded-3xl p-6 shadow-2xl">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-14 h-14 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
            <span class="text-3xl">🎯</span>
          </div>
          <div>
            <h2 class="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-orange-600">
              เลข 2 ตัว TOP {{ result.twoDigits.length }}
            </h2>
            <p class="text-sm text-yellow-700/70 dark:text-yellow-300/70 font-semibold">
              คัดเลือกเฉพาะชุดที่มีโอกาสสูง
            </p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="(item, index) in result.twoDigits"
            :key="item.number"
            class="group/item relative"
          >
            <div class="absolute -inset-0.5 rounded-2xl opacity-0 group-hover/item:opacity-75 transition duration-300 blur-sm"
                 :class="`bg-gradient-to-r ${getConfidenceColor(item.confidence)}`"></div>

            <div class="relative bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-xl">
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-3">
                  <span class="text-lg font-black text-gray-500 dark:text-gray-400">#{{ index + 1 }}</span>
                  <div :class="`px-6 py-3 bg-gradient-to-br ${getConfidenceColor(item.confidence)} text-white rounded-xl font-black text-2xl shadow-lg`">
                    {{ item.number }}
                  </div>
                </div>
                <div :class="getConfidenceBadgeColor(item.confidence)" class="px-3 py-1.5 rounded-xl font-black text-lg shadow-md">
                  {{ item.confidence }}%
                </div>
              </div>

              <p class="text-xs text-gray-600 dark:text-gray-400 mb-2">{{ item.reason }}</p>

              <div class="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  :class="getConfidenceBarColor(item.confidence)"
                  class="h-full rounded-full transition-all duration-1000 ease-out"
                  :style="{ width: `${item.confidence}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 3-Digit Numbers (เลข 3 ตัว) -->
    <div v-if="result.threeDigits.length > 0" class="relative group">
      <div class="absolute -inset-0.5 bg-gradient-to-r from-blue-400 to-indigo-600 rounded-3xl opacity-60 group-hover:opacity-100 transition duration-300 blur-md"></div>

      <div class="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-blue-900/20 rounded-3xl p-6 shadow-2xl">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
            <span class="text-3xl">🎲</span>
          </div>
          <div>
            <h2 class="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              เลข 3 ตัว TOP {{ result.threeDigits.length }}
            </h2>
            <p class="text-sm text-blue-700/70 dark:text-blue-300/70 font-semibold">
              คัดเลือกเฉพาะชุดที่มีโอกาสสูง
            </p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="(item, index) in result.threeDigits"
            :key="item.number"
            class="group/item relative"
          >
            <div class="absolute -inset-0.5 rounded-2xl opacity-0 group-hover/item:opacity-75 transition duration-300 blur-sm"
                 :class="`bg-gradient-to-r ${getConfidenceColor(item.confidence)}`"></div>

            <div class="relative bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-xl">
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-3">
                  <span class="text-lg font-black text-gray-500 dark:text-gray-400">#{{ index + 1 }}</span>
                  <div :class="`px-5 py-3 bg-gradient-to-br ${getConfidenceColor(item.confidence)} text-white rounded-xl font-black text-2xl shadow-lg`">
                    {{ item.number }}
                  </div>
                </div>
                <div :class="getConfidenceBadgeColor(item.confidence)" class="px-3 py-1.5 rounded-xl font-black text-lg shadow-md">
                  {{ item.confidence }}%
                </div>
              </div>

              <p class="text-xs text-gray-600 dark:text-gray-400 mb-2">{{ item.reason }}</p>

              <div class="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  :class="getConfidenceBarColor(item.confidence)"
                  class="h-full rounded-full transition-all duration-1000 ease-out"
                  :style="{ width: `${item.confidence}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Info Box -->
    <div class="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 shadow-lg border-2 border-purple-200 dark:border-purple-700">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
          <span class="text-2xl">💡</span>
        </div>
        <div class="flex-1">
          <h3 class="text-lg font-black text-purple-700 dark:text-purple-300 mb-2">
            วิธีใช้ Precision Mode
          </h3>
          <ul class="space-y-2 text-sm text-purple-600 dark:text-purple-400">
            <li class="flex items-start gap-2">
              <span class="flex-shrink-0 mt-0.5">✓</span>
              <span><strong>เลขน้อยแต่แม่น:</strong> คัดเลือกเฉพาะเลขที่มีโอกาสสูงสุด (TOP 3-5 เท่านั้น)</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="flex-shrink-0 mt-0.5">✓</span>
              <span><strong>% โอกาส:</strong> แสดงเปอร์เซ็นต์ความมั่นใจตามการวิเคราะห์หลายมิติ</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="flex-shrink-0 mt-0.5">✓</span>
              <span><strong>เหตุผล:</strong> แสดงเหตุผลว่าทำไมถึงแนะนำเลขนี้</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="flex-shrink-0 mt-0.5">✓</span>
              <span><strong>Threshold สูง:</strong> กรองเฉพาะเลขที่มี confidence > 70%</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.animate-shimmer {
  animation: shimmer 3s ease-in-out infinite;
}
</style>
