/**
 * useBalance
 * Composable สำหรับจัดการยอดเงินคงเหลือจาก racha-lotto.net
 */

import { ref } from 'vue'

export interface BalanceData {
  balance: string
  username: string
  fetchedAt: string
  source: string
}

export const useBalance = () => {
  const isFetching = ref(false)
  const error = ref<string | null>(null)
  const balanceData = ref<BalanceData | null>(null)

  /**
   * ดึงยอดเงินจาก racha-lotto.net
   * @param username - Username สำหรับเข้าสู่ระบบ (optional)
   * @param password - Password สำหรับเข้าสู่ระบบ (optional)
   * @param useMock - ใช้ข้อมูลจำลองแทน (optional)
   * @returns BalanceData หรือ null ถ้าเกิดข้อผิดพลาด
   */
  const fetchBalance = async (
    username?: string,
    password?: string,
    useMock: boolean = false
  ): Promise<BalanceData | null> => {
    try {
      isFetching.value = true
      error.value = null

      // สร้าง query parameters
      const params = new URLSearchParams()
      if (username) params.append('username', username)
      if (password) params.append('password', password)
      if (useMock) params.append('mock', 'true')

      const queryString = params.toString() ? `?${params.toString()}` : ''

      // เรียก API endpoint
      const response = await fetch(`/api/balance/fetch${queryString}`)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || 'ไม่สามารถดึงยอดเงินได้')
      }

      // ถ้ามี warning แสดงใน error (แต่ไม่ throw error)
      if (data.warning) {
        error.value = data.warning
      }

      // เก็บข้อมูล
      balanceData.value = data.data

      // บันทึกลง localStorage (cache)
      localStorage.setItem('cached_balance', JSON.stringify({
        data: data.data,
        timestamp: Date.now(),
        warning: data.warning
      }))

      return data.data

    } catch (e: any) {
      error.value = e.message || 'เกิดข้อผิดพลาดในการดึงยอดเงิน'
      console.error('Error fetching balance:', e)
      return null
    } finally {
      isFetching.value = false
    }
  }

  /**
   * ดึงยอดเงินจาก cache (localStorage)
   * @param maxAge - อายุของ cache สูงสุดในหน่วยมิลลิวินาที (default: 5 นาที)
   * @returns BalanceData หรือ null ถ้าไม่มี cache หรือ cache หมดอายุ
   */
  const getCachedBalance = (maxAge: number = 5 * 60 * 1000): BalanceData | null => {
    try {
      const cached = localStorage.getItem('cached_balance')
      if (!cached) return null

      const { data, timestamp } = JSON.parse(cached)

      // ตรวจสอบว่า cache หมดอายุหรือไม่
      if (Date.now() - timestamp > maxAge) {
        localStorage.removeItem('cached_balance')
        return null
      }

      balanceData.value = data
      return data

    } catch (e) {
      console.error('Error reading cached balance:', e)
      return null
    }
  }

  /**
   * ล้าง cache
   */
  const clearCache = () => {
    localStorage.removeItem('cached_balance')
    balanceData.value = null
  }

  /**
   * Format ยอดเงินให้อ่านง่าย
   * @param balance - ยอดเงิน
   * @returns ยอดเงินที่ format แล้ว (เช่น "1,234.56")
   */
  const formatBalance = (balance: string): string => {
    try {
      const num = parseFloat(balance)
      if (isNaN(num)) return balance

      return num.toLocaleString('th-TH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    } catch (e) {
      return balance
    }
  }

  /**
   * Auto-refresh balance every N minutes
   * @param intervalMinutes - ช่วงเวลาในการ refresh (นาที)
   * @param username - Username (optional)
   * @param password - Password (optional)
   * @returns Function สำหรับหยุด auto-refresh
   */
  const startAutoRefresh = (
    intervalMinutes: number = 5,
    username?: string,
    password?: string
  ): (() => void) => {
    // Fetch ครั้งแรก
    fetchBalance(username, password)

    // ตั้ง interval
    const intervalId = setInterval(() => {
      fetchBalance(username, password)
    }, intervalMinutes * 60 * 1000)

    // Return function สำหรับหยุด
    return () => {
      clearInterval(intervalId)
    }
  }

  return {
    isFetching,
    error,
    balanceData,
    fetchBalance,
    getCachedBalance,
    clearCache,
    formatBalance,
    startAutoRefresh
  }
}
