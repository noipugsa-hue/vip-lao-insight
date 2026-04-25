<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { usePatternRecognition } from '../composables/usePatternRecognition'
import { useAccuracyTracking } from '../composables/useAccuracyTracking'
import { useVipResult } from '../composables/useVipResult'

const STORAGE_KEY = 'vip_lao_history'
const history = ref<string[]>([])

const { accuracyStats } = useAccuracyTracking()
const { hotNumbers, loadResult } = useVipResult()

onMounted(() => {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) history.value = JSON.parse(saved)
  loadResult()
})

const {
  findTwoStepPatterns,
  checkCurrentPattern,
  findHotStreaks,
  calculateOverallConfidence
} = usePatternRecognition(history.value)

// วิเคราะห์เลขที่ไม่ออกนาน
const longAbsentNumbers = computed(() => {
  const allDigits = Array.from({ length: 10 }, (_, i) => i.toString())
  const recent = history.value.slice(0, 10).join('')

  return allDigits
    .map(digit => ({
      digit,
      lastSeen: history.value.findIndex(h => h.includes(digit)),
      message: history.value.findIndex(h => h.includes(digit)) === -1
        ? 'ไม่เคยออกเลย!'
        : `ไม่ออกมา ${history.value.findIndex(h => h.includes(digit))} งวดแล้ว`
    }))
    .filter(d => d.lastSeen > 5 || d.lastSeen === -1)
    .sort((a, b) => (b.lastSeen === -1 ? 999 : b.lastSeen) - (a.lastSeen === -1 ? 999 : a.lastSeen))
    .slice(0, 5)
})

// คำนวณ Overall Confidence สำหรับเลขปัจจุบัน
const currentConfidence = computed(() => {
  if (hotNumbers.value.length === 0) return 0
  return calculateOverallConfidence(hotNumbers.value.map(String))
})
</script>

<template>
  <NuxtLayout name="main">
    <div class="max-w-5xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-6">
        <div class="text-5xl mb-3">💎</div>
        <h1 class="text-3xl font-bold text-gray-800 mb-2">VIP Insights</h1>
        <p class="text-gray-600">ข้อมูลเชิงลึกเพื่อความแม่นยำสูงสุด</p>
      </div>

      <!-- Accuracy Stats -->
      <div class="grid md:grid-cols-3 gap-4 mb-6">
        <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl shadow-lg p-6 text-center">
          <div class="text-4xl font-bold text-green-600 mb-2">{{ accuracyStats.accuracy }}%</div>
          <div class="text-sm text-gray-600">ความแม่นโดยรวม</div>
          <div class="text-xs text-gray-500 mt-1">{{ accuracyStats.correct }}/{{ accuracyStats.total }} ถูก</div>
        </div>

        <div class="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl shadow-lg p-6 text-center">
          <div class="text-4xl font-bold text-yellow-600 mb-2">{{ currentConfidence }}%</div>
          <div class="text-sm text-gray-600">Confidence ปัจจุบัน</div>
          <div class="text-xs text-gray-500 mt-1">สำหรับเลขแนะนำวันนี้</div>
        </div>

        <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-lg p-6 text-center">
          <div class="text-4xl font-bold text-blue-600 mb-2">{{ accuracyStats.highConfidence.accuracy }}%</div>
          <div class="text-sm text-gray-600">High Confidence</div>
          <div class="text-xs text-gray-500 mt-1">เลขที่มั่นใจ &gt;80%</div>
        </div>
      </div>

      <!-- Current Pattern Analysis -->
      <div v-if="checkCurrentPattern" class="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl shadow-lg p-6 mb-6">
        <h2 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span class="text-2xl">🔮</span>
          ลวดลายปัจจุบัน (2 งวดล่าสุด)
        </h2>
        <div class="bg-white/50 rounded-xl p-4">
          <div class="flex items-center gap-3 mb-3">
            <span class="px-4 py-2 bg-purple-500 text-white rounded-lg font-bold">{{ checkCurrentPattern.pattern.sequence[0] }}</span>
            <span class="text-2xl">→</span>
            <span class="px-4 py-2 bg-purple-500 text-white rounded-lg font-bold">{{ checkCurrentPattern.pattern.sequence[1] }}</span>
            <span class="text-2xl">→</span>
            <span class="text-gray-600 font-semibold">?</span>
          </div>
          <div class="text-sm text-gray-600 mb-2">{{ checkCurrentPattern.message }}</div>
          <div class="flex flex-wrap gap-2">
            <span class="text-xs text-gray-500">เลขที่อาจออก:</span>
            <span
              v-for="num in checkCurrentPattern.predictedNext"
              :key="num"
              class="px-3 py-1 bg-gradient-to-r from-purple-400 to-pink-500 text-white rounded-lg font-semibold text-sm"
            >
              {{ num }}
            </span>
          </div>
          <div class="mt-3 flex items-center gap-2">
            <span class="text-xs text-gray-600">Confidence:</span>
            <div class="flex-1 bg-gray-200 rounded-full h-2">
              <div
                class="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all"
                :style="{ width: `${checkCurrentPattern.confidence}%` }"
              ></div>
            </div>
            <span class="text-sm font-bold text-purple-600">{{ checkCurrentPattern.confidence }}%</span>
          </div>
        </div>
      </div>

      <!-- Hot Streaks -->
      <div v-if="findHotStreaks.length > 0" class="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl shadow-lg p-6 mb-6">
        <h2 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span class="text-2xl">🔥</span>
          Hot Streaks (เลขที่ซ้ำติดกัน)
        </h2>
        <div class="grid grid-cols-5 gap-3">
          <div
            v-for="streak in findHotStreaks"
            :key="streak.digit"
            class="text-center"
          >
            <div class="bg-gradient-to-r from-red-400 to-orange-500 text-white rounded-xl p-4 font-bold text-2xl mb-2">
              {{ streak.digit }}
            </div>
            <div class="text-xs text-gray-600">ซ้ำ {{ streak.count }} ครั้ง</div>
            <div class="text-xs text-orange-600 font-semibold">{{ streak.confidence }}%</div>
          </div>
        </div>
      </div>

      <!-- Top Patterns -->
      <div v-if="findTwoStepPatterns.length > 0" class="bg-white/90 rounded-2xl shadow-lg p-6 mb-6">
        <h2 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span class="text-2xl">📈</span>
          ลวดลายที่เกิดบ่อย (Top 5)
        </h2>
        <div class="space-y-3">
          <div
            v-for="(pattern, index) in findTwoStepPatterns.slice(0, 5)"
            :key="index"
            class="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition"
          >
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <span class="text-sm font-bold text-gray-500">#{{ index + 1 }}</span>
                <span class="px-3 py-1 bg-blue-500 text-white rounded-lg font-semibold">{{ pattern.sequence[0] }}</span>
                <span class="text-gray-400">→</span>
                <span class="px-3 py-1 bg-blue-500 text-white rounded-lg font-semibold">{{ pattern.sequence[1] }}</span>
              </div>
              <div class="text-sm text-gray-600">
                เกิด <span class="font-bold text-blue-600">{{ pattern.occurrences }}</span> ครั้ง
              </div>
            </div>
            <div class="flex flex-wrap gap-2 items-center">
              <span class="text-xs text-gray-500">งวดถัดไปมักออก:</span>
              <span
                v-for="next in pattern.nextNumbers.slice(0, 5)"
                :key="next"
                class="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold"
              >
                {{ next }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Long Absent Numbers -->
      <div class="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl shadow-lg p-6">
        <h2 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span class="text-2xl">❄️</span>
          เลขที่ไม่ออกนาน
        </h2>
        <div class="grid grid-cols-5 gap-3">
          <div
            v-for="absent in longAbsentNumbers"
            :key="absent.digit"
            class="text-center"
          >
            <div class="bg-gradient-to-r from-blue-400 to-cyan-500 text-white rounded-xl p-4 font-bold text-2xl mb-2">
              {{ absent.digit }}
            </div>
            <div class="text-xs text-gray-600">{{ absent.message }}</div>
          </div>
        </div>
        <div class="mt-4 p-3 bg-blue-100 rounded-lg text-xs text-gray-600">
          💡 <strong>Tips:</strong> เลขที่ไม่ออกนาน อาจมีโอกาสออกในงวดถัดไป (แต่ไม่รับประกัน!)
        </div>
      </div>

      <!-- Info -->
      <div class="mt-6 p-4 bg-yellow-50 rounded-xl text-sm text-gray-600">
        <p class="font-semibold mb-2">⚠️ คำเตือน:</p>
        <p class="text-xs">
          ข้อมูลทั้งหมดคำนวณจากสถิติและลวดลายในอดีต ไม่ได้รับประกันว่าจะถูกต้อง 100%
          หวยเป็นเรื่องของโอกาสและความสุ่ม ใช้ข้อมูลเป็นเพียงแนวทางเท่านั้น
        </p>
      </div>
    </div>
  </NuxtLayout>
</template>
