<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { usePurchaseHistory, type PurchaseEntry } from '../composables/usePurchaseHistory'
import { usePrizeChecker, type LotteryDrawResult } from '../composables/usePrizeChecker'
import { useLotteryType } from '../composables/useLotteryType'
import { useLotteryFetcher } from '../composables/useLotteryFetcher'

const router = useRouter()
const { user, waitForAuth } = useAuth()
const { selectedLotteryType } = useLotteryType()
const { fetchFromRachaLotto } = useLotteryFetcher()
const {
  purchases,
  isLoading,
  error,
  stats,
  uncheckedPurchases,
  winningPurchases,
  loadPurchases,
  addPurchase,
  updatePrizeResults,
  deletePurchase,
} = usePurchaseHistory()

const { checkNumbers } = usePrizeChecker()

// ฟอร์มเพิ่มเลข
const showAddForm = ref(false)
const newNumbers = ref<Array<{ number: string; type: '2digit' | '3digit' | '4digit'; betAmount: number }>>([])
const newNumber = ref('')
const newNumberType = ref<'2digit' | '3digit' | '4digit'>('3digit')
const betAmount = ref(100)
const notes = ref('')

// Filter
const filterTab = ref<'all' | 'unchecked' | 'winning'>('all')

// เพิ่มเลขในฟอร์ม
const addNumberToForm = () => {
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

  newNumbers.value.push({
    number: newNumber.value,
    type: newNumberType.value,
    betAmount: betAmount.value,
  })

  newNumber.value = ''
}

// ลบเลขจากฟอร์ม
const removeNumberFromForm = (index: number) => {
  newNumbers.value.splice(index, 1)
}

// บันทึกรายการซื้อ
const savePurchase = async () => {
  if (!user.value || newNumbers.value.length === 0) {
    alert('กรุณาเพิ่มเลขอย่างน้อย 1 ชุด')
    return
  }

  try {
    await addPurchase({
      userId: user.value.uid,
      numbers: newNumbers.value,
      lotteryType: selectedLotteryType.value.id,
      purchaseDate: new Date(),
      isChecked: false,
      notes: notes.value || undefined,
    })

    // รีเซ็ตฟอร์ม
    newNumbers.value = []
    notes.value = ''
    showAddForm.value = false

    alert('✓ บันทึกสำเร็จ')
  } catch (error) {
    console.error('Error saving purchase:', error)
    alert('เกิดข้อผิดพลาด: ' + error)
  }
}

// ตรวจรางวัลรายการเดียว
const checkSinglePurchase = async (purchase: PurchaseEntry) => {
  try {
    // ดึงผลหวยงวดใหม่
    const result = await fetchFromRachaLotto()
    if (!result) {
      alert('ไม่สามารถดึงผลหวยได้ กรุณาลองอีกครั้ง')
      return
    }

    const drawResult: LotteryDrawResult = {
      date: result.date,
      period: result.period,
      threeDigit: result.threeDigit,
      twoDigit: result.twoDigit,
      fourDigit: result.fourDigit,
    }

    // ตรวจรางวัล
    const results = checkNumbers(purchase.numbers, drawResult)

    // คำนวณเงินรางวัลรวม
    const totalPayout = results.reduce((sum, result) => {
      if (result.isWinner && result.payout) {
        const bet = purchase.numbers.find((n) => n.number === result.number)?.betAmount || 100
        return sum + result.payout * bet
      }
      return sum
    }, 0)

    // อัปเดตใน Firestore
    if (purchase.id) {
      await updatePrizeResults(purchase.id, results, totalPayout)
      alert(`✓ ตรวจรางวัลสำเร็จ\nเงินรางวัล: ${totalPayout.toLocaleString()} บาท`)
    }
  } catch (error) {
    console.error('Error checking purchase:', error)
    alert('เกิดข้อผิดพลาด: ' + error)
  }
}

// ลบรายการ
const confirmDelete = async (purchase: PurchaseEntry) => {
  if (!confirm('ต้องการลบรายการนี้?')) return

  try {
    if (purchase.id) {
      await deletePurchase(purchase.id)
      alert('✓ ลบสำเร็จ')
    }
  } catch (error) {
    console.error('Error deleting purchase:', error)
    alert('เกิดข้อผิดพลาด: ' + error)
  }
}

// กรองรายการตาม tab
const filteredPurchases = computed(() => {
  if (filterTab.value === 'unchecked') {
    return uncheckedPurchases.value
  }
  if (filterTab.value === 'winning') {
    return winningPurchases.value
  }
  return purchases.value
})

// คำนวณเงินที่ซื้อรวมของแต่ละรายการ
const getTotalBet = (purchase: PurchaseEntry) => {
  return purchase.numbers.reduce((sum, n) => sum + n.betAmount, 0)
}

// สีสำหรับกำไร/ขาดทุน
const getProfitColor = (value: number) => {
  if (value > 0) return 'text-green-600'
  if (value < 0) return 'text-red-600'
  return 'text-gray-600'
}

// Format วันที่
const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// Mount
onMounted(async () => {
  const currentUser = await waitForAuth()
  if (!currentUser) {
    await router.push('/login')
    return
  }

  // โหลดข้อมูล
  await loadPurchases(currentUser.uid, selectedLotteryType.value.id)
})
</script>

<template>
  <NuxtLayout name="main">
    <div class="max-w-5xl mx-auto space-y-6">
      <!-- Header -->
      <div class="text-center">
        <h1 class="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          📝 เลขที่ซื้อ
        </h1>
        <p class="text-gray-600 dark:text-gray-300 mt-2">บันทึกและติดตามเลขที่ซื้อของคุณ</p>
      </div>

      <!-- สถิติรวม -->
      <div class="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl shadow-lg p-6">
        <h2 class="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">📊 สถิติรวม</h2>

        <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div class="bg-white dark:bg-gray-800 rounded-xl p-4 text-center">
            <div class="text-sm text-gray-600 dark:text-gray-300 mb-1">จำนวนครั้ง</div>
            <div class="text-2xl font-bold text-gray-800 dark:text-gray-100">{{ stats.totalEntries }}</div>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-xl p-4 text-center">
            <div class="text-sm text-gray-600 dark:text-gray-300 mb-1">เงินลงทุน</div>
            <div class="text-2xl font-bold text-blue-600">{{ stats.totalBet.toLocaleString() }}</div>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-xl p-4 text-center">
            <div class="text-sm text-gray-600 dark:text-gray-300 mb-1">เงินรางวัล</div>
            <div class="text-2xl font-bold text-green-600">{{ stats.totalPayout.toLocaleString() }}</div>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-xl p-4 text-center">
            <div class="text-sm text-gray-600 dark:text-gray-300 mb-1">กำไร/ขาดทุน</div>
            <div class="text-2xl font-bold" :class="getProfitColor(stats.profit)">
              {{ stats.profit >= 0 ? '+' : '' }}{{ stats.profit.toLocaleString() }}
            </div>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-xl p-4 text-center">
            <div class="text-sm text-gray-600 dark:text-gray-300 mb-1">ถูกรางวัล</div>
            <div class="text-2xl font-bold text-yellow-600">{{ stats.winCount }}</div>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-xl p-4 text-center">
            <div class="text-sm text-gray-600 dark:text-gray-300 mb-1">อัตราชนะ</div>
            <div class="text-2xl font-bold text-purple-600">{{ stats.winRate.toFixed(1) }}%</div>
          </div>
        </div>
      </div>

      <!-- ปุ่มเพิ่มเลข -->
      <button
        @click="showAddForm = !showAddForm"
        class="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white rounded-2xl font-bold text-lg transition shadow-lg"
      >
        {{ showAddForm ? '❌ ยกเลิก' : '➕ เพิ่มเลขที่ซื้อ' }}
      </button>

      <!-- ฟอร์มเพิ่มเลข -->
      <div v-if="showAddForm" class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        <h2 class="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">➕ เพิ่มเลขใหม่</h2>

        <div class="space-y-4">
          <!-- เพิ่มเลข -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              v-model="newNumber"
              type="text"
              placeholder="ใส่เลข"
              maxlength="4"
              class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              @keypress.enter="addNumberToForm"
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
              @click="addNumberToForm"
              class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition"
            >
              ➕ เพิ่ม
            </button>
          </div>

          <!-- รายการเลข -->
          <div v-if="newNumbers.length > 0" class="space-y-2">
            <div class="text-sm font-semibold text-gray-700 dark:text-gray-200">
              รายการ ({{ newNumbers.length }} ชุด, รวม {{ newNumbers.reduce((sum, n) => sum + n.betAmount, 0).toLocaleString() }} บาท)
            </div>
            <div
              v-for="(item, index) in newNumbers"
              :key="index"
              class="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg p-3"
            >
              <div class="flex items-center gap-3">
                <span class="text-xl font-bold text-blue-600">{{ item.number }}</span>
                <span class="text-sm text-gray-600 dark:text-gray-300">({{ item.type === '2digit' ? '2 ตัว' : item.type === '3digit' ? '3 ตัว' : '4 ตัว' }})</span>
                <span class="text-sm font-semibold text-gray-700 dark:text-gray-200">{{ item.betAmount }} บาท</span>
              </div>
              <button
                @click="removeNumberFromForm(index)"
                class="px-3 py-1 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-500 hover:text-red-700 rounded-lg border border-red-200 dark:border-red-800 transition"
              >
                🗑️
              </button>
            </div>
          </div>

          <!-- หมายเหตุ -->
          <textarea
            v-model="notes"
            placeholder="หมายเหตุ (ถ้ามี)"
            rows="2"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          ></textarea>

          <!-- ปุ่มบันทึก -->
          <button
            @click="savePurchase"
            :disabled="newNumbers.length === 0"
            class="w-full px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ✓ บันทึกรายการ
          </button>
        </div>
      </div>

      <!-- Filter Tabs -->
      <div class="flex gap-2 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-2">
        <button
          @click="filterTab = 'all'"
          class="flex-1 px-4 py-2 rounded-lg font-semibold transition"
          :class="filterTab === 'all' ? 'bg-blue-500 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'"
        >
          ทั้งหมด ({{ purchases.length }})
        </button>
        <button
          @click="filterTab = 'unchecked'"
          class="flex-1 px-4 py-2 rounded-lg font-semibold transition"
          :class="filterTab === 'unchecked' ? 'bg-yellow-500 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'"
        >
          ยังไม่ตรวจ ({{ uncheckedPurchases.length }})
        </button>
        <button
          @click="filterTab = 'winning'"
          class="flex-1 px-4 py-2 rounded-lg font-semibold transition"
          :class="filterTab === 'winning' ? 'bg-green-500 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'"
        >
          ถูกรางวัล ({{ winningPurchases.length }})
        </button>
      </div>

      <!-- รายการเลขที่ซื้อ -->
      <div v-if="isLoading" class="text-center py-8">
        <div class="text-gray-500 dark:text-gray-400">⏳ กำลังโหลด...</div>
      </div>

      <div v-else-if="filteredPurchases.length === 0" class="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
        <div class="text-4xl mb-3">📭</div>
        <div class="text-gray-500 dark:text-gray-400">ยังไม่มีรายการ</div>
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="purchase in filteredPurchases"
          :key="purchase.id"
          class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
          :class="purchase.isChecked && purchase.totalPayout && purchase.totalPayout > 0 ? 'ring-2 ring-green-500' : ''"
        >
          <!-- Header -->
          <div class="flex items-start justify-between mb-4">
            <div>
              <div class="text-sm text-gray-600 dark:text-gray-300">
                {{ formatDate(purchase.purchaseDate) }}
              </div>
              <div v-if="purchase.notes" class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                📝 {{ purchase.notes }}
              </div>
            </div>

            <div class="flex gap-2">
              <button
                v-if="!purchase.isChecked"
                @click="checkSinglePurchase(purchase)"
                class="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition"
              >
                🎯 ตรวจ
              </button>
              <button
                @click="confirmDelete(purchase)"
                class="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold transition"
              >
                🗑️
              </button>
            </div>
          </div>

          <!-- เลข -->
          <div class="space-y-2 mb-4">
            <div
              v-for="(num, index) in purchase.numbers"
              :key="index"
              class="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg p-3"
            >
              <div class="flex items-center gap-3">
                <span class="text-2xl font-bold text-blue-600">{{ num.number }}</span>
                <span class="text-sm text-gray-600 dark:text-gray-300">({{ num.type === '2digit' ? '2 ตัว' : num.type === '3digit' ? '3 ตัว' : '4 ตัว' }})</span>
              </div>
              <span class="text-sm font-semibold text-gray-700 dark:text-gray-200">{{ num.betAmount }} บาท</span>
            </div>
          </div>

          <!-- สรุปผล -->
          <div class="grid grid-cols-3 gap-3">
            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
              <div class="text-xs text-gray-600 dark:text-gray-300">ซื้อ</div>
              <div class="text-lg font-bold text-gray-800 dark:text-gray-100">{{ getTotalBet(purchase).toLocaleString() }}</div>
            </div>

            <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
              <div class="text-xs text-gray-600 dark:text-gray-300">รางวัล</div>
              <div class="text-lg font-bold text-green-600">
                {{ purchase.isChecked ? (purchase.totalPayout || 0).toLocaleString() : '-' }}
              </div>
            </div>

            <div class="rounded-lg p-3 text-center" :class="purchase.isChecked && purchase.profit ? (purchase.profit > 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20') : 'bg-gray-50 dark:bg-gray-700'">
              <div class="text-xs text-gray-600 dark:text-gray-300">กำไร/ขาดทุน</div>
              <div v-if="purchase.isChecked && purchase.profit !== undefined" class="text-lg font-bold" :class="getProfitColor(purchase.profit)">
                {{ purchase.profit >= 0 ? '+' : '' }}{{ purchase.profit.toLocaleString() }}
              </div>
              <div v-else class="text-lg font-bold text-gray-400 dark:text-gray-500">-</div>
            </div>
          </div>

          <!-- สถานะ -->
          <div class="mt-3 text-center">
            <span
              v-if="!purchase.isChecked"
              class="inline-block px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-semibold"
            >
              ⏳ ยังไม่ตรวจ
            </span>
            <span
              v-else-if="purchase.totalPayout && purchase.totalPayout > 0"
              class="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold"
            >
              🎉 ถูกรางวัล
            </span>
            <span
              v-else
              class="inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-semibold"
            >
              ❌ ไม่ถูก
            </span>
          </div>
        </div>
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
