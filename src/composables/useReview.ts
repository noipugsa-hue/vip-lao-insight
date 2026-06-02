import { ref, computed } from 'vue'
import type { Ref } from 'vue'
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  limit,
} from 'firebase/firestore'

export interface Review {
  id: string
  userId: string
  userEmail: string
  userName?: string
  rating: number // 1-5
  review: string
  createdAt: Date
  updatedAt: Date
}

export interface ReviewData {
  userId: string
  userEmail: string
  userName?: string
  rating: number
  review: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export function useReview() {
  const { $db, $auth } = useNuxtApp()
  const { user } = useAuth()

  const reviews: Ref<Review[]> = ref([])
  const userReview: Ref<Review | null> = ref(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Computed average rating
  const averageRating = computed(() => {
    if (reviews.value.length === 0) return 0
    const total = reviews.value.reduce((sum, review) => sum + review.rating, 0)
    return Math.round((total / reviews.value.length) * 10) / 10
  })

  // Total reviews count
  const totalReviews = computed(() => reviews.value.length)

  // Rating distribution (1-5 stars)
  const ratingDistribution = computed(() => {
    const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    reviews.value.forEach((review) => {
      if (review.rating >= 1 && review.rating <= 5) {
        dist[review.rating as keyof typeof dist]++
      }
    })
    return dist
  })

  /**
   * Add a new review
   */
  async function addReview(rating: number, reviewText: string): Promise<boolean> {
    console.log('🔍 [addReview] Starting...')
    console.log('🔍 [addReview] User:', user.value?.email)
    console.log('🔍 [addReview] Rating:', rating)
    console.log('🔍 [addReview] Review length:', reviewText.length)

    if (!user.value) {
      error.value = 'กรุณาเข้าสู่ระบบก่อนเขียนรีวิว'
      console.error('❌ [addReview] No user')
      return false
    }

    if (rating < 1 || rating > 5) {
      error.value = 'คะแนนต้องอยู่ระหว่าง 1-5 ดาว'
      console.error('❌ [addReview] Invalid rating:', rating)
      return false
    }

    if (!reviewText.trim()) {
      error.value = 'กรุณาเขียนรีวิว'
      console.error('❌ [addReview] Empty review text')
      return false
    }

    try {
      loading.value = true
      error.value = null

      console.log('🔍 [addReview] Checking for existing review...')
      // Check if user already has a review
      const existingReview = await getUserReview()
      if (existingReview) {
        error.value = 'คุณเคยเขียนรีวิวแล้ว กรุณาแก้ไขรีวิวเดิมแทน'
        console.error('❌ [addReview] User already has review')
        return false
      }

      const reviewData: ReviewData = {
        userId: user.value.uid,
        userEmail: user.value.email || '',
        userName: user.value.displayName || undefined,
        rating,
        review: reviewText.trim(),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      }

      console.log('🔍 [addReview] Review data:', reviewData)
      console.log('🔍 [addReview] Adding to Firestore...')

      await addDoc(collection($db, 'reviews'), reviewData)

      console.log('✅ [addReview] Review added successfully!')

      await getReviews() // Refresh reviews list
      await getUserReview() // Refresh user review

      return true
    } catch (err: any) {
      console.error('❌ [addReview] Error:', err)
      console.error('❌ [addReview] Error code:', err.code)
      console.error('❌ [addReview] Error message:', err.message)

      // More specific error messages
      if (err.code === 'permission-denied') {
        error.value = 'ไม่มีสิทธิ์เขียนรีวิว กรุณา login ใหม่อีกครั้ง'
      } else if (err.code === 'unavailable') {
        error.value = 'ไม่สามารถเชื่อมต่อ Firestore ได้ กรุณาตรวจสอบอินเทอร์เน็ต'
      } else {
        error.value = `เกิดข้อผิดพลาด: ${err.message}`
      }

      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Update existing review
   */
  async function updateReview(
    reviewId: string,
    rating: number,
    reviewText: string
  ): Promise<boolean> {
    if (!user.value) {
      error.value = 'กรุณาเข้าสู่ระบบก่อนแก้ไขรีวิว'
      return false
    }

    if (rating < 1 || rating > 5) {
      error.value = 'คะแนนต้องอยู่ระหว่าง 1-5 ดาว'
      return false
    }

    if (!reviewText.trim()) {
      error.value = 'กรุณาเขียนรีวิว'
      return false
    }

    try {
      loading.value = true
      error.value = null

      const reviewRef = doc($db, 'reviews', reviewId)
      await updateDoc(reviewRef, {
        rating,
        review: reviewText.trim(),
        updatedAt: Timestamp.now(),
      })

      await getReviews() // Refresh reviews list
      await getUserReview() // Refresh user review

      return true
    } catch (err) {
      console.error('Error updating review:', err)
      error.value = 'เกิดข้อผิดพลาดในการแก้ไขรีวิว'
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Delete a review
   */
  async function deleteReview(reviewId: string): Promise<boolean> {
    if (!user.value) {
      error.value = 'กรุณาเข้าสู่ระบบก่อนลบรีวิว'
      return false
    }

    try {
      loading.value = true
      error.value = null

      const reviewRef = doc($db, 'reviews', reviewId)
      await deleteDoc(reviewRef)

      await getReviews() // Refresh reviews list
      userReview.value = null

      return true
    } catch (err) {
      console.error('Error deleting review:', err)
      error.value = 'เกิดข้อผิดพลาดในการลบรีวิว'
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Get all reviews (limited to 50 most recent)
   */
  async function getReviews(limitCount: number = 50): Promise<Review[]> {
    try {
      loading.value = true
      error.value = null

      const q = query(
        collection($db, 'reviews'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      )

      const querySnapshot = await getDocs(q)
      const fetchedReviews: Review[] = []

      querySnapshot.forEach((doc) => {
        const data = doc.data() as ReviewData
        fetchedReviews.push({
          id: doc.id,
          userId: data.userId,
          userEmail: data.userEmail,
          userName: data.userName,
          rating: data.rating,
          review: data.review,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        })
      })

      reviews.value = fetchedReviews
      return fetchedReviews
    } catch (err) {
      console.error('Error getting reviews:', err)
      error.value = 'เกิดข้อผิดพลาดในการโหลดรีวิว'
      return []
    } finally {
      loading.value = false
    }
  }

  /**
   * Get current user's review
   */
  async function getUserReview(): Promise<Review | null> {
    if (!user.value) {
      return null
    }

    try {
      const q = query(
        collection($db, 'reviews'),
        where('userId', '==', user.value.uid),
        limit(1)
      )

      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        userReview.value = null
        return null
      }

      const doc = querySnapshot.docs[0]
      const data = doc.data() as ReviewData

      const review: Review = {
        id: doc.id,
        userId: data.userId,
        userEmail: data.userEmail,
        userName: data.userName,
        rating: data.rating,
        review: data.review,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      }

      userReview.value = review
      return review
    } catch (err) {
      console.error('Error getting user review:', err)
      return null
    }
  }

  return {
    reviews,
    userReview,
    loading,
    error,
    averageRating,
    totalReviews,
    ratingDistribution,
    addReview,
    updateReview,
    deleteReview,
    getReviews,
    getUserReview,
  }
}
