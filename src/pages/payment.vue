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
        <!-- Header -->
        <div class="mb-8">
          <button @click="goBack" class="text-purple-200 hover:text-white mb-4 flex items-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            ย้อนกลับ
          </button>
          <h1 class="text-4xl font-bold text-white mb-2">ชำระเงิน</h1>
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

              <!-- LINE QR Code -->
              <div class="bg-gradient-to-br from-green-50/10 to-green-100/10 rounded-xl p-6 border-2 border-green-500/30">
                <h3 class="text-2xl font-bold text-white mb-4 text-center flex items-center justify-center gap-2">
                  <span class="text-3xl">💚</span>
                  <span>แอด LINE เพื่อชำระเงิน</span>
                </h3>
                <div class="flex flex-col items-center gap-4">
                  <!-- QR Code Image -->
                  <div class="bg-white p-4 rounded-2xl shadow-2xl">
                    <img
                      src="/images/line-qr.jpeg"
                      alt="LINE QR Code"
                      class="w-64 h-64 object-contain rounded-lg"
                    />
                  </div>
                  <p class="text-sm text-purple-200 text-center max-w-md">
                    สแกน QR Code หรือคลิกปุ่มด้านล่างเพื่อแอด LINE<br/>
                    แล้วแจ้งต้องการต่ออายุ PRO VIP <span class="font-bold text-yellow-300">599 บาท</span>
                  </p>
                </div>
              </div>

              <!-- Add Line Button -->
              <a
                href="https://line.me/ti/p/R0C12DzIhX"
                target="_blank"
                class="block w-full py-4 bg-gradient-to-r from-green-500 via-green-600 to-green-500 hover:from-green-600 hover:via-green-700 hover:to-green-600 text-white rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 mt-6 relative overflow-hidden group"
              >
                <span class="absolute inset-0 bg-gradient-to-r from-green-400/30 to-green-500/30 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                <span class="text-2xl relative z-10">💚</span>
                <span class="relative z-10">แอด LINE เพื่อชำระเงิน 599 บาท</span>
              </a>

              <!-- Payment Instructions -->
              <div class="bg-blue-50/10 border border-blue-300/30 rounded-xl p-4 mt-6">
                <p class="text-blue-200 text-sm text-center font-medium">
                  ℹ️ แอด LINE แล้วแจ้งต้องการต่ออายุ PRO VIP 599 บาท<br/>
                  ชำระเงิน และส่งสลิปยืนยัน ได้ใน LINE
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>
