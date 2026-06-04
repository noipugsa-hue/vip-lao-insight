import { ref, computed } from 'vue'
import type { Ref } from 'vue'
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
  Timestamp,
  limit,
  where,
} from 'firebase/firestore'
import { useAuth } from './useAuth'

export interface WinningNumber {
  id: string
  drawDate: Date // วันที่ออกรางวัล
  period: string // งวดที่ (เช่น "16/05/2567")
  lotteryType: string // ประเภทหวย (government, hanoi-vip, etc.)
  winningNumbers: {
    hotNumbers?: string[] // เลขเด่นที่ถูก
    twoDigits?: string[] // เลข 2 ตัวที่ถูก
    threeDigits?: string[] // เลข 3 ตัวที่ถูก
  }
  prizes: {
    type: string // ประเภทรางวัล (เลขเด่น, 2ตัวบน, 3ตัวบน, etc.)
    amount: number // จำนวนเงินที่ถูก
  }[]
  proofImageUrl?: string // URL รูปภาพหลักฐาน
  note?: string // หมายเหตุเพิ่มเติม
  verifiedBy: string // ชื่อ admin ที่ยืนยัน
  createdAt: Date
  updatedAt: Date
}

export interface WinningNumberData {
  drawDate: Timestamp
  period: string
  lotteryType: string
  winningNumbers: {
    hotNumbers?: string[]
    twoDigits?: string[]
    threeDigits?: string[]
  }
  prizes: {
    type: string
    amount: number
  }[]
  proofImageUrl?: string
  note?: string
  verifiedBy: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export function useWinningNumbers() {
  const { $db } = useNuxtApp()
  const { user } = useAuth()

  const winningNumbers: Ref<WinningNumber[]> = ref([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Computed: รวมจำนวนเลขที่ถูกทั้งหมด
  const totalWinnings = computed(() => winningNumbers.value.length)

  // Computed: รวมเงินรางวัลทั้งหมด
  const totalPrizeAmount = computed(() => {
    return winningNumbers.value.reduce((sum, record) => {
      const recordTotal = record.prizes.reduce((recordSum, prize) => recordSum + prize.amount, 0)
      return sum + recordTotal
    }, 0)
  })

  /**
   * เพิ่มเลขที่ถูกรางวัล (Admin only)
   */
  async function addWinningNumber(data: {
    drawDate: Date
    period: string
    lotteryType: string
    winningNumbers: {
      hotNumbers?: string[]
      twoDigits?: string[]
      threeDigits?: string[]
    }
    prizes: {
      type: string
      amount: number
    }[]
    proofImageUrl?: string
    note?: string
  }): Promise<boolean> {
    if (!user.value) {
      error.value = 'กรุณาเข้าสู่ระบบก่อน'
      return false
    }

    try {
      loading.value = true
      error.value = null

      const winningData: WinningNumberData = {
        drawDate: Timestamp.fromDate(data.drawDate),
        period: data.period,
        lotteryType: data.lotteryType,
        winningNumbers: data.winningNumbers,
        prizes: data.prizes,
        proofImageUrl: data.proofImageUrl,
        note: data.note,
        verifiedBy: user.value.email || 'Unknown',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      }

      await addDoc(collection($db, 'winningNumbers'), winningData)
      await getWinningNumbers() // Refresh list

      return true
    } catch (err: any) {
      console.error('Error adding winning number:', err)
      error.value = `เกิดข้อผิดพลาด: ${err.message}`
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * อัพเดตเลขที่ถูกรางวัล (Admin only)
   */
  async function updateWinningNumber(
    id: string,
    data: {
      drawDate: Date
      period: string
      lotteryType: string
      winningNumbers: {
        hotNumbers?: string[]
        twoDigits?: string[]
        threeDigits?: string[]
      }
      prizes: {
        type: string
        amount: number
      }[]
      proofImageUrl?: string
      note?: string
    }
  ): Promise<boolean> {
    if (!user.value) {
      error.value = 'กรุณาเข้าสู่ระบบก่อน'
      return false
    }

    try {
      loading.value = true
      error.value = null

      const winningRef = doc($db, 'winningNumbers', id)
      await updateDoc(winningRef, {
        drawDate: Timestamp.fromDate(data.drawDate),
        period: data.period,
        lotteryType: data.lotteryType,
        winningNumbers: data.winningNumbers,
        prizes: data.prizes,
        proofImageUrl: data.proofImageUrl,
        note: data.note,
        updatedAt: Timestamp.now(),
      })

      await getWinningNumbers() // Refresh list

      return true
    } catch (err: any) {
      console.error('Error updating winning number:', err)
      error.value = `เกิดข้อผิดพลาด: ${err.message}`
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * ลบเลขที่ถูกรางวัล (Admin only)
   */
  async function deleteWinningNumber(id: string): Promise<boolean> {
    if (!user.value) {
      error.value = 'กรุณาเข้าสู่ระบบก่อน'
      return false
    }

    try {
      loading.value = true
      error.value = null

      const winningRef = doc($db, 'winningNumbers', id)
      await deleteDoc(winningRef)

      await getWinningNumbers() // Refresh list

      return true
    } catch (err: any) {
      console.error('Error deleting winning number:', err)
      error.value = `เกิดข้อผิดพลาด: ${err.message}`
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * ดึงเลขที่ถูกรางวัลทั้งหมด
   */
  async function getWinningNumbers(limitCount: number = 50): Promise<WinningNumber[]> {
    try {
      loading.value = true
      error.value = null

      const q = query(
        collection($db, 'winningNumbers'),
        orderBy('drawDate', 'desc'),
        limit(limitCount)
      )

      const querySnapshot = await getDocs(q)
      const fetchedWinnings: WinningNumber[] = []

      querySnapshot.forEach((doc) => {
        const data = doc.data() as WinningNumberData
        fetchedWinnings.push({
          id: doc.id,
          drawDate: data.drawDate.toDate(),
          period: data.period,
          lotteryType: data.lotteryType,
          winningNumbers: data.winningNumbers,
          prizes: data.prizes,
          proofImageUrl: data.proofImageUrl,
          note: data.note,
          verifiedBy: data.verifiedBy,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        })
      })

      winningNumbers.value = fetchedWinnings
      return fetchedWinnings
    } catch (err: any) {
      console.error('Error getting winning numbers:', err)
      error.value = 'เกิดข้อผิดพลาดในการโหลดข้อมูล'
      return []
    } finally {
      loading.value = false
    }
  }

  /**
   * ดึงเลขที่ถูกรางวัลตามประเภทหวย
   */
  async function getWinningNumbersByLottery(
    lotteryType: string,
    limitCount: number = 20
  ): Promise<WinningNumber[]> {
    try {
      loading.value = true
      error.value = null

      const q = query(
        collection($db, 'winningNumbers'),
        where('lotteryType', '==', lotteryType),
        orderBy('drawDate', 'desc'),
        limit(limitCount)
      )

      const querySnapshot = await getDocs(q)
      const fetchedWinnings: WinningNumber[] = []

      querySnapshot.forEach((doc) => {
        const data = doc.data() as WinningNumberData
        fetchedWinnings.push({
          id: doc.id,
          drawDate: data.drawDate.toDate(),
          period: data.period,
          lotteryType: data.lotteryType,
          winningNumbers: data.winningNumbers,
          prizes: data.prizes,
          proofImageUrl: data.proofImageUrl,
          note: data.note,
          verifiedBy: data.verifiedBy,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        })
      })

      return fetchedWinnings
    } catch (err: any) {
      console.error('Error getting winning numbers by lottery:', err)
      error.value = 'เกิดข้อผิดพลาดในการโหลดข้อมูล'
      return []
    } finally {
      loading.value = false
    }
  }

  return {
    winningNumbers,
    loading,
    error,
    totalWinnings,
    totalPrizeAmount,
    addWinningNumber,
    updateWinningNumber,
    deleteWinningNumber,
    getWinningNumbers,
    getWinningNumbersByLottery,
  }
}
