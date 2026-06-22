<template>
  <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center">
          <span class="text-xl">⭐</span>
        </div>
        <div>
          <h2 class="text-xl font-bold text-gray-800 dark:text-white">เลขโปรด</h2>
          <p class="text-xs text-gray-500 dark:text-gray-400">เข้าถึงได้เร็ว</p>
        </div>
      </div>
      <button
        @click="showAddForm = !showAddForm"
        class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        :title="showAddForm ? 'ปิดฟอร์ม' : 'เพิ่มเลขโปรด'"
      >
        <span class="text-2xl">{{ showAddForm ? '✕' : '+' }}</span>
      </button>
    </div>

    <!-- Add Form -->
    <transition name="slide-down">
      <form v-if="showAddForm" @submit.prevent="handleAddFavorite" class="space-y-3 bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
        <div>
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300">เลข (2-6 หลัก)</label>
          <input
            v-model="newNumber"
            type="text"
            pattern="\d{2,6}"
            maxlength="6"
            placeholder="เช่น 123, 4567"
            class="w-full px-4 py-2 mt-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            required
          />
        </div>
        <div>
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300">ป้ายกำกับ (ไม่บังคับ)</label>
          <input
            v-model="newLabel"
            type="text"
            maxlength="30"
            placeholder="เช่น เลขวันเกิด, เลขนาม"
            class="w-full px-4 py-2 mt-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        <button
          type="submit"
          class="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition"
        >
          เพิ่มเลขโปรด
        </button>
      </form>
    </transition>

    <!-- Error Message -->
    <div v-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
      <p class="text-sm text-red-600 dark:text-red-400">{{ error }}</p>
    </div>

    <!-- Pinned Lottery Types -->
    <div v-if="sortedPinned.length > 0" class="space-y-2">
      <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
        <span>📌</span>
        <span>หวยที่ปักหมุด ({{ pinnedCount }})</span>
      </h3>
      <div class="grid grid-cols-2 gap-2">
        <button
          v-for="pinned in sortedPinned"
          :key="pinned.id"
          @click="selectLottery(pinned.id)"
          class="group relative px-3 py-2 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-800/40 dark:hover:to-pink-800/40 border border-purple-200 dark:border-purple-700 transition"
        >
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-gray-800 dark:text-white truncate">
              {{ getLotteryName(pinned.id) }}
            </span>
            <button
              @click.stop="handleUnpin(pinned.id)"
              class="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/40 transition"
              title="เอาหมุดออก"
            >
              <span class="text-xs">✕</span>
            </button>
          </div>
        </button>
      </div>
    </div>

    <!-- Favorite Numbers List -->
    <div v-if="sortedFavorites.length > 0" class="space-y-2">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <span>⭐</span>
          <span>เลขโปรด ({{ favoriteCount }})</span>
        </h3>
        <button
          v-if="pinnedCount > 0"
          @click="handleQuickCheck"
          :disabled="isLoading"
          class="text-xs px-3 py-1 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 transition"
        >
          {{ isLoading ? '⏳ กำลังตรวจ...' : '🔍 ตรวจรางวัลด่วน' }}
        </button>
      </div>

      <div class="space-y-2 max-h-96 overflow-y-auto">
        <div
          v-for="fav in sortedFavorites"
          :key="fav.id"
          class="group flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition"
        >
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="text-2xl font-bold text-purple-600 dark:text-purple-400">{{ fav.number }}</span>
              <span v-if="fav.label" class="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                {{ fav.label }}
              </span>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              เพิ่มเมื่อ {{ formatDate(fav.addedAt) }}
            </p>
          </div>
          <button
            @click="handleRemove(fav.id)"
            class="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition"
            title="ลบเลขโปรด"
          >
            <span class="text-red-600 dark:text-red-400">🗑️</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!showAddForm" class="text-center py-8">
      <div class="text-6xl mb-4">⭐</div>
      <p class="text-gray-500 dark:text-gray-400 mb-4">ยังไม่มีเลขโปรด</p>
      <button
        @click="showAddForm = true"
        class="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 transition"
      >
        เพิ่มเลขโปรดแรก
      </button>
    </div>

    <!-- Quick Check Results Modal -->
    <transition name="fade">
      <div
        v-if="showResults"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        @click="showResults = false"
      >
        <div
          @click.stop
          class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto p-6"
        >
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-xl font-bold text-gray-800 dark:text-white">ผลการตรวจรางวัล</h3>
            <button
              @click="showResults = false"
              class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              <span class="text-xl">✕</span>
            </button>
          </div>

          <div v-if="quickCheckResults.length > 0" class="space-y-3">
            <div
              v-for="(result, index) in quickCheckResults"
              :key="index"
              class="p-4 rounded-lg border-2"
              :class="{
                'border-green-500 bg-green-50 dark:bg-green-900/20': result.matchType === 'exact',
                'border-blue-500 bg-blue-50 dark:bg-blue-900/20': result.matchType === '3digit',
                'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20': result.matchType === '2digit',
              }"
            >
              <div class="flex items-start justify-between">
                <div>
                  <p class="text-2xl font-bold text-gray-800 dark:text-white">{{ result.number }}</p>
                  <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {{ getLotteryName(result.lotteryType) }}
                  </p>
                </div>
                <div class="text-right">
                  <div
                    class="text-sm font-bold px-2 py-1 rounded-full"
                    :class="{
                      'bg-green-500 text-white': result.matchType === 'exact',
                      'bg-blue-500 text-white': result.matchType === '3digit',
                      'bg-yellow-500 text-white': result.matchType === '2digit',
                    }"
                  >
                    {{ result.prizeCategory }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="text-center py-8">
            <div class="text-6xl mb-4">😔</div>
            <p class="text-gray-600 dark:text-gray-400">ไม่มีเลขถูกรางวัลในครั้งนี้</p>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useFavoriteNumbers } from '../composables/useFavoriteNumbers'
import { useLotteryType, lotteryTypes } from '../composables/useLotteryType'

const {
  sortedFavorites,
  sortedPinned,
  favoriteCount,
  pinnedCount,
  isLoading,
  error,
  addFavoriteNumber,
  removeFavoriteNumber,
  unpinLotteryType,
  quickCheckAllPinned,
} = useFavoriteNumbers()

const { setLotteryType } = useLotteryType()

// Form state
const showAddForm = ref(false)
const newNumber = ref('')
const newLabel = ref('')

// Results state
const showResults = ref(false)
const quickCheckResults = ref<any[]>([])

// Get lottery name by id
const getLotteryName = (id: string) => {
  const lottery = lotteryTypes.find(l => l.id === id)
  return lottery ? lottery.displayName : id
}

// Format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// Handle add favorite
const handleAddFavorite = () => {
  const success = addFavoriteNumber(newNumber.value, newLabel.value)
  if (success) {
    newNumber.value = ''
    newLabel.value = ''
    showAddForm.value = false
    error.value = null
  }
}

// Handle remove favorite
const handleRemove = (id: string) => {
  if (confirm('ต้องการลบเลขโปรดนี้?')) {
    removeFavoriteNumber(id)
  }
}

// Handle unpin lottery type
const handleUnpin = (id: string) => {
  unpinLotteryType(id)
}

// Select lottery type
const selectLottery = (id: string) => {
  const lottery = lotteryTypes.find(l => l.id === id)
  if (lottery) {
    setLotteryType(lottery)
  }
}

// Quick check all pinned
const handleQuickCheck = async () => {
  const results = await quickCheckAllPinned()
  quickCheckResults.value = results
  showResults.value = true
}
</script>

<style scoped>
/* Slide down animation */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Fade animation */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
