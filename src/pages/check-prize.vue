<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useLotteryFetcher } from '../composables/useLotteryFetcher'
import { usePrizeChecker, type LotteryDrawResult } from '../composables/usePrizeChecker'
import { useLotteryType } from '../composables/useLotteryType'

const router = useRouter()
const { user, waitForAuth } = useAuth()
const { selectedLotteryType } = useLotteryType()
const { fetchFromRachaLotto, lastResult } = useLotteryFetcher()
const {
  checkNumbers,
  checkResults,
  calculateTotalPayout,
  countPrizesByType,
  getPrizeTypeName,
} = usePrizeChecker()

// ข้อมูลผลหวย
const drawResult = ref<LotteryDrawResult | null>(null)
const isLoadingDraw = ref(false)

// ข้อมูลเลขที่จะตรวจ
const userNumbers = ref<Array<{ number: string; type: '2digit' | '3digit' | '4digit'; betAmount: number }>>([])
const newNumber = ref('')
const newNumberType = ref<'2digit' | '3digit' | '4digit'>('3digit')
const betAmount = ref(100)

// สถานะ
const hasChecked = ref(false)
const showAddForm = ref(true)

// โหลดผลหวยงวดใหม่
const loadLatestDraw = async () => {
  isLoadingDraw.value = true
  try {
    const result = await fetchFromRachaLotto()
    if (result) {
      drawResult.value = {
        date: result.date,
        period: result.period,
        threeDigit: result.threeDigit,
        twoDigit: result.twoDigit,
        fourDigit: result.fourDigit,
      }
    }
  } catch (error) {
    console.error('Error loading draw:', error)
  } finally {
    isLoadingDraw.value = false
  }
}

// ใส่ผลหวยเอง (กรณี API ไม่ได้)
const manualDrawDate = ref('')
const manualDrawPeriod = ref('')
const manualThreeDigit = ref('')
const manualTwoDigit = ref('')
const manualFourDigit = ref('')

const setManualDraw = () => {
  drawResult.value = {
    date: manualDrawDate.value || new Date().toISOString().split('T')[0],
    period: manualDrawPeriod.value,
    threeDigit: manualThreeDigit.value,
    twoDigit: manualTwoDigit.value || undefined,
    fourDigit: manualFourDigit.value || undefined,
  }
}

// เพิ่มเลขที่จะตรวจ
const addNumber = () => {
  if (!newNumber.value) return

  const digitCount = newNumber.value.length
  if (
    (newNumberType.value === '2digit' && digitCount !== 2) ||
    (newNumberType.value === '3digit' && digitCount !== 3) ||
    (newNumberType.value === '4digit' && digitCount !== 4)
  ) {
    alert(`กรุณาใส่เลข ${newNumberType.value === '2digit' ? '2' : newNumberType.value === '3digit' ? '3' : '4'} ตัว`)
    return
  }

  userNumbers.value.push({
    number: newNumber.value,
    type: newNumberType.value,
    betAmount: betAmount.value,
  })

  newNumber.value = ''
}

// ลบเลข
const removeNumber = (index: number) => {
  userNumbers.value.splice(index, 1)
}

// ตรวจรางวัล
const checkPrizes = () => {
  if (!drawResult.value) {
    alert('กรุณาโหลดผลหวยก่อน')
    return
  }

  if (userNumbers.value.length === 0) {
    alert('กรุณาเพิ่มเลขที่จะตรวจ')
    return
  }

  checkNumbers(userNumbers.value, drawResult.value)
  hasChecked.value = true
  showAddForm.value = false
}

// คำนวณเงินรางวัลรวม
const totalPayout = computed(() => {
  if (!hasChecked.value) return 0
  return checkResults.value.reduce((sum, result) => {
    if (result.isWinner && result.payout) {
      const bet = userNumbers.value.find((n) => n.number === result.number)?.betAmount || 100
      return sum + result.payout * bet
    }
    return sum
  }, 0)
})

// คำนวณเงินที่ซื้อรวม
const totalBet = computed(() => {
  return userNumbers.value.reduce((sum, n) => sum + n.betAmount, 0)
})

// กำไร/ขาดทุน
const profit = computed(() => {
  return totalPayout.value - totalBet.value
})

// นับจำนวนรางวัล
const prizeCounts = computed(() => {
  if (!hasChecked.value) return null
  return countPrizesByType(checkResults.value)
})

// รีเซ็ต
const reset = () => {
  hasChecked.value = false
  showAddForm.value = true
  checkResults.value.length = 0
}

// สีสำหรับผลกำไร/ขาดทุน
const getProfitColor = (value: number) => {
  if (value > 0) return 'text-green-600'
  if (value < 0) return 'text-red-600'
  return 'text-gray-600'
}

// Mount
onMounted(async () => {
  const currentUser = await waitForAuth()
  if (!currentUser) {
    await router.push('/login')
    return
  }

  // โหลดผลหวยอัตโนมัติ
  await loadLatestDraw()
})
</script>

<template>
  <NuxtLayout name="main">
    <div class="max-w-4xl mx-auto space-y-6">
      <!-- Header -->
      <div class="text-center">
        <h1 class="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          🎯 ตรวจรางวัล
        </h1>
        <p class="text-gray-600 dark:text-gray-300 mt-2">ตรวจสอบเลขที่ซื้อว่าถูกรางวัลหรือไม่</p>
      </div>

      <!-- ผลหวยงวดใหม่ -->
      <div class="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl shadow-lg p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold text-gray-800 dark:text-gray-100">📊 ผลหวยงวดใหม่</h2>
          <button
            @click="loadLatestDraw"
            :disabled="isLoadingDraw"
            class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition disabled:opacity-50"
          >
            {{ isLoadingDraw ? '⏳ กำลังโหลด...' : '🔄 โหลดผล' }}
          </button>
        </div>

        <div v-if="drawResult" class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-white dark:bg-gray-800 rounded-xl p-4">
            <div class="text-sm text-gray-600 dark:text-gray-300 mb-1">งวดวันที่</div>
            <div class="text-xl font-bold text-gray-800 dark:text-gray-100">{{ drawResult.date }}</div>
            <div v-if="drawResult.period" class="text-sm text-gray-500 dark:text-gray-400">งวดที่ {{ drawResult.period }}</div>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-xl p-4">
            <div class="text-sm text-gray-600 dark:text-gray-300 mb-1">เลข 3 ตัว</div>
            <div class="text-3xl font-bold text-blue-600">{{ drawResult.threeDigit }}</div>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-xl p-4">
            <div class="text-sm text-gray-600 dark:text-gray-300 mb-1">เลข 2 ตัว</div>
            <div class="text-3xl font-bold text-green-600">
              {{ drawResult.twoDigit || '-' }}
            </div>
          </div>
        </div>

        <div v-else class="text-center py-8 text-gray-500 dark:text-gray-400">
          ยังไม่มีผลหวย กดปุ่ม "โหลดผล" หรือใส่ผลหวยเอง
        </div>

        <!-- ใส่ผลหวยเอง -->
        <details class="mt-4">
          <summary class="cursor-pointer text-sm text-blue-600 hover:text-blue-700 font-semibold">
            ✏️ ใส่ผลหวยเอง (กรณี API ไม่ได้)
          </summary>
          <div class="mt-4 bg-white dark:bg-gray-800 rounded-xl p-4 space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <input
                v-model="manualDrawDate"
                type="date"
                placeholder="วันที่"
                class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
              <input
                v-model="manualDrawPeriod"
                type="text"
                placeholder="งวดที่ (ถ้ามี)"
                class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div class="grid grid-cols-3 gap-3">
              <input
                v-model="manualThreeDigit"
                type="text"
                placeholder="เลข 3 ตัว *"
                maxlength="3"
                class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
              <input
                v-model="manualTwoDigit"
                type="text"
                placeholder="เลข 2 ตัว"
                maxlength="2"
                class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
              <input
                v-model="manualFourDigit"
                type="text"
                placeholder="เลข 4 ตัว"
                maxlength="4"
                class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <button
              @click="setManualDraw"
              class="w-full px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition"
            >
              ✓ บันทึกผลหวย
            </button>
          </div>
        </details>
      </div>

      <!-- เพิ่มเลขที่จะตรวจ -->
      <div v-if="showAddForm" class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        <h2 class="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">📝 เพิ่มเลขที่จะตรวจ</h2>

        <div class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              v-model="newNumber"
              type="text"
              placeholder="ใส่เลข"
              maxlength="4"
              class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              @keypress.enter="addNumber"
            />

            <select
              v-model="newNumberType"
              class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="2digit">2 ตัว</option>
              <option value="3digit">3 ตัว</option>
              <option value="4digit">4 ตัว</option>
            </select>

            <input
              v-model.number="betAmount"
              type="number"
              placeholder="ราคา (บาท)"
              min="1"
              class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />

            <button
              @click="addNumber"
              class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition"
            >
              ➕ เพิ่ม
            </button>
          </div>

          <!-- รายการเลขที่เพิ่มแล้ว -->
          <div v-if="userNumbers.length > 0" class="space-y-2">
            <div class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
              รายการเลข ({{ userNumbers.length }} ชุด, รวม {{ totalBet.toLocaleString() }} บาท)
            </div>
            <div
              v-for="(item, index) in userNumbers"
              :key="index"
              class="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg p-3"
            >
              <div class="flex items-center gap-3">
                <span class="text-2xl font-bold text-blue-600">{{ item.number }}</span>
                <span class="text-sm text-gray-600 dark:text-gray-300">({{ item.type === '2digit' ? '2 ตัว' : item.type === '3digit' ? '3 ตัว' : '4 ตัว' }})</span>
                <span class="text-sm font-semibold text-gray-700 dark:text-gray-200">{{ item.betAmount }} บาท</span>
              </div>
              <button
                @click="removeNumber(index)"
                class="text-red-500 hover:text-red-700 transition"
              >
                🗑️
              </button>
            </div>
          </div>

          <!-- ปุ่มตรวจรางวัล -->
          <button
            @click="checkPrizes"
            :disabled="!drawResult || userNumbers.length === 0"
            class="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white rounded-lg font-bold text-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🎯 ตรวจรางวัล
          </button>
        </div>
      </div>

      <!-- ผลการตรวจรางวัล -->
      <div v-if="hasChecked" class="space-y-6">
        <!-- สรุปผล -->
        <div class="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl shadow-lg p-6">
          <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">🏆 ผลการตรวจรางวัล</h2>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div class="bg-white dark:bg-gray-800 rounded-xl p-4 text-center">
              <div class="text-sm text-gray-600 dark:text-gray-300 mb-1">เงินที่ซื้อ</div>
              <div class="text-2xl font-bold text-gray-800 dark:text-gray-100">{{ totalBet.toLocaleString() }} บาท</div>
            </div>

            <div class="bg-white dark:bg-gray-800 rounded-xl p-4 text-center">
              <div class="text-sm text-gray-600 dark:text-gray-300 mb-1">เงินรางวัล</div>
              <div class="text-2xl font-bold text-green-600">{{ totalPayout.toLocaleString() }} บาท</div>
            </div>

            <div class="bg-white dark:bg-gray-800 rounded-xl p-4 text-center">
              <div class="text-sm text-gray-600 dark:text-gray-300 mb-1">กำไร/ขาดทุน</div>
              <div class="text-2xl font-bold" :class="getProfitColor(profit)">
                {{ profit >= 0 ? '+' : '' }}{{ profit.toLocaleString() }} บาท
              </div>
            </div>
          </div>

          <!-- สถิติรางวัล -->
          <div v-if="prizeCounts" class="bg-white dark:bg-gray-800 rounded-xl p-4">
            <div class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">รางวัลที่ถูก</div>
            <div class="grid grid-cols-4 gap-2 text-center">
              <div>
                <div class="text-lg font-bold text-blue-600">{{ prizeCounts.exact }}</div>
                <div class="text-xs text-gray-600 dark:text-gray-300">ตรง</div>
              </div>
              <div>
                <div class="text-lg font-bold text-green-600">{{ prizeCounts.front }}</div>
                <div class="text-xs text-gray-600 dark:text-gray-300">หน้า</div>
              </div>
              <div>
                <div class="text-lg font-bold text-yellow-600">{{ prizeCounts.back }}</div>
                <div class="text-xs text-gray-600 dark:text-gray-300">หลัง</div>
              </div>
              <div>
                <div class="text-lg font-bold text-purple-600">{{ prizeCounts.any }}</div>
                <div class="text-xs text-gray-600 dark:text-gray-300">โผล่</div>
              </div>
            </div>
          </div>
        </div>

        <!-- รายละเอียดแต่ละเลข -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h3 class="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">📋 รายละเอียดแต่ละเลข</h3>

          <div class="space-y-3">
            <div
              v-for="(result, index) in checkResults"
              :key="index"
              class="flex items-center justify-between p-4 rounded-xl"
              :class="result.isWinner ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-500' : 'bg-gray-50 dark:bg-gray-700'"
            >
              <div class="flex items-center gap-4">
                <span class="text-3xl">{{ result.isWinner ? '🎉' : '❌' }}</span>
                <div>
                  <div class="text-2xl font-bold" :class="result.isWinner ? 'text-green-600' : 'text-gray-400 dark:text-gray-500'">
                    {{ result.number }}
                  </div>
                  <div class="text-sm text-gray-600 dark:text-gray-300">
                    {{ result.type === '2digit' ? '2 ตัว' : result.type === '3digit' ? '3 ตัว' : '4 ตัว' }}
                    <span v-if="result.isWinner && result.prizeType">
                      - {{ getPrizeTypeName(result.prizeType) }}
                    </span>
                  </div>
                </div>
              </div>

              <div v-if="result.isWinner && result.payout" class="text-right">
                <div class="text-xl font-bold text-green-600">
                  +{{ (result.payout * (userNumbers.find(n => n.number === result.number)?.betAmount || 100)).toLocaleString() }} บาท
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400">
                  (อัตราจ่าย 1:{{ result.payout }})
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ปุ่มตรวจใหม่ -->
        <button
          @click="reset"
          class="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg font-bold transition"
        >
          🔄 ตรวจใหม่
        </button>
      </div>
    </div>
  </NuxtLayout>
</template>

<style scoped>
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  -moz-appearance: textfield;
}
</style>
