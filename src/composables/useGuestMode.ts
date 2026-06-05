/**
 * Guest Mode Composable
 * ใช้สำหรับตรวจสอบว่า user เป็น guest (ยังไม่ login) หรือไม่
 */

import { computed } from 'vue'
import { useAuth } from './useAuth'

export const useGuestMode = () => {
  const { user, isAuthReady } = useAuth()

  // ตรวจสอบว่าเป็น guest หรือไม่
  const isGuest = computed(() => {
    return isAuthReady.value && !user.value
  })

  // ตรวจสอบว่า user login แล้วหรือยัง
  const isLoggedIn = computed(() => {
    return isAuthReady.value && !!user.value
  })

  // Features ที่ guest เข้าถึงได้
  const guestFeatures = {
    viewDemoPredictions: true, // ดู demo predictions
    viewStatistics: true, // ดูสถิติพื้นฐาน
    viewReviews: true, // ดูรีวิว
    viewLotteryHistory: true, // ดูผลหวยล่าสุด
    calculateNumbers: false, // คำนวณเลขเอง - ต้อง login
    saveNumbers: false, // บันทึกเลข - ต้อง login
    checkPrize: false, // ตรวจรางวัล - ต้อง login
    advancedFormulas: false, // สูตรขั้นสูง - ต้อง login
  }

  // ฟังก์ชันตรวจสอบว่า guest สามารถใช้ feature นี้ได้หรือไม่
  const canUseFeature = (featureName: keyof typeof guestFeatures) => {
    if (isLoggedIn.value) return true // logged-in users มีสิทธิ์ทุกอย่าง
    return guestFeatures[featureName]
  }

  return {
    isGuest,
    isLoggedIn,
    guestFeatures,
    canUseFeature,
  }
}
