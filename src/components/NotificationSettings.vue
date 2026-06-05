<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { usePushNotifications } from '../composables/usePushNotifications'

const {
  isSupported,
  isPermissionGranted,
  isLoading,
  error,
  subscribeToLotteryUpdates,
  unsubscribeFromNotifications,
  isSubscribed,
  showTestNotification,
} = usePushNotifications()

const subscribed = ref(false)
const showSettings = ref(false)

onMounted(() => {
  subscribed.value = isSubscribed()
})

const toggleNotifications = async () => {
  if (subscribed.value) {
    // ปิดการแจ้งเตือน
    const success = await unsubscribeFromNotifications()
    if (success) {
      subscribed.value = false
    }
  } else {
    // เปิดการแจ้งเตือน
    const success = await subscribeToLotteryUpdates()
    if (success) {
      subscribed.value = true
    }
  }
}

const testNotification = async () => {
  await showTestNotification(
    '🎉 ทดสอบการแจ้งเตือน',
    'นี่คือการแจ้งเตือนทดสอบจาก Numora Lotto AI'
  )
}
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
          <span class="text-2xl">🔔</span>
        </div>
        <div>
          <h3 class="text-lg font-bold text-gray-900 dark:text-white">
            แจ้งเตือนผลหวย
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            รับการแจ้งเตือนเมื่อมีผลหวยออกใหม่
          </p>
        </div>
      </div>
      <button
        @click="showSettings = !showSettings"
        class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      >
        <svg class="w-6 h-6" :class="{ 'rotate-180': showSettings }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>

    <!-- Support Warning -->
    <div v-if="!isSupported" class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-4">
      <div class="flex items-start gap-3">
        <span class="text-yellow-600 dark:text-yellow-400 text-xl">⚠️</span>
        <div class="flex-1">
          <p class="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-1">
            Browser ไม่รองรับ
          </p>
          <p class="text-xs text-yellow-700 dark:text-yellow-400">
            Browser ของคุณไม่รองรับการแจ้งเตือน กรุณาใช้ Chrome, Firefox, หรือ Safari เวอร์ชันล่าสุด
          </p>
        </div>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 mb-4">
      <div class="flex items-start gap-3">
        <span class="text-red-600 dark:text-red-400 text-xl">❌</span>
        <div class="flex-1">
          <p class="text-sm font-medium text-red-800 dark:text-red-300">
            {{ error }}
          </p>
        </div>
      </div>
    </div>

    <!-- Settings Panel -->
    <div v-if="showSettings && isSupported" class="space-y-4">
      <!-- Toggle Switch -->
      <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
        <div class="flex-1">
          <p class="font-medium text-gray-900 dark:text-white">
            เปิดการแจ้งเตือน
          </p>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {{ subscribed ? 'กำลังรับการแจ้งเตือน' : 'ปิดการแจ้งเตือน' }}
          </p>
        </div>
        <button
          @click="toggleNotifications"
          :disabled="isLoading"
          class="relative inline-flex h-8 w-14 items-center rounded-full transition-colors"
          :class="subscribed ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'bg-gray-300 dark:bg-gray-600'"
        >
          <span
            class="inline-block h-6 w-6 transform rounded-full bg-white transition-transform"
            :class="subscribed ? 'translate-x-7' : 'translate-x-1'"
          />
        </button>
      </div>

      <!-- Test Button -->
      <button
        v-if="subscribed"
        @click="testNotification"
        class="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg transition-shadow"
      >
        🧪 ทดสอบการแจ้งเตือน
      </button>

      <!-- Info -->
      <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
        <div class="flex items-start gap-3">
          <span class="text-blue-600 dark:text-blue-400 text-xl">ℹ️</span>
          <div class="flex-1">
            <p class="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
              การแจ้งเตือนจะทำงานเมื่อ:
            </p>
            <ul class="text-xs text-blue-700 dark:text-blue-400 space-y-1">
              <li>• มีผลหวยออกใหม่</li>
              <li>• เลขที่คุณบันทึกไว้ถูกรางวัล</li>
              <li>• มีอัพเดทคุณสมบัติใหม่</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Permission Status -->
      <div class="text-center text-sm text-gray-500 dark:text-gray-400">
        <span v-if="isPermissionGranted" class="text-green-600 dark:text-green-400">
          ✅ อนุญาตการแจ้งเตือนแล้ว
        </span>
        <span v-else class="text-yellow-600 dark:text-yellow-400">
          ⏳ รอการอนุญาต
        </span>
      </div>
    </div>

    <!-- Quick Action (when collapsed) -->
    <div v-else-if="isSupported" class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span v-if="subscribed" class="inline-flex items-center gap-1 text-sm text-green-600 dark:text-green-400 font-medium">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
          เปิดใช้งานอยู่
        </span>
        <span v-else class="text-sm text-gray-500 dark:text-gray-400">
          ปิดการแจ้งเตือน
        </span>
      </div>
      <button
        @click="toggleNotifications"
        :disabled="isLoading"
        class="py-2 px-4 rounded-lg font-medium transition-colors"
        :class="subscribed
          ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg'"
      >
        {{ isLoading ? '⏳ กำลังตั้งค่า...' : (subscribed ? 'ปิด' : 'เปิดการแจ้งเตือน') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
button {
  @apply transition-transform active:scale-95;
}
</style>
