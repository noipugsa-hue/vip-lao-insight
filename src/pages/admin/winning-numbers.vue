<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../../composables/useAuth'
import { useAdmin } from '../../composables/useAdmin'
import { useWinningNumbers } from '../../composables/useWinningNumbers'
import { useLotteryType, LOTTERY_TYPES } from '../../composables/useLotteryType'

const router = useRouter()
const { waitForAuth } = useAuth()
const { isAdmin } = useAdmin()
const {
  winningNumbers,
  loading,
  error,
  totalWinnings,
  totalPrizeAmount,
  addWinningNumber,
  updateWinningNumber,
  deleteWinningNumber,
  getWinningNumbers,
} = useWinningNumbers()

const showAddDialog = ref(false)
const showEditDialog = ref(false)
const editingId = ref<string | null>(null)

// Form data
const formData = ref({
  drawDate: new Date().toISOString().split('T')[0],
  period: '',
  lotteryType: 'government',
  hotNumbers: '',
  twoDigits: '',
  threeDigits: '',
  prizes: [{ type: '', amount: 0 }],
  proofImageUrl: '',
  note: '',
})

onMounted(async () => {
  console.log('🔍 Admin Winning Numbers - Starting...')

  const currentUser = await waitForAuth()
  console.log('🔍 Current User:', currentUser?.email)
  console.log('🔍 Is Admin:', isAdmin.value)

  if (!currentUser || !isAdmin.value) {
    console.log('⚠️ Not authorized, redirecting to home')
    await router.push('/home')
    return
  }

  console.log('✅ Auth check passed, loading winning numbers...')
  await getWinningNumbers()
  console.log('✅ Winning numbers loaded:', winningNumbers.value.length)
})

// Reset form
const resetForm = () => {
  formData.value = {
    drawDate: new Date().toISOString().split('T')[0],
    period: '',
    lotteryType: 'government',
    hotNumbers: '',
    twoDigits: '',
    threeDigits: '',
    prizes: [{ type: '', amount: 0 }],
    proofImageUrl: '',
    note: '',
  }
  editingId.value = null
}

// Add prize row
const addPrizeRow = () => {
  formData.value.prizes.push({ type: '', amount: 0 })
}

// Remove prize row
const removePrizeRow = (index: number) => {
  if (formData.value.prizes.length > 1) {
    formData.value.prizes.splice(index, 1)
  }
}

// Open edit dialog
const openEditDialog = (record: any) => {
  editingId.value = record.id
  formData.value = {
    drawDate: new Date(record.drawDate).toISOString().split('T')[0],
    period: record.period,
    lotteryType: record.lotteryType,
    hotNumbers: record.winningNumbers.hotNumbers?.join(', ') || '',
    twoDigits: record.winningNumbers.twoDigits?.join(', ') || '',
    threeDigits: record.winningNumbers.threeDigits?.join(', ') || '',
    prizes: record.prizes,
    proofImageUrl: record.proofImageUrl || '',
    note: record.note || '',
  }
  showEditDialog.value = true
}

// Handle submit
const handleSubmit = async () => {
  const winningNumbers: any = {}

  if (formData.value.hotNumbers.trim()) {
    winningNumbers.hotNumbers = formData.value.hotNumbers.split(',').map(n => n.trim()).filter(n => n)
  }
  if (formData.value.twoDigits.trim()) {
    winningNumbers.twoDigits = formData.value.twoDigits.split(',').map(n => n.trim()).filter(n => n)
  }
  if (formData.value.threeDigits.trim()) {
    winningNumbers.threeDigits = formData.value.threeDigits.split(',').map(n => n.trim()).filter(n => n)
  }

  const data = {
    drawDate: new Date(formData.value.drawDate),
    period: formData.value.period,
    lotteryType: formData.value.lotteryType,
    winningNumbers,
    prizes: formData.value.prizes.filter(p => p.type && p.amount > 0),
    proofImageUrl: formData.value.proofImageUrl,
    note: formData.value.note,
  }

  let success = false
  if (editingId.value) {
    success = await updateWinningNumber(editingId.value, data)
  } else {
    success = await addWinningNumber(data)
  }

  if (success) {
    showAddDialog.value = false
    showEditDialog.value = false
    resetForm()
    alert(editingId.value ? '✅ แก้ไขสำเร็จ!' : '✅ เพิ่มสำเร็จ!')
  } else {
    alert(`❌ ${error.value}`)
  }
}

// Handle delete
const handleDelete = async (id: string) => {
  if (confirm('คุณต้องการลบข้อมูลนี้ใช่หรือไม่?')) {
    const success = await deleteWinningNumber(id)
    if (success) {
      alert('✅ ลบสำเร็จ!')
    } else {
      alert(`❌ ${error.value}`)
    }
  }
}

// Format date
const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// Get lottery name
const getLotteryName = (type: string) => {
  const lottery = LOTTERY_TYPES.find(l => l.id === type)
  return lottery?.displayName || type
}
</script>

<template>
  <NuxtLayout name="main">
    <div class="max-w-7xl mx-auto px-4 py-8">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-black text-gray-900 dark:text-white mb-2">
            👑 จัดการเลขที่ถูกรางวัล
          </h1>
          <p class="text-gray-600 dark:text-gray-400">
            Admin: เพิ่ม แก้ไข และลบเลขที่ถูกรางวัล
          </p>
        </div>
        <button
          @click="showAddDialog = true; resetForm()"
          class="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transform transition-all hover:scale-105"
        >
          <span class="text-xl mr-2">➕</span>
          เพิ่มเลขที่ถูก
        </button>
      </div>

      <!-- Stats -->
      <div class="grid md:grid-cols-2 gap-6 mb-8">
        <div class="bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl p-6 shadow-xl text-white">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-semibold opacity-90 mb-1">จำนวนเลขที่ถูก</p>
              <p class="text-4xl font-black">{{ totalWinnings }}</p>
              <p class="text-xs opacity-75 mt-1">รายการทั้งหมด</p>
            </div>
            <div class="text-6xl opacity-20">🎯</div>
          </div>
        </div>
        <div class="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-3xl p-6 shadow-xl text-white">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-semibold opacity-90 mb-1">รางวัลรวม</p>
              <p class="text-4xl font-black">{{ totalPrizeAmount.toLocaleString() }}</p>
              <p class="text-xs opacity-75 mt-1">บาท</p>
            </div>
            <div class="text-6xl opacity-20">💰</div>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        <p class="text-gray-600 dark:text-gray-400 mt-4">กำลังโหลด...</p>
      </div>

      <!-- Table -->
      <div v-else class="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">วันที่</th>
                <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">งวด</th>
                <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">ประเภท</th>
                <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">เลขที่ถูก</th>
                <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">รางวัล</th>
                <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">ยืนยันโดย</th>
                <th class="px-6 py-4 text-center text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">จัดการ</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr
                v-for="record in winningNumbers"
                :key="record.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
              >
                <td class="px-6 py-4 text-sm text-gray-900 dark:text-white">
                  {{ formatDate(record.drawDate) }}
                </td>
                <td class="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                  {{ record.period }}
                </td>
                <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                  {{ getLotteryName(record.lotteryType) }}
                </td>
                <td class="px-6 py-4 text-sm">
                  <div class="space-y-1">
                    <div v-if="record.winningNumbers.hotNumbers?.length">
                      <span class="text-xs text-gray-500 dark:text-gray-400">เด่น:</span>
                      <span class="ml-1 font-bold text-green-600 dark:text-green-400">
                        {{ record.winningNumbers.hotNumbers.join(', ') }}
                      </span>
                    </div>
                    <div v-if="record.winningNumbers.twoDigits?.length">
                      <span class="text-xs text-gray-500 dark:text-gray-400">2ตัว:</span>
                      <span class="ml-1 font-bold text-yellow-600 dark:text-yellow-400">
                        {{ record.winningNumbers.twoDigits.join(', ') }}
                      </span>
                    </div>
                    <div v-if="record.winningNumbers.threeDigits?.length">
                      <span class="text-xs text-gray-500 dark:text-gray-400">3ตัว:</span>
                      <span class="ml-1 font-bold text-blue-600 dark:text-blue-400">
                        {{ record.winningNumbers.threeDigits.join(', ') }}
                      </span>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 text-sm">
                  <div class="space-y-1">
                    <div v-for="(prize, idx) in record.prizes" :key="idx" class="text-xs">
                      <span class="text-gray-600 dark:text-gray-400">{{ prize.type }}:</span>
                      <span class="ml-1 font-bold text-purple-600 dark:text-purple-400">
                        {{ prize.amount.toLocaleString() }}฿
                      </span>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 text-xs text-gray-500 dark:text-gray-400">
                  {{ record.verifiedBy }}
                </td>
                <td class="px-6 py-4 text-center">
                  <div class="flex items-center justify-center gap-2">
                    <button
                      @click="openEditDialog(record)"
                      class="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                      title="แก้ไข"
                    >
                      <span class="text-lg">✏️</span>
                    </button>
                    <button
                      @click="handleDelete(record.id)"
                      class="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                      title="ลบ"
                    >
                      <span class="text-lg">🗑️</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div v-if="winningNumbers.length === 0" class="text-center py-12">
            <div class="text-6xl mb-4">📊</div>
            <p class="text-gray-600 dark:text-gray-400">ยังไม่มีข้อมูลเลขที่ถูก</p>
          </div>
        </div>
      </div>

      <!-- Add/Edit Dialog -->
      <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="showAddDialog || showEditDialog"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
          @click.self="showAddDialog = false; showEditDialog = false"
        >
          <div class="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 my-8">
            <h3 class="text-2xl font-black text-gray-900 dark:text-white mb-6">
              {{ editingId ? '✏️ แก้ไขเลขที่ถูก' : '➕ เพิ่มเลขที่ถูก' }}
            </h3>

            <form @submit.prevent="handleSubmit" class="space-y-4">
              <!-- Date & Period -->
              <div class="grid md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">วันที่ออกรางวัล</label>
                  <input
                    v-model="formData.drawDate"
                    type="date"
                    required
                    class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">งวดที่</label>
                  <input
                    v-model="formData.period"
                    type="text"
                    placeholder="เช่น 16/05/2567"
                    required
                    class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <!-- Lottery Type -->
              <div>
                <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">ประเภทหวย</label>
                <select
                  v-model="formData.lotteryType"
                  required
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                >
                  <option v-for="lottery in LOTTERY_TYPES" :key="lottery.id" :value="lottery.id">
                    {{ lottery.displayName }}
                  </option>
                </select>
              </div>

              <!-- Winning Numbers -->
              <div class="space-y-3">
                <div>
                  <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">เลขเด่นที่ถูก (คั่นด้วย comma)</label>
                  <input
                    v-model="formData.hotNumbers"
                    type="text"
                    placeholder="เช่น 1, 5, 7"
                    class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">เลข 2 ตัวที่ถูก (คั่นด้วย comma)</label>
                  <input
                    v-model="formData.twoDigits"
                    type="text"
                    placeholder="เช่น 23, 45, 67"
                    class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">เลข 3 ตัวที่ถูก (คั่นด้วย comma)</label>
                  <input
                    v-model="formData.threeDigits"
                    type="text"
                    placeholder="เช่น 123, 456, 789"
                    class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <!-- Prizes -->
              <div>
                <div class="flex items-center justify-between mb-2">
                  <label class="block text-sm font-bold text-gray-700 dark:text-gray-300">รายละเอียดรางวัล</label>
                  <button
                    type="button"
                    @click="addPrizeRow"
                    class="text-sm text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    + เพิ่มรางวัล
                  </button>
                </div>
                <div class="space-y-2">
                  <div
                    v-for="(prize, idx) in formData.prizes"
                    :key="idx"
                    class="flex gap-2"
                  >
                    <input
                      v-model="prize.type"
                      type="text"
                      placeholder="ประเภท (เช่น 3ตัวบน)"
                      class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                    />
                    <input
                      v-model.number="prize.amount"
                      type="number"
                      placeholder="จำนวนเงิน"
                      class="w-32 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                      v-if="formData.prizes.length > 1"
                      type="button"
                      @click="removePrizeRow(idx)"
                      class="px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>

              <!-- Proof Image URL -->
              <div>
                <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">URL รูปภาพหลักฐาน (ถ้ามี)</label>
                <input
                  v-model="formData.proofImageUrl"
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <!-- Note -->
              <div>
                <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">หมายเหตุ (ถ้ามี)</label>
                <textarea
                  v-model="formData.note"
                  rows="3"
                  placeholder="เพิ่มหมายเหตุเพิ่มเติม..."
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                ></textarea>
              </div>

              <!-- Buttons -->
              <div class="flex gap-3 pt-4">
                <button
                  type="button"
                  @click="showAddDialog = false; showEditDialog = false"
                  class="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl font-bold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  :disabled="loading"
                  class="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold disabled:opacity-50"
                >
                  {{ loading ? 'กำลังบันทึก...' : (editingId ? 'บันทึกการแก้ไข' : 'เพิ่มข้อมูล') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </div>
  </NuxtLayout>
</template>
