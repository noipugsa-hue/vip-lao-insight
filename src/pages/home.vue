<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useVipResult } from '../composables/useVipResult'
import { useLotteryType } from '../composables/useLotteryType'
import { useEngineSettings } from '../composables/useEngineSettings'
import { usePatternRecognition } from '../composables/usePatternRecognition'
import { useAccuracyTracking } from '../composables/useAccuracyTracking'
import { useSubscription } from '../composables/useSubscription'
import { useAdmin } from '../composables/useAdmin'

const router = useRouter()
const { waitForAuth } = useAuth()
const { subscription, currentPlan, daysRemaining, isExpiringSoon, urgencyLevel, fetchSubscription } = useSubscription()
const { isAdmin } = useAdmin()

// คำนวณจำนวนวันทั้งหมดจาก startDate ถึง endDate
const totalDays = computed(() => {
  if (!subscription.value) return 30
  const start = new Date(subscription.value.startDate)
  const end = new Date(subscription.value.endDate)
  const diffTime = end.getTime() - start.getTime()
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))
  return Math.max(diffDays, 1) // อย่างน้อย 1 วัน
})

const history = ref<string[]>([])

const { hotNumbers, twoDigits, threeDigits, lotteryType, calculatedAt, loadResult, clearResult } = useVipResult()
const { selectedLotteryType } = useLotteryType()
const { settings } = useEngineSettings()
const { accuracyStats } = useAccuracyTracking()

// สร้าง storage key แบบ dynamic ตามประเภทหวย
const getStorageKey = (lotteryId: string) => `vip_lao_history_${lotteryId}`

// โหลดข้อมูลตามประเภทหวย
const loadDataForLotteryType = (lotteryId: string) => {
  // โหลด history สำหรับประเภทหวยนี้
  const storageKey = getStorageKey(lotteryId)
  const saved = localStorage.getItem(storageKey)
  if (saved) {
    history.value = JSON.parse(saved)
  } else {
    history.value = []
  }

  // โหลดผลลัพธ์การคำนวณสำหรับประเภทหวยนี้
  loadResult(lotteryId)
}

// ฟังก์ชันแสดง Expired Modal
const showExpiredModal = () => {
  // ส่ง event ไปยัง main.vue เพื่อแสดง modal
  window.dispatchEvent(new CustomEvent('show-expired-modal'))
}

// ฟังก์ชันแชร์เลข
const showShareModal = ref(false)
const copySuccess = ref(false)

// สร้าง text สำหรับแชร์
const formatShareText = () => {
  const lotteryName = selectedLotteryType.value.displayName

  // สร้างวันที่แบบ dd/mm/yyyy
  const now = new Date()
  const day = now.getDate().toString().padStart(2, '0')
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const year = now.getFullYear()
  const date = `${day}/${month}/${year}`

  let text = `🎯 VIP Lao Insight - ${lotteryName}\n`
  text += `📅 วันที่: ${date}\n`
  text += `━━━━━━━━━━━━━━━━━━━━\n\n`

  if (hotNumbers.value.length > 0) {
    text += `🔥 เลขเด่น (${hotNumbers.value.length} ตัว)\n`
    text += `${hotNumbers.value.join(', ')}\n\n`
  }

  if (twoDigits.value.length > 0) {
    text += `💎 เลข 2 ตัว (${twoDigits.value.length} ตัว)\n`
    text += `${twoDigits.value.join(', ')}\n\n`
  }

  if (threeDigits.value.length > 0) {
    text += `✨ เลข 3 ตัว (${threeDigits.value.length} ตัว)\n`
    text += `${threeDigits.value.join(', ')}\n\n`
  }

  text += `━━━━━━━━━━━━━━━━━━━━\n`
  text += `🌐 vip-lao-insight.vercel.app`

  return text
}

// Copy to clipboard
const copyToClipboard = async () => {
  try {
    const text = formatShareText()
    await navigator.clipboard.writeText(text)
    copySuccess.value = true
    setTimeout(() => {
      copySuccess.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
    alert('❌ ไม่สามารถคัดลอกได้')
  }
}

// แชร์ไป Line
const shareToLine = () => {
  const text = formatShareText()
  const url = `https://line.me/R/msg/text/?${encodeURIComponent(text)}`
  window.open(url, '_blank')
}

// แชร์ไป Facebook
const shareToFacebook = () => {
  const text = formatShareText()
  const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://vip-lao-insight.vercel.app')}&quote=${encodeURIComponent(text)}`
  window.open(url, '_blank', 'width=600,height=400')
}

// แชร์ไป WhatsApp
const shareToWhatsApp = () => {
  const text = formatShareText()
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`
  window.open(url, '_blank')
}

// ฟังก์ชันเคลียร์ข้อมูลเก่า
const showClearModal = ref(false)
const clearOldData = () => {
  try {
    const storageKey = getStorageKey(selectedLotteryType.value.id)
    const currentLotteryType = selectedLotteryType.value.id

    // ลบประวัติหวยของประเภทนี้
    localStorage.removeItem(storageKey)

    // ลบ accuracy tracking ของประเภทนี้
    const accuracyKey = 'accuracy_tracking'
    const accuracyData = localStorage.getItem(accuracyKey)
    if (accuracyData) {
      try {
        const records = JSON.parse(accuracyData)
        // กรองเฉพาะ records ที่ไม่ใช่ประเภทหวยปัจจุบัน
        const filtered = records.filter((r: any) => r.lotteryType !== currentLotteryType)
        localStorage.setItem(accuracyKey, JSON.stringify(filtered))
      } catch (e) {
        console.error('Error filtering accuracy tracking:', e)
      }
    }

    // รีเซ็ตค่าในหน้า
    history.value = []

    // เคลียร์ผลการทำนาย (จะลบ localStorage และ clear reactive state)
    clearResult()

    // ปิด modal
    showClearModal.value = false

    // แสดงข้อความสำเร็จ
    console.log(`✅ เคลียร์ข้อมูล ${selectedLotteryType.value.name} สำเร็จ`)
    alert('✅ เคลียร์ข้อมูลสำเร็จ! พร้อมใส่เลขและคำนวณใหม่')
  } catch (err) {
    console.error('Error clearing data:', err)
    alert('❌ เกิดข้อผิดพลาดในการเคลียร์ข้อมูล')
  }
}

onMounted(async () => {
  console.log('🏠 [Home] Page mounted!')

  // ตรวจสอบ authentication ก่อน
  console.log('🏠 [Home] Waiting for auth...')
  const currentUser = await waitForAuth()
  console.log('🏠 [Home] Auth result:', currentUser ? `User: ${currentUser.email}` : 'No user')

  if (!currentUser) {
    // ถ้ายังไม่ได้ login ให้ไปหน้า login
    console.log('🏠 [Home] No user, redirecting to /login')
    await router.push('/login')
    return
  }

  // โหลดข้อมูล subscription
  console.log('🏠 [Home] Calling fetchSubscription()...')
  await fetchSubscription()
  console.log('🏠 [Home] fetchSubscription() completed')

  // โหลดข้อมูลสำหรับประเภทหวยที่เลือกอยู่
  console.log('🏠 [Home] Loading lottery data...')
  loadDataForLotteryType(selectedLotteryType.value.id)
  console.log('🏠 [Home] Home page initialization complete!')
})

// Watch lottery type changes
watch(() => selectedLotteryType.value.id, (newType) => {
  loadDataForLotteryType(newType)
})

const todayStr = computed(() => {
  const now = new Date()
  return now.toLocaleDateString('th-TH')
})

// ใช้ Pattern Recognition สำหรับคำนวณ confidence
const { calculateOverallConfidence } = usePatternRecognition(history.value)

// คำนวณ confidence สำหรับ Hot Numbers
const hotNumbersWithConfidence = computed(() => {
  return hotNumbers.value.map(num => ({
    number: num,
    confidence: calculateOverallConfidence([String(num)])
  }))
})

// คำนวณ confidence สำหรับ 3 ตัว
const threeDigitsWithConfidence = computed(() => {
  return threeDigits.value.map(num => ({
    number: num,
    confidence: calculateOverallConfidence([num])
  }))
})

// คำนวณ confidence สำหรับ 2 ตัว
const twoDigitsWithConfidence = computed(() => {
  return twoDigits.value.map(num => ({
    number: num,
    confidence: calculateOverallConfidence([num])
  }))
})

// ฟังก์ชันกำหนดสีตาม confidence level
const getConfidenceColor = (confidence: number) => {
  if (confidence >= 80) return 'from-green-500 to-green-600'
  if (confidence >= 60) return 'from-yellow-500 to-yellow-600'
  return 'from-gray-400 to-gray-500'
}

const getConfidenceBarColor = (confidence: number) => {
  if (confidence >= 80) return 'bg-green-500'
  if (confidence >= 60) return 'bg-yellow-500'
  return 'bg-gray-400'
}

// ฟังก์ชันแปลงชื่อแพ็คเกจเป็นภาษาไทย
const getPlanNameTH = computed(() => {
  // Admin มีสิทธิ์พิเศษ
  if (isAdmin.value) return 'ADMIN'

  const planNames: Record<string, string> = {
    free: 'FREE 30 วัน',
    pro: 'PRO VIP'
  }
  return planNames[currentPlan.value || 'free'] || 'FREE 30 วัน'
})

// ฟังก์ชันกำหนดสีตามแพ็คเกจ
const getPlanColor = computed(() => {
  // Admin ใช้สีม่วง-ชมพู
  if (isAdmin.value) return 'from-purple-600 to-pink-600'

  const colors: Record<string, string> = {
    free: 'from-green-400 to-emerald-500',
    pro: 'from-yellow-400 to-orange-500'
  }
  return colors[currentPlan.value || 'free'] || 'from-green-400 to-emerald-500'
})

// ฟังก์ชันกำหนดไอคอนตามแพ็คเกจ
const getPlanIcon = computed(() => {
  // Admin ใช้ไอคอนมงกุฎ
  if (isAdmin.value) return '👑'

  const icons: Record<string, string> = {
    free: '🎁',
    pro: '⭐'
  }
  return icons[currentPlan.value || 'free'] || '🎁'
})
</script>

<template>
  <NuxtLayout name="main">
    <div class="max-w-2xl mx-auto">
      <!-- Lottery Type & Date Header -->
      <div class="text-center mb-6">
        <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
          เลือกประเภทหวย แล้วใส่เลข 3-6 หลัก
        </h1>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          {{ selectedLotteryType.displayName }} · {{ todayStr }}
        </p>
        <div class="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-full shadow-sm text-xs text-gray-600 dark:text-gray-400">
          <span>Engine: <strong>{{ settings.calculationMode }}</strong></span>
          <span>·</span>
          <span>Level: <strong class="text-green-600">{{ settings.accuracyLevel }}/10</strong></span>
        </div>
        <div v-if="accuracyStats.total > 0" class="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 rounded-full shadow-sm text-xs">
          <span class="text-purple-700 dark:text-purple-300">ความแม่นโดยรวม: <strong>{{ accuracyStats.accuracy }}%</strong></span>
        </div>
      </div>

      <!-- VIP Status Card -->
      <div class="mb-6">
        <!-- Glass Morphism Card with Gradient Border -->
        <div class="relative group">
          <!-- Animated Gradient Border -->
          <div class="absolute -inset-0.5 bg-gradient-to-r rounded-3xl opacity-75 group-hover:opacity-100 transition duration-300 blur-sm"
               :class="getPlanColor"></div>

          <!-- Main Card -->
          <div class="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl p-6 shadow-2xl">
            <!-- Decorative Background Pattern -->
            <div class="absolute inset-0 opacity-5 dark:opacity-10 rounded-3xl overflow-hidden">
              <div class="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br"
                   :class="getPlanColor"></div>
              <div class="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-gradient-to-tr"
                   :class="getPlanColor"></div>
            </div>

            <div class="relative flex items-center justify-between gap-4">
              <!-- Left Side: Plan Info -->
              <div class="flex items-center gap-4 flex-1">
                <!-- Animated Icon Badge -->
                <div class="relative">
                  <div class="absolute inset-0 bg-gradient-to-br rounded-2xl blur-md opacity-60 animate-pulse"
                       :class="getPlanColor"></div>
                  <div
                    class="relative w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center text-3xl shadow-lg transform transition-transform hover:scale-110 hover:rotate-6"
                    :class="getPlanColor"
                  >
                    {{ getPlanIcon }}
                  </div>
                </div>

                <!-- Plan Name & Badge -->
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      สมาชิก
                    </span>
                    <div class="px-2 py-0.5 bg-gradient-to-r rounded-full text-[10px] font-bold text-white shadow-md"
                         :class="getPlanColor">
                      VIP
                    </div>
                  </div>
                  <h3 class="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r"
                      :class="getPlanColor">
                    {{ getPlanNameTH.toUpperCase() }}
                  </h3>
                </div>
              </div>

              <!-- Right Side: Time & Action -->
              <div class="text-right space-y-3">
                <!-- Days Remaining Display -->
                <div class="relative">
                  <!-- Glow Effect for Urgent -->
                  <div v-if="urgencyLevel === 'critical' && !isAdmin" class="absolute inset-0 bg-red-500 rounded-2xl blur-lg opacity-50 animate-pulse"></div>

                  <!-- Admin: Show days but with special styling -->
                  <div v-if="isAdmin" class="relative px-4 py-3 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 shadow-lg shadow-purple-500/50">
                    <p class="text-[10px] font-bold text-white/90 uppercase tracking-wide mb-1">
                      👑 ADMIN (ไม่ต้องจ่าย)
                    </p>
                    <div class="flex items-baseline gap-1 justify-center">
                      <p class="text-3xl font-black text-white drop-shadow-lg">
                        {{ daysRemaining }}
                      </p>
                      <span class="text-sm font-bold text-white/90">วัน</span>
                    </div>
                  </div>

                  <!-- Regular Users: Days Remaining -->
                  <div v-else class="relative px-4 py-3 rounded-2xl"
                       :class="
                         urgencyLevel === 'critical' ? 'bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/50' :
                         urgencyLevel === 'high' ? 'bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/50' :
                         urgencyLevel === 'medium' ? 'bg-gradient-to-br from-yellow-500 to-yellow-600 shadow-lg shadow-yellow-500/50' :
                         'bg-gradient-to-br from-green-500 to-green-600 shadow-lg shadow-green-500/50'
                       ">
                    <p class="text-[10px] font-bold text-white/90 uppercase tracking-wide mb-1">
                      {{ isExpiringSoon ? '⚠️ เหลือเวลา' : '✅ ใช้งานได้อีก' }}
                    </p>
                    <div class="flex items-baseline gap-1 justify-center">
                      <p class="text-3xl font-black text-white drop-shadow-lg"
                         :class="urgencyLevel === 'critical' ? 'animate-pulse' : ''">
                        {{ daysRemaining }}
                      </p>
                      <span class="text-sm font-bold text-white/90">วัน</span>
                    </div>
                    <p v-if="currentPlan === 'free'" class="text-[10px] text-white/80 mt-1 text-center">
                      หมดอายุต้องชำระ 599฿
                    </p>
                  </div>
                </div>

                <!-- Admin: View Payment Page Button -->
                <NuxtLink
                  v-if="isAdmin"
                  to="/payment"
                  class="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 via-purple-600 to-pink-600 text-white text-xs font-bold rounded-xl shadow-lg hover:shadow-2xl transition-all hover:scale-105 active:scale-95"
                >
                  <span>👁️ ดูหน้าจ่ายเงิน</span>
                  <span>(ตัวอย่าง)</span>
                </NuxtLink>

                <!-- Renew/Upgrade Button (not shown for admin) -->
                <button
                  v-else-if="isExpiringSoon"
                  @click="showExpiredModal()"
                  class="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 via-red-500 to-red-600 text-white text-sm font-bold rounded-xl shadow-lg hover:shadow-2xl transition-all hover:scale-105 active:scale-95"
                  :class="urgencyLevel === 'critical' ? 'animate-bounce' : ''"
                >
                  <span>{{ currentPlan === 'free' ? 'อัพเกรด PRO 599฿' : 'ต่ออายุ PRO' }}</span>
                  <span>⚡</span>
                </button>
              </div>
            </div>

            <!-- Progress Bar -->
            <div v-if="daysRemaining !== null" class="mt-4 pt-4 border-t" :class="isAdmin ? 'border-purple-200 dark:border-purple-700' : 'border-gray-200 dark:border-gray-700'">
              <div class="flex items-center justify-between text-xs mb-2" :class="isAdmin ? 'text-purple-600 dark:text-purple-400' : 'text-gray-600 dark:text-gray-400'">
                <span class="font-semibold">{{ isAdmin ? '👑 Admin - ไม่ต้องชำระเงิน' : 'ระยะเวลาการใช้งาน' }}</span>
                <span class="font-bold">{{ daysRemaining }} / {{ totalDays }} วัน</span>
              </div>
              <div class="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
                <div
                  class="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out"
                  :class="
                    isAdmin ? 'bg-gradient-to-r from-purple-500 to-pink-600' :
                    urgencyLevel === 'critical' ? 'bg-gradient-to-r from-red-500 to-red-600' :
                    urgencyLevel === 'high' ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                    urgencyLevel === 'medium' ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                    'bg-gradient-to-r from-green-500 to-green-600'
                  "
                  :style="{ width: `${Math.min((daysRemaining / totalDays) * 100, 100)}%` }"
                >
                  <div class="absolute inset-0 bg-white/30 animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="mb-6 flex flex-wrap gap-3">
        <!-- Share Button -->
        <button
          v-if="hotNumbers.length > 0"
          @click="showShareModal = true"
          class="group relative inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transform transition-all hover:scale-105 active:scale-95"
        >
          <span class="text-xl">📤</span>
          <span>แชร์เลข</span>
          <div class="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </button>

        <!-- Clear Data Button -->
        <button
          @click="showClearModal = true"
          class="group relative inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transform transition-all hover:scale-105 active:scale-95"
        >
          <span class="text-xl">🗑️</span>
          <span>เคลียร์ข้อมูลเก่า</span>
          <div class="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </button>
      </div>

      <!-- Results Display -->
      <div v-if="hotNumbers.length" class="space-y-6">
        <!-- Hot Numbers -->
        <div class="relative group">
          <!-- Glow Effect -->
          <div class="absolute -inset-0.5 bg-gradient-to-r from-green-400 to-emerald-600 rounded-3xl opacity-60 group-hover:opacity-100 transition duration-300 blur-md"></div>

          <div class="relative bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-green-900/20 rounded-3xl p-6 shadow-2xl backdrop-blur-sm">
            <!-- Header with Icon -->
            <div class="flex items-center justify-between mb-6">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg transform transition-transform hover:scale-110 hover:rotate-6">
                  <span class="text-2xl">🔥</span>
                </div>
                <div>
                  <h2 class="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400">
                    เลขเด่น
                  </h2>
                  <p class="text-xs text-green-700/70 dark:text-green-300/70 font-semibold">Hot Numbers</p>
                </div>
              </div>
              <div class="px-3 py-1.5 bg-white/80 dark:bg-gray-800/80 rounded-full shadow-md backdrop-blur-sm">
                <span class="text-xs font-bold text-green-600 dark:text-green-400">{{ hotNumbers.length }} ตัว</span>
              </div>
            </div>

            <!-- Hot Numbers Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                v-for="item in hotNumbersWithConfidence"
                :key="item.number"
                class="group/item relative"
              >
                <!-- Card Glow -->
                <div class="absolute -inset-0.5 rounded-2xl opacity-0 group-hover/item:opacity-75 transition duration-300 blur-sm"
                     :class="item.confidence >= 80 ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                             item.confidence >= 60 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                             'bg-gradient-to-r from-gray-400 to-gray-500'"></div>

                <div class="relative bg-white/90 dark:bg-gray-800/90 rounded-2xl p-4 shadow-xl backdrop-blur-sm transform transition-all hover:scale-105">
                  <div class="flex items-center justify-between mb-3">
                    <div class="relative">
                      <div
                        class="px-7 py-3 bg-gradient-to-br text-white rounded-2xl font-black text-3xl shadow-2xl transform transition-transform group-hover/item:scale-110"
                        :class="getConfidenceColor(item.confidence)"
                      >
                        {{ item.number }}
                      </div>
                    </div>
                    <div class="text-right">
                      <div class="px-3 py-1.5 rounded-xl font-black text-lg shadow-md"
                           :class="item.confidence >= 80 ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                                   item.confidence >= 60 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' :
                                   'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'">
                        {{ item.confidence }}%
                      </div>
                    </div>
                  </div>
                  <!-- Progress Bar with Animation -->
                  <div class="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
                    <div
                      class="h-full rounded-full transition-all duration-1000 ease-out relative"
                      :class="getConfidenceBarColor(item.confidence)"
                      :style="{ width: `${item.confidence}%` }"
                    >
                      <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 3-Digit Numbers -->
        <div class="relative group">
          <!-- Glow Effect -->
          <div class="absolute -inset-0.5 bg-gradient-to-r from-blue-400 to-indigo-600 rounded-3xl opacity-60 group-hover:opacity-100 transition duration-300 blur-md"></div>

          <div class="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-blue-900/20 rounded-3xl p-6 shadow-2xl backdrop-blur-sm">
            <!-- Header -->
            <div class="flex items-center justify-between mb-6">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg transform transition-transform hover:scale-110 hover:rotate-6">
                  <span class="text-2xl">🎲</span>
                </div>
                <div>
                  <h2 class="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                    เลข 3 ตัว
                  </h2>
                  <p class="text-xs text-blue-700/70 dark:text-blue-300/70 font-semibold">Three Digits</p>
                </div>
              </div>
              <div class="px-3 py-1.5 bg-white/80 dark:bg-gray-800/80 rounded-full shadow-md backdrop-blur-sm">
                <span class="text-xs font-bold text-blue-600 dark:text-blue-400">{{ threeDigits.length }} ชุด</span>
              </div>
            </div>

            <!-- 3-Digit Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div
                v-for="item in threeDigitsWithConfidence"
                :key="item.number"
                class="group/item relative"
              >
                <div class="absolute -inset-0.5 rounded-xl opacity-0 group-hover/item:opacity-75 transition duration-300 blur-sm"
                     :class="item.confidence >= 80 ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                             item.confidence >= 60 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                             'bg-gradient-to-r from-gray-400 to-gray-500'"></div>

                <div class="relative bg-white/90 dark:bg-gray-800/90 rounded-xl p-3 shadow-lg backdrop-blur-sm flex items-center justify-between transform transition-all hover:scale-105">
                  <div
                    class="px-6 py-2.5 bg-gradient-to-br text-white rounded-xl font-black text-xl shadow-lg transform transition-transform group-hover/item:scale-110"
                    :class="getConfidenceColor(item.confidence)"
                  >
                    {{ item.number }}
                  </div>
                  <div class="flex items-center gap-2 flex-1 ml-4">
                    <div class="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden shadow-inner">
                      <div
                        class="h-full rounded-full transition-all duration-1000 ease-out relative"
                        :class="getConfidenceBarColor(item.confidence)"
                        :style="{ width: `${item.confidence}%` }"
                      >
                        <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                      </div>
                    </div>
                    <div class="px-2 py-1 rounded-lg font-black text-sm min-w-[50px] text-center shadow-md"
                         :class="item.confidence >= 80 ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                                 item.confidence >= 60 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' :
                                 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'">
                      {{ item.confidence }}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 2-Digit Numbers -->
        <div class="relative group">
          <!-- Glow Effect -->
          <div class="absolute -inset-0.5 bg-gradient-to-r from-yellow-400 to-orange-600 rounded-3xl opacity-60 group-hover:opacity-100 transition duration-300 blur-md"></div>

          <div class="relative bg-gradient-to-br from-yellow-50 via-orange-50 to-yellow-100 dark:from-yellow-900/20 dark:via-orange-900/20 dark:to-yellow-900/20 rounded-3xl p-6 shadow-2xl backdrop-blur-sm">
            <!-- Header -->
            <div class="flex items-center justify-between mb-6">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg transform transition-transform hover:scale-110 hover:rotate-6">
                  <span class="text-2xl">🎯</span>
                </div>
                <div>
                  <h2 class="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-orange-600 dark:from-yellow-400 dark:to-orange-400">
                    ชุด 2 ตัว
                  </h2>
                  <p class="text-xs text-yellow-700/70 dark:text-yellow-300/70 font-semibold">Two Digits</p>
                </div>
              </div>
              <div class="px-3 py-1.5 bg-white/80 dark:bg-gray-800/80 rounded-full shadow-md backdrop-blur-sm">
                <span class="text-xs font-bold text-yellow-600 dark:text-yellow-400">{{ twoDigits.length }} ชุด</span>
              </div>
            </div>

            <!-- 2-Digit Grid -->
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              <div
                v-for="item in twoDigitsWithConfidence"
                :key="item.number"
                class="group/item relative"
              >
                <div class="absolute -inset-0.5 rounded-xl opacity-0 group-hover/item:opacity-75 transition duration-300 blur-sm"
                     :class="item.confidence >= 80 ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                             item.confidence >= 60 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                             'bg-gradient-to-r from-gray-400 to-gray-500'"></div>

                <div class="relative bg-white/90 dark:bg-gray-800/90 rounded-xl p-3 shadow-lg backdrop-blur-sm transform transition-all hover:scale-110">
                  <div class="flex flex-col items-center gap-2">
                    <div
                      class="px-5 py-2 bg-gradient-to-br text-white rounded-xl font-black text-2xl shadow-lg w-full text-center transform transition-transform group-hover/item:scale-110"
                      :class="getConfidenceColor(item.confidence)"
                    >
                      {{ item.number }}
                    </div>
                    <div class="w-full space-y-1.5">
                      <div class="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden shadow-inner">
                        <div
                          class="h-full rounded-full transition-all duration-1000 ease-out relative"
                          :class="getConfidenceBarColor(item.confidence)"
                          :style="{ width: `${item.confidence}%` }"
                        >
                          <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                        </div>
                      </div>
                      <div class="text-center px-2 py-0.5 rounded-lg font-bold text-xs shadow-sm"
                           :class="item.confidence >= 80 ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                                   item.confidence >= 60 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' :
                                   'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'">
                        {{ item.confidence }}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Confidence Legend -->
        <div class="relative group">
          <div class="absolute -inset-0.5 bg-gradient-to-r from-purple-400 to-pink-600 rounded-3xl opacity-40 group-hover:opacity-60 transition duration-300 blur-md"></div>

          <div class="relative bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-3xl p-6 shadow-2xl">
            <div class="flex items-center justify-center gap-2 mb-5">
              <span class="text-xl">📊</span>
              <h3 class="text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400">
                คำอธิบายความมั่นใจ
              </h3>
            </div>
            <div class="grid grid-cols-3 gap-4">
              <div class="relative group/legend">
                <div class="absolute -inset-0.5 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl opacity-0 group-hover/legend:opacity-100 transition duration-300 blur-sm"></div>
                <div class="relative bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-3 shadow-md transform transition-transform hover:scale-105">
                  <div class="flex items-center justify-center gap-2 mb-2">
                    <div class="w-4 h-4 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 shadow-md animate-pulse"></div>
                    <span class="font-black text-green-600 dark:text-green-400 text-sm">≥ 80%</span>
                  </div>
                  <p class="text-center text-xs font-bold text-green-700 dark:text-green-300">มั่นใจสูง</p>
                  <p class="text-center text-[10px] text-green-600/70 dark:text-green-400/70 mt-1">แนะนำสูง</p>
                </div>
              </div>
              <div class="relative group/legend">
                <div class="absolute -inset-0.5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl opacity-0 group-hover/legend:opacity-100 transition duration-300 blur-sm"></div>
                <div class="relative bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl p-3 shadow-md transform transition-transform hover:scale-105">
                  <div class="flex items-center justify-center gap-2 mb-2">
                    <div class="w-4 h-4 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 shadow-md"></div>
                    <span class="font-black text-yellow-600 dark:text-yellow-400 text-sm">60-79%</span>
                  </div>
                  <p class="text-center text-xs font-bold text-yellow-700 dark:text-yellow-300">มั่นใจปานกลาง</p>
                  <p class="text-center text-[10px] text-yellow-600/70 dark:text-yellow-400/70 mt-1">พิจารณาได้</p>
                </div>
              </div>
              <div class="relative group/legend">
                <div class="absolute -inset-0.5 bg-gradient-to-r from-gray-400 to-gray-500 rounded-xl opacity-0 group-hover/legend:opacity-100 transition duration-300 blur-sm"></div>
                <div class="relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl p-3 shadow-md transform transition-transform hover:scale-105">
                  <div class="flex items-center justify-center gap-2 mb-2">
                    <div class="w-4 h-4 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 shadow-md"></div>
                    <span class="font-black text-gray-600 dark:text-gray-400 text-sm">&lt; 60%</span>
                  </div>
                  <p class="text-center text-xs font-bold text-gray-700 dark:text-gray-300">มั่นใจต่ำ</p>
                  <p class="text-center text-[10px] text-gray-600/70 dark:text-gray-400/70 mt-1">ระมัดระวัง</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Calculation Info -->
        <div v-if="calculatedAt" class="text-center">
          <div class="inline-flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full shadow-lg">
            <span class="text-xs">⏱️</span>
            <span class="text-xs font-semibold text-gray-600 dark:text-gray-400">
              คำนวณล่าสุด: <span class="font-bold text-purple-600 dark:text-purple-400">{{ calculatedAt }}</span>
            </span>
          </div>
        </div>

        <!-- Buy Numbers CTA -->
        <div class="relative group mt-8">
          <!-- Animated Gradient Border -->
          <div class="absolute -inset-1 bg-gradient-to-r from-red-400 via-pink-400 to-purple-600 rounded-3xl opacity-75 group-hover:opacity-100 transition duration-300 blur-lg animate-pulse"></div>

          <div class="relative bg-gradient-to-br from-red-500 via-pink-500 to-purple-600 rounded-3xl p-8 shadow-2xl">
            <div class="text-center mb-6">
              <div class="inline-block mb-3">
                <span class="text-5xl animate-bounce inline-block">🎰</span>
              </div>
              <h3 class="text-3xl font-black text-white mb-3 drop-shadow-2xl">
                พร้อมลุ้นรางวัลใหญ่?
              </h3>
              <p class="text-white/90 text-base font-bold">
                สมัครซื้อเลขออนไลน์ได้แล้ววันนี้!
              </p>
            </div>

            <a
              href="https://af1.racha-lottoaf.com/?openExternalBrowser=1#/register?af=f8b877b2-23c2-3382-b460-3599780c1bc9"
              target="_blank"
              rel="noopener noreferrer"
              class="relative block w-full group/btn overflow-hidden"
            >
              <div class="absolute inset-0 bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 animate-pulse"></div>
              <div class="relative py-5 px-8 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-900 font-black text-2xl rounded-2xl shadow-2xl transform transition-all hover:scale-105 active:scale-95 text-center">
                <span class="mr-3 inline-block group-hover/btn:animate-bounce">🚀</span>
                คลิกสมัครซื้อเลขที่นี่
                <span class="ml-3 inline-block group-hover/btn:animate-bounce">💰</span>
              </div>
            </a>

            <div class="mt-6 flex items-center justify-center gap-6 text-white/90 text-sm">
              <div class="flex items-center gap-2">
                <span class="text-xl">✅</span>
                <span class="font-bold">ปลอดภัย</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-xl">⚡</span>
                <span class="font-bold">รวดเร็ว</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-xl">💳</span>
                <span class="font-bold">ถอนง่าย</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- No Results -->
      <div v-else class="relative group">
        <div class="absolute -inset-0.5 bg-gradient-to-r from-purple-400 to-pink-600 rounded-3xl opacity-30 group-hover:opacity-50 transition duration-300 blur-md"></div>

        <div class="relative bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-3xl p-12 shadow-2xl text-center">
          <div class="mb-6">
            <div class="inline-block animate-bounce">
              <span class="text-8xl">🎲</span>
            </div>
          </div>
          <h3 class="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 mb-3">
            ยังไม่มีผลการคำนวณ
          </h3>
          <p class="text-gray-600 dark:text-gray-400 mb-8 text-lg">
            ไปที่หน้า "ใส่เลขเอง" เพื่อเริ่มคำนวณเลขหวย
          </p>
          <NuxtLink
            to="/manual"
            class="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-black text-lg shadow-xl hover:shadow-2xl transform transition-all hover:scale-110 active:scale-95"
          >
            <span class="text-2xl">✏️</span>
            <span>ไปใส่เลขเอง</span>
            <span class="text-2xl">→</span>
          </NuxtLink>
        </div>
      </div>

      <!-- Clear Data Confirmation Modal -->
      <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="showClearModal"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          @click.self="showClearModal = false"
        >
          <Transition
            enter-active-class="transition duration-300 ease-out"
            enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition duration-200 ease-in"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-95"
          >
            <div
              v-if="showClearModal"
              class="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 space-y-6"
            >
              <!-- Warning Icon -->
              <div class="flex justify-center">
                <div class="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                  <span class="text-5xl">⚠️</span>
                </div>
              </div>

              <!-- Title -->
              <div class="text-center space-y-2">
                <h3 class="text-2xl font-black text-gray-900 dark:text-white">
                  ยืนยันการเคลียร์ข้อมูล
                </h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  คุณต้องการลบข้อมูลเก่าทั้งหมดใช่หรือไม่?
                </p>
              </div>

              <!-- Warning Message -->
              <div class="bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-200 dark:border-orange-700 rounded-2xl p-4">
                <div class="flex items-start gap-3">
                  <span class="text-2xl flex-shrink-0">📋</span>
                  <div class="space-y-1 text-sm text-orange-800 dark:text-orange-200">
                    <p class="font-bold">ข้อมูลที่จะถูกลบ:</p>
                    <ul class="list-disc list-inside space-y-1 ml-2">
                      <li>ประวัติการออกรางวัล {{ selectedLotteryType.name }}</li>
                      <li>ผลการคำนวณเลขเด่น</li>
                      <li>การทำนายเลข 2 ตัว และ 3 ตัว</li>
                    </ul>
                    <p class="font-bold mt-3 text-red-600 dark:text-red-400">
                      ⚠️ ข้อมูลที่ลบแล้วจะไม่สามารถกู้คืนได้!
                    </p>
                  </div>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="grid grid-cols-2 gap-3">
                <button
                  @click="showClearModal = false"
                  class="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-2xl font-bold shadow-md hover:shadow-lg transform transition-all hover:scale-105 active:scale-95"
                >
                  ยกเลิก
                </button>
                <button
                  @click="clearOldData"
                  class="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-2xl font-bold shadow-md hover:shadow-lg transform transition-all hover:scale-105 active:scale-95"
                >
                  ยืนยันลบ
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>

      <!-- Share Modal -->
      <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="showShareModal"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          @click.self="showShareModal = false"
        >
          <Transition
            enter-active-class="transition duration-300 ease-out"
            enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition duration-200 ease-in"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-95"
          >
            <div
              v-if="showShareModal"
              class="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 space-y-6"
            >
              <!-- Share Icon -->
              <div class="flex justify-center">
                <div class="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                  <span class="text-5xl">📤</span>
                </div>
              </div>

              <!-- Title -->
              <div class="text-center space-y-2">
                <h3 class="text-2xl font-black text-gray-900 dark:text-white">
                  แชร์เลขที่คำนวณ
                </h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  เลือกช่องทางที่ต้องการแชร์
                </p>
              </div>

              <!-- Preview Text -->
              <div class="bg-gray-50 dark:bg-gray-900/50 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-4 max-h-40 overflow-y-auto">
                <pre class="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono">{{ formatShareText() }}</pre>
              </div>

              <!-- Share Options -->
              <div class="grid grid-cols-2 gap-3">
                <!-- Copy Button -->
                <button
                  @click="copyToClipboard"
                  class="group relative flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-2xl shadow-md hover:shadow-lg transform transition-all hover:scale-105 active:scale-95"
                >
                  <span class="text-3xl">{{ copySuccess ? '✅' : '📋' }}</span>
                  <span class="text-sm font-bold text-gray-900 dark:text-white">
                    {{ copySuccess ? 'คัดลอกแล้ว!' : 'คัดลอก' }}
                  </span>
                </button>

                <!-- Line Button -->
                <button
                  @click="shareToLine"
                  class="group relative flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl shadow-md hover:shadow-lg transform transition-all hover:scale-105 active:scale-95"
                >
                  <span class="text-3xl">💬</span>
                  <span class="text-sm font-bold text-white">Line</span>
                </button>

                <!-- Facebook Button -->
                <button
                  @click="shareToFacebook"
                  class="group relative flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl shadow-md hover:shadow-lg transform transition-all hover:scale-105 active:scale-95"
                >
                  <span class="text-3xl">📘</span>
                  <span class="text-sm font-bold text-white">Facebook</span>
                </button>

                <!-- WhatsApp Button -->
                <button
                  @click="shareToWhatsApp"
                  class="group relative flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl shadow-md hover:shadow-lg transform transition-all hover:scale-105 active:scale-95"
                >
                  <span class="text-3xl">📱</span>
                  <span class="text-sm font-bold text-white">WhatsApp</span>
                </button>
              </div>

              <!-- Close Button -->
              <button
                @click="showShareModal = false"
                class="w-full px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-2xl font-bold shadow-md hover:shadow-lg transform transition-all hover:scale-105 active:scale-95"
              >
                ปิด
              </button>
            </div>
          </Transition>
        </div>
      </Transition>
    </div>
  </NuxtLayout>
</template>

<style scoped>
@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.animate-shimmer {
  animation: shimmer 2s infinite;
}
</style>
