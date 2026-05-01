<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../../composables/useAuth'
import { useAdmin } from '../../composables/useAdmin'
import { useFeatureAccess, type SubscriptionPlan, type FeatureId, ALL_FEATURES } from '../../composables/useFeatureAccess'

definePageMeta({
  layout: 'main'
})

const router = useRouter()
const { waitForAuth } = useAuth()
const { isAdmin } = useAdmin()
const {
  planFeatures,
  loading,
  error,
  featuresByCategory,
  getFeatureCount,
  fetchFeatureAccess,
  saveFeatureAccess,
  resetToDefault,
  hasFeatureAccess,
  toggleFeature
} = useFeatureAccess()

const activeTab = ref<'table' | 'category'>('table')
const saving = ref(false)
const successMessage = ref('')
const showResetConfirm = ref(false)
const initialized = ref(false)

// Plan names สำหรับแสดงผล
const planNames: Record<SubscriptionPlan, string> = {
  free: 'Free',
  basic: 'Basic',
  pro: 'Pro',
  premium: 'Premium'
}

// Plan colors
const planColors: Record<SubscriptionPlan, string> = {
  free: 'bg-gray-500',
  basic: 'bg-blue-500',
  pro: 'bg-purple-500',
  premium: 'bg-gradient-to-r from-yellow-400 to-orange-500'
}

// Category names
const categoryNames = {
  prediction: 'การพยากรณ์',
  analysis: 'การวิเคราะห์',
  storage: 'การจัดเก็บและติดตาม',
  premium: 'ฟีเจอร์พรีเมียม'
}

const plans: SubscriptionPlan[] = ['free', 'basic', 'pro', 'premium']

onMounted(async () => {
  const currentUser = await waitForAuth()
  if (!currentUser || !isAdmin.value) {
    await router.push('/home')
    return
  }

  // โหลดข้อมูลจาก Firestore
  await fetchFeatureAccess()
  initialized.value = true
})

// บันทึกการเปลี่ยนแปลง
const handleSave = async () => {
  saving.value = true
  successMessage.value = ''

  const success = await saveFeatureAccess()

  if (success) {
    successMessage.value = '✅ บันทึกการตั้งค่าสำเร็จ'

    // ส่ง event เพื่อบอกให้ layout รีเฟรชเมนู
    window.dispatchEvent(new CustomEvent('feature-access-updated'))

    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  }

  saving.value = false
}

// รีเซ็ตเป็นค่าเริ่มต้น
const handleReset = () => {
  showResetConfirm.value = true
}

const confirmReset = () => {
  resetToDefault()
  showResetConfirm.value = false
  successMessage.value = '🔄 รีเซ็ตเป็นค่าเริ่มต้นแล้ว (ยังไม่บันทึก)'
  setTimeout(() => {
    successMessage.value = ''
  }, 3000)
}

// สถิติ
const stats = computed(() => {
  const counts = getFeatureCount.value
  return {
    totalFeatures: ALL_FEATURES.length,
    free: counts.free,
    basic: counts.basic,
    pro: counts.pro,
    premium: counts.premium
  }
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 dark:from-gray-950 dark:via-purple-950 dark:to-indigo-950 py-8 px-4">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
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

        <div class="mb-4">
          <h1 class="text-3xl md:text-4xl font-bold text-white mb-2">
            🔐 จัดการสิทธิ์การเข้าถึงฟีเจอร์
          </h1>
          <p class="text-purple-200">
            กำหนดว่า VIP แต่ละระดับจะเข้าถึงฟีเจอร์ไหนได้บ้าง
          </p>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div class="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4">
            <div class="text-purple-200 text-sm mb-1">ฟีเจอร์ทั้งหมด</div>
            <div class="text-2xl font-bold text-white">{{ stats.totalFeatures }}</div>
          </div>
          <div class="bg-gray-500/20 backdrop-blur-md border border-gray-400/30 rounded-xl p-4">
            <div class="text-gray-200 text-sm mb-1">Free</div>
            <div class="text-2xl font-bold text-white">{{ stats.free }}</div>
          </div>
          <div class="bg-blue-500/20 backdrop-blur-md border border-blue-400/30 rounded-xl p-4">
            <div class="text-blue-200 text-sm mb-1">Basic</div>
            <div class="text-2xl font-bold text-white">{{ stats.basic }}</div>
          </div>
          <div class="bg-purple-500/20 backdrop-blur-md border border-purple-400/30 rounded-xl p-4">
            <div class="text-purple-200 text-sm mb-1">Pro</div>
            <div class="text-2xl font-bold text-white">{{ stats.pro }}</div>
          </div>
          <div class="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-md border border-yellow-400/30 rounded-xl p-4">
            <div class="text-yellow-200 text-sm mb-1">Premium</div>
            <div class="text-2xl font-bold text-white">{{ stats.premium }}</div>
          </div>
        </div>
      </div>

      <!-- Action Bar -->
      <div class="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <!-- Tabs -->
        <div class="flex gap-2 bg-white/10 backdrop-blur-md rounded-lg p-1">
          <button
            @click="activeTab = 'table'"
            :class="[
              'px-4 py-2 rounded-lg transition-colors font-medium',
              activeTab === 'table'
                ? 'bg-purple-500 text-white'
                : 'text-purple-200 hover:text-white'
            ]"
          >
            📊 ตารางเปรียบเทียบ
          </button>
          <button
            @click="activeTab = 'category'"
            :class="[
              'px-4 py-2 rounded-lg transition-colors font-medium',
              activeTab === 'category'
                ? 'bg-purple-500 text-white'
                : 'text-purple-200 hover:text-white'
            ]"
          >
            📁 แยกตามหมวดหมู่
          </button>
        </div>

        <!-- Actions -->
        <div class="flex gap-3">
          <button
            @click="handleReset"
            :disabled="loading || saving"
            class="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🔄 รีเซ็ต
          </button>
          <button
            @click="handleSave"
            :disabled="loading || saving"
            class="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg font-bold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ saving ? '💾 กำลังบันทึก...' : '💾 บันทึก' }}
          </button>
        </div>
      </div>

      <!-- Success Message -->
      <div
        v-if="successMessage"
        class="mb-6 bg-green-500/20 border-2 border-green-400 rounded-xl p-4 text-green-100 animate-pulse"
      >
        {{ successMessage }}
      </div>

      <!-- Error Message -->
      <div
        v-if="error"
        class="mb-6 bg-red-500/20 border-2 border-red-400 rounded-xl p-4 text-red-100"
      >
        ❌ {{ error }}
      </div>

      <!-- Loading -->
      <div v-if="loading && !initialized" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        <p class="text-purple-200 mt-4">กำลังโหลด...</p>
      </div>

      <!-- Table View -->
      <div v-else-if="activeTab === 'table'" class="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="bg-white/5">
                <th class="px-6 py-4 text-left text-purple-200 font-bold sticky left-0 bg-gray-800/50 backdrop-blur-sm z-10">ฟีเจอร์</th>
                <th
                  v-for="plan in plans"
                  :key="plan"
                  class="px-6 py-4 text-center text-white font-bold"
                >
                  <div class="flex items-center justify-center gap-2">
                    <div :class="[planColors[plan], 'w-3 h-3 rounded-full']"></div>
                    {{ planNames[plan] }}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <template v-for="(category, categoryKey) in featuresByCategory" :key="categoryKey">
                <!-- Category Header -->
                <tr class="bg-purple-500/20">
                  <td colspan="5" class="px-6 py-3 text-white font-bold">
                    {{ categoryNames[categoryKey as keyof typeof categoryNames] }}
                  </td>
                </tr>
                <!-- Features -->
                <tr
                  v-for="feature in category"
                  :key="feature.id"
                  class="border-t border-white/10 hover:bg-white/5 transition-colors"
                >
                  <td class="px-6 py-4 sticky left-0 bg-gray-900/50 backdrop-blur-sm z-10">
                    <div class="flex items-start gap-3">
                      <span class="text-2xl">{{ feature.icon }}</span>
                      <div>
                        <div class="text-white font-medium">{{ feature.name }}</div>
                        <div class="text-purple-300 text-sm">{{ feature.description }}</div>
                      </div>
                    </div>
                  </td>
                  <td
                    v-for="plan in plans"
                    :key="plan"
                    class="px-6 py-4 text-center"
                  >
                    <button
                      @click="toggleFeature(plan, feature.id)"
                      :class="[
                        'w-10 h-10 rounded-lg transition-all transform hover:scale-110',
                        hasFeatureAccess(plan, feature.id)
                          ? 'bg-green-500 text-white shadow-lg shadow-green-500/50'
                          : 'bg-red-500/30 text-red-300'
                      ]"
                    >
                      {{ hasFeatureAccess(plan, feature.id) ? '✓' : '✕' }}
                    </button>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Category View -->
      <div v-else class="space-y-6">
        <div
          v-for="(category, categoryKey) in featuresByCategory"
          :key="categoryKey"
          class="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6"
        >
          <h2 class="text-2xl font-bold text-white mb-6">
            {{ categoryNames[categoryKey as keyof typeof categoryNames] }}
          </h2>
          <div class="space-y-4">
            <div
              v-for="feature in category"
              :key="feature.id"
              class="bg-white/5 rounded-xl p-4"
            >
              <div class="flex items-start gap-4 mb-4">
                <span class="text-3xl">{{ feature.icon }}</span>
                <div class="flex-1">
                  <h3 class="text-lg font-bold text-white mb-1">{{ feature.name }}</h3>
                  <p class="text-purple-300 text-sm">{{ feature.description }}</p>
                </div>
              </div>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button
                  v-for="plan in plans"
                  :key="plan"
                  @click="toggleFeature(plan, feature.id)"
                  :class="[
                    'px-4 py-2 rounded-lg font-medium transition-all',
                    hasFeatureAccess(plan, feature.id)
                      ? planColors[plan] + ' text-white shadow-lg'
                      : 'bg-white/10 text-purple-300 hover:bg-white/20'
                  ]"
                >
                  {{ hasFeatureAccess(plan, feature.id) ? '✓ ' : '' }}{{ planNames[plan] }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Reset Confirmation Modal -->
      <div
        v-if="showResetConfirm"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        @click.self="showResetConfirm = false"
      >
        <div class="bg-gradient-to-br from-purple-900 to-indigo-900 border-2 border-purple-400 rounded-2xl p-8 max-w-md w-full shadow-2xl">
          <div class="text-center mb-6">
            <div class="text-6xl mb-4">⚠️</div>
            <h3 class="text-2xl font-bold text-white mb-2">ยืนยันการรีเซ็ต</h3>
            <p class="text-purple-200">
              คุณต้องการรีเซ็ตการตั้งค่าทั้งหมดกลับเป็นค่าเริ่มต้นหรือไม่?
            </p>
          </div>
          <div class="flex gap-4">
            <button
              @click="showResetConfirm = false"
              class="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-colors"
            >
              ยกเลิก
            </button>
            <button
              @click="confirmReset"
              class="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl"
            >
              รีเซ็ต
            </button>
          </div>
        </div>
      </div>

      <!-- Info Card -->
      <div class="mt-8 bg-blue-500/20 backdrop-blur-md border border-blue-400/30 rounded-2xl p-6">
        <div class="flex items-start gap-4">
          <div class="text-4xl">💡</div>
          <div>
            <h3 class="text-xl font-bold text-white mb-2">วิธีใช้งาน</h3>
            <ul class="text-blue-200 space-y-2 text-sm">
              <li>• คลิกที่ปุ่ม ✓/✕ เพื่อเปิด/ปิดฟีเจอร์สำหรับแต่ละ plan</li>
              <li>• สีเขียว (✓) หมายถึงเปิดใช้งาน, สีแดง (✕) หมายถึงปิดใช้งาน</li>
              <li>• แก้ไขเสร็จแล้วคลิก "💾 บันทึก" เพื่อบันทึกลง Firestore</li>
              <li>• คลิก "🔄 รีเซ็ต" เพื่อกลับไปค่าเริ่มต้น (ต้องบันทึกอีกครั้ง)</li>
              <li>• การเปลี่ยนแปลงจะมีผลทันทีกับผู้ใช้ทั้งหมด</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
