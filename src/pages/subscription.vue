<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useSubscription, SUBSCRIPTION_PLANS } from '../composables/useSubscription'

const router = useRouter()
const { waitForAuth, user } = useAuth()
const {
  subscription,
  fetchSubscription,
  fetchPaymentHistory,
  currentPlan,
  isVIP,
  daysRemaining
} = useSubscription()

const loading = ref(false)
const paymentHistory = ref<any[]>([])

onMounted(async () => {
  const currentUser = await waitForAuth()
  if (!currentUser) {
    await router.push('/login')
    return
  }

  loading.value = true
  await fetchSubscription()
  paymentHistory.value = await fetchPaymentHistory()
  loading.value = false
})

// ข้อมูลแพ็กเกจปัจจุบัน
const currentPlanInfo = computed(() => {
  return SUBSCRIPTION_PLANS.find(p => p.id === currentPlan.value)
})

// ต่ออายุ
const handleRenew = async () => {
  await router.push(`/payment?plan=${currentPlan.value}&action=renew`)
}

// ฟอร์แมตวันที่
const formatDate = (date: Date | undefined) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// ฟอร์แมต payment method
const formatPaymentMethod = (method: string | undefined) => {
  if (!method) return '-'
  const methods: Record<string, string> = {
    'promptpay': 'PromptPay',
    'credit_card': 'บัตรเครดิต/เดบิต',
    'truemoney': 'TrueMoney Wallet'
  }
  return methods[method] || method
}

// สถานะ subscription
const statusText = computed(() => {
  if (!subscription.value) return 'ไม่พบข้อมูล'
  const statuses: Record<string, string> = {
    'active': 'ใช้งานอยู่',
    'expired': 'หมดอายุ',
    'cancelled': 'ยกเลิกแล้ว',
    'pending': 'รอดำเนินการ'
  }
  return statuses[subscription.value.status] || subscription.value.status
})

const statusColor = computed(() => {
  if (!subscription.value) return 'text-white/70'
  const colors: Record<string, string> = {
    'active': 'text-white',
    'expired': 'text-white/70',
    'cancelled': 'text-white/70',
    'pending': 'text-white/70'
  }
  return colors[subscription.value.status] || 'text-white/70'
})

// คำนวณจำนวนวันทั้งหมดในช่วง subscription
const totalDaysInPeriod = computed(() => {
  if (!subscription.value) return 30
  const start = new Date(subscription.value.startDate)
  const end = new Date(subscription.value.endDate)
  const diffTime = end.getTime() - start.getTime()
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))
  return Math.max(diffDays, 1) // อย่างน้อย 1 วัน
})
</script>

<template>
  <NuxtLayout name="main">
    <div class="max-w-3xl mx-auto px-4 py-8">
      <!-- Loading -->
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 dark:border-purple-400"></div>
        <p class="text-gray-600 dark:text-gray-400 mt-4">กำลังโหลด...</p>
      </div>

      <div v-else class="space-y-6">
        <!-- Header -->
        <div class="text-center mb-8">
          <h1 class="text-3xl font-black text-gray-900 dark:text-white mb-2">
            สมาชิก VIP
          </h1>
          <p class="text-gray-600 dark:text-gray-400">
            จัดการแพ็กเกจสมาชิกของคุณ
          </p>
        </div>

        <!-- Main Subscription Card -->
        <div class="relative group">
          <!-- Animated Gradient Border -->
          <div class="absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-pink-500 to-blue-600 rounded-3xl opacity-75 group-hover:opacity-100 transition duration-300 blur-sm"></div>

          <!-- Card Content -->
          <div class="relative bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-2xl">
            <!-- Decorative Background -->
            <div class="absolute inset-0 opacity-5 dark:opacity-10 rounded-3xl overflow-hidden">
              <div class="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-purple-600 to-pink-600"></div>
              <div class="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600"></div>
            </div>

            <div class="relative space-y-8">
              <!-- Status Badge -->
              <div class="flex items-center justify-center">
                <div class="relative">
                  <div class="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-500 to-blue-600 rounded-2xl blur-md opacity-60 animate-pulse"></div>
                  <div class="relative px-8 py-4 bg-gradient-to-r from-purple-600 via-pink-500 to-blue-600 rounded-2xl">
                    <div class="flex items-center gap-3">
                      <span class="text-4xl">⭐</span>
                      <div class="text-center">
                        <p class="text-xs font-bold text-white/90 uppercase tracking-wide mb-1">
                          {{ currentPlanInfo?.name || currentPlan.toUpperCase() }}
                        </p>
                        <span :class="['text-xs font-bold', statusColor]">
                          {{ statusText }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Days Remaining - Big Display -->
              <div class="text-center">
                <p class="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">
                  เวลาที่เหลือ
                </p>
                <div class="relative inline-block">
                  <div
                    class="absolute inset-0 rounded-3xl blur-xl opacity-50"
                    :class="
                      daysRemaining <= 3 ? 'bg-red-500' :
                      daysRemaining <= 7 ? 'bg-orange-500' :
                      'bg-green-500'
                    "
                  ></div>
                  <div
                    class="relative px-12 py-8 rounded-3xl"
                    :class="
                      daysRemaining <= 3 ? 'bg-gradient-to-br from-red-500 to-red-600' :
                      daysRemaining <= 7 ? 'bg-gradient-to-br from-orange-500 to-orange-600' :
                      'bg-gradient-to-br from-green-500 to-green-600'
                    "
                  >
                    <div class="flex items-baseline justify-center gap-2">
                      <span
                        class="text-7xl font-black text-white drop-shadow-2xl"
                        :class="daysRemaining <= 3 ? 'animate-pulse' : ''"
                      >
                        {{ daysRemaining }}
                      </span>
                      <span class="text-2xl font-bold text-white/90">วัน</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Subscription Details -->
              <div class="grid grid-cols-2 gap-4 p-6 bg-gray-50 dark:bg-gray-900/50 rounded-2xl">
                <div class="text-center">
                  <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                    วันเริ่มต้น
                  </p>
                  <p class="text-sm font-bold text-gray-900 dark:text-white">
                    {{ formatDate(subscription?.startDate) }}
                  </p>
                </div>
                <div class="text-center">
                  <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                    วันหมดอายุ
                  </p>
                  <p class="text-sm font-bold text-gray-900 dark:text-white">
                    {{ formatDate(subscription?.endDate) }}
                  </p>
                </div>
              </div>

              <!-- Progress Bar -->
              <div class="space-y-2">
                <div class="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                  <span class="font-semibold">ระยะเวลาการใช้งาน</span>
                  <span class="font-bold">{{ daysRemaining }} / {{ totalDaysInPeriod }} วัน</span>
                </div>
                <div class="relative h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
                  <div
                    class="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out"
                    :class="
                      daysRemaining <= 3 ? 'bg-gradient-to-r from-red-500 to-red-600' :
                      daysRemaining <= 7 ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                      'bg-gradient-to-r from-green-500 to-green-600'
                    "
                    :style="{ width: `${Math.min((daysRemaining / totalDaysInPeriod) * 100, 100)}%` }"
                  >
                    <div class="absolute inset-0 bg-white/30 animate-pulse"></div>
                  </div>
                </div>
              </div>

              <!-- Features List -->
              <div v-if="currentPlanInfo" class="space-y-3">
                <p class="text-sm font-bold text-gray-700 dark:text-gray-300 text-center">
                  ✨ ฟีเจอร์ที่ใช้ได้
                </p>
                <div class="grid grid-cols-1 gap-2">
                  <div
                    v-for="(feature, index) in currentPlanInfo.features"
                    :key="index"
                    class="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl"
                  >
                    <div class="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0">
                      <span class="text-white text-xs">✓</span>
                    </div>
                    <span class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ feature }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Renew Button -->
              <div v-if="isVIP && subscription?.status === 'active'" class="pt-4">
                <button
                  @click="handleRenew"
                  class="group/btn relative w-full overflow-hidden"
                >
                  <!-- Animated Background -->
                  <div class="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-500 to-blue-600 animate-pulse"></div>

                  <!-- Button Content -->
                  <div class="relative py-5 px-8 bg-gradient-to-r from-purple-600 via-pink-500 to-blue-600 hover:from-purple-700 hover:via-pink-600 hover:to-blue-700 text-white font-black text-xl rounded-2xl shadow-2xl transform transition-all hover:scale-105 active:scale-95 text-center">
                    <span class="mr-3 inline-block group-hover/btn:animate-bounce">💎</span>
                    ต่ออายุสมาชิก VIP
                    <span class="ml-3 inline-block group-hover/btn:animate-bounce">⚡</span>
                  </div>
                </button>

                <!-- Renewal Info -->
                <div class="mt-4 text-center">
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    ต่ออายุเพื่อเพลิดเพลินกับเลขเด่นและฟีเจอร์พิเศษต่อ
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Payment History (Simplified) -->
        <div class="relative group" v-if="paymentHistory.length > 0">
          <div class="absolute -inset-0.5 bg-gradient-to-r from-gray-400 to-gray-500 rounded-3xl opacity-30 group-hover:opacity-50 transition duration-300 blur-sm"></div>

          <div class="relative bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl">
            <h3 class="text-lg font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span class="text-2xl">📝</span>
              ประวัติการชำระเงิน
            </h3>

            <div class="space-y-3">
              <div
                v-for="payment in paymentHistory.slice(0, 3)"
                :key="payment.id"
                class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-900/70 transition-colors"
              >
                <div class="flex-1">
                  <p class="text-sm font-bold text-gray-900 dark:text-white">
                    {{ payment.plan.toUpperCase() }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{ formatDate(payment.createdAt) }}
                  </p>
                </div>
                <div class="text-right">
                  <p class="text-lg font-black text-purple-600 dark:text-purple-400">
                    {{ payment.amount }} ฿
                  </p>
                  <span class="inline-block px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full text-xs font-bold">
                    สำเร็จ
                  </span>
                </div>
              </div>
            </div>

            <p v-if="paymentHistory.length > 3" class="text-center text-xs text-gray-500 dark:text-gray-400 mt-4">
              แสดง 3 รายการล่าสุดจาก {{ paymentHistory.length }} รายการ
            </p>
          </div>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>
