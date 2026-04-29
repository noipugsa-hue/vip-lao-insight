import { ref, computed } from 'vue'
import { doc, getDoc, setDoc, updateDoc, query, collection, where, getDocs, Timestamp } from 'firebase/firestore'
import { useNuxtApp } from '#app'
import { useAuth } from './useAuth'

/**
 * ⚠️ TESTING MODE - ระบบสมาชิก VIP ยังไม่เปิดใช้งานจริง
 * - Payment Gateway ยังไม่ได้เชื่อมต่อ
 * - ทำงานในโหมด Mock/Demo เท่านั้น
 * - หากต้องการสมัครจริง กรุณาติดต่อ Admin
 */

// ประเภทแพ็กเกจ
export type SubscriptionPlan = 'free' | 'basic' | 'pro' | 'premium'

// สถานะ subscription
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'pending'

// ข้อมูล subscription
export interface Subscription {
  userId: string
  plan: SubscriptionPlan
  status: SubscriptionStatus
  startDate: Date
  endDate: Date
  paymentMethod?: 'promptpay' | 'credit_card' | 'truemoney'
  amount: number
  transactionId?: string
  omiseChargeId?: string
  autoRenew: boolean
  createdAt: Date
  updatedAt: Date
}

// ข้อมูลแพ็กเกจ
export interface PlanInfo {
  id: SubscriptionPlan
  name: string
  nameEn: string
  price: number
  duration: number // วัน
  features: string[]
  popular?: boolean
}

// แพ็กเกจทั้งหมด
export const SUBSCRIPTION_PLANS: PlanInfo[] = [
  {
    id: 'basic',
    name: 'Basic',
    nameEn: 'Basic Plan',
    price: 199,
    duration: 30,
    features: [
      'เห็นการพยากรณ์ขั้นสูง',
      'ดูสถิติย้อนหลัง 3 เดือน',
      'วิเคราะห์ฝัน',
      'ไม่มีโฆษณา'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    nameEn: 'Pro Plan',
    price: 399,
    duration: 30,
    features: [
      'เห็นการพยากรณ์ขั้นสูง',
      'ดูสถิติย้อนหลัง 6 เดือน',
      'วิเคราะห์ฝัน',
      'ติดตามความแม่นยำ',
      'บันทึกเลขซื้อไม่จำกัด',
      'ไม่มีโฆษณา'
    ],
    popular: true
  },
  {
    id: 'premium',
    name: 'Premium',
    nameEn: 'Premium Plan',
    price: 699,
    duration: 30,
    features: [
      'เห็นการพยากรณ์ขั้นสูงแบบ AI',
      'ดูสถิติย้อนหลังไม่จำกัด',
      'วิเคราะห์ฝันขั้นสูง',
      'ติดตามความแม่นยำแบบละเอียด',
      'บันทึกเลขซื้อไม่จำกัด',
      'รับแจ้งเตือนพิเศษ',
      'ปรึกษาผู้เชี่ยวชาญ',
      'ไม่มีโฆษณา'
    ]
  }
]

export const useSubscription = () => {
  const nuxtApp = useNuxtApp()
  const db = nuxtApp.$db
  const { user, waitForAuth } = useAuth()

  const subscription = ref<Subscription | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // เช็คว่าเป็น VIP หรือไม่
  const isVIP = computed(() => {
    if (!subscription.value) return false
    return subscription.value.status === 'active' &&
           subscription.value.plan !== 'free' &&
           new Date(subscription.value.endDate) > new Date()
  })

  // เช็คแผนปัจจุบัน
  const currentPlan = computed(() => subscription.value?.plan || 'free')

  // จำนวนวันที่เหลือ
  const daysRemaining = computed(() => {
    if (!subscription.value || subscription.value.status !== 'active') return 0
    const now = new Date()
    const end = new Date(subscription.value.endDate)
    const diff = end.getTime() - now.getTime()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  })

  // เช็คว่าใกล้หมดอายุหรือไม่
  const isExpiringSoon = computed(() => {
    if (!subscription.value || subscription.value.status !== 'active') return false
    if (subscription.value.plan === 'free') return false
    return daysRemaining.value > 0 && daysRemaining.value <= 7
  })

  // ข้อความแจ้งเตือน
  const expirationMessage = computed(() => {
    if (!isExpiringSoon.value) return ''
    const days = daysRemaining.value
    if (days === 1) return '⏰ สมาชิก VIP ของคุณจะหมดอายุพรุ่งนี้!'
    if (days <= 3) return `⏰ สมาชิก VIP ของคุณจะหมดอายุในอีก ${days} วัน!`
    return `⏰ สมาชิก VIP ของคุณจะหมดอายุในอีก ${days} วัน`
  })

  // ระดับความเร่งด่วน (สำหรับ UI)
  const urgencyLevel = computed(() => {
    const days = daysRemaining.value
    if (days === 0) return 'expired'
    if (days === 1) return 'critical'
    if (days <= 3) return 'high'
    if (days <= 7) return 'medium'
    return 'none'
  })

  // ดึงข้อมูล subscription
  const fetchSubscription = async () => {
    try {
      loading.value = true
      error.value = null

      await waitForAuth()
      if (!user.value) {
        throw new Error('กรุณาเข้าสู่ระบบก่อน')
      }

      const docRef = doc(db, 'subscriptions', user.value.uid)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const data = docSnap.data()
        subscription.value = {
          ...data,
          startDate: data.startDate?.toDate() || new Date(),
          endDate: data.endDate?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as Subscription

        // เช็คว่าหมดอายุหรือยัง
        if (subscription.value.status === 'active' && new Date(subscription.value.endDate) < new Date()) {
          await expireSubscription()
        }
      } else {
        // ถ้ายังไม่มี subscription ให้สร้าง free plan
        await createFreeSubscription()
      }
    } catch (err: any) {
      error.value = err.message
      console.error('Error fetching subscription:', err)
    } finally {
      loading.value = false
    }
  }

  // สร้าง free subscription
  const createFreeSubscription = async () => {
    if (!user.value) return

    const now = new Date()
    const freeSubscription: Subscription = {
      userId: user.value.uid,
      plan: 'free',
      status: 'active',
      startDate: now,
      endDate: new Date('2099-12-31'), // ไม่มีวันหมดอายุสำหรับ free
      amount: 0,
      autoRenew: false,
      createdAt: now,
      updatedAt: now
    }

    const docRef = doc(db, 'subscriptions', user.value.uid)
    await setDoc(docRef, {
      ...freeSubscription,
      startDate: Timestamp.fromDate(freeSubscription.startDate),
      endDate: Timestamp.fromDate(freeSubscription.endDate),
      createdAt: Timestamp.fromDate(freeSubscription.createdAt),
      updatedAt: Timestamp.fromDate(freeSubscription.updatedAt)
    })

    subscription.value = freeSubscription
  }

  // สร้าง subscription ใหม่หลังชำระเงิน
  const createSubscription = async (
    plan: SubscriptionPlan,
    paymentMethod: 'promptpay' | 'credit_card' | 'truemoney',
    transactionId: string,
    omiseChargeId?: string
  ) => {
    try {
      loading.value = true
      error.value = null

      await waitForAuth()
      if (!user.value) {
        throw new Error('กรุณาเข้าสู่ระบบก่อน')
      }

      const planInfo = SUBSCRIPTION_PLANS.find(p => p.id === plan)
      if (!planInfo) {
        throw new Error('ไม่พบแพ็กเกจที่เลือก')
      }

      const now = new Date()
      const endDate = new Date(now.getTime() + planInfo.duration * 24 * 60 * 60 * 1000)

      const newSubscription: Subscription = {
        userId: user.value.uid,
        plan,
        status: 'active',
        startDate: now,
        endDate,
        paymentMethod,
        amount: planInfo.price,
        transactionId,
        omiseChargeId,
        autoRenew: false,
        createdAt: now,
        updatedAt: now
      }

      const docRef = doc(db, 'subscriptions', user.value.uid)
      await setDoc(docRef, {
        ...newSubscription,
        startDate: Timestamp.fromDate(newSubscription.startDate),
        endDate: Timestamp.fromDate(newSubscription.endDate),
        createdAt: Timestamp.fromDate(newSubscription.createdAt),
        updatedAt: Timestamp.fromDate(newSubscription.updatedAt)
      })

      subscription.value = newSubscription

      // บันทึกประวัติการชำระเงิน
      await createPaymentHistory(newSubscription)

      return true
    } catch (err: any) {
      error.value = err.message
      console.error('Error creating subscription:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  // ต่ออายุ subscription
  const renewSubscription = async (
    paymentMethod: 'promptpay' | 'credit_card' | 'truemoney',
    transactionId: string,
    omiseChargeId?: string
  ) => {
    try {
      loading.value = true
      error.value = null

      await waitForAuth()
      if (!user.value || !subscription.value) {
        throw new Error('ไม่พบข้อมูล subscription')
      }

      const planInfo = SUBSCRIPTION_PLANS.find(p => p.id === subscription.value!.plan)
      if (!planInfo) {
        throw new Error('ไม่พบแพ็กเกจที่เลือก')
      }

      const now = new Date()
      const currentEnd = new Date(subscription.value.endDate)
      const startDate = currentEnd > now ? currentEnd : now
      const endDate = new Date(startDate.getTime() + planInfo.duration * 24 * 60 * 60 * 1000)

      const docRef = doc(db, 'subscriptions', user.value.uid)
      await updateDoc(docRef, {
        status: 'active',
        startDate: Timestamp.fromDate(startDate),
        endDate: Timestamp.fromDate(endDate),
        paymentMethod,
        transactionId,
        omiseChargeId,
        updatedAt: Timestamp.fromDate(now)
      })

      subscription.value = {
        ...subscription.value,
        status: 'active',
        startDate,
        endDate,
        paymentMethod,
        transactionId,
        omiseChargeId,
        updatedAt: now
      }

      // บันทึกประวัติการชำระเงิน
      await createPaymentHistory(subscription.value)

      return true
    } catch (err: any) {
      error.value = err.message
      console.error('Error renewing subscription:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  // ยกเลิก subscription
  const cancelSubscription = async () => {
    try {
      loading.value = true
      error.value = null

      await waitForAuth()
      if (!user.value || !subscription.value) {
        throw new Error('ไม่พบข้อมูล subscription')
      }

      const docRef = doc(db, 'subscriptions', user.value.uid)
      await updateDoc(docRef, {
        status: 'cancelled',
        autoRenew: false,
        updatedAt: Timestamp.fromDate(new Date())
      })

      subscription.value = {
        ...subscription.value,
        status: 'cancelled',
        autoRenew: false,
        updatedAt: new Date()
      }

      return true
    } catch (err: any) {
      error.value = err.message
      console.error('Error cancelling subscription:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  // ทำให้ subscription หมดอายุ
  const expireSubscription = async () => {
    if (!user.value || !subscription.value) return

    const docRef = doc(db, 'subscriptions', user.value.uid)
    await updateDoc(docRef, {
      status: 'expired',
      updatedAt: Timestamp.fromDate(new Date())
    })

    subscription.value = {
      ...subscription.value,
      status: 'expired',
      updatedAt: new Date()
    }
  }

  // บันทึกประวัติการชำระเงิน
  const createPaymentHistory = async (sub: Subscription) => {
    if (!user.value) return

    const paymentRef = collection(db, 'payments')
    await setDoc(doc(paymentRef), {
      userId: user.value.uid,
      plan: sub.plan,
      amount: sub.amount,
      paymentMethod: sub.paymentMethod,
      transactionId: sub.transactionId,
      omiseChargeId: sub.omiseChargeId,
      status: 'completed',
      createdAt: Timestamp.fromDate(new Date())
    })
  }

  // ดึงประวัติการชำระเงิน
  const fetchPaymentHistory = async () => {
    try {
      await waitForAuth()
      if (!user.value) return []

      const q = query(
        collection(db, 'payments'),
        where('userId', '==', user.value.uid)
      )
      const querySnapshot = await getDocs(q)

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }))
    } catch (err: any) {
      console.error('Error fetching payment history:', err)
      return []
    }
  }

  // เช็คว่าสามารถใช้ฟีเจอร์ได้หรือไม่
  const canUseFeature = (requiredPlan: SubscriptionPlan) => {
    if (!subscription.value || subscription.value.status !== 'active') return false

    const planHierarchy: SubscriptionPlan[] = ['free', 'basic', 'pro', 'premium']
    const currentIndex = planHierarchy.indexOf(subscription.value.plan)
    const requiredIndex = planHierarchy.indexOf(requiredPlan)

    return currentIndex >= requiredIndex && new Date(subscription.value.endDate) > new Date()
  }

  return {
    subscription,
    loading,
    error,
    isVIP,
    currentPlan,
    daysRemaining,
    isExpiringSoon,
    expirationMessage,
    urgencyLevel,
    fetchSubscription,
    createSubscription,
    renewSubscription,
    cancelSubscription,
    fetchPaymentHistory,
    canUseFeature,
    SUBSCRIPTION_PLANS
  }
}
