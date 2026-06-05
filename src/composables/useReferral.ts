/**
 * Referral Program Composable
 * ใช้สำหรับจัดการระบบแนะนำเพื่อน (Referral Program)
 */

import { ref, computed } from 'vue'
import { useAuth } from './useAuth'
import { collection, doc, setDoc, getDoc, getDocs, query, where, updateDoc, increment, Timestamp } from 'firebase/firestore'

// Referral rewards configuration
const REWARDS = {
  referrer: {
    points: 100, // คะแนนที่ผู้แนะนำได้รับต่อ 1 คน
    vipDays: 7, // วัน VIP ฟรีต่อ 1 คน
  },
  referee: {
    points: 50, // คะแนนที่ผู้ถูกแนะนำได้รับ
    vipDays: 3, // วัน VIP ฟรีสำหรับคนใหม่
  },
  milestones: [
    { referrals: 5, reward: { points: 500, vipDays: 30 }, label: 'แนะนำ 5 คน' },
    { referrals: 10, reward: { points: 1500, vipDays: 60 }, label: 'แนะนำ 10 คน' },
    { referrals: 25, reward: { points: 5000, vipDays: 180 }, label: 'แนะนำ 25 คน' },
    { referrals: 50, reward: { points: 15000, vipDays: 365 }, label: 'แนะนำ 50 คน' },
  ],
}

interface ReferralData {
  code: string
  userId: string
  totalReferrals: number
  successfulReferrals: number
  pendingReferrals: number
  totalPoints: number
  totalVipDays: number
  createdAt: Date
  updatedAt: Date
}

interface ReferralStats {
  clicks: number
  signups: number
  conversions: number
  lastUsedAt?: Date
}

export const useReferral = () => {
  const { user, waitForAuth } = useAuth()
  const { $db } = useNuxtApp()

  const referralCode = ref<string>('')
  const referralData = ref<ReferralData | null>(null)
  const referralStats = ref<ReferralStats>({
    clicks: 0,
    signups: 0,
    conversions: 0,
  })
  const referredUsers = ref<any[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Generate unique referral code
  const generateReferralCode = (userId: string): string => {
    const cleanEmail = user.value?.email?.split('@')[0].replace(/[^a-zA-Z0-9]/g, '') || 'user'
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase()
    return `${cleanEmail.toUpperCase()}-${randomSuffix}`
  }

  // Get or create referral code for current user
  const getMyReferralCode = async (): Promise<string> => {
    console.log('📝 [useReferral] getMyReferralCode called')

    await waitForAuth()

    if (!user.value) {
      const errMsg = 'กรุณา login ก่อนใช้งานระบบ referral'
      console.error('❌ [useReferral]', errMsg)
      error.value = errMsg
      return ''
    }

    console.log('👤 [useReferral] User found:', user.value.email, 'UID:', user.value.uid)

    try {
      isLoading.value = true
      error.value = null

      // ตรวจสอบว่ามี referral code แล้วหรือไม่
      console.log('🔍 [useReferral] Checking for existing referral code...')
      const referralRef = doc($db, 'referrals', user.value.uid)
      const referralSnap = await getDoc(referralRef)
      console.log('📊 [useReferral] Firestore query completed, exists:', referralSnap.exists())

      if (referralSnap.exists()) {
        console.log('✅ [useReferral] Existing referral code found')
        const data = referralSnap.data()
        referralCode.value = data.code
        referralData.value = {
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as ReferralData
        console.log('📋 [useReferral] Code:', referralCode.value)
        console.log('📊 [useReferral] Data:', referralData.value)

        // Load stats
        const statsRef = doc($db, 'referralStats', user.value.uid)
        const statsSnap = await getDoc(statsRef)
        if (statsSnap.exists()) {
          const stats = statsSnap.data()
          referralStats.value = {
            clicks: stats.clicks || 0,
            signups: stats.signups || 0,
            conversions: stats.conversions || 0,
            lastUsedAt: stats.lastUsedAt?.toDate(),
          }
        }
      } else {
        // สร้าง referral code ใหม่
        console.log('🆕 [useReferral] Creating new referral code...')
        const newCode = generateReferralCode(user.value.uid)
        console.log('📋 [useReferral] Generated code:', newCode)

        const newReferralData: ReferralData = {
          code: newCode,
          userId: user.value.uid,
          totalReferrals: 0,
          successfulReferrals: 0,
          pendingReferrals: 0,
          totalPoints: 0,
          totalVipDays: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        console.log('💾 [useReferral] Saving to Firestore...')
        await setDoc(referralRef, {
          ...newReferralData,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        })
        console.log('✅ [useReferral] Referral doc created')

        // สร้าง stats doc
        const statsRef = doc($db, 'referralStats', user.value.uid)
        await setDoc(statsRef, {
          clicks: 0,
          signups: 0,
          conversions: 0,
        })
        console.log('✅ [useReferral] Stats doc created')

        referralCode.value = newCode
        referralData.value = newReferralData
      }

      isLoading.value = false
      console.log('🎉 [useReferral] Referral code ready:', referralCode.value)
      return referralCode.value
    } catch (err: any) {
      console.error('❌ [useReferral] Error getting referral code:', err)
      console.error('❌ [useReferral] Error details:', {
        message: err.message,
        code: err.code,
        stack: err.stack,
      })

      // Detailed error message
      if (err.code === 'permission-denied') {
        error.value = 'ไม่มีสิทธิ์เข้าถึงข้อมูล กรุณาติดต่อ admin'
      } else if (err.code === 'unavailable') {
        error.value = 'ไม่สามารถเชื่อมต่อ Firestore ได้ กรุณาลองใหม่'
      } else {
        error.value = `เกิดข้อผิดพลาด: ${err.message || 'ไม่ทราบสาเหตุ'}`
      }

      isLoading.value = false
      return ''
    }
  }

  // Track referral click
  const trackReferralClick = async (code: string) => {
    try {
      // หา userId จาก referral code
      const referralsQuery = query(
        collection($db, 'referrals'),
        where('code', '==', code)
      )
      const querySnapshot = await getDocs(referralsQuery)

      if (!querySnapshot.empty) {
        const referrerUserId = querySnapshot.docs[0].id

        // อัพเดท stats
        const statsRef = doc($db, 'referralStats', referrerUserId)
        await updateDoc(statsRef, {
          clicks: increment(1),
          lastUsedAt: Timestamp.now(),
        })

        // บันทึกใน localStorage สำหรับติดตาม
        if (process.client) {
          localStorage.setItem('referral_code', code)
          localStorage.setItem('referral_clicked_at', new Date().toISOString())
        }
      }
    } catch (err) {
      console.error('Error tracking referral click:', err)
    }
  }

  // Apply referral code when user signs up
  const applyReferralCode = async (newUserUid: string) => {
    try {
      // ดึง referral code จาก localStorage
      if (!process.client) return

      const storedCode = localStorage.getItem('referral_code')
      if (!storedCode) return

      // หาผู้แนะนำ
      const referralsQuery = query(
        collection($db, 'referrals'),
        where('code', '==', storedCode)
      )
      const querySnapshot = await getDocs(referralsQuery)

      if (querySnapshot.empty) return

      const referrerUserId = querySnapshot.docs[0].id

      // ห้ามแนะนำตัวเอง
      if (referrerUserId === newUserUid) return

      // บันทึกความสัมพันธ์ referral
      const referralRecordRef = doc($db, 'referralRecords', newUserUid)
      await setDoc(referralRecordRef, {
        referrerId: referrerUserId,
        refereeId: newUserUid,
        referralCode: storedCode,
        status: 'pending', // pending -> active (หลังจากใช้งานครบ X วัน)
        createdAt: Timestamp.now(),
      })

      // อัพเดทสถิติ
      const referrerRef = doc($db, 'referrals', referrerUserId)
      await updateDoc(referrerRef, {
        totalReferrals: increment(1),
        pendingReferrals: increment(1),
        updatedAt: Timestamp.now(),
      })

      const statsRef = doc($db, 'referralStats', referrerUserId)
      await updateDoc(statsRef, {
        signups: increment(1),
      })

      // มอบรางวัลให้ผู้ถูกแนะนำ (ทันที)
      await grantReward(newUserUid, REWARDS.referee.points, REWARDS.referee.vipDays, 'referee')

      // ลบ referral code จาก localStorage
      localStorage.removeItem('referral_code')
      localStorage.removeItem('referral_clicked_at')
    } catch (err) {
      console.error('Error applying referral code:', err)
    }
  }

  // Confirm referral (เมื่อผู้ถูกแนะนำใช้งานจริง)
  const confirmReferral = async (refereeUid: string) => {
    try {
      const recordRef = doc($db, 'referralRecords', refereeUid)
      const recordSnap = await getDoc(recordRef)

      if (!recordSnap.exists()) return

      const record = recordSnap.data()
      if (record.status !== 'pending') return

      const referrerUserId = record.referrerId

      // อัพเดทสถานะ
      await updateDoc(recordRef, {
        status: 'active',
        confirmedAt: Timestamp.now(),
      })

      // อัพเดทสถิติผู้แนะนำ
      const referrerRef = doc($db, 'referrals', referrerUserId)
      await updateDoc(referrerRef, {
        successfulReferrals: increment(1),
        pendingReferrals: increment(-1),
        updatedAt: Timestamp.now(),
      })

      const statsRef = doc($db, 'referralStats', referrerUserId)
      await updateDoc(statsRef, {
        conversions: increment(1),
      })

      // มอบรางวัลให้ผู้แนะนำ
      await grantReward(referrerUserId, REWARDS.referrer.points, REWARDS.referrer.vipDays, 'referrer')

      // ตรวจสอบ milestones
      const referrerSnap = await getDoc(referrerRef)
      if (referrerSnap.exists()) {
        const data = referrerSnap.data()
        await checkMilestones(referrerUserId, data.successfulReferrals)
      }
    } catch (err) {
      console.error('Error confirming referral:', err)
    }
  }

  // Grant reward (คะแนนและวัน VIP)
  const grantReward = async (userId: string, points: number, vipDays: number, type: 'referrer' | 'referee') => {
    try {
      const userRef = doc($db, 'referrals', userId)

      await updateDoc(userRef, {
        totalPoints: increment(points),
        totalVipDays: increment(vipDays),
        updatedAt: Timestamp.now(),
      })

      // บันทึก reward history
      const rewardRef = doc(collection($db, 'rewardHistory'))
      await setDoc(rewardRef, {
        userId,
        type,
        points,
        vipDays,
        createdAt: Timestamp.now(),
      })

      console.log(`Granted ${points} points and ${vipDays} VIP days to ${userId}`)
    } catch (err) {
      console.error('Error granting reward:', err)
    }
  }

  // Check and grant milestone rewards
  const checkMilestones = async (userId: string, currentReferrals: number) => {
    try {
      for (const milestone of REWARDS.milestones) {
        if (currentReferrals === milestone.referrals) {
          // มอบรางวัล milestone
          await grantReward(userId, milestone.reward.points, milestone.reward.vipDays, 'referrer')

          // บันทึก milestone achievement
          const achievementRef = doc(collection($db, 'milestoneAchievements'))
          await setDoc(achievementRef, {
            userId,
            milestone: milestone.referrals,
            label: milestone.label,
            reward: milestone.reward,
            achievedAt: Timestamp.now(),
          })

          console.log(`Milestone achieved: ${milestone.label} for user ${userId}`)
        }
      }
    } catch (err) {
      console.error('Error checking milestones:', err)
    }
  }

  // Get referred users list
  const getReferredUsers = async () => {
    await waitForAuth()

    if (!user.value) return []

    try {
      isLoading.value = true

      const recordsQuery = query(
        collection($db, 'referralRecords'),
        where('referrerId', '==', user.value.uid)
      )
      const querySnapshot = await getDocs(recordsQuery)

      referredUsers.value = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        confirmedAt: doc.data().confirmedAt?.toDate(),
      }))

      isLoading.value = false
      return referredUsers.value
    } catch (err) {
      console.error('Error getting referred users:', err)
      error.value = 'ไม่สามารถโหลดรายชื่อผู้ถูกแนะนำได้'
      isLoading.value = false
      return []
    }
  }

  // Get referral link
  const referralLink = computed(() => {
    if (!referralCode.value) return ''
    const baseUrl = process.client ? window.location.origin : 'https://vip-lao-insight.vercel.app'
    return `${baseUrl}/?ref=${referralCode.value}`
  })

  // Conversion rate
  const conversionRate = computed(() => {
    if (!referralData.value || referralData.value.totalReferrals === 0) return 0
    return Math.round((referralData.value.successfulReferrals / referralData.value.totalReferrals) * 100)
  })

  // Next milestone
  const nextMilestone = computed(() => {
    if (!referralData.value) return null

    const current = referralData.value.successfulReferrals
    return REWARDS.milestones.find(m => m.referrals > current) || null
  })

  return {
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
    trackReferralClick,
    applyReferralCode,
    confirmReferral,
    getReferredUsers,
    REWARDS,
  }
}
