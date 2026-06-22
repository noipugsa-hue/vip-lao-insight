/**
 * useFavoriteNumbers
 * Composable สำหรับจัดการเลขโปรด, lottery types โปรด และเปรียบเทียบผลรางวัล
 */

import { ref, computed } from 'vue'
import type { LotteryType } from './useLotteryType'
import { useLotteryHistory } from './useLotteryHistory'

interface FavoriteNumber {
  id: string
  number: string // เลขโปรด (2-6 หลัก)
  label?: string // ป้ายกำกับ เช่น "เลขวันเกิด", "เลขนาม"
  lotteryTypes: string[] // lottery type ids ที่ใช้เลขนี้
  addedAt: string
  lastCheckedAt?: string
}

interface PinnedLotteryType {
  id: string
  pinnedAt: string
}

interface ComparisonResult {
  number: string
  lotteryType: string
  date: string
  matchType: 'exact' | '2digit' | '3digit' | 'none'
  prizeCategory?: string
  amount?: number
}

const STORAGE_KEY_FAVORITES = 'favorite_numbers'
const STORAGE_KEY_PINNED = 'pinned_lottery_types'

export const useFavoriteNumbers = () => {
  const favoriteNumbers = ref<FavoriteNumber[]>([])
  const pinnedLotteryTypes = ref<PinnedLotteryType[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // โหลดข้อมูลจาก localStorage
  const loadData = () => {
    if (!import.meta.client) return

    try {
      // Load favorite numbers
      const savedFavorites = localStorage.getItem(STORAGE_KEY_FAVORITES)
      if (savedFavorites) {
        favoriteNumbers.value = JSON.parse(savedFavorites)
      }

      // Load pinned lottery types
      const savedPinned = localStorage.getItem(STORAGE_KEY_PINNED)
      if (savedPinned) {
        pinnedLotteryTypes.value = JSON.parse(savedPinned)
      }
    } catch (err) {
      console.error('Error loading favorite data:', err)
      error.value = 'ไม่สามารถโหลดข้อมูลได้'
    }
  }

  // บันทึกข้อมูลลง localStorage
  const saveData = () => {
    if (!import.meta.client) return

    try {
      localStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(favoriteNumbers.value))
      localStorage.setItem(STORAGE_KEY_PINNED, JSON.stringify(pinnedLotteryTypes.value))
    } catch (err) {
      console.error('Error saving favorite data:', err)
      error.value = 'ไม่สามารถบันทึกข้อมูลได้'
    }
  }

  // เพิ่มเลขโปรด
  const addFavoriteNumber = (number: string, label?: string, lotteryTypes: string[] = []) => {
    // Validate number
    if (!/^\d{2,6}$/.test(number)) {
      error.value = 'กรุณากรอกเลข 2-6 หลัก'
      return false
    }

    // ตรวจสอบเลขซ้ำ
    const exists = favoriteNumbers.value.find(fav => fav.number === number)
    if (exists) {
      error.value = 'เลขนี้มีในรายการโปรดแล้ว'
      return false
    }

    const newFavorite: FavoriteNumber = {
      id: `fav_${Date.now()}`,
      number,
      label,
      lotteryTypes,
      addedAt: new Date().toISOString(),
    }

    favoriteNumbers.value.push(newFavorite)
    saveData()
    error.value = null
    return true
  }

  // ลบเลขโปรด
  const removeFavoriteNumber = (id: string) => {
    const index = favoriteNumbers.value.findIndex(fav => fav.id === id)
    if (index !== -1) {
      favoriteNumbers.value.splice(index, 1)
      saveData()
      return true
    }
    return false
  }

  // อัพเดทเลขโปรด
  const updateFavoriteNumber = (id: string, updates: Partial<FavoriteNumber>) => {
    const favorite = favoriteNumbers.value.find(fav => fav.id === id)
    if (favorite) {
      Object.assign(favorite, updates)
      saveData()
      return true
    }
    return false
  }

  // ปักหมุด lottery type
  const pinLotteryType = (lotteryTypeId: string) => {
    const exists = pinnedLotteryTypes.value.find(p => p.id === lotteryTypeId)
    if (exists) {
      error.value = 'lottery type นี้ปักหมุดอยู่แล้ว'
      return false
    }

    pinnedLotteryTypes.value.push({
      id: lotteryTypeId,
      pinnedAt: new Date().toISOString(),
    })
    saveData()
    error.value = null
    return true
  }

  // เอาหมุดออก
  const unpinLotteryType = (lotteryTypeId: string) => {
    const index = pinnedLotteryTypes.value.findIndex(p => p.id === lotteryTypeId)
    if (index !== -1) {
      pinnedLotteryTypes.value.splice(index, 1)
      saveData()
      return true
    }
    return false
  }

  // ตรวจสอบว่า lottery type ปักหมุดอยู่หรือไม่
  const isPinned = (lotteryTypeId: string) => {
    return pinnedLotteryTypes.value.some(p => p.id === lotteryTypeId)
  }

  // เปรียบเทียบเลขโปรดกับผลรางวัลล่าสุด
  const compareWithLatestResults = async (lotteryTypeId: string): Promise<ComparisonResult[]> => {
    isLoading.value = true
    error.value = null

    try {
      // Filter favorites for this lottery type
      const relevantFavorites = favoriteNumbers.value.filter(
        fav => fav.lotteryTypes.length === 0 || fav.lotteryTypes.includes(lotteryTypeId)
      )

      if (relevantFavorites.length === 0) {
        return []
      }

      // Get latest result from localStorage history
      const historyKey = `vip_lao_history_${lotteryTypeId}`
      const savedHistory = localStorage.getItem(historyKey)

      if (!savedHistory) {
        error.value = 'ไม่พบประวัติผลหวย กรุณาดึงข้อมูลก่อน'
        return []
      }

      const history: string[] = JSON.parse(savedHistory)
      if (history.length === 0) {
        error.value = 'ไม่มีผลหวยในประวัติ'
        return []
      }

      const latestResult = history[0] // เลขล่าสุด

      // Compare each favorite with latest result
      const results: ComparisonResult[] = relevantFavorites.map(fav => {
        const result: ComparisonResult = {
          number: fav.number,
          lotteryType: lotteryTypeId,
          date: new Date().toISOString(),
          matchType: 'none',
        }

        // Check exact match
        if (fav.number === latestResult) {
          result.matchType = 'exact'
          result.prizeCategory = 'รางวัลที่ 1'
        }
        // Check 3-digit match (last 3 digits)
        else if (fav.number.length === 3 && latestResult.endsWith(fav.number)) {
          result.matchType = '3digit'
          result.prizeCategory = '3 ตัวท้าย'
        }
        // Check 2-digit match (last 2 digits)
        else if (fav.number.length === 2 && latestResult.endsWith(fav.number)) {
          result.matchType = '2digit'
          result.prizeCategory = '2 ตัวท้าย'
        }

        return result
      })

      // Update last checked time
      relevantFavorites.forEach(fav => {
        updateFavoriteNumber(fav.id, { lastCheckedAt: new Date().toISOString() })
      })

      isLoading.value = false
      return results.filter(r => r.matchType !== 'none') // Return only matches
    } catch (err) {
      console.error('Error comparing with results:', err)
      error.value = 'เกิดข้อผิดพลาดในการเปรียบเทียบผล'
      isLoading.value = false
      return []
    }
  }

  // Quick check: ตรวจสอบเลขทั้งหมดกับทุก lottery type ที่ปักหมุด
  const quickCheckAllPinned = async (): Promise<ComparisonResult[]> => {
    if (pinnedLotteryTypes.value.length === 0) {
      error.value = 'ไม่มี lottery type ที่ปักหมุด'
      return []
    }

    const allResults: ComparisonResult[] = []

    for (const pinned of pinnedLotteryTypes.value) {
      const results = await compareWithLatestResults(pinned.id)
      allResults.push(...results)
    }

    return allResults
  }

  // Computed: เลขโปรดที่เรียงตามวันที่เพิ่ม (ใหม่สุดก่อน)
  const sortedFavorites = computed(() => {
    return [...favoriteNumbers.value].sort((a, b) => {
      return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
    })
  })

  // Computed: lottery types ที่ปักหมุดเรียงตามวันที่ปัก (ใหม่สุดก่อน)
  const sortedPinned = computed(() => {
    return [...pinnedLotteryTypes.value].sort((a, b) => {
      return new Date(b.pinnedAt).getTime() - new Date(a.pinnedAt).getTime()
    })
  })

  // Computed: จำนวนเลขโปรด
  const favoriteCount = computed(() => favoriteNumbers.value.length)

  // Computed: จำนวน lottery types ที่ปักหมุด
  const pinnedCount = computed(() => pinnedLotteryTypes.value.length)

  // Load data on init
  loadData()

  return {
    // State
    favoriteNumbers,
    pinnedLotteryTypes,
    isLoading,
    error,

    // Computed
    sortedFavorites,
    sortedPinned,
    favoriteCount,
    pinnedCount,

    // Methods - Favorite Numbers
    addFavoriteNumber,
    removeFavoriteNumber,
    updateFavoriteNumber,

    // Methods - Pinned Lottery Types
    pinLotteryType,
    unpinLotteryType,
    isPinned,

    // Methods - Comparison
    compareWithLatestResults,
    quickCheckAllPinned,

    // Utilities
    loadData,
    saveData,
  }
}
