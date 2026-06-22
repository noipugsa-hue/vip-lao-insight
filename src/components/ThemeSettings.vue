<template>
  <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
        <span class="text-xl">🎨</span>
      </div>
      <div>
        <h2 class="text-xl font-bold text-gray-800 dark:text-white">การตั้งค่าธีม</h2>
        <p class="text-xs text-gray-500 dark:text-gray-400">ปรับแต่งหน้าตา</p>
      </div>
    </div>

    <!-- Dark Mode Toggle -->
    <div class="space-y-3">
      <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">โหมดมืด</h3>

      <button
        @click="toggleDarkMode"
        class="w-full flex items-center justify-between p-4 rounded-xl bg-gradient-to-r hover:shadow-lg transition"
        :class="isDark ? 'from-gray-800 to-gray-900 text-white' : 'from-gray-100 to-gray-200 text-gray-900'"
      >
        <div class="flex items-center gap-3">
          <span class="text-2xl">{{ isDark ? '🌙' : '☀️' }}</span>
          <div class="text-left">
            <p class="font-medium">{{ isDark ? 'โหมดมืด' : 'โหมดสว่าง' }}</p>
            <p class="text-xs opacity-75">คลิกเพื่อสลับ</p>
          </div>
        </div>
        <div class="w-14 h-8 rounded-full relative transition"
          :class="isDark ? 'bg-purple-600' : 'bg-gray-400'"
        >
          <div class="absolute top-1 w-6 h-6 bg-white rounded-full transition-all"
            :class="isDark ? 'left-7' : 'left-1'"
          ></div>
        </div>
      </button>
    </div>

    <!-- Auto Dark Mode -->
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">โหมดอัตโนมัติ</h3>
        <button
          @click="toggleAutoMode"
          class="px-3 py-1 rounded-full text-xs font-medium transition"
          :class="isAutoMode
            ? 'bg-purple-600 text-white hover:bg-purple-700'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'"
        >
          {{ isAutoMode ? 'เปิด' : 'ปิด' }}
        </button>
      </div>

      <div v-if="isAutoMode" class="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 space-y-3">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          สถานะ: <span class="font-medium text-purple-600 dark:text-purple-400">{{ autoModeStatus }}</span>
        </p>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs font-medium text-gray-600 dark:text-gray-400">เริ่ม (เปิดโหมดมืด)</label>
            <select
              v-model.number="tempStartHour"
              @change="updateSchedule"
              class="w-full mt-1 px-3 py-2 rounded-lg border border-purple-200 dark:border-purple-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
            >
              <option v-for="hour in 24" :key="hour-1" :value="hour-1">
                {{ (hour-1).toString().padStart(2, '0') }}:00
              </option>
            </select>
          </div>
          <div>
            <label class="text-xs font-medium text-gray-600 dark:text-gray-400">สิ้นสุด (ปิดโหมดมืด)</label>
            <select
              v-model.number="tempEndHour"
              @change="updateSchedule"
              class="w-full mt-1 px-3 py-2 rounded-lg border border-purple-200 dark:border-purple-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
            >
              <option v-for="hour in 24" :key="hour-1" :value="hour-1">
                {{ (hour-1).toString().padStart(2, '0') }}:00
              </option>
            </select>
          </div>
        </div>

        <div class="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <p>💡 ตัวอย่าง: 18:00 - 06:00 = เปิดโหมดมืดตอนเย็นถึงเช้า</p>
          <p>💡 ระบบจะตรวจสอบทุกนาทีและเปลี่ยนโหมดอัตโนมัติ</p>
        </div>
      </div>
    </div>

    <!-- AMOLED Mode (only in dark mode) -->
    <div v-if="isDark" class="space-y-3">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">AMOLED Black</h3>
          <p class="text-xs text-gray-500 dark:text-gray-400">ดำสนิทสำหรับ OLED</p>
        </div>
        <button
          @click="toggleAmoledMode"
          class="px-3 py-1 rounded-full text-xs font-medium transition"
          :class="isAmoledMode
            ? 'bg-black text-white border-2 border-white'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'"
        >
          {{ isAmoledMode ? 'เปิด' : 'ปิด' }}
        </button>
      </div>

      <div v-if="isAmoledMode" class="bg-black text-white rounded-xl p-4">
        <p class="text-sm">
          ✨ โหมด AMOLED ใช้สีดำแท้ (Pure Black #000000) เพื่อประหยัดแบตเตอรี่และลดความเมื่อยล้าของสายตาบนหน้าจอ OLED/AMOLED
        </p>
      </div>
    </div>

    <!-- Accent Color -->
    <div class="space-y-3">
      <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">สีธีม</h3>

      <div class="grid grid-cols-4 gap-3">
        <button
          v-for="color in accentColors"
          :key="color.id"
          @click="setAccentColor(color.id)"
          class="relative aspect-square rounded-xl transition-all hover:scale-110"
          :class="accentColor === color.id ? 'ring-4 ring-offset-2 dark:ring-offset-gray-800' : ''"
          :style="{ backgroundColor: color.hex, ringColor: color.hex }"
          :title="color.name"
        >
          <div v-if="accentColor === color.id" class="absolute inset-0 flex items-center justify-center">
            <span class="text-2xl text-white drop-shadow-lg">✓</span>
          </div>
        </button>
      </div>

      <div class="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
        <span class="text-sm text-gray-600 dark:text-gray-400">สีปัจจุบัน:</span>
        <div class="flex items-center gap-2">
          <div
            class="w-6 h-6 rounded-full"
            :style="{ backgroundColor: currentAccentColor.hex }"
          ></div>
          <span class="text-sm font-medium text-gray-800 dark:text-white">{{ currentAccentColor.name }}</span>
        </div>
      </div>
    </div>

    <!-- Preview -->
    <div class="space-y-3">
      <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">ตัวอย่างการแสดงผล</h3>

      <div class="space-y-2">
        <button class="w-full px-4 py-3 rounded-xl font-medium text-white transition hover:shadow-lg accent-bg">
          ปุ่มสีธีมหลัก
        </button>

        <div class="p-4 rounded-xl border-2 accent-border bg-gray-50 dark:bg-gray-700">
          <p class="font-medium accent-text">ข้อความสีธีม</p>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">ตัวอย่างการใช้งานสีธีม</p>
        </div>

        <div class="p-4 rounded-xl accent-gradient">
          <p class="font-bold text-white">Gradient สีธีม</p>
          <p class="text-sm text-white/90 mt-1">ใช้สำหรับไฮไลท์พิเศษ</p>
        </div>
      </div>
    </div>

    <!-- Reset Button -->
    <button
      @click="resetToDefault"
      class="w-full px-4 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition"
    >
      🔄 รีเซ็ตเป็นค่าเริ่มต้น
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useDarkMode } from '../composables/useDarkMode'

const {
  isDark,
  isAutoMode,
  isAmoledMode,
  accentColor,
  autoStartHour,
  autoEndHour,
  currentAccentColor,
  autoModeStatus,
  toggleDarkMode,
  toggleAutoMode,
  setAutoModeSchedule,
  toggleAmoledMode,
  setAccentColor: setAccentColorFn,
  accentColors,
  disableDarkMode,
} = useDarkMode()

// Temp values for schedule inputs
const tempStartHour = ref(autoStartHour.value)
const tempEndHour = ref(autoEndHour.value)

// Watch for changes in auto schedule from composable
watch([autoStartHour, autoEndHour], ([newStart, newEnd]) => {
  tempStartHour.value = newStart
  tempEndHour.value = newEnd
})

// Update schedule
const updateSchedule = () => {
  setAutoModeSchedule(tempStartHour.value, tempEndHour.value)
}

// Reset to default
const resetToDefault = () => {
  if (confirm('รีเซ็ตการตั้งค่าทั้งหมดเป็นค่าเริ่มต้น?')) {
    // Turn off auto mode
    if (isAutoMode.value) {
      toggleAutoMode()
    }

    // Turn off AMOLED
    if (isAmoledMode.value) {
      toggleAmoledMode()
    }

    // Reset to light mode
    if (isDark.value) {
      disableDarkMode()
    }

    // Reset accent to purple
    if (accentColor.value !== 'purple') {
      setAccentColorFn('purple')
    }

    // Reset schedule to default (18:00 - 06:00)
    setAutoModeSchedule(18, 6)
  }
}
</script>

<style scoped>
/* Smooth transitions for toggles */
button {
  transition: all 0.2s ease;
}
</style>
