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
          <!-- Numora Lotto AI: Always show in sidebar -->
          <div v-if="isSidebarExpanded">
            <h1 class="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600 dark:from-green-400 dark:to-blue-400">
              Numora Lotto AI
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
          <!-- Admin Badge -->
          <div v-if="isAdmin">
            <div class="space-y-1">
              <div class="flex items-center justify-between p-2 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 rounded-lg relative shadow-lg">
                <div class="flex items-center gap-2">
                  <span class="text-sm">👑</span>
                  <span class="text-white text-sm font-bold">ADMIN</span>
                </div>
                <span
                  :class="[
                    'px-2 py-0.5 text-white text-[10px] font-bold rounded-full',
                    daysRemaining <= 3 ? 'bg-red-600 animate-pulse' :
                    daysRemaining <= 7 ? 'bg-orange-600' :
                    'bg-purple-800'
                  ]"
                >
                  เหลือ {{ daysRemaining }} วัน
                </span>
              </div>
              <div class="space-y-1">
                <div class="text-center">
                  <p class="text-xs text-purple-600 dark:text-purple-300 font-bold">
                    👑 ไม่ต้องชำระเงิน
                  </p>
                </div>
                <NuxtLink
                  to="/payment"
                  class="block text-center text-xs text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 underline font-medium"
                >
                  👁️ ดูหน้าจ่ายเงิน (สำหรับดูตัวอย่าง)
                </NuxtLink>
              </div>
            </div>
          </div>
          <div v-else-if="isExpired">
            <button
              @click="showExpiredModal = true"
              class="w-full flex items-center justify-between p-2 bg-gradient-to-r from-red-500 to-red-600 rounded-lg hover:from-red-600 hover:to-red-700 transition relative animate-pulse"
            >
              <div class="flex items-center gap-2">
                <span class="text-sm">🚨</span>
                <span class="text-white text-sm font-bold">FREE หมดอายุ</span>
              </div>
              <span class="px-2 py-0.5 bg-white text-red-600 text-[10px] font-bold rounded-full">
                ต่ออายุ PRO
              </span>
            </button>
          </div>
          <div v-else-if="currentPlan === 'pro'">
            <NuxtLink
              to="/subscription"
              class="flex items-center justify-between p-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg hover:from-yellow-500 hover:to-orange-600 transition relative"
            >
              <div class="flex items-center gap-2">
                <span class="text-sm">⭐</span>
                <span class="text-white text-sm font-bold">PRO VIP</span>
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
            <div class="space-y-1">
              <div
                class="flex items-center justify-between p-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg relative"
              >
                <div class="flex items-center gap-2">
                  <span class="text-sm">🎁</span>
                  <span class="text-white text-sm font-bold">FREE 30 วัน</span>
                </div>
                <span
                  :class="[
                    'px-2 py-0.5 text-white text-[10px] font-bold rounded-full',
                    daysRemaining <= 3 ? 'bg-red-600 animate-pulse' :
                    daysRemaining <= 7 ? 'bg-orange-600' :
                    'bg-green-700'
                  ]"
                >
                  เหลือ {{ daysRemaining }} วัน
                </span>
              </div>
              <div class="text-center">
                <p class="text-xs text-gray-600 dark:text-gray-300 font-medium">
                  หมดอายุแล้วต้องชำระ 599 บาท
                </p>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="flex flex-col items-center gap-2">
          <!-- User Icon -->
          <div class="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center">
            <span class="text-white text-lg">👤</span>
          </div>

          <!-- VIP Badge Icon -->
          <div v-if="isAdmin">
            <div class="flex items-center justify-center p-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow-lg">
              <span class="text-xl">👑</span>
            </div>
          </div>
          <div v-else-if="currentPlan && currentPlan !== 'free'">
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
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700',
              // ป้องกันการคลิกเมื่อหมดอายุ (ยกเว้นหน้าที่อนุญาต)
              shouldBlockContent && !allowedPagesWhenExpired.includes(tab.path)
                ? 'pointer-events-none opacity-40 grayscale'
                : ''
            ]"
          >
            <span class="text-2xl">{{ tab.icon }}</span>
            <span v-if="isSidebarExpanded" class="text-sm">{{ tab.label }}</span>
            <!-- Lock icon for blocked items -->
            <span
              v-if="shouldBlockContent && !allowedPagesWhenExpired.includes(tab.path) && isSidebarExpanded"
              class="ml-auto text-lg"
            >
              🔒
            </span>
          </NuxtLink>
        </div>
      </nav>

      <!-- Sidebar Footer -->
      <div class="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
        <!-- Help/Tutorial Button -->
        <button
          @click="showTutorialAgain"
          :class="[
            'w-full flex items-center rounded-xl font-semibold transition-all text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-900/30 dark:hover:to-pink-900/30',
            isSidebarExpanded ? 'gap-3 px-4 py-3' : 'justify-center p-3'
          ]"
          title="ดูวิธีใช้งาน"
        >
          <span class="text-2xl">❓</span>
          <span v-if="isSidebarExpanded" class="text-sm">วิธีใช้งาน</span>
        </button>

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
            Numora Lotto AI
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
        v-if="isExpired"
        class="mt-4 mx-4 p-4 rounded-xl shadow-lg flex items-center justify-between gap-4 bg-gradient-to-r from-red-600 to-red-700 animate-pulse"
      >
        <div class="flex items-center gap-3 flex-1">
          <span class="text-2xl">🚨</span>
          <div>
            <p class="text-white font-bold text-sm md:text-base">
              {{ expirationMessage }}
            </p>
            <p class="text-white/90 text-xs mt-1">
              คลิกเพื่อแอด Line และชำระเงิน 599 บาทเพื่ออัพเกรด PRO VIP
            </p>
          </div>
        </div>
        <button
          @click="showExpiredModal = true"
          class="px-6 py-2 rounded-lg font-bold shadow-lg transition-all hover:scale-105 bg-white text-red-600 animate-bounce"
        >
          อัพเกรด PRO
        </button>
      </div>
      <div
        v-else-if="isExpiringSoon"
        :class="[
          'mt-4 mx-4 p-4 rounded-xl shadow-lg flex items-center justify-between gap-4',
          urgencyLevel === 'critical' ? 'bg-gradient-to-r from-red-600 to-red-700 animate-pulse' :
          urgencyLevel === 'high' ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
          urgencyLevel === 'medium' ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
          'bg-gradient-to-r from-blue-500 to-blue-600'
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
              คลิกเพื่อแอด Line และชำระเงิน 599 บาทต่ออายุ PRO VIP
            </p>
          </div>
        </div>
        <button
          @click="showExpiredModal = true"
          :class="[
            'px-6 py-2 rounded-lg font-bold shadow-lg transition-all hover:scale-105',
            urgencyLevel === 'critical' ? 'bg-white text-red-600 animate-bounce' :
            'bg-white text-orange-600'
          ]"
        >
          ต่ออายุ PRO
        </button>
      </div>

      <!-- Page Content -->
      <main class="flex-1 py-4 pb-20 lg:pb-4 relative">
        <!-- Content Blocker Overlay (when expired and not allowed page) -->
        <div
          v-if="shouldBlockContent"
          class="absolute inset-0 bg-black/30 backdrop-blur-md z-[90] flex items-center justify-center pointer-events-none"
        >
          <div class="text-center p-8 bg-red-600/80 rounded-2xl shadow-2xl max-w-md animate-pulse">
            <div class="text-6xl mb-4">🔒</div>
            <p class="text-white text-xl font-bold mb-2">
              เนื้อหาถูกล็อค
            </p>
            <p class="text-white/90 text-sm">
              กรุณาชำระเงิน 599 บาทเพื่อใช้งานต่อ
            </p>
          </div>
        </div>

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
          class="flex flex-col items-center justify-center flex-1 h-full transition-colors relative"
          :class="[
            currentPath === tab.path
              ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-gray-700'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
            // ป้องกันการคลิกเมื่อหมดอายุ (ยกเว้นหน้าที่อนุญาต)
            shouldBlockContent && !allowedPagesWhenExpired.includes(tab.path)
              ? 'pointer-events-none opacity-40 grayscale'
              : ''
          ]"
        >
          <span class="text-xl mb-1">{{ tab.icon }}</span>
          <span class="text-xs font-medium">{{ tab.label }}</span>
          <!-- Lock icon for blocked items -->
          <span
            v-if="shouldBlockContent && !allowedPagesWhenExpired.includes(tab.path)"
            class="absolute top-1 right-1 text-xs"
          >
            🔒
          </span>
        </NuxtLink>
      </div>
    </nav>

    <!-- Expired Modal -->
    <ExpiredModal
      :show="showExpiredModal"
      :can-close="canCloseExpiredModal"
      @close="showExpiredModal = false"
    />

    <!-- Onboarding Tutorial -->
    <OnboardingTutorial />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useAdmin } from '../composables/useAdmin'
import { useDarkMode } from '../composables/useDarkMode'
import { useSubscription } from '../composables/useSubscription'
import { useFeatureAccess, type FeatureId } from '../composables/useFeatureAccess'
// @ts-ignore - Vetur doesn't support Vue 3 SFC default exports, use Volar instead
import ExpiredModal from '../components/ExpiredModal.vue'

const route = useRoute()
const router = useRouter()
const currentPath = computed(() => route.path)
const { user, logout } = useAuth()
const { isAdmin } = useAdmin()
// @ts-ignore - Used in template, Vetur can't detect
const { isDark, toggleDarkMode } = useDarkMode()
const { isExpired, currentPlan, fetchSubscription, isExpiringSoon, expirationMessage, urgencyLevel, daysRemaining } = useSubscription()
const { canAccessFeature, fetchFeatureAccess } = useFeatureAccess()

// Mobile menu state
const isMobileMenuOpen = ref(false)

// Sidebar expanded state
const isSidebarExpanded = ref(true)

// Expired modal state
const showExpiredModal = ref(false)

// Determine if expired modal can be closed
// ถ้าหมดอายุจริงๆ (และไม่ใช่ admin) จะปิดไม่ได้ ต้องจ่ายเงินก่อน
// ถ้าแค่ใกล้หมดอายุ ปิดได้
const canCloseExpiredModal = computed(() => {
  // Admin สามารถปิดได้เสมอ (แม้จะหมดอายุ)
  if (isAdmin.value) return true

  // ถ้าหมดอายุจริงๆ แล้ว ไม่สามารถปิดได้ ต้องจ่ายเงิน
  if (isExpired.value) return false

  // ถ้าแค่ใกล้หมดอายุ สามารถปิดได้
  return true
})

// Determine if content should be blocked (when expired and not admin)
// หน้าที่อนุญาตให้เข้าถึงได้แม้หมดอายุ
const allowedPagesWhenExpired = ['/login', '/payment', '/pricing', '/subscription', '/winning-numbers', '/admin/winning-numbers']
const shouldBlockContent = computed(() => {
  // Admin ไม่ถูกบล็อก
  if (isAdmin.value) return false

  // ถ้าไม่หมดอายุ ไม่บล็อก
  if (!isExpired.value) return false

  // ถ้าอยู่ในหน้าที่อนุญาต ไม่บล็อก
  if (allowedPagesWhenExpired.includes(currentPath.value)) return false

  // กรณีอื่นๆ บล็อกทั้งหมด
  return true
})

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

// Handler สำหรับแสดง Expired Modal จากหน้าอื่น
const handleShowExpiredModal = () => {
  console.log('📱 Received show-expired-modal event')
  showExpiredModal.value = true
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

  // ฟัง event แสดง expired modal จากหน้าอื่น
  window.addEventListener('show-expired-modal', handleShowExpiredModal)
})

// Watch for expired subscription and show modal
watch(isExpired, (newValue) => {
  // แสดง modal เมื่อหมดอายุ (ยกเว้น admin ที่ไม่ต้องจ่ายเงิน)
  if (newValue && user.value && !isAdmin.value) {
    showExpiredModal.value = true
  }
}, { immediate: true })

// Cleanup event listener
onUnmounted(() => {
  window.removeEventListener('feature-access-updated', handleFeatureAccessUpdate)
  window.removeEventListener('open-mobile-menu', handleOpenMobileMenu)
  window.removeEventListener('show-expired-modal', handleShowExpiredModal)
})

// Sign out function
const handleSignOut = async () => {
  if (confirm('ต้องการออกจากระบบใช่หรือไม่?')) {
    await logout()
    await router.push('/login')
  }
}

// Show tutorial again
const showTutorialAgain = () => {
  // ลบ flag ที่เคยดูแล้ว
  localStorage.removeItem('has_seen_tutorial')
  // Reload หน้า เพื่อให้ tutorial แสดงอีกครั้ง
  window.location.reload()
}

// All menu items (for sidebar) with feature access control
const allMenuItemsList = [
  { path: '/precision', icon: '🏠', label: 'หลัก', adminOnly: false, featureId: null }, // เปิดให้ทุกคนใช้ได้
  { path: '/home', icon: '💎', label: 'โหมดปกติ', adminOnly: false, featureId: 'basic_prediction' as FeatureId },
  // { path: '/lottery-history', icon: '🎫', label: 'ผลหวยล่าสุด', adminOnly: false, featureId: 'basic_prediction' as FeatureId },
  { path: '/check-prize', icon: '✓', label: 'ตรวจรางวัล', adminOnly: false, featureId: 'check_prize' as FeatureId },
  { path: '/my-numbers', icon: '📝', label: 'เลขที่ซื้อ', adminOnly: false, featureId: 'save_numbers_limited' as FeatureId },
  { path: '/winning-numbers', icon: '🏆', label: 'เลขที่ถูกจริง', adminOnly: false, featureId: 'basic_prediction' as FeatureId },
  { path: '/statistics', icon: '📊', label: 'กราฟสถิติ', adminOnly: false, featureId: 'statistics_advanced' as FeatureId },
  { path: '/referral', icon: '🎁', label: 'แนะนำเพื่อน', adminOnly: false, featureId: null },
  { path: '/formula', icon: '🧪', label: 'สูตรหวย', adminOnly: false, featureId: 'lottery_formula' as FeatureId },
  { path: '/manual', icon: '✏️', label: 'ใส่เลขเอง', adminOnly: false, featureId: 'advanced_prediction' as FeatureId },
  { path: '/two-digit', icon: '🎲', label: 'เลข 2 ตัว', adminOnly: false, featureId: 'two_digit_advanced' as FeatureId },
  { path: '/three-digit', icon: '🔢', label: 'เลข 3 ตัว', adminOnly: false, featureId: 'three_digit_advanced' as FeatureId },
  { path: '/dream', icon: '💭', label: 'ทำนายฝัน', adminOnly: false, featureId: 'dream_analysis' as FeatureId },
  { path: '/win5', icon: '🏆', label: 'วิน5รวม', adminOnly: false, featureId: 'advanced_prediction' as FeatureId },
  { path: '/range', icon: '🎯', label: '00-99', adminOnly: false, featureId: 'advanced_prediction' as FeatureId },
  { path: '/admin/winning-numbers', icon: '👑', label: 'จัดการเลขถูก', adminOnly: true, featureId: null }, // Admin only
  { path: '/stats', icon: '👥', label: 'สถิติผู้ใช้', adminOnly: true, featureId: null }, // Admin only
  { path: '/admin/referrals', icon: '🎁', label: 'Referral Stats', adminOnly: true, featureId: null }, // Admin only
  { path: '/admin/users', icon: '🔓', label: 'จัดการผู้ใช้', adminOnly: true, featureId: null }, // Admin only
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
  { path: '/precision', icon: '🏠', label: 'หลัก' },
  { path: '/two-digit', icon: '🎲', label: 'เลข 2 ตัว' },
  { path: '/three-digit', icon: '🔢', label: 'เลข 3 ตัว' },
  { path: '/dream', icon: '💭', label: 'ทำนายฝัน' },
  { path: '/formula', icon: '🧪', label: 'สูตรหวย' },
  { path: '/winning-numbers', icon: '🏆', label: 'เลขที่ถูก' },
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
