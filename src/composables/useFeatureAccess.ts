import { ref, computed } from 'vue'
import { doc, getDoc, setDoc, collection, getDocs, Timestamp } from 'firebase/firestore'
import { useNuxtApp } from '#app'
import { useAuth } from './useAuth'
import { useSubscription, type SubscriptionPlan } from './useSubscription'

/**
 * ระบบจัดการสิทธิ์การเข้าถึงฟีเจอร์ตามระดับ VIP
 */

// ประเภทฟีเจอร์ทั้งหมดในระบบ
export type FeatureId =
  | 'basic_prediction'      // พยากรณ์พื้นฐาน
  | 'advanced_prediction'   // พยากรณ์ขั้นสูง
  | 'ai_prediction'         // พยากรณ์ AI
  | 'check_prize'           // ตรวจรางวัล
  | 'lottery_formula'       // สูตรหวย
  | 'history_3_months'      // สถิติย้อนหลัง 3 เดือน
  | 'history_6_months'      // สถิติย้อนหลัง 6 เดือน
  | 'history_unlimited'     // สถิติย้อนหลังไม่จำกัด
  | 'dream_analysis'        // วิเคราะห์ฝันพื้นฐาน
  | 'dream_advanced'        // วิเคราะห์ฝันขั้นสูง
  | 'accuracy_tracking'     // ติดตามความแม่นยำ
  | 'accuracy_detailed'     // ติดตามความแม่นยำแบบละเอียด
  | 'save_numbers_limited'  // บันทึกเลขซื้อ (จำกัด 10 รายการ)
  | 'save_numbers_unlimited'// บันทึกเลขซื้อไม่จำกัด
  | 'no_ads'                // ไม่มีโฆษณา
  | 'notifications'         // รับแจ้งเตือนพิเศษ
  | 'expert_consultation'   // ปรึกษาผู้เชี่ยวชาญ
  | 'two_digit_advanced'    // เลข 2 ตัวขั้นสูง
  | 'three_digit_advanced'  // เลข 3 ตัวขั้นสูง
  | 'statistics_advanced'   // สถิติขั้นสูง
  | 'multiple_lotteries'    // วิเคราะห์หวยหลายประเภท
  | 'export_data'           // ส่งออกข้อมูล

// ข้อมูลฟีเจอร์
export interface Feature {
  id: FeatureId
  name: string
  description: string
  category: 'prediction' | 'analysis' | 'storage' | 'premium'
  icon: string
}

// การตั้งค่าสิทธิ์สำหรับแต่ละ plan
export interface PlanFeatures {
  plan: SubscriptionPlan
  features: FeatureId[]
  updatedAt: Date
  updatedBy: string
}

// ฟีเจอร์ทั้งหมดในระบบ
export const ALL_FEATURES: Feature[] = [
  // Prediction
  { id: 'basic_prediction', name: 'พยากรณ์พื้นฐาน', description: 'เห็นการพยากรณ์เบื้องต้น', category: 'prediction', icon: '🔮' },
  { id: 'advanced_prediction', name: 'พยากรณ์ขั้นสูง', description: 'เห็นการพยากรณ์ด้วยอัลกอริธึมขั้นสูง', category: 'prediction', icon: '✨' },
  { id: 'ai_prediction', name: 'พยากรณ์ AI', description: 'พยากรณ์ด้วย AI ที่แม่นยำที่สุด', category: 'prediction', icon: '🤖' },
  { id: 'check_prize', name: 'ตรวจรางวัล', description: 'ตรวจสอบผลรางวัลหวย', category: 'prediction', icon: '🎯' },
  { id: 'lottery_formula', name: 'สูตรหวย', description: 'คำนวณเลขหวยด้วยสูตรต่างๆ (สถิติ, เลขคงที่, ความน่าจะเป็น, เลขกำลังวัน)', category: 'prediction', icon: '🧪' },
  { id: 'two_digit_advanced', name: 'เลข 2 ตัวขั้นสูง', description: 'วิเคราะห์เลข 2 ตัวแบบละเอียด', category: 'prediction', icon: '🎲' },
  { id: 'three_digit_advanced', name: 'เลข 3 ตัวขั้นสูง', description: 'วิเคราะห์เลข 3 ตัวแบบละเอียด', category: 'prediction', icon: '🔢' },

  // Analysis
  { id: 'history_3_months', name: 'สถิติย้อนหลัง 3 เดือน', description: 'ดูข้อมูลย้อนหลัง 3 เดือน', category: 'analysis', icon: '📊' },
  { id: 'history_6_months', name: 'สถิติย้อนหลัง 6 เดือน', description: 'ดูข้อมูลย้อนหลัง 6 เดือน', category: 'analysis', icon: '📈' },
  { id: 'history_unlimited', name: 'สถิติย้อนหลังไม่จำกัด', description: 'ดูข้อมูลย้อนหลังทั้งหมด', category: 'analysis', icon: '📉' },
  { id: 'dream_analysis', name: 'วิเคราะห์ฝันพื้นฐาน', description: 'แปลความหมายฝันเป็นตัวเลข', category: 'analysis', icon: '💭' },
  { id: 'dream_advanced', name: 'วิเคราะห์ฝันขั้นสูง', description: 'วิเคราะห์ฝันแบบละเอียดลึกซึ้ง', category: 'analysis', icon: '🌙' },
  { id: 'statistics_advanced', name: 'สถิติขั้นสูง', description: 'กราฟและสถิติขั้นสูง', category: 'analysis', icon: '📊' },
  { id: 'multiple_lotteries', name: 'วิเคราะห์หวยหลายประเภท', description: 'วิเคราะห์หวยทุกประเภท', category: 'analysis', icon: '🎰' },

  // Storage & Tracking
  { id: 'accuracy_tracking', name: 'ติดตามความแม่นยำ', description: 'บันทึกและติดตามผลการทำนาย', category: 'storage', icon: '📝' },
  { id: 'accuracy_detailed', name: 'ติดตามความแม่นยำแบบละเอียด', description: 'วิเคราะห์ความแม่นยำแบบเจาะลึก', category: 'storage', icon: '📋' },
  { id: 'save_numbers_limited', name: 'บันทึกเลขซื้อ (จำกัด)', description: 'บันทึกเลขซื้อได้ 10 รายการ', category: 'storage', icon: '💾' },
  { id: 'save_numbers_unlimited', name: 'บันทึกเลขซื้อไม่จำกัด', description: 'บันทึกเลขซื้อได้ไม่จำกัด', category: 'storage', icon: '💿' },
  { id: 'export_data', name: 'ส่งออกข้อมูล', description: 'ส่งออกข้อมูลเป็น CSV/Excel', category: 'storage', icon: '📤' },

  // Premium
  { id: 'no_ads', name: 'ไม่มีโฆษณา', description: 'ใช้งานโดยไม่มีโฆษณารบกวน', category: 'premium', icon: '🚫' },
  { id: 'notifications', name: 'แจ้งเตือนพิเศษ', description: 'รับการแจ้งเตือนก่อนใคร', category: 'premium', icon: '🔔' },
  { id: 'expert_consultation', name: 'ปรึกษาผู้เชี่ยวชาญ', description: 'ปรึกษาทีมผู้เชี่ยวชาญ', category: 'premium', icon: '👨‍💼' }
]

// การตั้งค่าเริ่มต้นสำหรับแต่ละ plan
export const DEFAULT_PLAN_FEATURES: Record<SubscriptionPlan, FeatureId[]> = {
  free: [
    'basic_prediction',
    'check_prize',
    'save_numbers_limited'
  ],
  basic: [
    'basic_prediction',
    'advanced_prediction',
    'check_prize',
    'lottery_formula',
    'history_3_months',
    'dream_analysis',
    'save_numbers_limited',
    'no_ads'
  ],
  pro: [
    'basic_prediction',
    'advanced_prediction',
    'check_prize',
    'lottery_formula',
    'history_6_months',
    'dream_analysis',
    'accuracy_tracking',
    'two_digit_advanced',
    'three_digit_advanced',
    'save_numbers_unlimited',
    'multiple_lotteries',
    'no_ads'
  ],
  premium: [
    'basic_prediction',
    'advanced_prediction',
    'ai_prediction',
    'check_prize',
    'lottery_formula',
    'history_unlimited',
    'dream_analysis',
    'dream_advanced',
    'accuracy_tracking',
    'accuracy_detailed',
    'two_digit_advanced',
    'three_digit_advanced',
    'statistics_advanced',
    'multiple_lotteries',
    'save_numbers_unlimited',
    'export_data',
    'no_ads',
    'notifications',
    'expert_consultation'
  ]
}

export const useFeatureAccess = () => {
  const nuxtApp = useNuxtApp()
  const db = nuxtApp.$db
  const { user, waitForAuth } = useAuth()
  const { currentPlan, subscription } = useSubscription()

  const planFeatures = ref<Record<SubscriptionPlan, FeatureId[]>>({
    free: [...DEFAULT_PLAN_FEATURES.free],
    basic: [...DEFAULT_PLAN_FEATURES.basic],
    pro: [...DEFAULT_PLAN_FEATURES.pro],
    premium: [...DEFAULT_PLAN_FEATURES.premium]
  })

  const loading = ref(false)
  const error = ref<string | null>(null)

  // ดึงการตั้งค่าสิทธิ์จาก Firestore
  const fetchFeatureAccess = async () => {
    try {
      loading.value = true
      error.value = null

      // ลองอ่านจาก localStorage ก่อน
      const localData = localStorage.getItem('feature_access_settings')
      if (localData) {
        const parsed = JSON.parse(localData)
        planFeatures.value = parsed
        loading.value = false

        // ✅ ไม่เรียก Firestore เพื่อป้องกันการ overwrite localStorage
        // (จะเรียกก็ต่อเมื่อ Firestore rules ถูก deploy แล้ว)
        return
      }

      // ถ้าไม่มีใน localStorage ให้ใช้ค่าเริ่มต้น
      planFeatures.value = { ...DEFAULT_PLAN_FEATURES }
      localStorage.setItem('feature_access_settings', JSON.stringify(DEFAULT_PLAN_FEATURES))
    } catch (err: any) {
      error.value = err.message
      console.error('Error fetching feature access:', err)
      // ใช้ค่าเริ่มต้นถ้า error
      planFeatures.value = { ...DEFAULT_PLAN_FEATURES }
    } finally {
      loading.value = false
    }
  }

  // ฟังก์ชันโหลดจาก Firestore
  const fetchFromFirestore = async () => {
    try {
      const docRef = doc(db, 'settings', 'featureAccess')
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const data = docSnap.data()
        const newData = {
          free: data.free || DEFAULT_PLAN_FEATURES.free,
          basic: data.basic || DEFAULT_PLAN_FEATURES.basic,
          pro: data.pro || DEFAULT_PLAN_FEATURES.pro,
          premium: data.premium || DEFAULT_PLAN_FEATURES.premium
        }
        planFeatures.value = newData

        // บันทึกลง localStorage
        localStorage.setItem('feature_access_settings', JSON.stringify(newData))
      } else {
        // ถ้ายังไม่มีข้อมูล ใช้ค่าเริ่มต้น
        planFeatures.value = { ...DEFAULT_PLAN_FEATURES }
        localStorage.setItem('feature_access_settings', JSON.stringify(DEFAULT_PLAN_FEATURES))
      }
    } catch (err: any) {
      console.warn('Cannot fetch from Firestore, using default:', err.message)
      // ใช้ค่าเริ่มต้นถ้า error
      planFeatures.value = { ...DEFAULT_PLAN_FEATURES }
      localStorage.setItem('feature_access_settings', JSON.stringify(DEFAULT_PLAN_FEATURES))
    }
  }

  // บันทึกการตั้งค่าสิทธิ์
  const saveFeatureAccess = async () => {
    try {
      loading.value = true
      error.value = null

      // บันทึกลง localStorage ก่อน (ทำงานได้เสมอ)
      localStorage.setItem('feature_access_settings', JSON.stringify(planFeatures.value))

      // พยายามบันทึกลง Firestore
      try {
        await waitForAuth()
        if (!user.value) {
          console.warn('User not authenticated, saved to localStorage only')
          return true
        }

        const docRef = doc(db, 'settings', 'featureAccess')
        await setDoc(docRef, {
          ...planFeatures.value,
          updatedAt: Timestamp.fromDate(new Date()),
          updatedBy: user.value.email
        })

        console.log('Saved to both localStorage and Firestore')
      } catch (firestoreErr: any) {
        console.warn('Cannot save to Firestore, saved to localStorage only:', firestoreErr.message)
        // ไม่ throw error เพราะบันทึกลง localStorage สำเร็จแล้ว
      }

      return true
    } catch (err: any) {
      error.value = err.message
      console.error('Error saving feature access:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  // รีเซ็ตเป็นค่าเริ่มต้น
  const resetToDefault = () => {
    planFeatures.value = { ...DEFAULT_PLAN_FEATURES }
  }

  // เช็คว่า plan นี้มีสิทธิ์ใช้ฟีเจอร์นี้ไหม
  const hasFeatureAccess = (plan: SubscriptionPlan, featureId: FeatureId): boolean => {
    return planFeatures.value[plan]?.includes(featureId) || false
  }

  // เช็คว่าผู้ใช้ปัจจุบันมีสิทธิ์ใช้ฟีเจอร์นี้ไหม
  const canAccessFeature = (featureId: FeatureId): boolean => {
    if (!subscription.value || subscription.value.status !== 'active') {
      return hasFeatureAccess('free', featureId)
    }

    const plan = subscription.value.plan
    return hasFeatureAccess(plan, featureId)
  }

  // Toggle ฟีเจอร์สำหรับ plan
  const toggleFeature = (plan: SubscriptionPlan, featureId: FeatureId) => {
    const features = planFeatures.value[plan]
    const index = features.indexOf(featureId)

    if (index > -1) {
      // ถ้ามีอยู่แล้ว ให้ลบออก
      planFeatures.value[plan] = features.filter(f => f !== featureId)
    } else {
      // ถ้ายังไม่มี ให้เพิ่มเข้าไป
      planFeatures.value[plan] = [...features, featureId]
    }
  }

  // เพิ่มฟีเจอร์ให้ทุก plan
  const enableFeatureForAll = (featureId: FeatureId) => {
    ;(['free', 'basic', 'pro', 'premium'] as SubscriptionPlan[]).forEach(plan => {
      if (!planFeatures.value[plan].includes(featureId)) {
        planFeatures.value[plan].push(featureId)
      }
    })
  }

  // ลบฟีเจอร์จากทุก plan
  const disableFeatureForAll = (featureId: FeatureId) => {
    ;(['free', 'basic', 'pro', 'premium'] as SubscriptionPlan[]).forEach(plan => {
      planFeatures.value[plan] = planFeatures.value[plan].filter(f => f !== featureId)
    })
  }

  // จำนวนฟีเจอร์แต่ละ plan
  const getFeatureCount = computed(() => ({
    free: planFeatures.value.free.length,
    basic: planFeatures.value.basic.length,
    pro: planFeatures.value.pro.length,
    premium: planFeatures.value.premium.length
  }))

  // จัดกลุ่มฟีเจอร์ตาม category
  const featuresByCategory = computed(() => {
    const grouped: Record<string, Feature[]> = {
      prediction: [],
      analysis: [],
      storage: [],
      premium: []
    }

    ALL_FEATURES.forEach(feature => {
      grouped[feature.category].push(feature)
    })

    return grouped
  })

  return {
    planFeatures,
    loading,
    error,
    ALL_FEATURES,
    featuresByCategory,
    getFeatureCount,
    fetchFeatureAccess,
    saveFeatureAccess,
    resetToDefault,
    hasFeatureAccess,
    canAccessFeature,
    toggleFeature,
    enableFeatureForAll,
    disableFeatureForAll
  }
}
