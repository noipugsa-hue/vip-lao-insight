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
  cancelSubscription,
  fetchPaymentHistory,
  currentPlan,
  isVIP,
  daysRemaining
} = useSubscription()

const loading = ref(false)
const showCancelDialog = ref(false)
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

// ยกเลิก subscription
const handleCancelSubscription = async () => {
  loading.value = true
  const success = await cancelSubscription()
  if (success) {
    showCancelDialog.value = false
    alert('ยกเลิกสมาชิกเรียบร้อยแล้ว คุณยังสามารถใช้งานได้จนครบกำหนด')
    await fetchSubscription()
  } else {
    alert('เกิดข้อผิดพลาดในการยกเลิกสมาชิก')
  }
  loading.value = false
}

// ต่ออายุ
const handleRenew = async () => {
  await router.push(`/payment?plan=${currentPlan.value}&action=renew`)
}

// อัพเกรด
const handleUpgrade = async () => {
  await router.push('/pricing')
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
  if (!subscription.value) return 'text-gray-400'
  const colors: Record<string, string> = {
    'active': 'text-green-400',
    'expired': 'text-red-400',
    'cancelled': 'text-orange-400',
    'pending': 'text-yellow-400'
  }
  return colors[subscription.value.status] || 'text-gray-400'
})
</script>

<template>
  <NuxtLayout name="main">
    <div class="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 py-12 px-4">
      <div class="max-w-5xl mx-auto">
        <!-- Loading -->
        <div v-if="loading" class="text-center py-12">
          <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white mx-auto"></div>
          <p class="text-white mt-4">กำลังโหลด...</p>
        </div>

        <div v-else>
          <!-- Notice Banner -->
          <div class="mb-8 max-w-3xl">
            <div class="bg-yellow-500/20 border-2 border-yellow-400 rounded-2xl p-4 backdrop-blur-md">
              <div class="flex items-start gap-3">
                <div class="text-2xl">ℹ️</div>
                <div class="flex-1">
                  <p class="text-yellow-100 text-sm">
                    <strong class="text-yellow-300">หมายเหตุ:</strong> ระบบสมาชิก VIP อยู่ในช่วงทดสอบ
                    การชำระเงินยังไม่เปิดใช้งานจริง
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Header -->
          <div class="mb-8">
            <h1 class="text-4xl font-bold text-white mb-2">จัดการสมาชิก</h1>
            <p class="text-purple-200">ดูและจัดการแพ็กเกจสมาชิกของคุณ</p>
          </div>

          <!-- Current Subscription Card -->
          <div class="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 mb-8">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-4">
                  <h2 class="text-2xl font-bold text-white">
                    แพ็กเกจ {{ currentPlanInfo?.name || currentPlan.toUpperCase() }}
                  </h2>
                  <span :class="['px-3 py-1 rounded-full text-sm font-bold', statusColor]">
                    {{ statusText }}
                  </span>
                </div>

                <div class="grid md:grid-cols-2 gap-4 text-purple-200">
                  <div>
                    <p class="text-sm text-purple-300">วันเริ่มต้น</p>
                    <p class="text-white font-medium">{{ formatDate(subscription?.startDate) }}</p>
                  </div>
                  <div>
                    <p class="text-sm text-purple-300">วันหมดอายุ</p>
                    <p class="text-white font-medium">{{ formatDate(subscription?.endDate) }}</p>
                  </div>
                  <div>
                    <p class="text-sm text-purple-300">ระยะเวลาที่เหลือ</p>
                    <p class="text-white font-medium">{{ daysRemaining }} วัน</p>
                  </div>
                  <div>
                    <p class="text-sm text-purple-300">ช่องทางชำระเงิน</p>
                    <p class="text-white font-medium">{{ formatPaymentMethod(subscription?.paymentMethod) }}</p>
                  </div>
                </div>

                <!-- Features -->
                <div v-if="currentPlanInfo" class="mt-6">
                  <p class="text-sm text-purple-300 mb-2">ฟีเจอร์ที่ใช้ได้</p>
                  <div class="flex flex-wrap gap-2">
                    <span
                      v-for="(feature, index) in currentPlanInfo.features"
                      :key="index"
                      class="px-3 py-1 bg-white/10 rounded-lg text-sm text-purple-100"
                    >
                      {{ feature }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex flex-col gap-3 md:min-w-[200px]">
                <button
                  v-if="isVIP && subscription?.status === 'active'"
                  @click="handleRenew"
                  class="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-bold transition-all"
                >
                  ต่ออายุ
                </button>
                <button
                  v-if="currentPlan !== 'premium'"
                  @click="handleUpgrade"
                  class="px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white rounded-xl font-bold transition-all"
                >
                  อัพเกรด
                </button>
                <button
                  v-if="subscription?.status === 'active' && currentPlan !== 'free'"
                  @click="showCancelDialog = true"
                  class="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-all"
                >
                  ยกเลิกสมาชิก
                </button>
                <button
                  @click="router.push('/pricing')"
                  class="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-all"
                >
                  ดูแพ็กเกจทั้งหมด
                </button>
              </div>
            </div>
          </div>

          <!-- Payment History -->
          <div class="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8">
            <h3 class="text-2xl font-bold text-white mb-6">ประวัติการชำระเงิน</h3>

            <div v-if="paymentHistory.length === 0" class="text-center py-8">
              <svg class="w-16 h-16 text-purple-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p class="text-purple-200">ยังไม่มีประวัติการชำระเงิน</p>
            </div>

            <div v-else class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="border-b border-white/20">
                    <th class="text-left py-3 px-4 text-purple-200 font-medium">วันที่</th>
                    <th class="text-left py-3 px-4 text-purple-200 font-medium">แพ็กเกจ</th>
                    <th class="text-left py-3 px-4 text-purple-200 font-medium">จำนวนเงิน</th>
                    <th class="text-left py-3 px-4 text-purple-200 font-medium">ช่องทาง</th>
                    <th class="text-left py-3 px-4 text-purple-200 font-medium">สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="payment in paymentHistory"
                    :key="payment.id"
                    class="border-b border-white/10 hover:bg-white/5 transition-colors"
                  >
                    <td class="py-3 px-4 text-white">
                      {{ formatDate(payment.createdAt) }}
                    </td>
                    <td class="py-3 px-4 text-white font-medium">
                      {{ payment.plan.toUpperCase() }}
                    </td>
                    <td class="py-3 px-4 text-white">
                      {{ payment.amount }} ฿
                    </td>
                    <td class="py-3 px-4 text-purple-200">
                      {{ formatPaymentMethod(payment.paymentMethod) }}
                    </td>
                    <td class="py-3 px-4">
                      <span class="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                        สำเร็จ
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Cancel Confirmation Dialog -->
      <div
        v-if="showCancelDialog"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        @click.self="showCancelDialog = false"
      >
        <div class="bg-gradient-to-br from-purple-900 to-indigo-900 border border-white/20 rounded-2xl p-8 max-w-md w-full">
          <h3 class="text-2xl font-bold text-white mb-4">ยืนยันการยกเลิกสมาชิก</h3>
          <p class="text-purple-200 mb-6">
            คุณแน่ใจหรือไม่ที่จะยกเลิกสมาชิก? คุณจะยังสามารถใช้งานได้จนครบกำหนดที่จ่ายไว้แล้ว แต่จะไม่มีการต่ออายุอัตโนมัติ
          </p>
          <div class="flex gap-3">
            <button
              @click="showCancelDialog = false"
              class="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-all"
            >
              ไม่ยกเลิก
            </button>
            <button
              @click="handleCancelSubscription"
              :disabled="loading"
              class="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-all disabled:opacity-50"
            >
              {{ loading ? 'กำลังดำเนินการ...' : 'ยืนยันยกเลิก' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>
