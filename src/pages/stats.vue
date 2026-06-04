<script setup lang="ts">
import { onMounted, onUnmounted, computed, ref, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useAdmin } from '../composables/useAdmin'
import { useLoginStats, type DailyUserStat } from '../composables/useLoginStats'
import { Chart, registerables } from 'chart.js'

// Register Chart.js components
Chart.register(...registerables)

const router = useRouter()
const { waitForAuth } = useAuth()
const { isAdmin } = useAdmin()
const { stats, subscribeToStats, getDailyUserStats } = useLoginStats()
const isLoading = ref(true)
const dailyStats = ref<DailyUserStat[]>([])
const selectedDays = ref(7)
let unsubscribe: (() => void) | null = null
let chartInstance: Chart | null = null

// สร้างกราฟ
const createChart = async () => {
  await nextTick()
  const canvas = document.getElementById('dailyUsersChart') as HTMLCanvasElement
  if (!canvas) return

  // ล้างกราฟเก่า
  if (chartInstance) {
    chartInstance.destroy()
  }

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: dailyStats.value.map(d => d.date),
      datasets: [
        {
          label: 'จำนวนผู้ใช้ที่ไม่ซ้ำ',
          data: dailyStats.value.map(d => d.count),
          borderColor: 'rgb(168, 85, 247)',
          backgroundColor: 'rgba(168, 85, 247, 0.1)',
          borderWidth: 3,
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointBackgroundColor: 'rgb(168, 85, 247)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointHoverRadius: 6
        },
        {
          label: 'จำนวน Login ทั้งหมด',
          data: dailyStats.value.map(d => d.logins),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          tension: 0.4,
          fill: true,
          pointRadius: 3,
          pointBackgroundColor: 'rgb(59, 130, 246)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointHoverRadius: 5
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            font: {
              size: 14,
              weight: 'bold'
            },
            padding: 15,
            usePointStyle: true
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleFont: {
            size: 14,
            weight: 'bold'
          },
          bodyFont: {
            size: 13
          },
          padding: 12,
          cornerRadius: 8
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
            font: {
              size: 12
            }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        },
        x: {
          ticks: {
            font: {
              size: 11
            },
            maxRotation: 45,
            minRotation: 45
          },
          grid: {
            display: false
          }
        }
      }
    }
  })
}

// โหลดข้อมูลกราฟ
const loadDailyStats = async () => {
  dailyStats.value = await getDailyUserStats(selectedDays.value)
  await createChart()
}

// เปลี่ยนช่วงเวลา
const changeDays = async (days: number) => {
  selectedDays.value = days
  await loadDailyStats()
}

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

  // โหลดข้อมูลกราฟ
  await loadDailyStats()

  isLoading.value = false
})

// Unsubscribe when component unmounts
onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe()
  }
  if (chartInstance) {
    chartInstance.destroy()
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
            <h1 class="text-4xl font-black text-white mb-3 drop-shadow-lg">📊 สถิติการเข้าใช้งาน</h1>
            <p class="text-white/90 mb-6 text-lg font-semibold">ข้อมูลการ Login เข้าสู่ระบบ Numora Lotto AI</p>

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

      <!-- Daily Users Chart -->
      <div class="bg-white rounded-2xl shadow-xl p-6 mb-8">
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-3">
            <span class="text-3xl">📈</span>
            <h2 class="text-2xl font-bold text-gray-800">กราฟจำนวนผู้ใช้ต่อวัน</h2>
          </div>

          <!-- Time Range Selector -->
          <div class="flex gap-2">
            <button
              @click="changeDays(7)"
              :class="[
                'px-4 py-2 rounded-lg font-semibold transition-all',
                selectedDays === 7
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              ]"
            >
              7 วัน
            </button>
            <button
              @click="changeDays(14)"
              :class="[
                'px-4 py-2 rounded-lg font-semibold transition-all',
                selectedDays === 14
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              ]"
            >
              14 วัน
            </button>
            <button
              @click="changeDays(30)"
              :class="[
                'px-4 py-2 rounded-lg font-semibold transition-all',
                selectedDays === 30
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              ]"
            >
              30 วัน
            </button>
          </div>
        </div>

        <!-- Chart Canvas -->
        <div class="relative" style="height: 400px;">
          <canvas id="dailyUsersChart"></canvas>
        </div>

        <!-- Summary Stats -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
          <div class="text-center">
            <p class="text-sm text-gray-500 mb-1">เฉลี่ยผู้ใช้/วัน</p>
            <p class="text-2xl font-bold text-purple-600">
              {{ Math.round(dailyStats.reduce((sum, d) => sum + d.count, 0) / (dailyStats.length || 1)) }}
            </p>
          </div>
          <div class="text-center">
            <p class="text-sm text-gray-500 mb-1">เฉลี่ย Login/วัน</p>
            <p class="text-2xl font-bold text-blue-600">
              {{ Math.round(dailyStats.reduce((sum, d) => sum + d.logins, 0) / (dailyStats.length || 1)) }}
            </p>
          </div>
          <div class="text-center">
            <p class="text-sm text-gray-500 mb-1">สูงสุด/วัน</p>
            <p class="text-2xl font-bold text-green-600">
              {{ Math.max(...dailyStats.map(d => d.count), 0) }}
            </p>
          </div>
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
