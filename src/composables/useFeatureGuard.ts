import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useFeatureAccess, type FeatureId } from './useFeatureAccess'
import { useSubscription } from './useSubscription'

/**
 * Helper composable สำหรับตรวจสอบสิทธิ์การเข้าถึงฟีเจอร์
 * ใช้ในหน้าต่างๆ เพื่อเช็คว่าผู้ใช้มีสิทธิ์เข้าถึงหรือไม่
 */

export const useFeatureGuard = () => {
  const router = useRouter()
  const { canAccessFeature } = useFeatureAccess()
  const { currentPlan, isVIP } = useSubscription()

  /**
   * เช็คว่าผู้ใช้มีสิทธิ์เข้าถึงฟีเจอร์หรือไม่
   * @param featureId - ID ของฟีเจอร์ที่ต้องการเช็ค
   * @returns boolean
   */
  const hasAccess = (featureId: FeatureId): boolean => {
    return canAccessFeature(featureId)
  }

  /**
   * Guard สำหรับฟีเจอร์ - ถ้าไม่มีสิทธิ์จะ redirect ไปหน้า pricing
   * @param featureId - ID ของฟีเจอร์ที่ต้องการเช็ค
   * @param redirectPath - path ที่จะ redirect ไป (default: /pricing)
   */
  const requireFeature = async (
    featureId: FeatureId,
    redirectPath: string = '/pricing'
  ): Promise<boolean> => {
    const access = canAccessFeature(featureId)

    if (!access) {
      await router.push(redirectPath)
      return false
    }

    return true
  }

  /**
   * แสดง modal แจ้งเตือนว่าต้องอัพเกรด VIP
   * @param featureId - ID ของฟีเจอร์
   * @param featureName - ชื่อฟีเจอร์ที่จะแสดงในข้อความ
   */
  const showUpgradeModal = (featureId: FeatureId, featureName: string) => {
    const message = `ฟีเจอร์ "${featureName}" สำหรับสมาชิก VIP เท่านั้น\n\nต้องการอัพเกรดเป็น VIP หรือไม่?`

    if (confirm(message)) {
      router.push('/pricing')
    }
  }

  /**
   * เช็คว่าผู้ใช้เป็น VIP หรือไม่
   */
  const isVipUser = computed(() => isVIP.value)

  /**
   * Plan ปัจจุบันของผู้ใช้
   */
  const userPlan = computed(() => currentPlan.value)

  /**
   * ชื่อ Plan ในภาษาไทย
   */
  const planNameTH = computed(() => {
    const names: Record<string, string> = {
      free: 'ฟรี',
      basic: 'เบสิค',
      pro: 'โปร',
      premium: 'พรีเมียม'
    }
    return names[currentPlan.value] || 'ฟรี'
  })

  return {
    hasAccess,
    requireFeature,
    showUpgradeModal,
    isVipUser,
    userPlan,
    planNameTH
  }
}
