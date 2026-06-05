<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useReferral } from '../composables/useReferral'
import { useAuth } from '../composables/useAuth'
import { useRouter } from 'vue-router'

definePageMeta({
  layout: 'main',
})

const router = useRouter()
const { user, waitForAuth } = useAuth()
const {
  referralCode,
  referralData,
  referralStats,
  referredUsers,
  referralLink,
  conversionRate,
  nextMilestone,
  isLoading,
  error,
  getMyReferralCode,
  getReferredUsers,
  REWARDS,
} = useReferral()

const showCopiedAlert = ref(false)
const isCopying = ref(false)
const copyButtonText = ref('📋 คัดลอก')
const shareMethod = ref<'link' | 'qr' | 'social'>('link')

onMounted(async () => {
  console.log('🎁 [Referral] Page mounted, waiting for auth...')

  await waitForAuth()

  if (!user.value) {
    console.log('❌ [Referral] No user found, redirecting to login')
    router.push('/login')
    return
  }

  console.log('✅ [Referral] User authenticated:', user.value.email)

  // Load referral data
  try {
    console.log('📝 [Referral] Getting referral code...')
    const code = await getMyReferralCode()
    console.log('✅ [Referral] Referral code loaded:', code)

    console.log('👥 [Referral] Getting referred users...')
    await getReferredUsers()
    console.log('✅ [Referral] Referred users loaded')
  } catch (err) {
    console.error('❌ [Referral] Error loading data:', err)
  }
})

const copyReferralLink = async () => {
  if (isCopying.value) return

  try {
    isCopying.value = true

    // Method 1: Modern Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(referralLink.value)
    } else {
      // Method 2: Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = referralLink.value
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()

      const successful = document.execCommand('copy')
      textArea.remove()

      if (!successful) {
        throw new Error('Copy failed')
      }
    }

    // Show success feedback
    showCopiedAlert.value = true
    copyButtonText.value = '✅ คัดลอกแล้ว!'

    setTimeout(() => {
      showCopiedAlert.value = false
      copyButtonText.value = '📋 คัดลอก'
      isCopying.value = false
    }, 3000)
  } catch (err) {
    console.error('Failed to copy:', err)

    // Show error with the link for manual copy
    const fallbackMessage = `ไม่สามารถคัดลอกอัตโนมัติได้\nกรุณาคัดลอกลิงก์ด้านล่าง:\n\n${referralLink.value}`
    alert(fallbackMessage)

    isCopying.value = false
    copyButtonText.value = '📋 คัดลอก'
  }
}

const shareViaLine = () => {
  const message = encodeURIComponent(`🎰 มาเล่น Numora Lotto AI กันเถอะ! ทำนายหวยด้วย AI แม่นยำสูง 🎯\n\nสมัครผ่านลิงก์นี้รับ VIP ฟรี ${REWARDS.referee.vipDays} วัน!\n${referralLink.value}`)
  window.open(`https://line.me/R/msg/text/?${message}`, '_blank')
}

const shareViaFacebook = () => {
  const url = encodeURIComponent(referralLink.value)
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank')
}

const shareViaTwitter = () => {
  const text = encodeURIComponent(`🎰 มาเล่น Numora Lotto AI กันเถอะ! ทำนายหวยด้วย AI แม่นยำสูง 🎯`)
  const url = encodeURIComponent(referralLink.value)
  window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank')
}

const progressToNextMilestone = computed(() => {
  if (!referralData.value || !nextMilestone.value) return 100
  return Math.round((referralData.value.successfulReferrals / nextMilestone.value.referrals) * 100)
})

const selectInputText = (event: Event) => {
  const input = event.target as HTMLInputElement
  input?.select()
}
</script>

<template>
  <div class="container mx-auto px-4 max-w-6xl">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 mb-2">
        🎁 โปรแกรมแนะนำเพื่อน
      </h1>
      <p class="text-gray-600 dark:text-gray-400">
        ชวนเพื่อนมาใช้งาน รับรางวัลและ VIP ฟรี!
      </p>
    </div>

    <div v-if="isLoading" class="flex items-center justify-center py-20">
      <div class="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600"></div>
    </div>

    <div v-else class="space-y-6">
      <!-- Stats Overview -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
          <div class="text-3xl mb-2">👥</div>
          <div class="text-3xl font-black mb-1">
            {{ referralData?.successfulReferrals || 0 }}
          </div>
          <div class="text-sm text-purple-100">
            เพื่อนที่แนะนำสำเร็จ
          </div>
        </div>

        <div class="bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl shadow-lg p-6 text-white">
          <div class="text-3xl mb-2">✨</div>
          <div class="text-3xl font-black mb-1">
            {{ referralData?.totalPoints || 0 }}
          </div>
          <div class="text-sm text-pink-100">
            คะแนนที่ได้รับ
          </div>
        </div>

        <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white">
          <div class="text-3xl mb-2">🎖️</div>
          <div class="text-3xl font-black mb-1">
            {{ referralData?.totalVipDays || 0 }}
          </div>
          <div class="text-sm text-blue-100">
            วัน VIP ที่ได้รับ
          </div>
        </div>

        <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white">
          <div class="text-3xl mb-2">📈</div>
          <div class="text-3xl font-black mb-1">
            {{ conversionRate }}%
          </div>
          <div class="text-sm text-green-100">
            อัตราการสมัครสำเร็จ
          </div>
        </div>
      </div>

      <!-- Referral Link Card -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
        <div class="text-center mb-6">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            🔗 ลิงก์แนะนำเพื่อนของคุณ
          </h2>
          <p class="text-gray-600 dark:text-gray-400">
            แชร์ลิงก์นี้ให้เพื่อนสมัครใช้งาน
          </p>
        </div>

        <!-- Loading State -->
        <div v-if="!referralCode && !error" class="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-8 mb-4">
          <div class="text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600 mx-auto mb-4"></div>
            <p class="text-gray-600 dark:text-gray-400">กำลังสร้างรหัสแนะนำ...</p>
          </div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-6 mb-4">
          <div class="text-center">
            <div class="text-4xl mb-3">❌</div>
            <p class="text-red-600 dark:text-red-400 font-medium mb-2">ไม่สามารถโหลดรหัสแนะนำได้</p>
            <p class="text-sm text-red-500 dark:text-red-400">{{ error }}</p>
            <button
              @click="getMyReferralCode"
              class="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors transition-transform active:scale-95"
            >
              🔄 ลองใหม่อีกครั้ง
            </button>
          </div>
        </div>

        <!-- Referral Code Display -->
        <div v-else class="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 mb-4">
          <div class="text-center">
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">รหัสแนะนำของคุณ</p>
            <p class="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-2">
              {{ referralCode }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              รหัสนี้เป็นของคุณเท่านั้น แชร์ให้เพื่อนได้เลย!
            </p>
          </div>
        </div>

        <!-- Link Input -->
        <div class="flex gap-2 mb-6">
          <input
            :value="referralLink"
            readonly
            class="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white font-mono text-sm"
            @click="selectInputText"
          />
          <button
            @click="copyReferralLink"
            :disabled="isCopying"
            class="px-6 py-3 rounded-xl font-bold transition-all min-w-[140px] transition-transform active:scale-95"
            :class="showCopiedAlert
              ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg scale-105'
              : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg'"
          >
            {{ copyButtonText }}
          </button>
        </div>

        <!-- Copied Alert -->
        <Transition
          enter-active-class="transition ease-out duration-300"
          enter-from-class="transform scale-95 opacity-0"
          enter-to-class="transform scale-100 opacity-100"
          leave-active-class="transition ease-in duration-200"
          leave-from-class="transform scale-100 opacity-100"
          leave-to-class="transform scale-95 opacity-0"
        >
          <div v-if="showCopiedAlert" class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-3 mb-4 text-center">
            <span class="text-green-600 dark:text-green-400 font-medium">
              ✅ คัดลอกลิงก์สำเร็จ!
            </span>
          </div>
        </Transition>

        <!-- Share Buttons -->
        <div class="grid grid-cols-3 gap-3">
          <button
            @click="shareViaLine"
            class="py-3 px-4 bg-[#00B900] text-white rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 transition-transform active:scale-95"
          >
            <span class="text-xl">💬</span>
            <span>Line</span>
          </button>
          <button
            @click="shareViaFacebook"
            class="py-3 px-4 bg-[#1877F2] text-white rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 transition-transform active:scale-95"
          >
            <span class="text-xl">👍</span>
            <span>Facebook</span>
          </button>
          <button
            @click="shareViaTwitter"
            class="py-3 px-4 bg-[#1DA1F2] text-white rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 transition-transform active:scale-95"
          >
            <span class="text-xl">🐦</span>
            <span>Twitter</span>
          </button>
        </div>
      </div>

      <!-- Rewards Info -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- For Referrer -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <span class="text-2xl">🎁</span>
            </div>
            <div>
              <h3 class="text-lg font-bold text-gray-900 dark:text-white">
                รางวัลสำหรับคุณ
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                ต่อ 1 เพื่อนที่สมัครสำเร็จ
              </p>
            </div>
          </div>

          <div class="space-y-3">
            <div class="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
              <div class="flex items-center gap-2">
                <span class="text-2xl">✨</span>
                <span class="font-medium text-gray-900 dark:text-white">คะแนน</span>
              </div>
              <span class="text-xl font-black text-purple-600 dark:text-purple-400">
                +{{ REWARDS.referrer.points }}
              </span>
            </div>
            <div class="flex items-center justify-between p-4 bg-pink-50 dark:bg-pink-900/20 rounded-xl">
              <div class="flex items-center gap-2">
                <span class="text-2xl">🎖️</span>
                <span class="font-medium text-gray-900 dark:text-white">VIP ฟรี</span>
              </div>
              <span class="text-xl font-black text-pink-600 dark:text-pink-400">
                +{{ REWARDS.referrer.vipDays }} วัน
              </span>
            </div>
          </div>
        </div>

        <!-- For Referee -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
              <span class="text-2xl">🆕</span>
            </div>
            <div>
              <h3 class="text-lg font-bold text-gray-900 dark:text-white">
                รางวัลสำหรับเพื่อน
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                เมื่อสมัครผ่านลิงก์คุณ
              </p>
            </div>
          </div>

          <div class="space-y-3">
            <div class="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <div class="flex items-center gap-2">
                <span class="text-2xl">✨</span>
                <span class="font-medium text-gray-900 dark:text-white">คะแนน</span>
              </div>
              <span class="text-xl font-black text-blue-600 dark:text-blue-400">
                +{{ REWARDS.referee.points }}
              </span>
            </div>
            <div class="flex items-center justify-between p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
              <div class="flex items-center gap-2">
                <span class="text-2xl">🎖️</span>
                <span class="font-medium text-gray-900 dark:text-white">VIP ฟรี</span>
              </div>
              <span class="text-xl font-black text-indigo-600 dark:text-indigo-400">
                +{{ REWARDS.referee.vipDays}} วัน
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Milestones -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
          🏆 เป้าหมายและรางวัลพิเศษ
        </h3>

        <!-- Progress to Next Milestone -->
        <div v-if="nextMilestone" class="mb-6">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
              {{ nextMilestone.label }}
            </span>
            <span class="text-sm font-bold text-purple-600 dark:text-purple-400">
              {{ referralData?.successfulReferrals || 0 }} / {{ nextMilestone.referrals }}
            </span>
          </div>
          <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <div
              class="h-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-500"
              :style="{ width: `${progressToNextMilestone}%` }"
            ></div>
          </div>
        </div>

        <!-- Milestone List -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="milestone in REWARDS.milestones"
            :key="milestone.referrals"
            class="p-4 rounded-xl border-2 transition-all"
            :class="(referralData?.successfulReferrals || 0) >= milestone.referrals
              ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-500'
              : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'"
          >
            <div class="flex items-start gap-3">
              <div class="text-3xl">
                {{ (referralData?.successfulReferrals || 0) >= milestone.referrals ? '✅' : '🎯' }}
              </div>
              <div class="flex-1">
                <div class="font-bold text-gray-900 dark:text-white mb-2">
                  {{ milestone.label }}
                </div>
                <div class="space-y-1 text-sm">
                  <div class="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <span>✨</span>
                    <span>+{{ milestone.reward.points }} คะแนน</span>
                  </div>
                  <div class="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <span>🎖️</span>
                    <span>+{{ milestone.reward.vipDays }} วัน VIP</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Referred Users List -->
      <div v-if="referredUsers.length > 0" class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
          👥 เพื่อนที่แนะนำ ({{ referredUsers.length }})
        </h3>

        <div class="space-y-3">
          <div
            v-for="(referee, index) in referredUsers"
            :key="referee.id"
            class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
          >
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                {{ index + 1 }}
              </div>
              <div>
                <div class="font-medium text-gray-900 dark:text-white">
                  เพื่อน #{{ index + 1 }}
                </div>
                <div class="text-xs text-gray-600 dark:text-gray-400">
                  สมัครเมื่อ {{ new Date(referee.createdAt).toLocaleDateString('th-TH') }}
                </div>
              </div>
            </div>
            <div>
              <span
                class="px-3 py-1 rounded-full text-xs font-bold"
                :class="referee.status === 'active'
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                  : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'"
              >
                {{ referee.status === 'active' ? '✅ ใช้งานแล้ว' : '⏳ รอการยืนยัน' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center">
        <div class="text-6xl mb-4">🎯</div>
        <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
          เริ่มแนะนำเพื่อนวันนี้!
        </h3>
        <p class="text-gray-600 dark:text-gray-400">
          แชร์ลิงก์ด้านบนให้เพื่อนสมัครเพื่อรับรางวัล
        </p>
      </div>
    </div>
  </div>
</template>
