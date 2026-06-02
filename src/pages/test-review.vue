<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuth } from '../composables/useAuth'
import { useReview } from '../composables/useReview'

const { waitForAuth, user } = useAuth()
const {
  reviews,
  userReview,
  loading,
  error,
  averageRating,
  totalReviews,
  addReview,
  updateReview,
  deleteReview,
  getReviews,
  getUserReview,
} = useReview()

const showReviewForm = ref(false)
const reviewMode = ref<'add' | 'edit'>('add')
const initialRating = ref(5)
const initialReviewText = ref('')

onMounted(async () => {
  const currentUser = await waitForAuth()
  if (!currentUser) {
    alert('กรุณา login ก่อน')
    return
  }

  // Load reviews
  await getReviews(10)
  await getUserReview()
})

const openAddReviewForm = async () => {
  await getUserReview()
  if (userReview.value) {
    reviewMode.value = 'edit'
    initialRating.value = userReview.value.rating
    initialReviewText.value = userReview.value.review
  } else {
    reviewMode.value = 'add'
    initialRating.value = 5
    initialReviewText.value = ''
  }
  showReviewForm.value = true
}

const handleReviewSubmit = async (rating: number, reviewText: string) => {
  if (reviewMode.value === 'edit' && userReview.value) {
    const success = await updateReview(userReview.value.id, rating, reviewText)
    if (success) {
      showReviewForm.value = false
      alert('✅ แก้ไขรีวิวสำเร็จ!')
    } else if (error.value) {
      alert(`❌ ${error.value}`)
    }
  } else {
    const success = await addReview(rating, reviewText)
    if (success) {
      showReviewForm.value = false
      alert('✅ เขียนรีวิวสำเร็จ!')
    } else if (error.value) {
      alert(`❌ ${error.value}`)
    }
  }
}

const handleEditReview = (reviewId: string) => {
  const review = reviews.value.find(r => r.id === reviewId)
  if (review) {
    reviewMode.value = 'edit'
    initialRating.value = review.rating
    initialReviewText.value = review.review
    showReviewForm.value = true
  }
}

const handleDeleteReview = async (reviewId: string) => {
  if (confirm('คุณต้องการลบรีวิวนี้ใช่หรือไม่?')) {
    const success = await deleteReview(reviewId)
    if (success) {
      alert('✅ ลบรีวิวสำเร็จ')
    } else if (error.value) {
      alert(`❌ ${error.value}`)
    }
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
    <div class="max-w-6xl mx-auto">
      <h1 class="text-4xl font-black text-gray-900 dark:text-white mb-8 text-center">
        🧪 ทดสอบระบบรีวิว
      </h1>

      <!-- User Info -->
      <div v-if="user" class="bg-white dark:bg-gray-800 rounded-xl p-6 mb-8 shadow-lg">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
          👤 ข้อมูลผู้ใช้
        </h2>
        <p class="text-gray-600 dark:text-gray-400">
          Email: <span class="font-semibold">{{ user.email }}</span>
        </p>
        <p class="text-gray-600 dark:text-gray-400">
          UID: <span class="font-semibold text-xs">{{ user.uid }}</span>
        </p>
      </div>

      <!-- Stats -->
      <div class="bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl p-8 mb-8 shadow-lg">
        <h2 class="text-2xl font-black text-gray-900 dark:text-white mb-6 text-center">
          ⭐ สถิติรีวิว
        </h2>

        <div class="grid grid-cols-3 gap-6 text-center">
          <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
            <div class="text-3xl font-black text-purple-600 dark:text-purple-400">
              {{ totalReviews }}
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400 mt-2">รีวิวทั้งหมด</div>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
            <div class="text-3xl font-black text-yellow-600 dark:text-yellow-400">
              {{ averageRating.toFixed(1) }}
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400 mt-2">คะแนนเฉลี่ย</div>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
            <div class="text-3xl font-black text-green-600 dark:text-green-400">
              {{ userReview ? '✅' : '❌' }}
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400 mt-2">รีวิวของคุณ</div>
          </div>
        </div>

        <!-- Write Review Button -->
        <div class="text-center mt-6">
          <button
            @click="openAddReviewForm"
            class="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 via-pink-500 to-blue-600 text-white rounded-2xl font-black text-lg shadow-xl hover:shadow-2xl transform transition-all hover:scale-110 active:scale-95"
          >
            <span class="text-2xl">✏️</span>
            <span>{{ userReview ? 'แก้ไขรีวิวของคุณ' : 'เขียนรีวิว' }}</span>
          </button>
        </div>
      </div>

      <!-- Reviews List -->
      <div class="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
        <h2 class="text-2xl font-black text-gray-900 dark:text-white mb-6">
          📝 รีวิวทั้งหมด
        </h2>

        <!-- Loading -->
        <div v-if="loading" class="text-center py-12">
          <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p class="text-gray-600 dark:text-gray-400 mt-4">กำลังโหลด...</p>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="text-center py-12">
          <div class="text-6xl mb-4">⚠️</div>
          <p class="text-red-600 dark:text-red-400">{{ error }}</p>
        </div>

        <!-- Empty -->
        <div v-else-if="reviews.length === 0" class="text-center py-12">
          <div class="text-6xl mb-4">💭</div>
          <p class="text-gray-600 dark:text-gray-400">ยังไม่มีรีวิว</p>
        </div>

        <!-- Reviews Grid - 2 columns responsive, flexible height -->
        <div v-else class="grid md:grid-cols-2 gap-6 items-start">
          <ReviewCard
            v-for="review in reviews"
            :key="review.id"
            :review="review"
            :is-own-review="user?.uid === review.userId"
            @edit="handleEditReview(review.id)"
            @delete="handleDeleteReview(review.id)"
          />
        </div>
      </div>

      <!-- Review Form Modal -->
      <ReviewForm
        :is-open="showReviewForm"
        :mode="reviewMode"
        :initial-rating="initialRating"
        :initial-review="initialReviewText"
        @close="showReviewForm = false"
        @submit="handleReviewSubmit"
      />
    </div>
  </div>
</template>
