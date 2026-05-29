import { ref, computed } from 'vue'
import { collection, query, orderBy, onSnapshot, doc, getDoc, updateDoc, addDoc, Timestamp, where, getDocs } from 'firebase/firestore'
import { useNuxtApp } from '#app'
import { useAuth } from './useAuth'
import { useAdmin } from './useAdmin'
import type { Subscription, SubscriptionPlan, SubscriptionStatus } from './useSubscription'

/**
 * 👥 ADMIN USER MANAGEMENT:
 * - ดูผู้ใช้ทั้งหมดและสถานะ VIP
 * - ปลดล็อค/ต่ออายุ VIP (30 วันมาตรฐาน)
 * - ติดตาม audit log การแก้ไข
 */

export interface UserSubscriptionInfo extends Subscription {
  email?: string
  uid: string
}

export interface AdminAction {
  actionId?: string
  adminEmail: string
  adminUid: string
  targetUserId: string
  targetUserEmail: string
  action: 'extend_subscription'

  // State tracking
  oldEndDate: Date
  newEndDate: Date
  daysAdded: number
  oldPlan: SubscriptionPlan
  newPlan: SubscriptionPlan
  oldStatus: SubscriptionStatus
  newStatus: SubscriptionStatus

  // Metadata
  notes?: string
  timestamp: Date
}

export const useAdminSubscription = () => {
  const nuxtApp = useNuxtApp()
  const db = nuxtApp.$db
  const { user, waitForAuth } = useAuth()
  const { isAdmin } = useAdmin()

  const users = ref<UserSubscriptionInfo[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const unsubscribe = ref<(() => void) | null>(null)

  // สถิติผู้ใช้
  const stats = computed(() => {
    const total = users.value.length
    const active = users.value.filter(u => u.status === 'active' && new Date(u.endDate) > new Date()).length
    const expired = users.value.filter(u => u.status === 'expired' || (u.status === 'active' && new Date(u.endDate) <= new Date())).length

    // Critical: 0-3 days remaining
    const critical = users.value.filter(u => {
      if (u.status !== 'active') return false
      const now = new Date()
      const end = new Date(u.endDate)
      const diff = end.getTime() - now.getTime()
      const days = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
      return days <= 3
    }).length

    return { total, active, expired, critical }
  })

  // คำนวณจำนวนวันที่เหลือ (ใช้ Math.floor เหมือน useSubscription)
  const calculateDaysRemaining = (endDate: Date): number => {
    const now = new Date()
    const end = new Date(endDate)
    const diff = end.getTime() - now.getTime()
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
  }

  // ระดับความเร่งด่วน
  const getUrgencyLevel = (userSub: UserSubscriptionInfo): 'expired' | 'critical' | 'high' | 'medium' | 'normal' => {
    if (userSub.status === 'expired' || new Date(userSub.endDate) <= new Date()) {
      return 'expired'
    }

    const days = calculateDaysRemaining(userSub.endDate)
    if (days === 0) return 'expired'
    if (days <= 3) return 'critical'
    if (days <= 7) return 'high'
    if (days <= 10) return 'medium'
    return 'normal'
  }

  // ดึงข้อมูลผู้ใช้ทั้งหมด (real-time)
  const fetchAllUsers = async () => {
    try {
      loading.value = true
      error.value = null

      await waitForAuth()
      if (!user.value || !isAdmin.value) {
        throw new Error('ไม่มีสิทธิ์เข้าถึง')
      }

      console.log('👥 [Admin] Starting to fetch all users...')
      console.log('👥 [Admin] Current admin user:', user.value?.email)

      // Stop previous listener
      if (unsubscribe.value) {
        unsubscribe.value()
      }

      // Query subscriptions collection with real-time updates
      const q = query(
        collection(db, 'subscriptions'),
        orderBy('updatedAt', 'desc')
      )

      console.log('👥 [Admin] Setting up real-time listener on subscriptions collection...')

      unsubscribe.value = onSnapshot(q, async (snapshot) => {
        console.log(`👥 [Admin] Received snapshot with ${snapshot.docs.length} documents`)
        console.log('👥 [Admin] Document IDs:', snapshot.docs.map(d => d.id))

        if (snapshot.empty) {
          console.warn('⚠️ [Admin] Subscriptions collection is empty! No users have logged in yet.')
          users.value = []
          loading.value = false
          return
        }

        const usersList: UserSubscriptionInfo[] = []

        for (const docSnap of snapshot.docs) {
          const data = docSnap.data()
          console.log(`📄 [Admin] Processing user ${docSnap.id}:`, {
            plan: data.plan,
            status: data.status,
            endDate: data.endDate?.toDate(),
            userId: data.userId,
            email: data.email
          })

          // Get user email - Priority: subscription.email > login_history > UID
          let email = data.email || data.userId || docSnap.id

          // ถ้าไม่มี email ใน subscription document ให้ลองหาจาก login_history
          if (!data.email || data.email === docSnap.id) {
            console.log(`📧 [Admin] No email in subscription, fetching from login_history...`)
            try {
              const loginHistoryQuery = query(
                collection(db, 'login_history'),
                where('userId', '==', docSnap.id)  // แก้จาก 'uid' เป็น 'userId'
              )
              const loginSnap = await getDocs(loginHistoryQuery)
              if (!loginSnap.empty && loginSnap.docs.length > 0) {
                const firstDoc = loginSnap.docs[0]
                if (firstDoc) {
                  const loginData = firstDoc.data()
                  email = loginData.email || email
                  console.log(`✅ [Admin] Found email in login_history: ${email}`)
                }
              } else {
                console.log(`⚠️ [Admin] No login_history found for ${docSnap.id}, using UID as email`)
              }
            } catch (err) {
              console.warn(`❌ [Admin] Error fetching email for user ${docSnap.id}:`, err)
            }
          } else {
            console.log(`✅ [Admin] Using email from subscription: ${email}`)
          }

          usersList.push({
            uid: docSnap.id,
            email,
            userId: docSnap.id,
            plan: data.plan || 'free',
            status: data.status || 'active',
            startDate: data.startDate?.toDate() || new Date(),
            endDate: data.endDate?.toDate() || new Date(),
            paymentMethod: data.paymentMethod,
            amount: data.amount || 0,
            transactionId: data.transactionId,
            omiseChargeId: data.omiseChargeId,
            autoRenew: data.autoRenew || false,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date()
          })
        }

        // Sort by urgency (expired/critical first)
        users.value = usersList.sort((a, b) => {
          const urgencyOrder = { expired: 0, critical: 1, high: 2, medium: 3, normal: 4 }
          const aLevel = getUrgencyLevel(a)
          const bLevel = getUrgencyLevel(b)
          return urgencyOrder[aLevel] - urgencyOrder[bLevel]
        })

        console.log(`✅ [Admin] Loaded ${users.value.length} users successfully`)
        console.log('📋 [Admin] User emails:', users.value.map(u => u.email))
        loading.value = false
      }, (err) => {
        error.value = err.message
        loading.value = false
        console.error('❌ [Admin] Error fetching users:', err)
        console.error('❌ [Admin] Error details:', {
          message: err.message,
          code: err.code,
          stack: err.stack
        })
      })

    } catch (err: any) {
      error.value = err.message
      loading.value = false
      console.error('Error fetching users:', err)
    }
  }

  // ต่ออายุ/ปลดล็อค subscription
  const extendUserSubscription = async (
    userId: string,
    days: number = 30,
    plan: SubscriptionPlan = 'pro',
    notes?: string
  ): Promise<boolean> => {
    try {
      loading.value = true
      error.value = null

      await waitForAuth()
      if (!user.value || !isAdmin.value) {
        throw new Error('ไม่มีสิทธิ์ดำเนินการ')
      }

      // Fetch current subscription
      const docRef = doc(db, 'subscriptions', userId)
      const docSnap = await getDoc(docRef)

      if (!docSnap.exists()) {
        throw new Error('ไม่พบข้อมูลผู้ใช้')
      }

      const currentData = docSnap.data()
      const oldEndDate = currentData.endDate?.toDate() || new Date()
      const oldPlan = currentData.plan || 'free'
      const oldStatus = currentData.status || 'expired'

      // Calculate new end date
      const now = new Date()
      let newEndDate: Date

      // If active and not expired, extend from current end date
      if (oldStatus === 'active' && oldEndDate > now) {
        newEndDate = new Date(oldEndDate.getTime() + days * 24 * 60 * 60 * 1000)
      } else {
        // If expired, extend from now
        newEndDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
      }

      // Update subscription
      await updateDoc(docRef, {
        plan: plan,
        status: 'active',
        endDate: Timestamp.fromDate(newEndDate),
        updatedAt: Timestamp.fromDate(now)
      })

      // Get user email
      const userInfo = users.value.find(u => u.uid === userId)
      const targetEmail = userInfo?.email || userId

      // Create audit log
      await addDoc(collection(db, 'admin_actions'), {
        adminEmail: user.value.email || '',
        adminUid: user.value.uid,
        targetUserId: userId,
        targetUserEmail: targetEmail,
        action: 'extend_subscription',
        oldEndDate: Timestamp.fromDate(oldEndDate),
        newEndDate: Timestamp.fromDate(newEndDate),
        daysAdded: days,
        oldPlan,
        newPlan: plan,
        oldStatus,
        newStatus: 'active',
        notes: notes || '',
        timestamp: Timestamp.fromDate(now)
      })

      console.log(`✅ Extended subscription for user ${userId}:`, {
        oldEndDate,
        newEndDate,
        daysAdded: days,
        oldPlan,
        newPlan: plan
      })

      loading.value = false
      return true
    } catch (err: any) {
      error.value = err.message
      loading.value = false
      console.error('Error extending subscription:', err)
      return false
    }
  }

  // ดึง audit log
  const getAuditLog = async (userId?: string): Promise<AdminAction[]> => {
    try {
      await waitForAuth()
      if (!user.value || !isAdmin.value) {
        throw new Error('ไม่มีสิทธิ์เข้าถึง')
      }

      let q = query(
        collection(db, 'admin_actions'),
        orderBy('timestamp', 'desc')
      )

      // Filter by user if specified
      if (userId) {
        q = query(
          collection(db, 'admin_actions'),
          where('targetUserId', '==', userId),
          orderBy('timestamp', 'desc')
        )
      }

      const snapshot = await getDocs(q)

      return snapshot.docs.map(doc => ({
        actionId: doc.id,
        ...doc.data(),
        oldEndDate: doc.data().oldEndDate?.toDate() || new Date(),
        newEndDate: doc.data().newEndDate?.toDate() || new Date(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      } as AdminAction))
    } catch (err: any) {
      console.error('Error fetching audit log:', err)
      return []
    }
  }

  // Cleanup listener
  const cleanup = () => {
    if (unsubscribe.value) {
      unsubscribe.value()
      unsubscribe.value = null
    }
  }

  return {
    users,
    loading,
    error,
    stats,
    calculateDaysRemaining,
    getUrgencyLevel,
    fetchAllUsers,
    extendUserSubscription,
    getAuditLog,
    cleanup
  }
}
