<template>
  <div class="min-h-screen bg-gradient-to-b from-cyan-100 via-purple-50 to-blue-100 pb-20">
    <!-- Top Header -->
    <header class="sticky top-0 z-40 bg-gradient-to-r from-cyan-50 to-blue-50 shadow-md">
      <!-- Logo & Icons Row -->
      <div class="flex items-center justify-between px-4 py-3">
        <!-- Logo -->
        <div>
          <h1 class="text-2xl font-black text-gray-800 tracking-tight">LOTTOAI</h1>
          <p class="text-xs text-gray-600">แนวทางล่ำหรับหวยรัฐบาล</p>
        </div>

        <!-- Top Right Icons -->
        <div class="flex items-center gap-3">
          <!-- Lock Icon -->
          <button class="w-10 h-10 rounded-full bg-green-500 shadow-lg flex items-center justify-center hover:bg-green-600 transition">
            <span class="text-white text-lg">🔒</span>
          </button>

          <!-- Coin Icon -->
          <button class="w-10 h-10 rounded-full bg-yellow-400 shadow-lg flex items-center justify-center hover:bg-yellow-500 transition">
            <span class="text-white text-lg">🪙</span>
          </button>

          <!-- PRO Badge -->
          <button class="px-4 py-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg flex items-center gap-2 hover:from-purple-600 hover:to-pink-600 transition">
            <span class="text-white text-xs font-bold">👤 PRO</span>
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
import { useRoute } from 'vue-router'

const route = useRoute()
const currentPath = computed(() => route.path)

// Top Navigation Tabs
const topTabs = [
  { path: '/home', icon: '🏠', label: 'หลัก' },
  { path: '/manual', icon: '✏️', label: 'ใส่เลขเอง' },
  { path: '/dream', icon: '💭', label: 'ทำนายฝัน' },
  { path: '/win5', icon: '🏆', label: 'วิน5รวม' },
  { path: '/range', icon: '🎯', label: '00-99' },
  { path: '/backup', icon: '📊', label: 'Back' },
]

// Bottom Tab Bar
const bottomTabs = [
  { path: '/analyze', icon: '🔍', label: 'วิเคราะห์' },
  { path: '/compare', icon: '⚖️', label: 'เปรียบ' },
  { path: '/accuracy', icon: '📊', label: 'ความแม่น' },
  { path: '/claude', icon: '🤖', label: 'Claude' },
  { path: '/calendar', icon: '📅', label: 'ปฏิทิน' },
]
</script>
