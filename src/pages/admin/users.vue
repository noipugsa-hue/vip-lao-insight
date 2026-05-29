<script setup lang="ts">
import { onMounted, onUnmounted, computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useNuxtApp } from '#app'
import { collection, query, getDocs } from 'firebase/firestore'
import { useAuth } from '../../composables/useAuth'
import { useAdmin } from '../../composables/useAdmin'
import { useAdminSubscription } from '../../composables/useAdminSubscription'
import type { UserSubscriptionInfo } from '../../composables/useAdminSubscription'

const router = useRouter()
const { waitForAuth } = useAuth()
const { isAdmin } = useAdmin()
const {
  users,
  loading,
  stats,
  calculateDaysRemaining,
  getUrgencyLevel,
  fetchAllUsers,
  extendUserSubscription,
  cleanup
} = useAdminSubscription()

const isLoading = ref(true)
const filterStatus = ref<'all' | 'active' | 'expired' | 'critical'>('all')
const sortBy = ref<'urgency' | 'recent'>('urgency')
const showExtendModal = ref(false)
const selectedUser = ref<UserSubscriptionInfo | null>(null)
const extendDays = ref(30)
const extendNotes = ref('')
const isExtending = ref(false)
const showSuccessToast = ref(false)
const successMessage = ref('')
const debugInfo = ref<any>(null)
const showDebugModal = ref(false)

// Pagination
const currentPage = ref(1)
const itemsPerPage = 18

onMounted(async () => {
  // ตรวจสอบ authentication ก่อน
  const currentUser = await waitForAuth()
  if (!currentUser) {
    await router.push('/login')
    return
  }

  // เช็คว่าเป็น admin หรือไม่
  if (!isAdmin.value) {
    alert('⛔ คุณไม่มีสิทธิ์เข้าถึงหน้านี้')
    await router.push('/home')
    return
  }

  // Fetch users with real-time updates
  await fetchAllUsers()
  isLoading.value = false
})

// Unsubscribe when component unmounts
onUnmounted(() => {
  cleanup()
})

// Filtered and sorted users
const filteredUsers = computed(() => {
  let filtered = users.value

  // Filter by status
  if (filterStatus.value === 'active') {
    filtered = filtered.filter(u => u.status === 'active' && new Date(u.endDate) > new Date())
  } else if (filterStatus.value === 'expired') {
    filtered = filtered.filter(u => u.status === 'expired' || new Date(u.endDate) <= new Date())
  } else if (filterStatus.value === 'critical') {
    filtered = filtered.filter(u => {
      const days = calculateDaysRemaining(u.endDate)
      return u.status === 'active' && days <= 3
    })
  }

  // Sort
  if (sortBy.value === 'recent') {
    return [...filtered].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
  }

  // Default: urgency (already sorted from composable)
  return filtered
})

// Total pages
const totalPages = computed(() => {
  return Math.ceil(filteredUsers.value.length / itemsPerPage)
})

// Paginated users
const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredUsers.value.slice(start, end)
})

// Page numbers for pagination UI
const pageNumbers = computed(() => {
  const pages = []
  const maxVisible = 5
  let startPage = Math.max(1, currentPage.value - Math.floor(maxVisible / 2))
  let endPage = Math.min(totalPages.value, startPage + maxVisible - 1)

  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1)
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i)
  }

  return pages
})

// Go to page
const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

// Reset to page 1 when filters change
watch([filterStatus, sortBy], () => {
  currentPage.value = 1
})

// Format date
const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

// Get urgency color
const getUrgencyColor = (userSub: UserSubscriptionInfo) => {
  const level = getUrgencyLevel(userSub)
  switch (level) {
    case 'expired': return 'bg-red-500 text-white'
    case 'critical': return 'bg-red-500 text-white animate-pulse'
    case 'high': return 'bg-orange-500 text-white'
    case 'medium': return 'bg-yellow-500 text-white'
    default: return 'bg-green-500 text-white'
  }
}

// Get urgency badge text
const getUrgencyText = (userSub: UserSubscriptionInfo) => {
  const days = calculateDaysRemaining(userSub.endDate)
  const level = getUrgencyLevel(userSub)

  if (level === 'expired') return `หมดอายุแล้ว`
  return `เหลือ ${days} วัน`
}

// Get plan badge color
const getPlanColor = (plan: string) => {
  return plan === 'pro'
    ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white'
    : 'bg-gradient-to-r from-green-400 to-green-600 text-white'
}

// Open extend modal
const openExtendModal = (user: UserSubscriptionInfo) => {
  selectedUser.value = user
  extendDays.value = 30
  extendNotes.value = ''
  showExtendModal.value = true
}

// Close extend modal
const closeExtendModal = () => {
  showExtendModal.value = false
  selectedUser.value = null
  extendNotes.value = ''
}

// Calculate preview end date
const previewEndDate = computed(() => {
  if (!selectedUser.value) return new Date()

  const now = new Date()
  const currentEnd = new Date(selectedUser.value.endDate)
  const isActive = selectedUser.value.status === 'active' && currentEnd > now

  if (isActive) {
    return new Date(currentEnd.getTime() + extendDays.value * 24 * 60 * 60 * 1000)
  } else {
    return new Date(now.getTime() + extendDays.value * 24 * 60 * 60 * 1000)
  }
})

// Calculate preview days
const previewDays = computed(() => {
  if (!selectedUser.value) return 0
  return calculateDaysRemaining(previewEndDate.value)
})

// Debug Firestore connection
const checkFirestoreConnection = async () => {
  try {
    const { $db } = useNuxtApp()
    const testQuery = query(collection($db, 'subscriptions'))
    const snapshot = await getDocs(testQuery)

    debugInfo.value = {
      connected: true,
      collectionExists: true,
      documentCount: snapshot.docs.length,
      documents: snapshot.docs.map(doc => ({
        id: doc.id,
        data: doc.data()
      }))
    }

    console.log('🔍 Firestore Debug Info:', debugInfo.value)
    showDebugModal.value = true
  } catch (err: any) {
    debugInfo.value = {
      connected: false,
      error: err.message
    }
    showDebugModal.value = true
  }
}

// Confirm extension
const confirmExtension = async () => {
  if (!selectedUser.value) return

  isExtending.value = true
  try {
    const success = await extendUserSubscription(
      selectedUser.value.uid,
      extendDays.value,
      'pro',
      extendNotes.value
    )

    if (success) {
      successMessage.value = `✅ ปลดล็อค/ต่ออายุ ${selectedUser.value.email} สำเร็จ!`
      showSuccessToast.value = true
      setTimeout(() => {
        showSuccessToast.value = false
      }, 3000)
      closeExtendModal()
    } else {
      alert('❌ เกิดข้อผิดพลาดในการต่ออายุ')
    }
  } catch (err) {
    alert('❌ เกิดข้อผิดพลาด: ' + err)
  } finally {
    isExtending.value = false
  }
}
</script>

<template>
  <NuxtLayout name="main">
    <div class="max-w-7xl mx-auto">
      <!-- Back Button -->
      <div class="mb-6">
        <button
          @click="router.push('/home')"
          class="group inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-2xl font-bold shadow-xl hover:shadow-2xl transform transition-all hover:scale-105 active:scale-95"
        >
          <span class="text-2xl group-hover:animate-bounce">←</span>
          <span>ย้อนกลับหน้าหลัก</span>
        </button>
      </div>

      <!-- Header -->
      <div class="mb-8">
        <div class="relative group">
          <!-- Animated Gradient Border -->
          <div class="absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-3xl opacity-75 group-hover:opacity-100 transition duration-300 blur-md"></div>

          <!-- Main Header Card -->
          <div class="relative bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 rounded-3xl p-8 shadow-2xl text-center">
            <h1 class="text-4xl font-black text-white mb-3 drop-shadow-lg">👥 จัดการผู้ใช้</h1>
            <p class="text-white/90 mb-6 text-lg font-semibold">ดูและจัดการ VIP ของผู้ใช้ทั้งหมด</p>

            <!-- Real-time Badge -->
            <div class="inline-flex items-center gap-2 px-5 py-2.5 bg-white/20 backdrop-blur-md rounded-full shadow-xl border border-white/30">
              <span class="relative flex h-3 w-3">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span class="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
              </span>
              <span class="text-white font-bold text-sm">🔄 Real-time Updates</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <!-- Total Users -->
        <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-6 text-white">
          <div class="flex items-center justify-between mb-4">
            <div class="text-4xl">👥</div>
            <div class="text-right">
              <p class="text-sm opacity-80 mb-1">ผู้ใช้ทั้งหมด</p>
              <p class="text-4xl font-black">{{ stats.total }}</p>
            </div>
          </div>
          <div class="text-xs opacity-80">จำนวนผู้ใช้ทั้งหมดในระบบ</div>
        </div>

        <!-- Active -->
        <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-xl p-6 text-white">
          <div class="flex items-center justify-between mb-4">
            <div class="text-4xl">✅</div>
            <div class="text-right">
              <p class="text-sm opacity-80 mb-1">ใช้งานอยู่</p>
              <p class="text-4xl font-black">{{ stats.active }}</p>
            </div>
          </div>
          <div class="text-xs opacity-80">VIP ที่ยังไม่หมดอายุ</div>
        </div>

        <!-- Expired -->
        <div class="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-xl p-6 text-white">
          <div class="flex items-center justify-between mb-4">
            <div class="text-4xl">⏰</div>
            <div class="text-right">
              <p class="text-sm opacity-80 mb-1">หมดอายุ</p>
              <p class="text-4xl font-black">{{ stats.expired }}</p>
            </div>
          </div>
          <div class="text-xs opacity-80">VIP ที่หมดอายุแล้ว</div>
        </div>

        <!-- Critical -->
        <div class="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-xl p-6 text-white">
          <div class="flex items-center justify-between mb-4">
            <div class="text-4xl">🚨</div>
            <div class="text-right">
              <p class="text-sm opacity-80 mb-1">เหลือน้อย</p>
              <p class="text-4xl font-black">{{ stats.critical }}</p>
            </div>
          </div>
          <div class="text-xs opacity-80">เหลือ 0-3 วัน</div>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6">
        <div class="flex flex-col md:flex-row items-start md:items-center gap-4">
          <!-- Status Filter -->
          <div class="flex-1">
            <label class="block text-base font-black text-gray-900 dark:text-white mb-3">
              🔍 กรองสถานะ
            </label>
            <select
              v-model="filterStatus"
              class="w-full px-4 py-3 bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-bold text-gray-900 dark:text-white text-base"
            >
              <option value="all" class="font-bold text-gray-900 dark:text-white bg-white dark:bg-gray-900">ทั้งหมด</option>
              <option value="active" class="font-bold text-gray-900 dark:text-white bg-white dark:bg-gray-900">ใช้งานอยู่</option>
              <option value="expired" class="font-bold text-gray-900 dark:text-white bg-white dark:bg-gray-900">หมดอายุ</option>
              <option value="critical" class="font-bold text-gray-900 dark:text-white bg-white dark:bg-gray-900">เหลือน้อย (0-3 วัน)</option>
            </select>
          </div>

          <!-- Sort -->
          <div class="flex-1">
            <label class="block text-base font-black text-gray-900 dark:text-white mb-3">
              📊 เรียงตาม
            </label>
            <select
              v-model="sortBy"
              class="w-full px-4 py-3 bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-bold text-gray-900 dark:text-white text-base"
            >
              <option value="urgency" class="font-bold text-gray-900 dark:text-white bg-white dark:bg-gray-900">ความเร่งด่วน</option>
              <option value="recent" class="font-bold text-gray-900 dark:text-white bg-white dark:bg-gray-900">อัพเดทล่าสุด</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading || loading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-600"></div>
        <p class="mt-4 text-gray-600 dark:text-gray-400 font-semibold">กำลังโหลดข้อมูล...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredUsers.length === 0" class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 text-center">
        <div class="text-6xl mb-6">📭</div>
        <p class="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">ยังไม่มีข้อมูลผู้ใช้</p>
        <div class="max-w-md mx-auto space-y-3">
          <p class="text-gray-600 dark:text-gray-400">
            💡 เพื่อให้เห็นรายชื่อผู้ใช้ ผู้ใช้ต้อง <span class="font-bold text-purple-600 dark:text-purple-400">Login เข้าสู่ระบบ</span> อย่างน้อย 1 ครั้ง
          </p>
          <p class="text-gray-600 dark:text-gray-400">
            📌 เมื่อผู้ใช้ Login ระบบจะสร้าง FREE subscription (30 วัน) โดยอัตโนมัติ
          </p>
          <div class="mt-6 space-y-3">
            <div class="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border-2 border-purple-200 dark:border-purple-800">
              <p class="text-sm text-purple-700 dark:text-purple-300 font-semibold">
                🔍 เปิด Console (F12) เพื่อดู debug logs
              </p>
            </div>
            <button
              @click="checkFirestoreConnection"
              class="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transform transition-all hover:scale-105 active:scale-95"
            >
              🔧 Debug Firestore Connection
            </button>
          </div>
        </div>
      </div>

      <!-- Users Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div
          v-for="user in paginatedUsers"
          :key="user.uid"
          class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all border-2 border-gray-100 dark:border-gray-700"
        >
          <!-- User Avatar & Email -->
          <div class="flex items-center gap-4 mb-4">
            <div class="w-14 h-14 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
              <span class="text-white text-2xl font-bold">
                {{ user.email?.charAt(0).toUpperCase() || 'U' }}
              </span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">{{ user.email }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ user.uid.slice(0, 8) }}...</p>
            </div>
          </div>

          <!-- Plan & Status Badges -->
          <div class="flex items-center gap-2 mb-4">
            <span :class="['px-3 py-1 rounded-full text-xs font-bold', getPlanColor(user.plan)]">
              {{ user.plan === 'pro' ? '⭐ PRO' : '🎁 FREE' }}
            </span>
            <span :class="['px-3 py-1 rounded-full text-xs font-bold', getUrgencyColor(user)]">
              {{ getUrgencyText(user) }}
            </span>
          </div>

          <!-- Dates -->
          <div class="space-y-2 mb-4">
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-600 dark:text-gray-400">📅 เริ่ม:</span>
              <span class="font-bold text-gray-800 dark:text-gray-200">{{ formatDate(user.startDate) }}</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-600 dark:text-gray-400">⏰ สิ้นสุด:</span>
              <span class="font-bold text-gray-800 dark:text-gray-200">{{ formatDate(user.endDate) }}</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-600 dark:text-gray-400">วันที่เหลือ:</span>
              <span class="text-2xl font-black text-purple-600 dark:text-purple-400">
                {{ calculateDaysRemaining(user.endDate) }}
              </span>
            </div>
          </div>

          <!-- Extend Button -->
          <button
            @click="openExtendModal(user)"
            class="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transform transition-all hover:scale-105 active:scale-95"
          >
            🔓 ปลดล็อค/ต่ออายุ
          </button>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
        <div class="flex flex-col md:flex-row items-center justify-between gap-4">
          <!-- Page Info -->
          <div class="text-sm font-bold text-gray-700 dark:text-gray-300">
            แสดง {{ ((currentPage - 1) * itemsPerPage) + 1 }} - {{ Math.min(currentPage * itemsPerPage, filteredUsers.length) }}
            จากทั้งหมด {{ filteredUsers.length }} รายการ
          </div>

          <!-- Page Numbers -->
          <div class="flex items-center gap-2">
            <!-- Previous Button -->
            <button
              @click="goToPage(currentPage - 1)"
              :disabled="currentPage === 1"
              class="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-200 dark:disabled:hover:bg-gray-700"
            >
              ← ก่อนหน้า
            </button>

            <!-- First Page -->
            <button
              v-if="pageNumbers[0] > 1"
              @click="goToPage(1)"
              class="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-xl font-bold transition-all"
            >
              1
            </button>

            <!-- Dots -->
            <span v-if="pageNumbers[0] > 2" class="text-gray-500 dark:text-gray-400 font-bold">
              ...
            </span>

            <!-- Page Numbers -->
            <button
              v-for="page in pageNumbers"
              :key="page"
              @click="goToPage(page)"
              :class="[
                'px-4 py-2 rounded-xl font-bold transition-all',
                page === currentPage
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200'
              ]"
            >
              {{ page }}
            </button>

            <!-- Dots -->
            <span v-if="pageNumbers[pageNumbers.length - 1] < totalPages - 1" class="text-gray-500 dark:text-gray-400 font-bold">
              ...
            </span>

            <!-- Last Page -->
            <button
              v-if="pageNumbers[pageNumbers.length - 1] < totalPages"
              @click="goToPage(totalPages)"
              class="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-xl font-bold transition-all"
            >
              {{ totalPages }}
            </button>

            <!-- Next Button -->
            <button
              @click="goToPage(currentPage + 1)"
              :disabled="currentPage === totalPages"
              class="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-200 dark:disabled:hover:bg-gray-700"
            >
              ถัดไป →
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Extension Modal -->
    <div
      v-if="showExtendModal"
      class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      @click.self="closeExtendModal"
    >
      <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <!-- Modal Header -->
        <div class="bg-gradient-to-r from-purple-600 to-pink-600 rounded-t-3xl p-6">
          <div class="flex items-center justify-between">
            <h2 class="text-2xl font-black text-white">🔓 ปลดล็อค/ต่ออายุ VIP</h2>
            <button
              @click="closeExtendModal"
              class="text-white hover:bg-white/20 rounded-full p-2 transition-all"
            >
              <span class="text-2xl">×</span>
            </button>
          </div>
        </div>

        <div class="p-6">
          <!-- User Info -->
          <div class="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mb-6">
            <div class="flex items-center gap-3 mb-2">
              <div class="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                <span class="text-white text-lg font-bold">
                  {{ selectedUser?.email?.charAt(0).toUpperCase() || 'U' }}
                </span>
              </div>
              <div>
                <p class="font-bold text-gray-800 dark:text-gray-200">{{ selectedUser?.email }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ selectedUser?.uid }}</p>
              </div>
            </div>
          </div>

          <!-- Before/After Comparison -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <!-- Before -->
            <div class="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border-2 border-red-200 dark:border-red-800">
              <h3 class="text-sm font-bold text-red-700 dark:text-red-400 mb-3">📅 ก่อนต่ออายุ</h3>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-400">แผน:</span>
                  <span class="font-bold text-gray-800 dark:text-gray-200">{{ selectedUser?.plan.toUpperCase() }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-400">สิ้นสุด:</span>
                  <span class="font-bold text-gray-800 dark:text-gray-200">{{ formatDate(selectedUser?.endDate || new Date()) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-400">วันที่เหลือ:</span>
                  <span class="text-xl font-black text-red-600 dark:text-red-400">
                    {{ calculateDaysRemaining(selectedUser?.endDate || new Date()) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- After -->
            <div class="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border-2 border-green-200 dark:border-green-800">
              <h3 class="text-sm font-bold text-green-700 dark:text-green-400 mb-3">✅ หลังต่ออายุ</h3>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-400">แผน:</span>
                  <span class="font-bold text-green-600 dark:text-green-400">PRO</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-400">สิ้นสุด:</span>
                  <span class="font-bold text-gray-800 dark:text-gray-200">{{ formatDate(previewEndDate) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-400">วันที่เหลือ:</span>
                  <span class="text-xl font-black text-green-600 dark:text-green-400">
                    {{ previewDays }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Days Input -->
          <div class="mb-6">
            <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              📅 จำนวนวันที่ต้องการเพิ่ม
            </label>
            <input
              v-model.number="extendDays"
              type="number"
              min="1"
              max="365"
              class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-bold text-lg"
            />
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">มาตรฐาน: 30 วัน (สามารถปรับได้ 1-365 วัน)</p>
          </div>

          <!-- Notes -->
          <div class="mb-6">
            <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              📝 หมายเหตุ (ไม่บังคับ)
            </label>
            <textarea
              v-model="extendNotes"
              rows="3"
              placeholder="เช่น: ชำระผ่าน LINE ยอด 599 บาท"
              class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
            ></textarea>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-3">
            <button
              @click="closeExtendModal"
              :disabled="isExtending"
              class="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ❌ ยกเลิก
            </button>
            <button
              @click="confirmExtension"
              :disabled="isExtending"
              class="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transform transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <span v-if="isExtending">⏳ กำลังดำเนินการ...</span>
              <span v-else>✅ ยืนยันต่ออายุ</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Success Toast -->
    <div
      v-if="showSuccessToast"
      class="fixed bottom-6 right-6 bg-green-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce z-50"
    >
      <span class="text-2xl">✅</span>
      <span class="font-bold">{{ successMessage }}</span>
    </div>

    <!-- Debug Modal -->
    <div
      v-if="showDebugModal"
      class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      @click.self="showDebugModal = false"
    >
      <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <!-- Modal Header -->
        <div class="bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-3xl p-6">
          <div class="flex items-center justify-between">
            <h2 class="text-2xl font-black text-white">🔍 Firestore Debug Info</h2>
            <button
              @click="showDebugModal = false"
              class="text-white hover:bg-white/20 rounded-full p-2 transition-all"
            >
              <span class="text-2xl">×</span>
            </button>
          </div>
        </div>

        <div class="p-6">
          <!-- Connection Status -->
          <div v-if="debugInfo" class="space-y-4">
            <div v-if="debugInfo.connected" class="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border-2 border-green-200 dark:border-green-800">
              <p class="text-green-700 dark:text-green-300 font-bold">✅ Connected to Firestore</p>
              <p class="text-sm text-green-600 dark:text-green-400 mt-2">
                พบ {{ debugInfo.documentCount }} documents ใน subscriptions collection
              </p>
            </div>
            <div v-else class="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border-2 border-red-200 dark:border-red-800">
              <p class="text-red-700 dark:text-red-300 font-bold">❌ Connection Error</p>
              <p class="text-sm text-red-600 dark:text-red-400 mt-2">{{ debugInfo.error }}</p>
            </div>

            <!-- Documents -->
            <div v-if="debugInfo.documents && debugInfo.documents.length > 0" class="mt-6">
              <h3 class="text-lg font-bold text-gray-800 dark:text-gray-200 mb-3">📄 Documents:</h3>
              <div class="space-y-3">
                <div
                  v-for="doc in debugInfo.documents"
                  :key="doc.id"
                  class="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600"
                >
                  <p class="font-bold text-purple-600 dark:text-purple-400 mb-2">ID: {{ doc.id }}</p>
                  <pre class="text-xs text-gray-700 dark:text-gray-300 overflow-auto">{{ JSON.stringify(doc.data, null, 2) }}</pre>
                </div>
              </div>
            </div>
            <div v-else-if="debugInfo.connected" class="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border-2 border-yellow-200 dark:border-yellow-800">
              <p class="text-yellow-700 dark:text-yellow-300 font-bold">⚠️ Collection is Empty</p>
              <p class="text-sm text-yellow-600 dark:text-yellow-400 mt-2">
                ยังไม่มี subscription documents ใน Firestore
              </p>
              <p class="text-sm text-yellow-600 dark:text-yellow-400 mt-2">
                💡 ให้ผู้ใช้ Login เข้าสู่ระบบเพื่อสร้าง subscription record อัตโนมัติ
              </p>
            </div>
          </div>

          <!-- Close Button -->
          <div class="mt-6">
            <button
              @click="showDebugModal = false"
              class="w-full px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-xl font-bold transition-all"
            >
              ปิด
            </button>
          </div>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>

<style scoped>
/* Custom animations */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.grid > div {
  animation: fadeIn 0.3s ease-out;
}
</style>
