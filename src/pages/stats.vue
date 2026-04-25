<script setup lang="ts">
import { onMounted, onUnmounted, computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useAdmin } from '../composables/useAdmin'
import { useLoginStats } from '../composables/useLoginStats'

const router = useRouter()
const { waitForAuth } = useAuth()
const { isAdmin } = useAdmin()
const { stats, subscribeToStats } = useLoginStats()
const isLoading = ref(true)
let unsubscribe: (() => void) | null = null

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

  // Subscribe to real-time updates
  unsubscribe = subscribeToStats()
  isLoading.value = false
})

// Unsubscribe when component unmounts
onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe()
  }
})

// คำนวณจำนวนผู้ใช้ที่ไม่ซ้ำ
const uniqueUsersCount = computed(() => stats.value.uniqueUsers.size)

// ฟอร์แมต timestamp
const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

// ฟอร์แมต time ago
const timeAgo = (date: Date) => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days} วันที่แล้ว`
  if (hours > 0) return `${hours} ชั่วโมงที่แล้ว`
  if (minutes > 0) return `${minutes} นาทีที่แล้ว`
  return 'เมื่อสักครู่'
}

// เช็คว่าเป็น mobile หรือไม่
const isMobile = (userAgent: string) => {
  return /mobile/i.test(userAgent)
}
</script>

<template>
  <NuxtLayout name="main">
    <div class="max-w-6xl mx-auto">
      <!-- Header -->
      <div class="mb-8 text-center">
        <h1 class="text-3xl font-black text-gray-800 mb-2">📊 สถิติการเข้าใช้งาน</h1>
        <p class="text-gray-600 mb-3">ข้อมูลการ Login เข้าสู่ระบบ VIP Lao Insight</p>
        <!-- Real-time Badge -->
        <div class="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full shadow-lg">
          <span class="relative flex h-3 w-3">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span class="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
          </span>
          <span class="text-white font-bold text-sm">🔄 Real-time Updates</span>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <!-- Total Logins -->
        <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-6 text-white">
          <div class="flex items-center justify-between mb-4">
            <div class="text-4xl">🔐</div>
            <div class="text-right">
              <p class="text-sm opacity-80 mb-1">Login ทั้งหมด</p>
              <p class="text-4xl font-black">{{ stats.totalLogins }}</p>
            </div>
          </div>
          <div class="text-xs opacity-80">จำนวน Login ทั้งหมดในระบบ</div>
        </div>

        <!-- Today Logins -->
        <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-xl p-6 text-white">
          <div class="flex items-center justify-between mb-4">
            <div class="text-4xl">📅</div>
            <div class="text-right">
              <p class="text-sm opacity-80 mb-1">Login วันนี้</p>
              <p class="text-4xl font-black">{{ stats.todayLogins }}</p>
            </div>
          </div>
          <div class="text-xs opacity-80">จำนวน Login ในวันนี้</div>
        </div>

        <!-- Unique Users -->
        <div class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-xl p-6 text-white">
          <div class="flex items-center justify-between mb-4">
            <div class="text-4xl">👥</div>
            <div class="text-right">
              <p class="text-sm opacity-80 mb-1">ผู้ใช้ทั้งหมด</p>
              <p class="text-4xl font-black">{{ uniqueUsersCount }}</p>
            </div>
          </div>
          <div class="text-xs opacity-80">จำนวนผู้ใช้ที่ไม่ซ้ำกัน</div>
        </div>
      </div>

      <!-- Recent Login History -->
      <div class="bg-white rounded-2xl shadow-xl p-6">
        <div class="flex items-center gap-3 mb-6">
          <span class="text-3xl">📝</span>
          <h2 class="text-2xl font-bold text-gray-800">ประวัติการ Login ล่าสุด</h2>
        </div>

        <div v-if="stats.recentLogins.length === 0" class="text-center py-12 text-gray-400">
          <div class="text-6xl mb-4">📭</div>
          <p class="text-lg">ยังไม่มีข้อมูล Login</p>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="(record, index) in stats.recentLogins"
            :key="index"
            class="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl hover:shadow-md transition-all border border-gray-200"
          >
            <!-- User Info -->
            <div class="flex items-center gap-4 flex-1">
              <!-- Avatar -->
              <div class="w-12 h-12 bg-gradient-to-br from-green-600 to-green-700 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                <span class="text-white text-xl font-bold">
                  {{ record.email.charAt(0).toUpperCase() }}
                </span>
              </div>

              <!-- Email & Time -->
              <div class="flex-1 min-w-0">
                <p class="text-sm font-bold text-gray-800 truncate">{{ record.email }}</p>
                <p class="text-xs text-gray-500">{{ timeAgo(record.timestamp) }}</p>
              </div>
            </div>

            <!-- Device & Timestamp -->
            <div class="flex items-center gap-4">
              <!-- Device Badge -->
              <div
                :class="[
                  'px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1',
                  isMobile(record.userAgent)
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-purple-100 text-purple-700'
                ]"
              >
                <span>{{ isMobile(record.userAgent) ? '📱' : '💻' }}</span>
                <span>{{ isMobile(record.userAgent) ? 'Mobile' : 'Desktop' }}</span>
              </div>

              <!-- Full Timestamp -->
              <div class="hidden md:block text-xs text-gray-500 text-right min-w-[120px]">
                {{ formatDate(record.timestamp) }}
              </div>
            </div>
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

.space-y-3 > div {
  animation: fadeIn 0.3s ease-out;
}
</style>
