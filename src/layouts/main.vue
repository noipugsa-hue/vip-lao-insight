<template>
  <div class="min-h-screen bg-gradient-to-b from-cyan-100 via-purple-50 to-blue-100 dark:bg-gradient-to-b dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
    <!-- Mobile Menu Overlay -->
    <transition name="fade">
      <div
        v-if="isMobileMenuOpen"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[55] lg:hidden"
        @click="isMobileMenuOpen = false"
      ></div>
    </transition>

    <!-- Sidebar Navigation -->
    <aside
      :class="[
        'fixed top-0 left-0 h-full bg-white dark:bg-gray-800 shadow-2xl transform transition-all duration-300 ease-in-out flex flex-col',
        isSidebarExpanded ? 'w-72' : 'w-20',
        isMobileMenuOpen ? 'translate-x-0 z-[60]' : '-translate-x-full lg:translate-x-0 lg:z-10'
      ]"
    >
      <!-- Sidebar Header -->
      <div class="p-4 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between mb-4">
          <!-- LOTTOAI: Always show in sidebar -->
          <div v-if="isSidebarExpanded">
            <h1 class="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600 dark:from-green-400 dark:to-blue-400">
              LOTTOAI
            </h1>
            <p class="text-xs text-gray-600 dark:text-gray-400">แนวทางสำหรับหวยออนไลน์</p>
          </div>
          <div v-else class="w-full flex justify-center">
            <div class="text-3xl">🎰</div>
          </div>
          <!-- Toggle button -->
          <button
            @click="isSidebarExpanded = !isSidebarExpanded"
            class="lg:block hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <span class="text-xl">{{ isSidebarExpanded ? '◀' : '▶' }}</span>
          </button>
        </div>

        <!-- User Info Card -->
        <div v-if="isSidebarExpanded" class="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-xl p-3">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center">
              <span class="text-white text-lg">👤</span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xs text-gray-500 dark:text-gray-400">ผู้ใช้งาน</p>
              <p class="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">{{ user?.email }}</p>
            </div>
          </div>

          <!-- VIP/Plan Badge -->
          <div v-if="currentPlan && currentPlan !== 'free'">
            <NuxtLink
              to="/subscription"
              class="flex items-center justify-between p-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg hover:from-yellow-500 hover:to-orange-600 transition relative"
            >
              <div class="flex items-center gap-2">
                <span class="text-sm">⭐</span>
                <span class="text-white text-sm font-bold">{{ currentPlan.toUpperCase() }}</span>
              </div>
              <span
                v-if="isExpiringSoon"
                class="px-2 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded-full"
              >
                {{ daysRemaining }} วัน
              </span>
            </NuxtLink>
          </div>
          <div v-else-if="currentPlan === 'free'">
            <NuxtLink
              to="/pricing"
              class="flex items-center justify-between p-2 bg-gradient-to-r from-gray-500 to-gray-600 rounded-lg hover:from-gray-600 hover:to-gray-700 transition relative"
            >
              <div class="flex items-center gap-2">
                <span class="text-sm">🆓</span>
                <span class="text-white text-sm font-bold">FREE</span>
              </div>
              <span class="text-white text-[10px] font-bold">
                อัพเกรด →
              </span>
            </NuxtLink>
          </div>
          <div v-else>
            <NuxtLink
              to="/pricing"
              class="flex items-center justify-center gap-2 p-2 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg hover:from-purple-600 hover:to-indigo-700 transition"
            >
              <span class="text-white text-sm font-bold">⬆️ อัพเกรด VIP</span>
            </NuxtLink>
          </div>
        </div>
        <div v-else class="flex flex-col items-center gap-2">
          <!-- User Icon -->
          <div class="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center">
            <span class="text-white text-lg">👤</span>
          </div>

          <!-- VIP Badge Icon -->
          <div v-if="currentPlan && currentPlan !== 'free'">
            <NuxtLink
              to="/subscription"
              class="flex items-center justify-center p-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg hover:from-yellow-500 hover:to-orange-600 transition"
            >
              <span class="text-xl">⭐</span>
            </NuxtLink>
          </div>
          <div v-else>
            <NuxtLink
              to="/pricing"
              class="flex items-center justify-center p-2 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg hover:from-purple-600 hover:to-indigo-700 transition"
            >
              <span class="text-xl">⬆️</span>
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Navigation Menu -->
      <nav class="flex-1 overflow-y-auto p-2">
        <div class="space-y-1">
          <NuxtLink
            v-for="tab in allMenuItems"
            :key="tab.path"
            :to="tab.path"
            @click="isMobileMenuOpen = false"
            :class="[
              'flex items-center rounded-xl font-semibold transition-all',
              isSidebarExpanded ? 'gap-3 px-4 py-3' : 'justify-center p-3',
              currentPath === tab.path
                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg scale-105'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            ]"
          >
            <span class="text-2xl">{{ tab.icon }}</span>
            <span v-if="isSidebarExpanded" class="text-sm">{{ tab.label }}</span>
          </NuxtLink>
        </div>
      </nav>

      <!-- Sidebar Footer -->
      <div class="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
        <!-- Dark Mode Toggle -->
        <button
          @click="toggleDarkMode"
          :class="[
            'w-full flex items-center rounded-xl font-semibold transition-all text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700',
            isSidebarExpanded ? 'gap-3 px-4 py-3' : 'justify-center p-3'
          ]"
        >
          <span class="text-2xl">{{ isDark ? '☀️' : '🌙' }}</span>
          <span v-if="isSidebarExpanded" class="text-sm">{{ isDark ? 'โหมดกลางวัน' : 'โหมดกลางคืน' }}</span>
        </button>

        <!-- Sign Out Button -->
        <button
          @click="handleSignOut"
          :class="[
            'w-full flex items-center rounded-xl font-semibold transition-all bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 shadow-lg',
            isSidebarExpanded ? 'gap-3 px-4 py-3' : 'justify-center p-3'
          ]"
        >
          <span class="text-2xl">🚪</span>
          <span v-if="isSidebarExpanded" class="text-sm">ออกจากระบบ</span>
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <div :class="['min-h-screen flex flex-col transition-all duration-300', isSidebarExpanded ? 'lg:ml-72' : 'lg:ml-20']">
      <!-- DEBUG: Show menu state -->
      <div class="lg:hidden fixed top-0 right-0 z-[100] bg-red-500 text-white px-2 py-1 text-xs">
        Menu: {{ isMobileMenuOpen ? 'OPEN' : 'CLOSED' }}
      </div>

      <!-- Top Bar (Mobile) - Hide completely when menu is open or on formula page -->
      <header v-if="!isMobileMenuOpen && currentPath !== '/formula'" :key="`topbar-${isMobileMenuOpen}`" class="lg:hidden sticky top-0 z-20 bg-white dark:bg-gray-800 shadow-md">
        <div class="flex items-center justify-between px-4 py-3">
          <!-- Hamburger Menu -->
          <button
            @click="openMobileMenu"
            class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <svg class="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <!-- Logo -->
          <h1 class="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600 dark:from-green-400 dark:to-blue-400">
            LOTTOAI
          </h1>

          <!-- Dark Mode Toggle -->
          <button
            @click="toggleDarkMode"
            class="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          >
            <span class="text-xl">{{ isDark ? '☀️' : '🌙' }}</span>
          </button>
        </div>
      </header>

      <!-- Expiration Warning Banner -->
      <div
        v-if="isExpiringSoon"
        :class="[
          'mt-4 p-4 rounded-xl shadow-lg flex items-center justify-between gap-4',
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
      <main class="flex-1 py-4 pb-20 lg:pb-4">
        <slot />
      </main>
    </div>

    <!-- Bottom Tab Bar (Mobile only) -->
    <nav class="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-2xl">
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
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useAdmin } from '../composables/useAdmin'
import { useDarkMode } from '../composables/useDarkMode'
import { useSubscription } from '../composables/useSubscription'
import { useFeatureAccess, type FeatureId } from '../composables/useFeatureAccess'

const route = useRoute()
const router = useRouter()
const currentPath = computed(() => route.path)
const { user, logout } = useAuth()
const { isAdmin } = useAdmin()
const { isDark, toggleDarkMode } = useDarkMode()
const { isVIP, currentPlan, fetchSubscription, isExpiringSoon, expirationMessage, urgencyLevel, daysRemaining } = useSubscription()
const { canAccessFeature, fetchFeatureAccess } = useFeatureAccess()

// Mobile menu state
const isMobileMenuOpen = ref(false)

// Sidebar expanded state
const isSidebarExpanded = ref(true)

// Open mobile menu with debug
const openMobileMenu = () => {
  console.log('🔓 Opening mobile menu, current state:', isMobileMenuOpen.value)
  isMobileMenuOpen.value = true
  console.log('✅ Menu opened, new state:', isMobileMenuOpen.value)
}

// Handler สำหรับเปิดเมนูจาก event
const handleOpenMobileMenu = () => {
  console.log('📱 Received open-mobile-menu event')
  isMobileMenuOpen.value = true
}

// Handler สำหรับรีเฟรชเมนูเมื่อมีการอัปเดตสิทธิ์การเข้าถึงฟีเจอร์
const handleFeatureAccessUpdate = async () => {
  console.log('🔄 Feature access updated, refreshing menu...')
  await fetchFeatureAccess()
}

// Load subscription and feature access on mount
onMounted(async () => {
  if (user.value) {
    await fetchSubscription()
    await fetchFeatureAccess()
  }

  // ฟัง event จากหน้า feature-access
  window.addEventListener('feature-access-updated', handleFeatureAccessUpdate)

  // ฟัง event เปิดเมนูจากหน้าอื่นๆ เช่น formula
  window.addEventListener('open-mobile-menu', handleOpenMobileMenu)
})

// Cleanup event listener
onUnmounted(() => {
  window.removeEventListener('feature-access-updated', handleFeatureAccessUpdate)
  window.removeEventListener('open-mobile-menu', handleOpenMobileMenu)
})

// Sign out function
const handleSignOut = async () => {
  if (confirm('ต้องการออกจากระบบใช่หรือไม่?')) {
    await logout()
    await router.push('/login')
  }
}

// All menu items (for sidebar) with feature access control
const allMenuItemsList = [
  { path: '/home', icon: '🏠', label: 'หลัก', adminOnly: false, featureId: 'basic_prediction' as FeatureId },
  { path: '/lottery-history', icon: '🎫', label: 'ผลหวยล่าสุด', adminOnly: false, featureId: 'basic_prediction' as FeatureId },
  { path: '/check-prize', icon: '🎯', label: 'ตรวจรางวัล', adminOnly: false, featureId: 'check_prize' as FeatureId },
  { path: '/my-numbers', icon: '📝', label: 'เลขที่ซื้อ', adminOnly: false, featureId: 'save_numbers_limited' as FeatureId },
  { path: '/statistics', icon: '📊', label: 'กราฟสถิติ', adminOnly: false, featureId: 'statistics_advanced' as FeatureId },
  { path: '/formula', icon: '🧪', label: 'สูตรหวย', adminOnly: false, featureId: 'lottery_formula' as FeatureId },
  { path: '/manual', icon: '✏️', label: 'ใส่เลขเอง', adminOnly: false, featureId: 'advanced_prediction' as FeatureId },
  { path: '/two-digit', icon: '🎲', label: 'เลข 2 ตัว', adminOnly: false, featureId: 'two_digit_advanced' as FeatureId },
  { path: '/three-digit', icon: '🔢', label: 'เลข 3 ตัว', adminOnly: false, featureId: 'three_digit_advanced' as FeatureId },
  { path: '/dream', icon: '💭', label: 'ทำนายฝัน', adminOnly: false, featureId: 'dream_analysis' as FeatureId },
  { path: '/win5', icon: '🏆', label: 'วิน5รวม', adminOnly: false, featureId: 'advanced_prediction' as FeatureId },
  { path: '/range', icon: '🎯', label: '00-99', adminOnly: false, featureId: 'advanced_prediction' as FeatureId },
  { path: '/stats', icon: '👥', label: 'สถิติผู้ใช้', adminOnly: true, featureId: null }, // Admin only
  { path: '/admin/feature-access', icon: '🔐', label: 'จัดการฟีเจอร์', adminOnly: true, featureId: null }, // Admin only
  { path: '/admin', icon: '⚙️', label: 'จัดการระบบ', adminOnly: true, featureId: null }, // Admin only
]

const allMenuItems = computed(() => {
  return allMenuItemsList.filter(tab => {
    // เช็ค admin only ก่อน
    if (tab.adminOnly && !isAdmin.value) return false

    // ถ้าไม่มี featureId แสดงว่าเป็นหน้าพื้นฐาน (แสดงได้ทั้งหมด)
    if (!tab.featureId) return true

    // เช็คสิทธิ์การเข้าถึงฟีเจอร์
    return canAccessFeature(tab.featureId)
  })
})

// Bottom Tab Bar (Mobile - most important pages)
const bottomTabsAll = [
  { path: '/home', icon: '🏠', label: 'หลัก' },
  { path: '/lottery-history', icon: '🎫', label: 'ผลหวย' },
  { path: '/check-prize', icon: '🎯', label: 'ตรวจรางวัล' },
  { path: '/my-numbers', icon: '📝', label: 'เลขที่ซื้อ' },
  { path: '/statistics', icon: '📊', label: 'สถิติ' },
]

const bottomTabs = computed(() => bottomTabsAll)
</script>

<style scoped>
/* Fade transition for overlay */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
