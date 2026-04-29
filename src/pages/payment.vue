<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useSubscription, SUBSCRIPTION_PLANS, type SubscriptionPlan } from '../composables/useSubscription'

const router = useRouter()
const route = useRoute()
const { waitForAuth, user } = useAuth()
const { createSubscription, renewSubscription, fetchSubscription } = useSubscription()

const loading = ref(false)
const processing = ref(false)
const selectedPlan = ref<SubscriptionPlan>('basic')
const selectedMethod = ref<'promptpay' | 'credit_card' | 'truemoney'>('promptpay')
const action = ref<'new' | 'renew'>('new')

// Card form data
const cardData = ref({
  name: '',
  number: '',
  expMonth: '',
  expYear: '',
  securityCode: ''
})

// Error states
const error = ref<string | null>(null)
const cardErrors = ref({
  name: '',
  number: '',
  expiry: '',
  cvv: ''
})

onMounted(async () => {
  const currentUser = await waitForAuth()
  if (!currentUser) {
    await router.push('/login')
    return
  }

  // Get plan from query params
  const planParam = route.query.plan as SubscriptionPlan
  if (planParam && ['basic', 'pro', 'premium'].includes(planParam)) {
    selectedPlan.value = planParam
  }

  // Get action (new or renew)
  const actionParam = route.query.action as string
  if (actionParam === 'renew') {
    action.value = 'renew'
  }

  // Load Omise.js script
  loadOmiseScript()
})

// Load Omise.js from CDN
const loadOmiseScript = () => {
  if (document.getElementById('omise-script')) return

  const script = document.createElement('script')
  script.id = 'omise-script'
  script.src = 'https://cdn.omise.co/omise.js'
  script.async = true
  document.head.appendChild(script)
}

// Get selected plan info
const planInfo = computed(() => {
  return SUBSCRIPTION_PLANS.find(p => p.id === selectedPlan.value)
})

// Validate card number
const validateCardNumber = () => {
  const number = cardData.value.number.replace(/\s/g, '')
  if (!number) {
    cardErrors.value.number = 'กรุณากรอกหมายเลขบัตร'
  } else if (number.length < 13 || number.length > 19) {
    cardErrors.value.number = 'หมายเลขบัตรไม่ถูกต้อง'
  } else {
    cardErrors.value.number = ''
  }
}

// Validate expiry date
const validateExpiry = () => {
  const month = cardData.value.expMonth
  const year = cardData.value.expYear

  if (!month || !year) {
    cardErrors.value.expiry = 'กรุณากรอกวันหมดอายุ'
  } else {
    const now = new Date()
    const expiry = new Date(parseInt('20' + year), parseInt(month) - 1)
    if (expiry < now) {
      cardErrors.value.expiry = 'บัตรหมดอายุแล้ว'
    } else {
      cardErrors.value.expiry = ''
    }
  }
}

// Validate CVV
const validateCVV = () => {
  const cvv = cardData.value.securityCode
  if (!cvv) {
    cardErrors.value.cvv = 'กรุณากรอก CVV'
  } else if (cvv.length < 3 || cvv.length > 4) {
    cardErrors.value.cvv = 'CVV ไม่ถูกต้อง'
  } else {
    cardErrors.value.cvv = ''
  }
}

// Format card number with spaces
const formatCardNumber = () => {
  let value = cardData.value.number.replace(/\s/g, '')
  value = value.replace(/\D/g, '')
  value = value.slice(0, 19)
  value = value.replace(/(\d{4})/g, '$1 ').trim()
  cardData.value.number = value
}

// Process payment
const processPayment = async () => {
  if (!planInfo.value || !user.value) return

  error.value = null
  processing.value = true

  try {
    // Validate form based on payment method
    if (selectedMethod.value === 'credit_card') {
      validateCardNumber()
      validateExpiry()
      validateCVV()

      const hasErrors = Object.values(cardErrors.value).some(err => err !== '')
      if (hasErrors) {
        throw new Error('กรุณาตรวจสอบข้อมูลบัตรของคุณ')
      }

      // Create Omise token (mock for now)
      // In production, use Omise.createToken()
      const token = await createOmiseToken()
      if (!token) {
        throw new Error('ไม่สามารถสร้าง token ได้')
      }

      // Send to backend to create charge
      const result = await createCharge(token, planInfo.value.id, selectedMethod.value)
      if (!result.success) {
        throw new Error(result.message || 'การชำระเงินล้มเหลว')
      }

      // Save subscription
      if (action.value === 'renew') {
        await renewSubscription(selectedMethod.value, result.transactionId, result.chargeId)
      } else {
        await createSubscription(planInfo.value.id, selectedMethod.value, result.transactionId, result.chargeId)
      }
    } else {
      // PromptPay or TrueMoney
      // Generate QR code or redirect to payment page
      const result = await createCharge('', planInfo.value.id, selectedMethod.value)
      if (!result.success) {
        throw new Error(result.message || 'การชำระเงินล้มเหลว')
      }

      if (result.qrCode) {
        // Show QR code for PromptPay
        showQRCode(result.qrCode)
        return
      }

      if (result.redirectUrl) {
        // Redirect to TrueMoney payment page
        window.location.href = result.redirectUrl
        return
      }
    }

    // Success
    alert('ชำระเงินสำเร็จ!')
    await router.push('/subscription')
  } catch (err: any) {
    error.value = err.message || 'เกิดข้อผิดพลาด'
    console.error('Payment error:', err)
  } finally {
    processing.value = false
  }
}

// Create Omise token (mock implementation)
const createOmiseToken = async (): Promise<string> => {
  return new Promise((resolve) => {
    // In production, use:
    // Omise.createToken('card', {
    //   name: cardData.value.name,
    //   number: cardData.value.number.replace(/\s/g, ''),
    //   expiration_month: cardData.value.expMonth,
    //   expiration_year: cardData.value.expYear,
    //   security_code: cardData.value.securityCode
    // }, (statusCode, response) => {
    //   if (response.object === 'token') {
    //     resolve(response.id)
    //   } else {
    //     resolve('')
    //   }
    // })

    // Mock token for development
    setTimeout(() => {
      resolve('tokn_test_' + Date.now())
    }, 500)
  })
}

// Create charge via API
const createCharge = async (
  token: string,
  plan: SubscriptionPlan,
  method: 'promptpay' | 'credit_card' | 'truemoney'
): Promise<any> => {
  const response = await fetch('/api/payment/create-charge', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      token,
      plan,
      method,
      userId: user.value?.uid
    })
  })

  return await response.json()
}

// Show QR code for PromptPay
const showQRCode = (qrCode: string) => {
  // Implement QR code display
  alert('แสดง QR Code สำหรับ PromptPay')
}

// Go back
const goBack = () => {
  router.back()
}
</script>

<template>
  <NuxtLayout name="main">
    <div class="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 py-12 px-4">
      <div class="max-w-4xl mx-auto">
        <!-- Notice Banner -->
        <div class="mb-8">
          <div class="bg-red-500/20 border-2 border-red-400 rounded-2xl p-6 backdrop-blur-md">
            <div class="flex items-start gap-4">
              <div class="text-4xl">🚫</div>
              <div class="flex-1">
                <h3 class="text-xl font-bold text-red-300 mb-2">ระบบชำระเงินยังไม่เปิดใช้งาน</h3>
                <p class="text-red-100 text-sm mb-3">
                  ขณะนี้อยู่ในโหมดทดสอบ การชำระเงินจะไม่เกิดขึ้นจริง
                  หากต้องการสมัครสมาชิก VIP กรุณาติดต่อผู้ดูแลระบบ
                </p>
                <p class="text-red-200 text-xs">
                  📧 Email: noipugsa@gmail.com
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Header -->
        <div class="mb-8">
          <button @click="goBack" class="text-purple-200 hover:text-white mb-4 flex items-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            ย้อนกลับ
          </button>
          <h1 class="text-4xl font-bold text-white mb-2">ชำระเงิน (โหมดทดสอบ)</h1>
          <p class="text-purple-200">{{ action === 'renew' ? 'ต่ออายุ' : 'สมัคร' }}แพ็กเกจ VIP</p>
        </div>

        <div class="grid lg:grid-cols-3 gap-8">
          <!-- Order Summary -->
          <div class="lg:col-span-1">
            <div class="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 sticky top-4">
              <h3 class="text-xl font-bold text-white mb-4">สรุปคำสั่งซื้อ</h3>

              <div v-if="planInfo" class="space-y-4">
                <div class="pb-4 border-b border-white/20">
                  <p class="text-purple-200 text-sm">แพ็กเกจ</p>
                  <p class="text-white font-bold text-lg">{{ planInfo.name }}</p>
                </div>

                <div class="pb-4 border-b border-white/20">
                  <p class="text-purple-200 text-sm">ระยะเวลา</p>
                  <p class="text-white font-medium">{{ planInfo.duration }} วัน</p>
                </div>

                <div class="pb-4 border-b border-white/20">
                  <p class="text-purple-200 text-sm mb-2">ฟีเจอร์</p>
                  <ul class="space-y-1">
                    <li v-for="(feature, index) in planInfo.features" :key="index" class="text-purple-100 text-sm flex items-start gap-2">
                      <svg class="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                      </svg>
                      <span>{{ feature }}</span>
                    </li>
                  </ul>
                </div>

                <div class="pt-2">
                  <div class="flex justify-between items-center mb-2">
                    <p class="text-purple-200">ราคา</p>
                    <p class="text-white font-medium">{{ planInfo.price }} ฿</p>
                  </div>
                  <div class="flex justify-between items-center text-xl font-bold">
                    <p class="text-white">ยอดรวม</p>
                    <p class="text-yellow-300">{{ planInfo.price }} ฿</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Payment Form -->
          <div class="lg:col-span-2">
            <div class="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8">
              <!-- Error Message -->
              <div v-if="error" class="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200">
                {{ error }}
              </div>

              <!-- Payment Method Selection -->
              <div class="mb-8">
                <h3 class="text-xl font-bold text-white mb-4">เลือกช่องทางชำระเงิน</h3>
                <div class="grid grid-cols-3 gap-4">
                  <button
                    @click="selectedMethod = 'promptpay'"
                    :class="[
                      'p-4 rounded-xl border-2 transition-all',
                      selectedMethod === 'promptpay'
                        ? 'border-yellow-400 bg-yellow-400/10'
                        : 'border-white/20 bg-white/5 hover:border-white/40'
                    ]"
                  >
                    <div class="text-center">
                      <div class="text-3xl mb-2">💳</div>
                      <p class="text-white font-medium text-sm">PromptPay</p>
                    </div>
                  </button>

                  <button
                    @click="selectedMethod = 'credit_card'"
                    :class="[
                      'p-4 rounded-xl border-2 transition-all',
                      selectedMethod === 'credit_card'
                        ? 'border-yellow-400 bg-yellow-400/10'
                        : 'border-white/20 bg-white/5 hover:border-white/40'
                    ]"
                  >
                    <div class="text-center">
                      <div class="text-3xl mb-2">💳</div>
                      <p class="text-white font-medium text-sm">บัตรเครดิต</p>
                    </div>
                  </button>

                  <button
                    @click="selectedMethod = 'truemoney'"
                    :class="[
                      'p-4 rounded-xl border-2 transition-all',
                      selectedMethod === 'truemoney'
                        ? 'border-yellow-400 bg-yellow-400/10'
                        : 'border-white/20 bg-white/5 hover:border-white/40'
                    ]"
                  >
                    <div class="text-center">
                      <div class="text-3xl mb-2">🦋</div>
                      <p class="text-white font-medium text-sm">TrueMoney</p>
                    </div>
                  </button>
                </div>
              </div>

              <!-- Credit Card Form -->
              <div v-if="selectedMethod === 'credit_card'" class="space-y-6">
                <div>
                  <label class="block text-white font-medium mb-2">ชื่อบนบัตร</label>
                  <input
                    v-model="cardData.name"
                    type="text"
                    class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:border-yellow-400"
                    placeholder="JOHN DOE"
                  />
                  <p v-if="cardErrors.name" class="text-red-400 text-sm mt-1">{{ cardErrors.name }}</p>
                </div>

                <div>
                  <label class="block text-white font-medium mb-2">หมายเลขบัตร</label>
                  <input
                    v-model="cardData.number"
                    @input="formatCardNumber"
                    @blur="validateCardNumber"
                    type="text"
                    class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:border-yellow-400"
                    placeholder="1234 5678 9012 3456"
                    maxlength="23"
                  />
                  <p v-if="cardErrors.number" class="text-red-400 text-sm mt-1">{{ cardErrors.number }}</p>
                </div>

                <div class="grid grid-cols-3 gap-4">
                  <div>
                    <label class="block text-white font-medium mb-2">เดือน</label>
                    <input
                      v-model="cardData.expMonth"
                      @blur="validateExpiry"
                      type="text"
                      class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:border-yellow-400"
                      placeholder="MM"
                      maxlength="2"
                    />
                  </div>
                  <div>
                    <label class="block text-white font-medium mb-2">ปี</label>
                    <input
                      v-model="cardData.expYear"
                      @blur="validateExpiry"
                      type="text"
                      class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:border-yellow-400"
                      placeholder="YY"
                      maxlength="2"
                    />
                  </div>
                  <div>
                    <label class="block text-white font-medium mb-2">CVV</label>
                    <input
                      v-model="cardData.securityCode"
                      @blur="validateCVV"
                      type="text"
                      class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:border-yellow-400"
                      placeholder="123"
                      maxlength="4"
                    />
                  </div>
                </div>
                <p v-if="cardErrors.expiry" class="text-red-400 text-sm -mt-4">{{ cardErrors.expiry }}</p>
                <p v-if="cardErrors.cvv" class="text-red-400 text-sm -mt-4">{{ cardErrors.cvv }}</p>
              </div>

              <!-- PromptPay Info -->
              <div v-if="selectedMethod === 'promptpay'" class="text-center py-8">
                <svg class="w-20 h-20 text-purple-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                <p class="text-purple-200">คุณจะได้รับ QR Code สำหรับสแกนจ่ายผ่าน PromptPay</p>
              </div>

              <!-- TrueMoney Info -->
              <div v-if="selectedMethod === 'truemoney'" class="text-center py-8">
                <div class="text-6xl mb-4">🦋</div>
                <p class="text-purple-200">คุณจะถูกนำไปยังหน้าชำระเงินของ TrueMoney Wallet</p>
              </div>

              <!-- Submit Button -->
              <button
                @click="processPayment"
                :disabled="processing"
                class="w-full py-4 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-bold text-lg rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-8"
              >
                {{ processing ? 'กำลังดำเนินการ...' : `ชำระเงิน ${planInfo?.price} ฿` }}
              </button>

              <!-- Security Notice -->
              <div class="mt-6 flex items-start gap-3 text-sm text-purple-200">
                <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
                </svg>
                <p>การชำระเงินของคุณปลอดภัยด้วย Omise Payment Gateway ที่ได้รับมาตรฐาน PCI DSS Level 1</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>
