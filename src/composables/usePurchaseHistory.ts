/**
 * usePurchaseHistory
 * Composable สำหรับจัดการประวัติการซื้อหวย
 */

import { ref, computed } from 'vue'
import { collection, addDoc, getDocs, query, where, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore'
import type { PrizeResult } from './usePrizeChecker'

export interface PurchaseEntry {
  id?: string
  userId: string
  numbers: Array<{
    number: string
    type: '2digit' | '3digit' | '4digit'
    betAmount: number // จำนวนเงินที่ซื้อ (บาท)
  }>
  lotteryType: string // government, savings, baac, etc.
  purchaseDate: Date
  drawDate?: string // วันที่ออกผล
  period?: string // งวด
  isChecked: boolean // ตรวจรางวัลแล้วหรือยัง
  prizeResults?: PrizeResult[] // ผลการตรวจรางวัล
  totalPayout?: number // เงินรางวัลรวม
  profit?: number // กำไร/ขาดทุน (totalPayout - totalBet)
  notes?: string // หมายเหตุ
}

export interface PurchaseStats {
  totalEntries: number // จำนวนครั้งที่ซื้อ
  totalBet: number // เงินลงทุนรวม
  totalPayout: number // เงินรางวัลรวม
  profit: number // กำไร/ขาดทุนรวม
  winCount: number // จำนวนครั้งที่ถูก
  winRate: number // เปอร์เซ็นต์ชนะ
}

export const usePurchaseHistory = () => {
  const db = useNuxtApp().$db
  const purchases = ref<PurchaseEntry[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  /**
   * โหลดประวัติการซื้อทั้งหมด
   */
  const loadPurchases = async (userId: string, lotteryType?: string) => {
    try {
      isLoading.value = true
      error.value = null

      let q = query(
        collection(db, 'purchases'),
        where('userId', '==', userId),
        orderBy('purchaseDate', 'desc')
      )

      if (lotteryType) {
        q = query(
          collection(db, 'purchases'),
          where('userId', '==', userId),
          where('lotteryType', '==', lotteryType),
          orderBy('purchaseDate', 'desc')
        )
      }

      const snapshot = await getDocs(q)
      purchases.value = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        purchaseDate: doc.data().purchaseDate.toDate(),
      })) as PurchaseEntry[]
    } catch (e: any) {
      error.value = e.message
      console.error('Error loading purchases:', e)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * เพิ่มรายการซื้อใหม่
   */
  const addPurchase = async (purchase: Omit<PurchaseEntry, 'id'>) => {
    try {
      isLoading.value = true
      error.value = null

      const docRef = await addDoc(collection(db, 'purchases'), {
        ...purchase,
        purchaseDate: purchase.purchaseDate,
        isChecked: false,
      })

      // เพิ่มเข้า array ในหน้าปัจจุบัน
      purchases.value.unshift({
        id: docRef.id,
        ...purchase,
      })

      return docRef.id
    } catch (e: any) {
      error.value = e.message
      console.error('Error adding purchase:', e)
      throw e
    } finally {
      isLoading.value = false
    }
  }

  /**
   * อัปเดตผลการตรวจรางวัล
   */
  const updatePrizeResults = async (
    purchaseId: string,
    prizeResults: PrizeResult[],
    totalPayout: number
  ) => {
    try {
      isLoading.value = true
      error.value = null

      const purchaseRef = doc(db, 'purchases', purchaseId)

      // หา purchase ใน array
      const purchase = purchases.value.find((p) => p.id === purchaseId)
      if (!purchase) {
        throw new Error('Purchase not found')
      }

      // คำนวณเงินที่ซื้อรวม
      const totalBet = purchase.numbers.reduce((sum, n) => sum + n.betAmount, 0)
      const profit = totalPayout - totalBet

      await updateDoc(purchaseRef, {
        isChecked: true,
        prizeResults,
        totalPayout,
        profit,
      })

      // อัปเดตใน array
      const index = purchases.value.findIndex((p) => p.id === purchaseId)
      if (index !== -1) {
        purchases.value[index] = {
          ...purchases.value[index],
          isChecked: true,
          prizeResults,
          totalPayout,
          profit,
        }
      }
    } catch (e: any) {
      error.value = e.message
      console.error('Error updating prize results:', e)
      throw e
    } finally {
      isLoading.value = false
    }
  }

  /**
   * ลบรายการซื้อ
   */
  const deletePurchase = async (purchaseId: string) => {
    try {
      isLoading.value = true
      error.value = null

      await deleteDoc(doc(db, 'purchases', purchaseId))

      // ลบออกจาก array
      purchases.value = purchases.value.filter((p) => p.id !== purchaseId)
    } catch (e: any) {
      error.value = e.message
      console.error('Error deleting purchase:', e)
      throw e
    } finally {
      isLoading.value = false
    }
  }

  /**
   * คำนวณสถิติรวม
   */
  const stats = computed<PurchaseStats>(() => {
    const totalEntries = purchases.value.length
    let totalBet = 0
    let totalPayout = 0
    let winCount = 0

    purchases.value.forEach((purchase) => {
      // คำนวณเงินที่ซื้อ
      const bet = purchase.numbers.reduce((sum, n) => sum + n.betAmount, 0)
      totalBet += bet

      // คำนวณเงินรางวัล
      if (purchase.isChecked && purchase.totalPayout) {
        totalPayout += purchase.totalPayout

        // นับครั้งที่ถูก
        if (purchase.totalPayout > 0) {
          winCount++
        }
      }
    })

    const profit = totalPayout - totalBet
    const winRate = totalEntries > 0 ? (winCount / totalEntries) * 100 : 0

    return {
      totalEntries,
      totalBet,
      totalPayout,
      profit,
      winCount,
      winRate,
    }
  })

  /**
   * กรองรายการที่ยังไม่ตรวจรางวัล
   */
  const uncheckedPurchases = computed(() => {
    return purchases.value.filter((p) => !p.isChecked)
  })

  /**
   * กรองรายการที่ถูกรางวัล
   */
  const winningPurchases = computed(() => {
    return purchases.value.filter((p) => p.isChecked && p.totalPayout && p.totalPayout > 0)
  })

  return {
    purchases,
    isLoading,
    error,
    stats,
    uncheckedPurchases,
    winningPurchases,
    loadPurchases,
    addPurchase,
    updatePrizeResults,
    deletePurchase,
  }
}
