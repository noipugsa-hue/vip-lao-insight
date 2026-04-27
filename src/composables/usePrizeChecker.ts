/**
 * usePrizeChecker
 * Composable สำหรับตรวจสอบรางวัลหวย
 */

import { ref } from 'vue'

export interface PrizeResult {
  number: string
  type: '2digit' | '3digit' | '4digit'
  isWinner: boolean
  prizeType?: 'exact' | 'front' | 'back' | 'any' // exact=ถูกทุกตำแหน่ง, front=2หน้า, back=2หลัง, any=โผล่
  matchedWith?: string // เลขที่ถูก
  payout?: number // เงินรางวัล (ถ้ามี)
}

export interface LotteryDrawResult {
  date: string
  period: string
  threeDigit: string
  twoDigit?: string
  fourDigit?: string
}

export const usePrizeChecker = () => {
  const checkResults = ref<PrizeResult[]>([])
  const isChecking = ref(false)

  /**
   * ตรวจสอบเลข 2 ตัว
   */
  const checkTwoDigit = (userNumber: string, drawResult: LotteryDrawResult): PrizeResult => {
    const result: PrizeResult = {
      number: userNumber,
      type: '2digit',
      isWinner: false,
    }

    if (!drawResult.twoDigit) {
      return result
    }

    // ตรวจสอบ 2 ตัวตรง
    if (userNumber === drawResult.twoDigit) {
      result.isWinner = true
      result.prizeType = 'exact'
      result.matchedWith = drawResult.twoDigit
      result.payout = 90 // อัตราจ่าย 1:90
      return result
    }

    // ตรวจสอบ 2 ตัวโผล่ (กลับหลังหน้า)
    const reversed = userNumber.split('').reverse().join('')
    if (reversed === drawResult.twoDigit) {
      result.isWinner = true
      result.prizeType = 'any'
      result.matchedWith = drawResult.twoDigit
      result.payout = 45 // อัตราจ่าย 1:45
      return result
    }

    return result
  }

  /**
   * ตรวจสอบเลข 3 ตัว
   */
  const checkThreeDigit = (userNumber: string, drawResult: LotteryDrawResult): PrizeResult => {
    const result: PrizeResult = {
      number: userNumber,
      type: '3digit',
      isWinner: false,
    }

    // ตรวจสอบ 3 ตัวตรง
    if (userNumber === drawResult.threeDigit) {
      result.isWinner = true
      result.prizeType = 'exact'
      result.matchedWith = drawResult.threeDigit
      result.payout = 500 // อัตราจ่าย 1:500
      return result
    }

    // ตรวจสอบ 3 ตัวหน้า (2 ตัวแรกตรง)
    const userFront = userNumber.slice(0, 2)
    const drawFront = drawResult.threeDigit.slice(0, 2)
    if (userFront === drawFront) {
      result.isWinner = true
      result.prizeType = 'front'
      result.matchedWith = drawFront
      result.payout = 60 // อัตราจ่าย 1:60
      return result
    }

    // ตรวจสอบ 3 ตัวหลัง (2 ตัวท้ายตรง)
    const userBack = userNumber.slice(-2)
    const drawBack = drawResult.threeDigit.slice(-2)
    if (userBack === drawBack) {
      result.isWinner = true
      result.prizeType = 'back'
      result.matchedWith = drawBack
      result.payout = 60 // อัตราจ่าย 1:60
      return result
    }

    // ตรวจสอบโผล่ (ตัวเลขทั้ง 3 ตัวเรียงใหม่)
    const userDigits = userNumber.split('').sort().join('')
    const drawDigits = drawResult.threeDigit.split('').sort().join('')
    if (userDigits === drawDigits) {
      result.isWinner = true
      result.prizeType = 'any'
      result.matchedWith = drawResult.threeDigit
      result.payout = 80 // อัตราจ่าย 1:80
      return result
    }

    return result
  }

  /**
   * ตรวจสอบเลข 4 ตัว
   */
  const checkFourDigit = (userNumber: string, drawResult: LotteryDrawResult): PrizeResult => {
    const result: PrizeResult = {
      number: userNumber,
      type: '4digit',
      isWinner: false,
    }

    if (!drawResult.fourDigit) {
      return result
    }

    // ตรวจสอบ 4 ตัวตรง
    if (userNumber === drawResult.fourDigit) {
      result.isWinner = true
      result.prizeType = 'exact'
      result.matchedWith = drawResult.fourDigit
      result.payout = 3000 // อัตราจ่าย 1:3000
      return result
    }

    return result
  }

  /**
   * ตรวจสอบรายการเลขทั้งหมด
   */
  const checkNumbers = (
    numbers: Array<{ number: string; type: '2digit' | '3digit' | '4digit' }>,
    drawResult: LotteryDrawResult
  ): PrizeResult[] => {
    isChecking.value = true

    const results: PrizeResult[] = []

    numbers.forEach(({ number, type }) => {
      let result: PrizeResult

      switch (type) {
        case '2digit':
          result = checkTwoDigit(number, drawResult)
          break
        case '3digit':
          result = checkThreeDigit(number, drawResult)
          break
        case '4digit':
          result = checkFourDigit(number, drawResult)
          break
        default:
          result = {
            number,
            type,
            isWinner: false,
          }
      }

      results.push(result)
    })

    checkResults.value = results
    isChecking.value = false

    return results
  }

  /**
   * คำนวณเงินรางวัลรวม
   */
  const calculateTotalPayout = (results: PrizeResult[], betAmount: number = 100): number => {
    return results.reduce((total, result) => {
      if (result.isWinner && result.payout) {
        return total + result.payout * betAmount
      }
      return total
    }, 0)
  }

  /**
   * นับจำนวนรางวัลแยกตามประเภท
   */
  const countPrizesByType = (results: PrizeResult[]) => {
    const counts = {
      exact: 0,
      front: 0,
      back: 0,
      any: 0,
      total: 0,
    }

    results.forEach((result) => {
      if (result.isWinner && result.prizeType) {
        counts[result.prizeType]++
        counts.total++
      }
    })

    return counts
  }

  /**
   * แปลงชื่อประเภทรางวัลเป็นภาษาไทย
   */
  const getPrizeTypeName = (prizeType: string): string => {
    const names: Record<string, string> = {
      exact: 'ตรง',
      front: 'หน้า',
      back: 'หลัง',
      any: 'โผล่',
    }
    return names[prizeType] || prizeType
  }

  return {
    checkResults,
    isChecking,
    checkTwoDigit,
    checkThreeDigit,
    checkFourDigit,
    checkNumbers,
    calculateTotalPayout,
    countPrizesByType,
    getPrizeTypeName,
  }
}
