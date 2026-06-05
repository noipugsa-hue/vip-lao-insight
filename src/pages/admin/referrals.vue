<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuth } from '../../composables/useAuth'
import { useAdmin } from '../../composables/useAdmin'
import { useRouter } from 'vue-router'
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore'

definePageMeta({
  layout: 'main',
})

const router = useRouter()
const { user, waitForAuth } = useAuth()
const { isAdmin } = useAdmin()
const { $db } = useNuxtApp()

interface ReferralUser {
  userId: string
  code: string
  email?: string
  totalReferrals: number
  successfulReferrals: number
  pendingReferrals: number
  totalPoints: number
  totalVipDays: number
  createdAt: Date
  referredUsers?: RefereeInfo[]
}

interface RefereeInfo {
  refereeId: string
  email?: string
  status: 'pending' | 'active'
  createdAt: Date
}

const allReferrals = ref<ReferralUser[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)
const searchQuery = ref('')
const sortBy = ref<'successfulReferrals' | 'totalReferrals' | 'totalPoints' | 'createdAt'>('successfulReferrals')

onMounted(async () => {
  await waitForAuth()

  if (!user.value || !isAdmin.value) {
    console.log('❌ [Admin Referrals] Not admin, redirecting')
    router.push('/home')
    return
  }

  await loadAllReferrals()
})

const loadAllReferrals = async () => {
  try {
    isLoading.value = true
    error.value = null

    // Load all referrals
    const referralsQuery = query(
      collection($db, 'referrals'),
      orderBy('successfulReferrals', 'desc')
    )
    const referralsSnap = await getDocs(referralsQuery)

    const referralsData: ReferralUser[] = []

    for (const doc of referralsSnap.docs) {
      const data = doc.data()

      // Load referred users for this referrer
      const recordsQuery = query(
        collection($db, 'referralRecords'),
        // where('referrerId', '==', doc.id)
      )
      const recordsSnap = await getDocs(recordsQuery)

      const referredUsers: RefereeInfo[] = recordsSnap.docs
        .filter(refDoc => refDoc.data().referrerId === doc.id)
        .map(refDoc => ({
          refereeId: refDoc.id,
          status: refDoc.data().status,
          createdAt: refDoc.data().createdAt?.toDate() || new Date(),
        }))

      referralsData.push({
        userId: doc.id,
        code: data.code,
        totalReferrals: data.totalReferrals || 0,
        successfulReferrals: data.successfulReferrals || 0,
        pendingReferrals: data.pendingReferrals || 0,
        totalPoints: data.totalPoints || 0,
        totalVipDays: data.totalVipDays || 0,
        createdAt: data.createdAt?.toDate() || new Date(),
        referredUsers,
      })
    }

    allReferrals.value = referralsData
    isLoading.value = false
  } catch (err: any) {
    console.error('Error loading referrals:', err)
    error.value = err.message
    isLoading.value = false
  }
}

// Computed statistics
const totalUsers = computed(() => allReferrals.value.length)
const totalReferrals = computed(() => allReferrals.value.reduce((sum, r) => sum + r.totalReferrals, 0))
const totalSuccessful = computed(() => allReferrals.value.reduce((sum, r) => sum + r.successfulReferrals, 0))
const totalPending = computed(() => allReferrals.value.reduce((sum, r) => sum + r.pendingReferrals, 0))
const overallConversionRate = computed(() => {
  if (totalReferrals.value === 0) return 0
  return Math.round((totalSuccessful.value / totalReferrals.value) * 100)
})

// Top referrers
const topReferrers = computed(() => {
  return [...allReferrals.value]
    .sort((a, b) => b.successfulReferrals - a.successfulReferrals)
    .slice(0, 10)
})

// Filtered and sorted list
const filteredReferrals = computed(() => {
  let filtered = allReferrals.value

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(r =>
      r.code.toLowerCase().includes(query) ||
      r.userId.toLowerCase().includes(query)
    )
  }

  // Sort
  return [...filtered].sort((a, b) => {
    if (sortBy.value === 'createdAt') {
      return b.createdAt.getTime() - a.createdAt.getTime()
    }
    return (b[sortBy.value] as number) - (a[sortBy.value] as number)
  })
})

const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <div class="container mx-auto px-4 max-w-7xl">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 mb-2">
        🎁 Referral Statistics
      </h1>
      <p class="text-gray-600 dark:text-gray-400">
        ภาพรวมระบบแนะนำเพื่อนทั้งหมด (Admin Only)
      </p>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center justify-center py-20">
      <div class="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600"></div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-6 mb-6">
      <div class="text-center">
        <div class="text-4xl mb-3">❌</div>
        <p class="text-red-600 dark:text-red-400 font-medium">{{ error }}</p>
        <button
          @click="loadAllReferrals"
          class="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
        >
          🔄 ลองใหม่อีกครั้ง
        </button>
      </div>
    </div>

    <!-- Content -->
    <div v-else class="space-y-6">
      <!-- Overall Stats -->
      <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
          <div class="text-3xl mb-2">👥</div>
          <div class="text-3xl font-black mb-1">{{ totalUsers }}</div>
          <div class="text-sm text-purple-100">Users ทั้งหมด</div>
        </div>

        <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white">
          <div class="text-3xl mb-2">📊</div>
          <div class="text-3xl font-black mb-1">{{ totalReferrals }}</div>
          <div class="text-sm text-blue-100">Total Referrals</div>
        </div>

        <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white">
          <div class="text-3xl mb-2">✅</div>
          <div class="text-3xl font-black mb-1">{{ totalSuccessful }}</div>
          <div class="text-sm text-green-100">Successful</div>
        </div>

        <div class="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl shadow-lg p-6 text-white">
          <div class="text-3xl mb-2">⏳</div>
          <div class="text-3xl font-black mb-1">{{ totalPending }}</div>
          <div class="text-sm text-yellow-100">Pending</div>
        </div>

        <div class="bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl shadow-lg p-6 text-white">
          <div class="text-3xl mb-2">📈</div>
          <div class="text-3xl font-black mb-1">{{ overallConversionRate }}%</div>
          <div class="text-sm text-pink-100">Conversion Rate</div>
        </div>
      </div>

      <!-- Top Referrers -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          🏆 Top 10 Referrers
        </h2>

        <div class="space-y-3">
          <div
            v-for="(referrer, index) in topReferrers"
            :key="referrer.userId"
            class="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl"
          >
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-black text-lg">
                {{ index + 1 }}
              </div>
              <div>
                <div class="font-bold text-gray-900 dark:text-white">
                  {{ referrer.code }}
                </div>
                <div class="text-sm text-gray-600 dark:text-gray-400">
                  User ID: {{ referrer.userId.substring(0, 8) }}...
                </div>
              </div>
            </div>

            <div class="text-right">
              <div class="text-2xl font-black text-purple-600 dark:text-purple-400">
                {{ referrer.successfulReferrals }}
              </div>
              <div class="text-xs text-gray-600 dark:text-gray-400">
                Successful
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Search and Sort -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        <div class="flex flex-col md:flex-row gap-4 mb-6">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="🔍 ค้นหา Code หรือ User ID..."
            class="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white"
          />

          <select
            v-model="sortBy"
            class="px-4 py-3 bg-gray-100 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white"
          >
            <option value="successfulReferrals">Successful Referrals</option>
            <option value="totalReferrals">Total Referrals</option>
            <option value="totalPoints">Total Points</option>
            <option value="createdAt">Created Date</option>
          </select>
        </div>

        <!-- All Users Table -->
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b-2 border-gray-200 dark:border-gray-700">
                <th class="text-left p-3 text-gray-700 dark:text-gray-300 font-bold">#</th>
                <th class="text-left p-3 text-gray-700 dark:text-gray-300 font-bold">Code</th>
                <th class="text-left p-3 text-gray-700 dark:text-gray-300 font-bold">User ID</th>
                <th class="text-center p-3 text-gray-700 dark:text-gray-300 font-bold">Total</th>
                <th class="text-center p-3 text-gray-700 dark:text-gray-300 font-bold">Success</th>
                <th class="text-center p-3 text-gray-700 dark:text-gray-300 font-bold">Pending</th>
                <th class="text-center p-3 text-gray-700 dark:text-gray-300 font-bold">Points</th>
                <th class="text-center p-3 text-gray-700 dark:text-gray-300 font-bold">VIP Days</th>
                <th class="text-left p-3 text-gray-700 dark:text-gray-300 font-bold">Created</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(referral, index) in filteredReferrals"
                :key="referral.userId"
                class="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <td class="p-3 text-gray-600 dark:text-gray-400">{{ index + 1 }}</td>
                <td class="p-3">
                  <span class="font-mono font-bold text-purple-600 dark:text-purple-400">
                    {{ referral.code }}
                  </span>
                </td>
                <td class="p-3">
                  <span class="text-sm text-gray-600 dark:text-gray-400 font-mono">
                    {{ referral.userId.substring(0, 12) }}...
                  </span>
                </td>
                <td class="p-3 text-center font-bold text-gray-900 dark:text-white">
                  {{ referral.totalReferrals }}
                </td>
                <td class="p-3 text-center">
                  <span class="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full font-bold">
                    {{ referral.successfulReferrals }}
                  </span>
                </td>
                <td class="p-3 text-center">
                  <span class="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-full font-bold">
                    {{ referral.pendingReferrals }}
                  </span>
                </td>
                <td class="p-3 text-center font-bold text-blue-600 dark:text-blue-400">
                  {{ referral.totalPoints }}
                </td>
                <td class="p-3 text-center font-bold text-pink-600 dark:text-pink-400">
                  {{ referral.totalVipDays }}
                </td>
                <td class="p-3 text-sm text-gray-600 dark:text-gray-400">
                  {{ formatDate(referral.createdAt) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="filteredReferrals.length === 0" class="text-center py-12">
          <div class="text-6xl mb-4">🔍</div>
          <p class="text-gray-600 dark:text-gray-400">ไม่พบข้อมูลที่ค้นหา</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
table {
  @apply text-sm;
}
</style>
