import { computed } from 'vue'
import { useAuth } from './useAuth'

// กำหนด email ของ admin (แก้ไขตรงนี้)
const ADMIN_EMAILS = [
  'noipugsa@gmail.com', // เพิ่ม admin emails ตรงนี้
]

export const useAdmin = () => {
  const { user } = useAuth()

  // เช็คว่าเป็น admin หรือไม่
  const isAdmin = computed(() => {
    if (!user.value || !user.value.email) return false
    return ADMIN_EMAILS.includes(user.value.email.toLowerCase())
  })

  return {
    isAdmin
  }
}
