import { ref, computed } from 'vue'
import { doc, getDoc, setDoc, updateDoc, query, collection, where, getDocs, Timestamp } from 'firebase/firestore'
import { useNuxtApp } from '#app'
import { useAuth } from './useAuth'
import { useAdmin } from './useAdmin'

/**
 * 🎁 FREE + PRO SYSTEM:
 * - ทุกคนเริ่มต้นด้วย FREE (ใช้ฟรี 30 วัน)
 * - หลังจาก 30 วัน ต้องแอด Line แล้วชำระเงิน 599 บาทเพื่ออัพเกรดเป็น PRO
 * - PRO = 599 บาท / 30 วัน (ใช้งานได้เต็มรูปแบบ)
 * - ⭐ ADMIN = ใช้งานได้ตลอดไม่มีข้อจำกัด
 */

// ประเภทแพ็กเกจ
export type SubscriptionPlan = 'free' | 'pro'

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
    id: 'free',
    name: 'FREE 30 วัน',
    nameEn: 'Free 30 Days',
    price: 0,
    duration: 30,
    features: [
      '🎁 ใช้ฟรี 30 วัน',
      'เห็นการพยากรณ์ขั้นสูง',
      'ดูสถิติย้อนหลัง',
      'วิเคราะห์ฝัน',
      'ติดตามความแม่นยำ',
      'บันทึกเลขซื้อ',
      'ไม่มีโฆษณา',
      '⏰ หมดอายุหลัง 30 วัน - แอด Line ชำระ 599฿'
    ],
    popular: false
  },
  {
    id: 'pro',
    name: 'PRO VIP',
    nameEn: 'PRO VIP Plan',
    price: 599,
    duration: 30,
    features: [
      '✅ ใช้งานได้เต็มรูปแบบ 30 วัน',
      'เห็นการพยากรณ์ขั้นสูง AI',
      'ดูสถิติย้อนหลังไม่จำกัด',
      'วิเคราะห์ฝันขั้นสูง',
      'ติดตามความแม่นยำแบบละเอียด',
      'บันทึกเลขซื้อไม่จำกัด',
      'รับแจ้งเตือนพิเศษ',
      'ไม่มีโฆษณา'
    ],
    popular: true
  }
]

export const useSubscription = () => {
  const nuxtApp = useNuxtApp()
  const db = nuxtApp.$db
  const { user, waitForAuth } = useAuth()
  const { isAdmin } = useAdmin()

  const subscription = ref<Subscription | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // เช็คว่าหมดอายุหรือยัง (Admin ไม่หมดอายุ)
  const isExpired = computed(() => {
    // ถ้าเป็น admin ไม่หมดอายุเลย
    if (isAdmin.value) return false

    if (!subscription.value) return false
    return subscription.value.status === 'expired' ||
           (subscription.value.status === 'active' && new Date(subscription.value.endDate) < new Date())
  })

  // เช็คว่าเป็น VIP หรือไม่ (Admin = VIP ตลอด)
  const isVIP = computed(() => {
    // ถ้าเป็น admin ถือว่าเป็น VIP ตลอด
    if (isAdmin.value) return true

    if (!subscription.value) return false
    return subscription.value.status === 'active' &&
           new Date(subscription.value.endDate) > new Date()
  })

  // เช็คแผนปัจจุบัน
  const currentPlan = computed(() => subscription.value?.plan || 'free')

  // จำนวนวันที่เหลือ (Admin ก็นับวันปกติ แต่ไม่ต้องจ่ายเงิน)
  const daysRemaining = computed(() => {
    if (!subscription.value || subscription.value.status !== 'active') return 0
    const now = new Date()
    const end = new Date(subscription.value.endDate)
    const diff = end.getTime() - now.getTime()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  })

  // เช็คว่าใกล้หมดอายุหรือไม่ (Admin ไม่มีการหมดอายุ)
  const isExpiringSoon = computed(() => {
    // Admin ไม่มีการหมดอายุ
    if (isAdmin.value) return false

    if (!subscription.value || subscription.value.status !== 'active') return false
    return daysRemaining.value > 0 && daysRemaining.value <= 10
  })

  // ข้อความแจ้งเตือน
  const expirationMessage = computed(() => {
    // ถ้าหมดอายุแล้ว
    if (isExpired.value) {
      return '🚨 VIP ของคุณหมดอายุแล้ว! ชำระเงิน 599 บาทเพื่อใช้งานต่อ'
    }

    // ถ้ายังไม่หมดอายุแต่ใกล้หมด
    if (!isExpiringSoon.value) return ''
    const days = daysRemaining.value
    if (days === 1) return '⏰ VIP ของคุณจะหมดอายุพรุ่งนี้! ชำระ 599 บาทเพื่อใช้งานต่อ'
    if (days <= 3) return `⏰ VIP ของคุณจะหมดอายุในอีก ${days} วัน! ชำระ 599 บาทเพื่อใช้งานต่อ`
    if (days <= 7) return `⏰ VIP ของคุณจะหมดอายุในอีก ${days} วัน - อย่าลืมต่ออายุ`
    return `ℹ️ VIP ของคุณเหลืออีก ${days} วัน`
  })

  // ระดับความเร่งด่วน (สำหรับ UI)
  const urgencyLevel = computed(() => {
    if (isExpired.value) return 'expired'
    const days = daysRemaining.value
    if (days === 0) return 'expired'
    if (days === 1) return 'critical'
    if (days <= 3) return 'high'
    if (days <= 7) return 'medium'
    if (days <= 10) return 'low'
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

      // ลองอ่านจาก localStorage ก่อน
      const localKey = `subscription_${user.value.uid}`
      const localData = localStorage.getItem(localKey)

      // ถ้าเป็น admin และมี subscription เก่า ให้เช็คว่าหมดอายุหรือยัง
      if (localData && isAdmin.value) {
        const parsed = JSON.parse(localData)
        const endDate = new Date(parsed.endDate)
        const now = new Date()

        // คำนวณจำนวนวันที่เหลือ
        const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

        console.log('👑 Admin subscription check:', {
          endDate: endDate.toISOString(),
          now: now.toISOString(),
          daysLeft,
          status: parsed.status
        })

        // ถ้าหมดอายุแล้ว หรือวันที่ผิดปกติ (มากกว่า 50 วันหรือติดลบ) ให้สร้างใหม่เลย
        if (endDate < now || parsed.status === 'expired' || daysLeft > 50 || daysLeft < 0) {
          console.log('👑 Admin subscription expired or invalid, creating new 30-day subscription')
          await autoRenewAdminSubscription()
          loading.value = false
          return
        }

        // ถ้ายังไม่หมดอายุและวันที่ปกติ ใช้ของเดิม
        subscription.value = {
          ...parsed,
          startDate: new Date(parsed.startDate),
          endDate: new Date(parsed.endDate),
          createdAt: new Date(parsed.createdAt),
          updatedAt: new Date(parsed.updatedAt)
        } as Subscription

        loading.value = false
        return
      }

      // สำหรับ user ทั่วไป ใช้ localStorage ปกติ
      if (localData && !isAdmin.value) {
        const parsed = JSON.parse(localData)
        const endDate = new Date(parsed.endDate)
        const now = new Date()
        const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

        // ถ้าวันที่ผิดปกติมาก (>100 วัน หรือ <-100 วัน) ให้ลบและสร้างใหม่
        if (daysLeft > 100 || daysLeft < -100) {
          console.log('⚠️ Invalid subscription data detected, creating new subscription')
          localStorage.removeItem(localKey)
          await createFreeSubscription()
          loading.value = false
          return
        }

        subscription.value = {
          ...parsed,
          startDate: new Date(parsed.startDate),
          endDate: new Date(parsed.endDate),
          createdAt: new Date(parsed.createdAt),
          updatedAt: new Date(parsed.updatedAt)
        } as Subscription

        loading.value = false
        return
      }

      // พยายามโหลดจาก Firestore
      try {
        const docRef = doc(db, 'subscriptions', user.value.uid)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          const data = docSnap.data()
          const endDate = data.endDate?.toDate() || new Date()
          const now = new Date()

          // คำนวณจำนวนวันที่เหลือสำหรับ admin
          const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

          console.log('👑 Admin Firestore subscription check:', {
            endDate: endDate.toISOString(),
            now: now.toISOString(),
            daysLeft,
            status: data.status
          })

          // ถ้าเป็น admin และหมดอายุแล้ว หรือวันที่ผิดปกติ ให้สร้างใหม่เลย
          if (isAdmin.value && (endDate < now || data.status === 'expired' || daysLeft > 50 || daysLeft < 0)) {
            console.log('👑 Admin subscription expired or invalid in Firestore, creating new 30-day subscription')
            await autoRenewAdminSubscription()
            loading.value = false
            return
          }

          subscription.value = {
            ...data,
            startDate: data.startDate?.toDate() || new Date(),
            endDate: endDate,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date()
          } as Subscription

          // บันทึกลง localStorage
          localStorage.setItem(localKey, JSON.stringify(subscription.value))

          // เช็คว่าหมดอายุหรือยัง (สำหรับ user ทั่วไป)
          if (!isAdmin.value && subscription.value.status === 'active' && new Date(subscription.value.endDate) < new Date()) {
            await expireSubscription()
          }
        } else {
          // ถ้ายังไม่มี subscription ให้สร้าง free 30 วัน
          console.log(isAdmin.value ? '👑 Admin first login, creating 30-day subscription' : '🎁 New user, creating free 30-day subscription')
          await createFreeSubscription()
        }
      } catch (firestoreErr: any) {
        console.warn('Cannot access Firestore, creating free subscription locally:', firestoreErr.message)
        // สร้าง free subscription ใน localStorage
        await createFreeSubscription()
      }
    } catch (err: any) {
      error.value = err.message
      console.error('Error fetching subscription:', err)
      // สร้าง free subscription เป็นค่าเริ่มต้น
      await createFreeSubscription()
    } finally {
      loading.value = false
    }
  }

  // สร้าง free subscription (30 วันฟรี)
  const createFreeSubscription = async () => {
    if (!user.value) return

    const now = new Date()
    const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 วันจากวันนี้

    const freeSubscription: Subscription = {
      userId: user.value.uid,
      plan: 'free',
      status: 'active',
      startDate: now,
      endDate: endDate,
      amount: 0,
      autoRenew: false,
      createdAt: now,
      updatedAt: now
    }

    // บันทึกลง localStorage ก่อน (ทำงานได้เสมอ)
    const localKey = `subscription_${user.value.uid}`
    localStorage.setItem(localKey, JSON.stringify(freeSubscription))
    subscription.value = freeSubscription

    // พยายามบันทึกลง Firestore
    try {
      const docRef = doc(db, 'subscriptions', user.value.uid)
      await setDoc(docRef, {
        ...freeSubscription,
        startDate: Timestamp.fromDate(freeSubscription.startDate),
        endDate: Timestamp.fromDate(freeSubscription.endDate),
        createdAt: Timestamp.fromDate(freeSubscription.createdAt),
        updatedAt: Timestamp.fromDate(freeSubscription.updatedAt)
      })
      console.log('🎁 FREE 30 วันสร้างสำเร็จ! saved to both localStorage and Firestore')
    } catch (err: any) {
      console.warn('Cannot save to Firestore, saved to localStorage only:', err.message)
    }
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

    subscription.value = {
      ...subscription.value,
      status: 'expired',
      updatedAt: new Date()
    }

    // บันทึกลง localStorage
    const localKey = `subscription_${user.value.uid}`
    localStorage.setItem(localKey, JSON.stringify(subscription.value))

    // พยายามบันทึกลง Firestore
    try {
      const docRef = doc(db, 'subscriptions', user.value.uid)
      await updateDoc(docRef, {
        status: 'expired',
        updatedAt: Timestamp.fromDate(new Date())
      })
    } catch (err: any) {
      console.warn('Cannot update Firestore, updated localStorage only:', err.message)
    }
  }

  // ต่ออายุ subscription อัตโนมัติสำหรับ admin (ไม่ต้องจ่ายเงิน)
  const autoRenewAdminSubscription = async () => {
    if (!user.value) return

    const now = new Date()
    const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 วันจากวันนี้

    const renewedSubscription: Subscription = {
      userId: user.value.uid,
      plan: 'free', // Admin ใช้ free plan
      status: 'active',
      startDate: now,
      endDate: endDate,
      amount: 0,
      autoRenew: false,
      createdAt: subscription.value?.createdAt || now,
      updatedAt: now
    }

    // บันทึกลง localStorage
    const localKey = `subscription_${user.value.uid}`
    localStorage.setItem(localKey, JSON.stringify(renewedSubscription))
    subscription.value = renewedSubscription

    // พยายามบันทึกลง Firestore
    try {
      const docRef = doc(db, 'subscriptions', user.value.uid)
      await setDoc(docRef, {
        ...renewedSubscription,
        startDate: Timestamp.fromDate(renewedSubscription.startDate),
        endDate: Timestamp.fromDate(renewedSubscription.endDate),
        createdAt: Timestamp.fromDate(renewedSubscription.createdAt),
        updatedAt: Timestamp.fromDate(renewedSubscription.updatedAt)
      })
      console.log('👑 Admin subscription auto-renewed for 30 days (no payment required)')
    } catch (err: any) {
      console.warn('Cannot save to Firestore, saved to localStorage only:', err.message)
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

    const planHierarchy: SubscriptionPlan[] = ['free', 'pro']
    const currentIndex = planHierarchy.indexOf(subscription.value.plan)
    const requiredIndex = planHierarchy.indexOf(requiredPlan)

    return currentIndex >= requiredIndex && new Date(subscription.value.endDate) > new Date()
  }

  return {
    subscription,
    loading,
    error,
    isVIP,
    isExpired,
    currentPlan,
    daysRemaining,
    isExpiringSoon,
    expirationMessage,
    urgencyLevel,
    fetchSubscription,
    createFreeSubscription,
    createSubscription,
    renewSubscription,
    cancelSubscription,
    fetchPaymentHistory,
    canUseFeature,
    SUBSCRIPTION_PLANS
  }
}
