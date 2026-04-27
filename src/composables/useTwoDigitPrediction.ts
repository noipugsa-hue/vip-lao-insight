/**
 * useTwoDigitPrediction
 * Composable สำหรับคำนวณและทำนายเลข 2 ตัวงวดถัดไป
 * ใช้หลักการทางสถิติและการวิเคราะห์รูปแบบ
 */

export const useTwoDigitPrediction = () => {

  /**
   * วิเคราะห์ความถี่ของเลข 2 ตัวที่ออก
   * @param history - Array ของเลข 2 ตัวย้อนหลัง
   * @returns Object ที่เก็บความถี่แต่ละเลข
   */
  const analyzeFrequency = (history: string[]): Record<string, number> => {
    const frequency: Record<string, number> = {}

    history.forEach(num => {
      frequency[num] = (frequency[num] || 0) + 1
    })

    return frequency
  }

  /**
   * หาเลขที่ออกบ่อยที่สุด (Hot Numbers)
   * @param history - Array ของเลข 2 ตัวย้อนหลัง
   * @param count - จำนวนเลขที่ต้องการ (default: 5)
   * @returns Array ของเลขที่ออกบ่อย
   */
  const getHotNumbers = (history: string[], count: number = 5): string[] => {
    const frequency = analyzeFrequency(history)

    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, count)
      .map(([num]) => num)
  }

  /**
   * หาเลขที่ไม่ค่อยออกหรือไม่เคยออก (Cold Numbers)
   * @param history - Array ของเลข 2 ตัวย้อนหลัง
   * @param count - จำนวนเลขที่ต้องการ (default: 5)
   * @returns Array ของเลขที่ไม่ค่อยออก
   */
  const getColdNumbers = (history: string[], count: number = 5): string[] => {
    const frequency = analyzeFrequency(history)
    const allNumbers = Array.from({ length: 100 }, (_, i) => i.toString().padStart(2, '0'))

    // หาเลขที่ไม่เคยออกหรือออกน้อย
    return allNumbers
      .filter(num => !frequency[num] || frequency[num] <= 1)
      .slice(0, count)
  }

  /**
   * วิเคราะห์รูปแบบของตัวเลข (Pattern Analysis)
   * @param history - Array ของเลข 2 ตัวย้อนหลัง
   * @returns Object ที่มีข้อมูลรูปแบบต่างๆ
   */
  const analyzePattern = (history: string[]) => {
    if (history.length === 0) {
      return {
        evenOddPattern: { even: 0, odd: 0 },
        rangePattern: { low: 0, mid: 0, high: 0 },
        digitSumPattern: {} as Record<string, number>
      }
    }

    const evenOdd = { even: 0, odd: 0 }
    const range = { low: 0, mid: 0, high: 0 } // 00-33, 34-66, 67-99
    const digitSum: Record<string, number> = {}

    history.forEach(num => {
      const value = parseInt(num, 10)

      // วิเคราะห์คู่-คี่
      if (value % 2 === 0) {
        evenOdd.even++
      } else {
        evenOdd.odd++
      }

      // วิเคราะห์ช่วงตัวเลข
      if (value <= 33) {
        range.low++
      } else if (value <= 66) {
        range.mid++
      } else {
        range.high++
      }

      // วิเคราะห์ผลรวมของตัวเลข
      const sum = Math.floor(value / 10) + (value % 10)
      const sumKey = sum.toString()
      digitSum[sumKey] = (digitSum[sumKey] || 0) + 1
    })

    return {
      evenOddPattern: evenOdd,
      rangePattern: range,
      digitSumPattern: digitSum
    }
  }

  /**
   * วิเคราะห์ Gap - เลขที่ไม่ได้ออกนาน
   * เลขที่ไม่ได้ออกนาน 3-7 งวด มีโอกาสออกสูง
   */
  const analyzeGap = (history: string[]): Record<string, number> => {
    const lastSeen: Record<string, number> = {}
    const gapScore: Record<string, number> = {}

    // หาว่าแต่ละเลขออกครั้งล่าสุดเมื่อไหร่
    history.forEach((num, index) => {
      if (!lastSeen[num]) {
        lastSeen[num] = index
      }
    })

    // คำนวณ gap score สำหรับทุกเลข 00-99
    for (let i = 0; i < 100; i++) {
      const num = i.toString().padStart(2, '0')
      const gap = lastSeen[num] !== undefined
        ? lastSeen[num]
        : history.length

      // Gap 3-7 งวด = โอกาสสูงสุด
      if (gap >= 3 && gap <= 7) {
        gapScore[num] = 5
      } else if (gap >= 8 && gap <= 12) {
        gapScore[num] = 3
      } else if (gap >= 1 && gap <= 2) {
        gapScore[num] = 2
      } else if (gap > 12) {
        gapScore[num] = 1
      } else {
        gapScore[num] = 0
      }
    }

    return gapScore
  }

  /**
   * สร้างเลขจาก Sequential Pattern (เลขติดกัน)
   */
  const generateSequentialNumbers = (history: string[], count: number): string[] => {
    const results: string[] = []

    if (history.length === 0) return results

    const lastNumber = parseInt(history[0], 10)

    // สร้างเลขติดกันกับเลขงวดล่าสุด
    const sequences = [
      ((lastNumber + 1) % 100).toString().padStart(2, '0'),
      ((lastNumber - 1 + 100) % 100).toString().padStart(2, '0'),
      ((lastNumber + 10) % 100).toString().padStart(2, '0'),
      ((lastNumber - 10 + 100) % 100).toString().padStart(2, '0'),
      ((lastNumber + 11) % 100).toString().padStart(2, '0'),
      ((lastNumber - 11 + 100) % 100).toString().padStart(2, '0'),
    ]

    sequences.forEach(num => {
      if (results.length < count && !results.includes(num)) {
        results.push(num)
      }
    })

    return results
  }

  /**
   * ทำนายเลข 2 ตัวงวดถัดไป (ปรับปรุงใหม่)
   * @param history - Array ของเลข 2 ตัวย้อนหลัง
   * @param predictionCount - จำนวนเลขที่ต้องการทำนาย (default: 8)
   * @returns Object ที่มีเลขทำนายและข้อมูลวิเคราะห์
   */
  const predictNextNumbers = (history: string[], predictionCount: number = 8) => {
    if (history.length < 3) {
      return {
        predictions: [],
        confidence: 0,
        hotNumbers: [],
        coldNumbers: [],
        pattern: null,
        message: 'ต้องมีข้อมูลย้อนหลังอย่างน้อย 3 งวด'
      }
    }

    // วิเคราะห์ทุกมิติ
    const frequency = analyzeFrequency(history)
    const hotNumbers = getHotNumbers(history, 5)
    const coldNumbers = getColdNumbers(history, 5)
    const pattern = analyzePattern(history)
    const gapScores = analyzeGap(history)

    // สร้างเลขผสมจากหลายวิธี
    const predictions: string[] = []
    const usedNumbers = new Set<string>()

    // 1. Gap Numbers - เลขที่ไม่ได้ออกนาน 3-7 งวด (30%)
    const gapNumbers = Object.entries(gapScores)
      .filter(([num, score]) => score >= 3)
      .sort((a, b) => b[1] - a[1])
      .map(([num]) => num)

    const gapCount = Math.ceil(predictionCount * 0.3)
    for (let i = 0; i < gapCount && i < gapNumbers.length; i++) {
      if (!usedNumbers.has(gapNumbers[i])) {
        predictions.push(gapNumbers[i])
        usedNumbers.add(gapNumbers[i])
      }
    }

    // 2. Hot Numbers เลขที่ออกบ่อย (25%)
    const hotCount = Math.ceil(predictionCount * 0.25)
    for (let i = 0; i < hotCount && i < hotNumbers.length; i++) {
      if (!usedNumbers.has(hotNumbers[i])) {
        predictions.push(hotNumbers[i])
        usedNumbers.add(hotNumbers[i])
      }
    }

    // 3. Sequential Numbers - เลขติดกับงวดล่าสุด (20%)
    const sequential = generateSequentialNumbers(history, Math.ceil(predictionCount * 0.2))
    sequential.forEach(num => {
      if (!usedNumbers.has(num) && predictions.length < predictionCount) {
        predictions.push(num)
        usedNumbers.add(num)
      }
    })

    // 4. Pattern Based - วิเคราะห์รูปแบบล่าสุด (15%)
    const recentPattern = history.slice(0, 3)
    const patternBased = generatePatternBasedNumbers(recentPattern, Math.ceil(predictionCount * 0.15))
    patternBased.forEach(num => {
      if (!usedNumbers.has(num) && predictions.length < predictionCount) {
        predictions.push(num)
        usedNumbers.add(num)
      }
    })

    // 5. Mixed Numbers - ผสมตัวเลข (10%)
    const mixedNumbers = generateMixedNumbers(history, Math.ceil(predictionCount * 0.1))
    mixedNumbers.forEach(num => {
      if (!usedNumbers.has(num) && predictions.length < predictionCount) {
        predictions.push(num)
        usedNumbers.add(num)
      }
    })

    // 6. เติมเลขสุ่มจากเลขที่มี gap score ปานกลาง
    while (predictions.length < predictionCount) {
      const remaining = Object.entries(gapScores)
        .filter(([num]) => !usedNumbers.has(num))
        .sort((a, b) => b[1] - a[1])

      if (remaining.length === 0) break

      const randomPick = remaining[Math.floor(Math.random() * Math.min(10, remaining.length))][0]
      predictions.push(randomPick)
      usedNumbers.add(randomPick)
    }

    // คำนวณ Confidence Score (0-100)
    const confidence = calculateConfidence(history, predictions)

    return {
      predictions: predictions.slice(0, predictionCount),
      confidence,
      hotNumbers,
      coldNumbers,
      pattern,
      message: `วิเคราะห์จาก ${history.length} งวดย้อนหลัง`
    }
  }

  /**
   * สร้างเลขจากการวิเคราะห์รูปแบบล่าสุด
   */
  const generatePatternBasedNumbers = (recent: string[], count: number): string[] => {
    const results: string[] = []

    if (recent.length === 0) return results

    // วิเคราะห์ตัวเลขในงวดล่าสุด
    const lastNumber = recent[0]
    const lastValue = parseInt(lastNumber, 10)
    const firstDigit = Math.floor(lastValue / 10)
    const secondDigit = lastValue % 10

    // สร้างเลขใกล้เคียงกับงวดล่าสุด
    const variations = [
      // เปลี่ยนตัวท้าย
      `${firstDigit}${(secondDigit + 1) % 10}`.padStart(2, '0'),
      `${firstDigit}${(secondDigit + 9) % 10}`.padStart(2, '0'),
      // เปลี่ยนตัวหน้า
      `${(firstDigit + 1) % 10}${secondDigit}`.padStart(2, '0'),
      `${(firstDigit + 9) % 10}${secondDigit}`.padStart(2, '0'),
      // สลับตัวเลข
      `${secondDigit}${firstDigit}`.padStart(2, '0'),
    ]

    variations.forEach(num => {
      if (results.length < count && !results.includes(num)) {
        results.push(num)
      }
    })

    return results
  }

  /**
   * สร้างเลขจากการผสมตัวเลขในประวัติ
   */
  const generateMixedNumbers = (history: string[], count: number): string[] => {
    const results: string[] = []
    const digits = new Set<string>()

    // เก็บตัวเลขทั้งหมดที่เคยออก
    history.forEach(num => {
      digits.add(num[0])
      digits.add(num[1])
    })

    const digitArray = Array.from(digits)

    // สร้างเลขใหม่จากการผสม
    for (let i = 0; i < digitArray.length && results.length < count; i++) {
      for (let j = 0; j < digitArray.length && results.length < count; j++) {
        const newNum = digitArray[i] + digitArray[j]
        if (!results.includes(newNum) && !history.includes(newNum)) {
          results.push(newNum)
        }
      }
    }

    return results
  }

  /**
   * คำนวณ Confidence Score
   */
  const calculateConfidence = (history: string[], predictions: string[]): number => {
    // ยิ่งมีข้อมูลมาก confidence ยิ่งสูง (max 70%)
    const historyScore = Math.min((history.length / 20) * 40, 40)

    // Pattern consistency score (max 30%)
    const pattern = analyzePattern(history)
    const patternScore = 30

    // Prediction diversity score (max 30%)
    const diversityScore = predictions.length >= 8 ? 30 : (predictions.length / 8) * 30

    const total = historyScore + patternScore + diversityScore

    return Math.round(Math.min(total, 85)) // จำกัดไม่ให้เกิน 85%
  }

  /**
   * หาเลขที่มีแนวโน้มจะออกต่อเนื่อง (Streak Analysis)
   */
  const analyzeStreak = (history: string[]): string[] => {
    if (history.length < 2) return []

    const streaks: Record<string, number> = {}

    for (let i = 0; i < history.length - 1; i++) {
      const current = history[i]
      const next = history[i + 1]
      const pair = `${current}-${next}`
      streaks[pair] = (streaks[pair] || 0) + 1
    }

    // หาเลขที่มักจะตามหลังเลขล่าสุด
    const lastNum = history[0]
    const possibleNext: string[] = []

    Object.entries(streaks).forEach(([pair, count]) => {
      const [first] = pair.split('-')
      if (first === lastNum && count > 1) {
        const [, second] = pair.split('-')
        possibleNext.push(second)
      }
    })

    return possibleNext
  }

  return {
    analyzeFrequency,
    getHotNumbers,
    getColdNumbers,
    analyzePattern,
    predictNextNumbers,
    analyzeStreak,
    analyzeGap,
    generateSequentialNumbers
  }
}
