<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useWinningNumbers } from '../composables/useWinningNumbers'
import { useLotteryType, LOTTERY_TYPES } from '../composables/useLotteryType'

const router = useRouter()
const { waitForAuth } = useAuth()
const {
  winningNumbers,
  loading,
  totalWinnings,
  totalPrizeAmount,
  getWinningNumbers,
  getWinningNumbersByLottery,
} = useWinningNumbers()

const selectedFilter = ref('all')

onMounted(async () => {
  const currentUser = await waitForAuth()
  if (!currentUser) {
    await router.push('/login')
    return
  }

  await getWinningNumbers(30)
})

// Filter by lottery type
const filteredWinnings = computed(() => {
  if (selectedFilter.value === 'all') {
    return winningNumbers.value
  }
  return winningNumbers.value.filter(w => w.lotteryType === selectedFilter.value)
})

// Change filter
const changeFilter = async (lotteryType: string) => {
  selectedFilter.value = lotteryType
  if (lotteryType === 'all') {
    await getWinningNumbers(30)
  } else {
    await getWinningNumbersByLottery(lotteryType, 30)
  }
}

// Format date
const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// Get lottery name
const getLotteryName = (type: string) => {
  const lottery = LOTTERY_TYPES.find(l => l.id === type)
  return lottery?.displayName || type
}

// Get lottery color
const getLotteryColor = (type: string) => {
  const colors: Record<string, string> = {
    'government': 'from-blue-500 to-blue-600',
    'hanoi-vip': 'from-red-500 to-red-600',
    'hanoi-special': 'from-orange-500 to-orange-600',
    'lao-vip': 'from-green-500 to-green-600',
    'nikkei-vip-morning': 'from-purple-500 to-purple-600',
  }
  return colors[type] || 'from-gray-500 to-gray-600'
}
</script>

<template>
  <NuxtLayout name="main">
    <div class="max-w-6xl mx-auto px-4 py-8">
      <!-- Header -->
      <div class="text-center mb-8">
        <div class="inline-block mb-4">
          <div class="relative">
            <div class="absolute inset-0 bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 rounded-2xl blur-md opacity-60 animate-pulse"></div>
            <div class="relative px-6 py-3 bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 rounded-2xl">
              <span class="text-4xl">🏆</span>
            </div>
          </div>
        </div>
        <h1 class="text-4xl font-black text-gray-900 dark:text-white mb-3">
          เลขที่เคยถูกรางวัล
        </h1>
        <p class="text-gray-600 dark:text-gray-400 text-lg">
          ประวัติการทำนายที่ถูกรางวัลจริง ✨
        </p>
      </div>

      <!-- Stats Cards -->
      <div class="grid md:grid-cols-2 gap-6 mb-8">
        <div class="relative group">
          <div class="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl opacity-75 group-hover:opacity-100 transition blur-sm"></div>
          <div class="relative bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-2xl">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">จำนวนครั้งที่ถูก</p>
                <p class="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                  {{ totalWinnings }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">ครั้ง</p>
              </div>
              <div class="text-6xl opacity-20">🎯</div>
            </div>
          </div>
        </div>

        <div class="relative group">
          <div class="absolute -inset-0.5 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-3xl opacity-75 group-hover:opacity-100 transition blur-sm"></div>
          <div class="relative bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-2xl">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">รางวัลรวม</p>
                <p class="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-orange-600">
                  {{ totalPrizeAmount.toLocaleString() }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">บาท</p>
              </div>
              <div class="text-6xl opacity-20">💰</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filter Tabs -->
      <div class="mb-6">
        <div class="bg-white dark:bg-gray-800 rounded-2xl p-2 shadow-lg">
          <div class="flex flex-wrap gap-2">
            <button
              @click="changeFilter('all')"
              :class="[
                'px-4 py-2 rounded-xl font-bold text-sm transition-all',
                selectedFilter === 'all'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              ]"
            >
              ทั้งหมด
            </button>
            <button
              v-for="lottery in LOTTERY_TYPES.slice(0, 5)"
              :key="lottery.id"
              @click="changeFilter(lottery.id)"
              :class="[
                'px-4 py-2 rounded-xl font-bold text-sm transition-all',
                selectedFilter === lottery.id
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              ]"
            >
              {{ lottery.displayName }}
            </button>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        <p class="text-gray-600 dark:text-gray-400 mt-4">กำลังโหลด...</p>
      </div>

      <!-- Winning Numbers List -->
      <div v-else-if="filteredWinnings.length > 0" class="space-y-6">
        <div
          v-for="record in filteredWinnings"
          :key="record.id"
          class="relative group"
        >
          <!-- Glow Effect -->
          <div :class="['absolute -inset-0.5 rounded-3xl opacity-60 group-hover:opacity-100 transition blur-sm bg-gradient-to-r', getLotteryColor(record.lotteryType)]"></div>

          <!-- Card -->
          <div class="relative bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-2xl">
            <!-- Header -->
            <div class="flex items-start justify-between mb-6">
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-2">
                  <div :class="['px-4 py-2 rounded-xl text-white font-bold text-sm bg-gradient-to-r', getLotteryColor(record.lotteryType)]">
                    {{ getLotteryName(record.lotteryType) }}
                  </div>
                  <div class="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-full text-xs font-bold">
                    ✓ ยืนยันแล้ว
                  </div>
                </div>
                <h3 class="text-2xl font-black text-gray-900 dark:text-white mb-1">
                  งวดวันที่ {{ record.period }}
                </h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  {{ formatDate(record.drawDate) }}
                </p>
              </div>
              <div class="text-5xl opacity-20">🎊</div>
            </div>

            <!-- Winning Numbers -->
            <div class="grid md:grid-cols-3 gap-4 mb-6">
              <!-- Hot Numbers -->
              <div v-if="record.winningNumbers.hotNumbers?.length" class="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-4">
                <div class="flex items-center gap-2 mb-3">
                  <span class="text-2xl">🔥</span>
                  <p class="font-black text-gray-900 dark:text-white">เลขเด่น</p>
                </div>
                <div class="flex flex-wrap gap-2">
                  <div
                    v-for="(num, idx) in record.winningNumbers.hotNumbers"
                    :key="idx"
                    class="px-4 py-2 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-xl font-black text-xl shadow-lg"
                  >
                    {{ num }}
                  </div>
                </div>
              </div>

              <!-- Two Digits -->
              <div v-if="record.winningNumbers.twoDigits?.length" class="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-2xl p-4">
                <div class="flex items-center gap-2 mb-3">
                  <span class="text-2xl">🎯</span>
                  <p class="font-black text-gray-900 dark:text-white">เลข 2 ตัว</p>
                </div>
                <div class="flex flex-wrap gap-2">
                  <div
                    v-for="(num, idx) in record.winningNumbers.twoDigits"
                    :key="idx"
                    class="px-4 py-2 bg-gradient-to-br from-yellow-500 to-orange-600 text-white rounded-xl font-black text-xl shadow-lg"
                  >
                    {{ num }}
                  </div>
                </div>
              </div>

              <!-- Three Digits -->
              <div v-if="record.winningNumbers.threeDigits?.length" class="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-4">
                <div class="flex items-center gap-2 mb-3">
                  <span class="text-2xl">🎲</span>
                  <p class="font-black text-gray-900 dark:text-white">เลข 3 ตัว</p>
                </div>
                <div class="flex flex-wrap gap-2">
                  <div
                    v-for="(num, idx) in record.winningNumbers.threeDigits"
                    :key="idx"
                    class="px-4 py-2 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl font-black text-xl shadow-lg"
                  >
                    {{ num }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Prizes -->
            <div class="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-4 mb-4">
              <div class="flex items-center gap-2 mb-3">
                <span class="text-2xl">💎</span>
                <p class="font-black text-gray-900 dark:text-white">รางวัลที่ได้รับ</p>
              </div>
              <div class="grid md:grid-cols-2 gap-3">
                <div
                  v-for="(prize, idx) in record.prizes"
                  :key="idx"
                  class="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-xl"
                >
                  <span class="text-sm font-bold text-gray-700 dark:text-gray-300">{{ prize.type }}</span>
                  <span class="text-lg font-black text-purple-600 dark:text-purple-400">
                    {{ prize.amount.toLocaleString() }} ฿
                  </span>
                </div>
              </div>
            </div>

            <!-- Proof Image -->
            <div v-if="record.proofImageUrl" class="mb-4">
              <p class="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">📸 หลักฐานการถูกรางวัล</p>
              <img
                :src="record.proofImageUrl"
                alt="Proof"
                class="w-full max-w-md rounded-xl shadow-lg border-2 border-gray-200 dark:border-gray-700"
              />
            </div>

            <!-- Note -->
            <div v-if="record.note" class="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 mb-4">
              <p class="text-sm text-gray-700 dark:text-gray-300">
                <span class="font-bold">📝 หมายเหตุ:</span> {{ record.note }}
              </p>
            </div>

            <!-- Footer -->
            <div class="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                  <span class="text-white text-xs font-bold">✓</span>
                </div>
                <div>
                  <p class="text-xs text-gray-500 dark:text-gray-400">ยืนยันโดย</p>
                  <p class="text-sm font-bold text-gray-900 dark:text-white">{{ record.verifiedBy }}</p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-xs text-gray-500 dark:text-gray-400">เพิ่มเมื่อ</p>
                <p class="text-sm font-bold text-gray-900 dark:text-white">{{ formatDate(record.createdAt) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="relative group">
        <div class="absolute -inset-0.5 bg-gradient-to-r from-gray-400 to-gray-500 rounded-3xl opacity-30 blur-sm"></div>
        <div class="relative bg-white dark:bg-gray-800 rounded-3xl p-12 shadow-xl text-center">
          <div class="text-8xl mb-4 opacity-20">🎯</div>
          <h3 class="text-2xl font-black text-gray-900 dark:text-white mb-2">
            ยังไม่มีข้อมูล
          </h3>
          <p class="text-gray-600 dark:text-gray-400">
            {{ selectedFilter === 'all' ? 'ยังไม่มีการบันทึกเลขที่ถูกรางวัล' : `ยังไม่มีเลขที่ถูกสำหรับ ${getLotteryName(selectedFilter)}` }}
          </p>
        </div>
      </div>

      <!-- Trust Badge -->
      <div class="mt-12 text-center">
        <div class="inline-block bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-2xl px-6 py-4">
          <div class="flex items-center gap-3">
            <span class="text-3xl">✓</span>
            <div class="text-left">
              <p class="text-sm font-black text-green-700 dark:text-green-300">ข้อมูลที่น่าเชื่อถือ</p>
              <p class="text-xs text-green-600 dark:text-green-400">ยืนยันโดย Admin และมีหลักฐานประกอบ</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>
