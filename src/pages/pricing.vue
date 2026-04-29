<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useSubscription, type PlanInfo, type SubscriptionPlan } from '../composables/useSubscription'

const router = useRouter()
const { waitForAuth, user } = useAuth()
const { subscription, fetchSubscription, SUBSCRIPTION_PLANS, currentPlan, isVIP, daysRemaining } = useSubscription()

const loading = ref(false)

onMounted(async () => {
  const currentUser = await waitForAuth()
  if (!currentUser) {
    await router.push('/login')
    return
  }

  // โหลดข้อมูล subscription
  await fetchSubscription()
})

// เลือกแพ็กเกจและไปหน้าชำระเงิน
const selectPlan = async (plan: PlanInfo) => {
  if (!user.value) {
    await router.push('/login')
    return
  }

  // ไปหน้า payment พร้อม plan id
  await router.push(`/payment?plan=${plan.id}`)
}

// ไปหน้าจัดการ subscription
const manageSubscription = async () => {
  await router.push('/subscription')
}
</script>

<template>
  <NuxtLayout name="main">
    <div class="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 py-12 px-4">
      <div class="max-w-7xl mx-auto">
        <!-- Notice Banner -->
        <div class="mb-8 mx-auto max-w-3xl">
          <div class="bg-yellow-500/20 border-2 border-yellow-400 rounded-2xl p-6 backdrop-blur-md">
            <div class="flex items-start gap-4">
              <div class="text-4xl">⚠️</div>
              <div class="flex-1">
                <h3 class="text-xl font-bold text-yellow-300 mb-2">ระบบยังไม่เปิดใช้บริการ</h3>
                <p class="text-yellow-100 text-sm">
                  ระบบสมาชิก VIP กำลังอยู่ในช่วงทดสอบ ยังไม่สามารถชำระเงินได้จริง
                  หากสนใจสมัครสมาชิก กรุณาติดต่อ Admin
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Header -->
        <div class="text-center mb-12">
          <h1 class="text-4xl md:text-5xl font-bold text-white mb-4">
            เลือกแพ็กเกจที่เหมาะกับคุณ
          </h1>
          <p class="text-xl text-purple-200">
            ยกระดับการวิเคราะห์หวยด้วย AI ขั้นสูง
          </p>
        </div>

        <!-- Current Subscription Status -->
        <div v-if="subscription && isVIP" class="max-w-2xl mx-auto mb-12">
          <div class="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 text-center">
            <div class="flex items-center justify-center gap-2 mb-2">
              <svg class="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              <h3 class="text-xl font-bold text-white">คุณเป็นสมาชิก VIP</h3>
            </div>
            <p class="text-purple-200 mb-1">
              แพ็กเกจปัจจุบัน: <span class="font-bold text-white">{{ currentPlan.toUpperCase() }}</span>
            </p>
            <p class="text-purple-200">
              เหลือเวลาอีก <span class="font-bold text-yellow-300">{{ daysRemaining }}</span> วัน
            </p>
            <button
              @click="manageSubscription"
              class="mt-4 px-6 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
            >
              จัดการสมาชิก
            </button>
          </div>
        </div>

        <!-- Pricing Cards -->
        <div class="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div
            v-for="plan in SUBSCRIPTION_PLANS"
            :key="plan.id"
            :class="[
              'relative bg-white/10 backdrop-blur-md border rounded-2xl p-8 transition-all duration-300',
              plan.popular ? 'border-yellow-400 transform scale-105 shadow-2xl' : 'border-white/20 hover:border-white/40 hover:transform hover:scale-105'
            ]"
          >
            <!-- Popular Badge -->
            <div
              v-if="plan.popular"
              class="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-1 rounded-full text-sm font-bold"
            >
              แนะนำ
            </div>

            <!-- Current Plan Badge -->
            <div
              v-if="currentPlan === plan.id"
              class="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold"
            >
              ใช้งานอยู่
            </div>

            <!-- Plan Name -->
            <h3 class="text-2xl font-bold text-white mb-2">
              {{ plan.name }}
            </h3>

            <!-- Price -->
            <div class="mb-6">
              <span class="text-4xl font-bold text-white">{{ plan.price }}</span>
              <span class="text-xl text-purple-200"> ฿/เดือน</span>
            </div>

            <!-- Features -->
            <ul class="space-y-3 mb-8">
              <li
                v-for="(feature, index) in plan.features"
                :key="index"
                class="flex items-start gap-3 text-purple-100"
              >
                <svg class="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                <span>{{ feature }}</span>
              </li>
            </ul>

            <!-- CTA Button -->
            <button
              v-if="currentPlan !== plan.id"
              @click="selectPlan(plan)"
              :disabled="loading"
              :class="[
                'w-full py-3 rounded-xl font-bold text-white transition-all duration-300',
                plan.popular
                  ? 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 shadow-lg hover:shadow-xl'
                  : 'bg-white/20 hover:bg-white/30',
                loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              ]"
            >
              {{ loading ? 'กำลังโหลด...' : 'ดูรายละเอียด (Demo)' }}
            </button>
            <div
              v-else
              class="w-full py-3 rounded-xl font-bold text-white bg-green-500/50 text-center cursor-default"
            >
              แพ็กเกจปัจจุบัน
            </div>
          </div>
        </div>

        <!-- FAQ Section -->
        <div class="max-w-3xl mx-auto mt-16">
          <h2 class="text-3xl font-bold text-white text-center mb-8">
            คำถามที่พบบ่อย
          </h2>
          <div class="space-y-4">
            <details class="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <summary class="font-bold text-white cursor-pointer">
                ชำระเงินอย่างไร?
              </summary>
              <p class="text-purple-200 mt-3">
                รองรับการชำระเงินผ่าน PromptPay, บัตรเครดิต/เดบิต และ TrueMoney Wallet ผ่านระบบ Omise ที่ปลอดภัย
              </p>
            </details>

            <details class="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <summary class="font-bold text-white cursor-pointer">
                ยกเลิกได้ไหม?
              </summary>
              <p class="text-purple-200 mt-3">
                สามารถยกเลิกได้ตลอดเวลา แต่จะยังใช้งานได้จนครบกำหนดที่จ่ายไว้แล้ว ไม่มีการคืนเงิน
              </p>
            </details>

            <details class="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <summary class="font-bold text-white cursor-pointer">
                อัพเกรดได้ไหม?
              </summary>
              <p class="text-purple-200 mt-3">
                สามารถอัพเกรดแพ็กเกจได้ตลอดเวลา โดยจ่ายส่วนต่างตามระยะเวลาที่เหลืออยู่
              </p>
            </details>

            <details class="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <summary class="font-bold text-white cursor-pointer">
                ต่ออายุอัตโนมัติไหม?
              </summary>
              <p class="text-purple-200 mt-3">
                ไม่มีการต่ออายุอัตโนมัติ คุณต้องต่ออายุด้วยตัวเองเมื่อใกล้หมดอายุ
              </p>
            </details>
          </div>
        </div>

        <!-- Support -->
        <div class="text-center mt-16">
          <p class="text-purple-200">
            มีคำถาม? ติดต่อเราได้ที่
            <a href="mailto:support@viplayinsight.com" class="text-yellow-300 hover:text-yellow-400 underline">
              support@viplayinsight.com
            </a>
          </p>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>
