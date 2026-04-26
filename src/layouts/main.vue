<template>
  <div class="min-h-screen bg-gradient-to-b from-cyan-100 via-purple-50 to-blue-100 pb-20">
    <!-- Top Header -->
    <header class="sticky top-0 z-40 bg-gradient-to-r from-cyan-50 to-blue-50 shadow-md">
      <!-- Logo & Icons Row -->
      <div class="flex items-center justify-between px-4 py-3">
        <!-- Logo -->
        <div>
          <h1 class="text-2xl font-black text-gray-800 tracking-tight">LOTTOAI</h1>
          <p class="text-xs text-gray-600">แนวทางสำหรับหวยออนไลน์</p>
        </div>

        <!-- User Info & Sign Out -->
        <div class="flex items-center gap-3">
          <!-- User Email -->
          <div class="hidden sm:flex items-center gap-2 px-3 py-1 bg-white/80 rounded-full shadow">
            <span class="text-gray-600 text-xs">👤</span>
            <span class="text-gray-800 text-xs font-semibold">{{ user?.email }}</span>
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
      <nav class="flex border-b border-gray-200 bg-white/80 overflow-x-auto">
        <NuxtLink
          v-for="tab in topTabs"
          :key="tab.path"
          :to="tab.path"
          class="flex-shrink-0 px-6 py-3 text-sm font-semibold transition-colors relative"
          :class="currentPath === tab.path
            ? 'text-green-700 bg-green-50'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'"
        >
          <span class="mr-1">{{ tab.icon }}</span>
          {{ tab.label }}
          <div
            v-if="currentPath === tab.path"
            class="absolute bottom-0 left-0 right-0 h-1 bg-green-600"
          ></div>
        </NuxtLink>
      </nav>
    </header>

    <!-- Page Content -->
    <main class="container mx-auto px-4 py-6">
      <slot />
    </main>

    <!-- Bottom Tab Bar -->
    <nav class="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-2xl">
      <div class="flex justify-around items-center h-16">
        <NuxtLink
          v-for="tab in bottomTabs"
          :key="tab.path"
          :to="tab.path"
          class="flex flex-col items-center justify-center flex-1 h-full transition-colors"
          :class="currentPath === tab.path
            ? 'text-green-600 bg-green-50'
            : 'text-gray-500 hover:text-gray-700'"
        >
          <span class="text-xl mb-1">{{ tab.icon }}</span>
          <span class="text-xs font-medium">{{ tab.label }}</span>
        </NuxtLink>
      </div>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useAdmin } from '../composables/useAdmin'

const route = useRoute()
const router = useRouter()
const currentPath = computed(() => route.path)
const { user, logout } = useAuth()
const { isAdmin } = useAdmin()

// Sign out function
const handleSignOut = async () => {
  if (confirm('ต้องการออกจากระบบใช่หรือไม่?')) {
    await logout()
    await router.push('/login')
  }
}

// Top Navigation Tabs
const topTabs = [
  { path: '/home', icon: '🏠', label: 'หลัก' },
  { path: '/manual', icon: '✏️', label: 'ใส่เลขเอง' },
  { path: '/two-digit', icon: '🎲', label: 'เลข 2 ตัว' },
  { path: '/dream', icon: '💭', label: 'ทำนายฝัน' },
  { path: '/win5', icon: '🏆', label: 'วิน5รวม' },
  { path: '/range', icon: '🎯', label: '00-99' },
  { path: '/backup', icon: '📊', label: 'Back' },
]

// Bottom Tab Bar (กรองแสดงเฉพาะเมนูที่ user มีสิทธิ์เข้าถึง)
const bottomTabsAll = [
  { path: '/analyze', icon: '🔍', label: 'วิเคราะห์', adminOnly: false },
  { path: '/compare', icon: '⚖️', label: 'เปรียบ', adminOnly: false },
  { path: '/stats', icon: '📊', label: 'สถิติ', adminOnly: true }, // เฉพาะ admin
  { path: '/accuracy', icon: '📈', label: 'ความแม่น', adminOnly: false },
  { path: '/calendar', icon: '📅', label: 'ปฏิทิน', adminOnly: false },
]

// กรองเมนูตามสิทธิ์
const bottomTabs = computed(() => {
  return bottomTabsAll.filter(tab => !tab.adminOnly || isAdmin.value)
})
</script>
