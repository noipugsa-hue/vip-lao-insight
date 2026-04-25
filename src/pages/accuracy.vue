<script setup lang="ts">
import { ref } from 'vue'
import { useEngineSettings, calculationModes } from '../composables/useEngineSettings'

const { settings, setAccuracyLevel, setCalculationMode, toggleNumberPreference, resetSettings, getNumberStats } = useEngineSettings()

const showAppliedMessage = ref(false)

const applySettings = () => {
  showAppliedMessage.value = true
  setTimeout(() => {
    showAppliedMessage.value = false
  }, 2000)
}

const stats = getNumberStats()
</script>

<template>
  <NuxtLayout name="main">
    <div class="max-w-2xl mx-auto space-y-4">
      <!-- Success Message -->
      <Transition name="fade">
        <div
          v-if="showAppliedMessage"
          class="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-xl font-bold"
        >
          ✓ ใช้งานสำเร็จ
        </div>
      </Transition>

      <!-- Engine Settings Card -->
      <div class="bg-white/90 backdrop-blur rounded-2xl shadow-lg p-6">
        <div class="flex items-center gap-3 mb-4">
          <span class="text-3xl">📊</span>
          <h2 class="text-xl font-bold text-gray-800">ปรับความแม่น Engine</h2>
          <button
            @click="applySettings"
            class="ml-auto px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold text-sm transition"
          >
            ✓ ใช้งานอยู่
          </button>
        </div>

        <p class="text-sm text-gray-600 mb-6">
          ปรับ slider 0–10 (0=โค้ด, 10=ความแม่นสูงสุด) แล้วกด "ใช้งาน" และกลับไปค่าเดิมใหม่
        </p>

        <!-- Accuracy Slider -->
        <div class="mb-6">
          <div class="flex items-center justify-between mb-2">
            <label class="text-sm font-semibold text-gray-700">ระดับความแม่น</label>
            <span class="text-lg font-bold text-green-600">{{ settings.accuracyLevel }}</span>
          </div>
          <input
            type="range"
            min="0"
            max="10"
            :value="settings.accuracyLevel"
            @input="setAccuracyLevel(Number(($event.target as HTMLInputElement).value))"
            class="w-full h-3 bg-gradient-to-r from-gray-300 via-yellow-400 to-green-500 rounded-lg appearance-none cursor-pointer"
          />
          <div class="flex justify-between text-xs text-gray-500 mt-1">
            <span>0 (โค้ด)</span>
            <span>10 (แม่นสุด)</span>
          </div>
        </div>

        <!-- Calculation Modes -->
        <div class="bg-gradient-to-br from-cyan-50 to-green-50 rounded-xl p-4 mb-4">
          <h3 class="text-sm font-bold text-gray-700 mb-3">ปรับการคำนวณ</h3>
          <div class="space-y-3">
            <button
              v-for="mode in calculationModes"
              :key="mode.id"
              @click="setCalculationMode(mode.id)"
              class="w-full text-left p-4 rounded-xl transition-all"
              :class="settings.calculationMode === mode.id
                ? 'bg-white shadow-lg ring-2 ring-green-500'
                : 'bg-white/50 hover:bg-white/80'"
            >
              <div class="flex items-start gap-3">
                <span class="text-2xl flex-shrink-0">{{ mode.icon }}</span>
                <div class="flex-1 min-w-0">
                  <h4 class="font-bold text-sm mb-1" :class="settings.calculationMode === mode.id ? 'text-green-700' : 'text-gray-800'">
                    {{ mode.label }}
                  </h4>
                  <p class="text-xs text-gray-600 leading-relaxed">{{ mode.description }}</p>
                </div>
                <span v-if="settings.calculationMode === mode.id" class="text-green-600 text-xl flex-shrink-0">✓</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      <!-- Number Preferences Card -->
      <div class="bg-white/90 backdrop-blur rounded-2xl shadow-lg p-6">
        <div class="flex items-center gap-3 mb-4">
          <span class="text-3xl">🔢</span>
          <h2 class="text-xl font-bold text-gray-800">ควบคุมเลข 0-9</h2>
          <button
            @click="resetSettings"
            class="ml-auto px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg font-semibold text-sm transition"
          >
            รีเซ็ต
          </button>
        </div>

        <p class="text-sm text-gray-600 mb-4">
          กดเลขเพื่อเปลี่ยนสถานะ: ✓ บังคับ → ✗ แบน → ปกติ
        </p>

        <!-- Number Grid -->
        <div class="grid grid-cols-5 gap-3 mb-4">
          <button
            v-for="digit in ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']"
            :key="digit"
            @click="toggleNumberPreference(digit)"
            class="aspect-square rounded-xl font-bold text-2xl transition-all transform active:scale-95"
            :class="{
              'bg-green-500 text-white shadow-lg': settings.numberPreferences[digit] === 'force',
              'bg-red-500 text-white shadow-lg': settings.numberPreferences[digit] === 'ban',
              'bg-gray-200 text-gray-700 hover:bg-gray-300': settings.numberPreferences[digit] === 'normal'
            }"
          >
            <div class="flex flex-col items-center justify-center">
              <span v-if="settings.numberPreferences[digit] === 'force'" class="text-sm">✓</span>
              <span v-if="settings.numberPreferences[digit] === 'ban'" class="text-sm">✗</span>
              <span>{{ digit }}</span>
            </div>
          </button>
        </div>

        <!-- Stats -->
        <div class="flex items-center justify-between text-xs text-gray-600 bg-gray-50 rounded-lg p-3">
          <span>กดเลขเพื่อเปลี่ยนสถานะ:</span>
          <div class="flex gap-4">
            <span class="font-semibold">✓ บังคับ → ✗ แบน → ปกติ</span>
          </div>
        </div>

        <!-- Stats Display -->
        <div class="mt-4 text-xs text-gray-600">
          <div class="flex items-center justify-center gap-6">
            <span>🔢 จำนวนเลข: {{ stats.total }}</span>
            <span class="text-green-600 font-bold">✓ บังคับ: {{ stats.forced }}</span>
            <span class="text-red-600 font-bold">✗ แบน: {{ stats.banned }}</span>
          </div>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>

<style scoped>
/* Custom Range Slider */
input[type="range"]::-webkit-slider-thumb {
  appearance: none;
  width: 24px;
  height: 24px;
  background: white;
  border: 3px solid #10b981;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

input[type="range"]::-moz-range-thumb {
  width: 24px;
  height: 24px;
  background: white;
  border: 3px solid #10b981;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
