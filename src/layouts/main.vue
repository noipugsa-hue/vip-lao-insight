<template>
  <div class="min-h-screen bg-gradient-to-b from-cyan-100 via-purple-50 to-blue-100 dark:bg-gradient-to-b dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pb-20">
    <!-- Top Header -->
    <header class="sticky top-0 z-40 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 shadow-md">
      <!-- Logo & Icons Row -->
      <div class="flex items-center justify-between px-4 py-3">
        <!-- Logo -->
        <div>
          <h1 class="text-2xl font-black text-gray-800 dark:text-gray-100 tracking-tight">LOTTOAI</h1>
          <p class="text-xs text-gray-600 dark:text-gray-300">แนวทางสำหรับหวยออนไลน์</p>
        </div>

        <!-- User Info & Sign Out -->
        <div class="flex items-center gap-3">
          <!-- Dark Mode Toggle -->
          <button
            @click="toggleDarkMode"
            class="p-2 rounded-full bg-white/80 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 shadow transition"
            :title="isDark ? 'เปิดโหมดกลางวัน' : 'เปิดโหมดกลางคืน'"
          >
            <span class="text-xl">{{ isDark ? '☀️' : '🌙' }}</span>
          </button>

          <!-- VIP Badge / Upgrade Button -->
          <NuxtLink
            v-if="isVIP"
            to="/subscription"
            class="hidden sm:flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full shadow-lg hover:from-yellow-500 hover:to-orange-600 transition relative"
          >
            <span class="text-xs">⭐</span>
            <span class="text-white text-xs font-bold">{{ currentPlan.toUpperCase() }}</span>
            <!-- Notification Badge -->
            <span
              v-if="isExpiringSoon"
              class="absolute -top-1 -right-1 flex h-3 w-3"
            >
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <span
              v-if="isExpiringSoon && daysRemaining <= 3"
              class="absolute -top-2 -right-2 px-1.5 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded-full"
            >
              {{ daysRemaining }}
            </span>
          </NuxtLink>
          <NuxtLink
            v-else
            to="/pricing"
            class="hidden sm:flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full shadow-lg hover:from-purple-600 hover:to-indigo-700 transition"
          >
            <span class="text-white text-xs font-bold">⬆️ อัพเกรด VIP</span>
          </NuxtLink>

          <!-- User Email -->
          <div class="hidden sm:flex items-center gap-2 px-3 py-1 bg-white/80 dark:bg-gray-700 rounded-full shadow">
            <span class="text-gray-600 dark:text-gray-300 text-xs">👤</span>
            <span class="text-gray-800 dark:text-gray-100 text-xs font-semibold">{{ user?.email }}</span>
          </div>

          <!-- Sign Out Button -->
          <button
            @click="handleSignOut"
            class="px-4 py-2 rounded-full bg-gradient-to-r from-red-600 to-red-700 shadow-lg flex items-center gap-2 hover:from-red-700 hover:to-red-800 transition transform hover:scale-105 active:scale-95"
          >
            <span class="text-white text-xs font-bold">🚪 ออกจากระบบ</span>
          </button>
        </div>
      </div>

      <!-- Top Navigation Tabs -->
      <nav class="flex border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 overflow-x-auto">
        <NuxtLink
          v-for="tab in topTabs"
          :key="tab.path"
          :to="tab.path"
          class="flex-shrink-0 px-6 py-3 text-sm font-semibold transition-colors relative"
          :class="currentPath === tab.path
            ? 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-gray-700'
            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'"
        >
          <span class="mr-1">{{ tab.icon }}</span>
          {{ tab.label }}
          <div
            v-if="currentPath === tab.path"
            class="absolute bottom-0 left-0 right-0 h-1 bg-green-600 dark:bg-green-500"
          ></div>
        </NuxtLink>
      </nav>
    </header>

    <!-- Expiration Warning Banner -->
    <div
      v-if="isExpiringSoon"
      :class="[
        'mx-4 mt-4 p-4 rounded-xl shadow-lg flex items-center justify-between gap-4',
        urgencyLevel === 'critical' ? 'bg-gradient-to-r from-red-600 to-red-700 animate-pulse' :
        urgencyLevel === 'high' ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
        'bg-gradient-to-r from-yellow-500 to-yellow-600'
      ]"
    >
      <div class="flex items-center gap-3 flex-1">
        <span class="text-2xl">
          {{ urgencyLevel === 'critical' ? '🚨' : '⏰' }}
        </span>
        <div>
          <p class="text-white font-bold text-sm md:text-base">
            {{ expirationMessage }}
          </p>
          <p class="text-white/90 text-xs mt-1">
            คลิกเพื่อต่ออายุและใช้งานต่อได้ไม่มีสะดุด
          </p>
        </div>
      </div>
      <NuxtLink
        :to="`/payment?plan=${currentPlan}&action=renew`"
        :class="[
          'px-6 py-2 rounded-lg font-bold shadow-lg transition-all hover:scale-105',
          urgencyLevel === 'critical' ? 'bg-white text-red-600 animate-bounce' :
          'bg-white text-orange-600'
        ]"
      >
        ต่ออายุเลย
      </NuxtLink>
    </div>

    <!-- Page Content -->
    <main class="container mx-auto px-4 py-6">
      <slot />
    </main>

    <!-- Bottom Tab Bar -->
    <nav class="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-2xl">
      <div class="flex justify-around items-center h-16">
        <NuxtLink
          v-for="tab in bottomTabs"
          :key="tab.path"
          :to="tab.path"
          class="flex flex-col items-center justify-center flex-1 h-full transition-colors"
          :class="currentPath === tab.path
            ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-gray-700'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'"
        >
          <span class="text-xl mb-1">{{ tab.icon }}</span>
          <span class="text-xs font-medium">{{ tab.label }}</span>
        </NuxtLink>
      </div>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useAdmin } from '../composables/useAdmin'
import { useDarkMode } from '../composables/useDarkMode'
import { useSubscription } from '../composables/useSubscription'

const route = useRoute()
const router = useRouter()
const currentPath = computed(() => route.path)
const { user, logout } = useAuth()
const { isAdmin } = useAdmin()
const { isDark, toggleDarkMode } = useDarkMode()
const { isVIP, currentPlan, fetchSubscription, isExpiringSoon, expirationMessage, urgencyLevel, daysRemaining } = useSubscription()

// Load subscription on mount
onMounted(async () => {
  if (user.value) {
    await fetchSubscription()
  }
})

// Sign out function
const handleSignOut = async () => {
  if (confirm('ต้องการออกจากระบบใช่หรือไม่?')) {
    await logout()
    await router.push('/login')
  }
}

// Top Navigation Tabs (กรองตามสิทธิ์ admin)
const allTopTabs = [
  { path: '/home', icon: '🏠', label: 'หลัก', adminOnly: false },
  { path: '/ai-predict', icon: '🤖', label: 'AI Predict', adminOnly: false },
  { path: '/lottery-history', icon: '🎫', label: 'หวยย้อนหลัง', adminOnly: false },
  { path: '/check-prize', icon: '🎯', label: 'ตรวจรางวัล', adminOnly: false },
  { path: '/my-numbers', icon: '📝', label: 'เลขที่ซื้อ', adminOnly: false },
  { path: '/statistics', icon: '📊', label: 'กราฟสถิติ', adminOnly: false },
  { path: '/manual', icon: '✏️', label: 'ใส่เลขเอง', adminOnly: false },
  { path: '/two-digit', icon: '🎲', label: 'เลข 2 ตัว', adminOnly: false },
  { path: '/dream', icon: '💭', label: 'ทำนายฝัน', adminOnly: false },
  { path: '/win5', icon: '🏆', label: 'วิน5รวม', adminOnly: false },
  { path: '/range', icon: '🎯', label: '00-99', adminOnly: false },
  { path: '/stats', icon: '👥', label: 'สถิติผู้ใช้', adminOnly: true },
  { path: '/admin', icon: '⚙️', label: 'Admin', adminOnly: true },
]

const topTabs = computed(() => {
  return allTopTabs.filter(tab => !tab.adminOnly || isAdmin.value)
})

// Bottom Tab Bar (กรองแสดงเฉพาะเมนูที่ user มีสิทธิ์เข้าถึง)
const bottomTabsAll = [
  { path: '/home', icon: '🏠', label: 'หลัก', adminOnly: false },
  { path: '/ai-predict', icon: '🤖', label: 'AI Predict', adminOnly: false },
  { path: '/check-prize', icon: '🎯', label: 'ตรวจรางวัล', adminOnly: false },
  { path: '/my-numbers', icon: '📝', label: 'เลขที่ซื้อ', adminOnly: false },
  { path: '/pricing', icon: '⭐', label: 'VIP', adminOnly: false },
]

// กรองเมนูตามสิทธิ์
const bottomTabs = computed(() => {
  return bottomTabsAll.filter(tab => !tab.adminOnly || isAdmin.value)
})
</script>
