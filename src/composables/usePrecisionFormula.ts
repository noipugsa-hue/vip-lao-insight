/**
 * สูตรคำนวณหวยแบบแม่นยำสูง (Precision Formula)
 * เน้นเลขน้อยแต่แม่น - จำกัด 3-5 ชุดที่มี confidence สูงสุด
 *
 * หลักการ:
 * 1. Gap Analysis (40%) - เลขที่ไม่ได้ออกนาน 3-7 งวดมีโอกาสออกสูง
 * 2. Weighted Frequency (30%) - งวดล่าสุดมีน้ำหนักมากกว่า
 * 3. Pair Correlation (20%) - คู่ตัวเลขที่มักออกด้วยกัน
 * 4. Pattern Recognition (10%) - รูปแบบการออกซ้ำ
 */

export interface PrecisionNumber {
  number: string
  confidence: number
  reason: string // เหตุผลที่แนะนำ
  gapScore: number
  freqScore: number
  pairScore: number
  patternScore: number
}

export interface PrecisionResult {
  hotNumbers: PrecisionNumber[] // 3 ตัว
  twoDigits: PrecisionNumber[] // 3-5 ชุด
  threeDigits: PrecisionNumber[] // 3-5 ชุด
  overallConfidence: number
  analysisDate: string
}

export const usePrecisionFormula = () => {

  /**
   * Gap Analysis - คำนวณ gap score
   * เลขที่ไม่ได้ออกนาน 3-7 งวด = โอกาสสูงสุด (100 คะแนน)
   */
  const calculateGapScore = (lastSeenIndex: number, historyLength: number): number => {
    const gap = historyLength - lastSeenIndex - 1

    if (gap >= 3 && gap <= 7) return 100 // Sweet spot
    if (gap >= 2 && gap <= 9) return 80
    if (gap >= 1 && gap <= 11) return 60
    if (gap === 0) return 30 // ออกงวดล่าสุด - โอกาสต่ำ
    return 20 // ไม่เคยออกหรือนานมาก
  }

  /**
   * Weighted Frequency - ความถี่ถ่วงน้ำหนัก
   * งวดล่าสุดมีน้ำหนัก 2x, งวดก่อน 1.7x, ...
   */
  const calculateFrequencyScore = (
    digit: string,
    history: string[]
  ): number => {
    let weightedCount = 0
    let maxPossible = 0

    history.forEach((num, index) => {
      const weight = Math.pow(1.5, history.length - index - 1)
      maxPossible += weight

      if (num.includes(digit)) {
        weightedCount += weight
      }
    })

    return maxPossible > 0 ? (weightedCount / maxPossible) * 100 : 0
  }

  /**
   * Pair Correlation - วิเคราะห์คู่ที่มักออกด้วยกัน
   */
  const calculatePairScore = (
    digit: string,
    history: string[],
    recentDigits: string[]
  ): number => {
    let pairCount = 0
    let totalPossible = 0

    history.forEach((num, index) => {
      const weight = Math.pow(1.3, history.length - index - 1)
      totalPossible += weight * recentDigits.length

      recentDigits.forEach(recentDigit => {
        if (num.includes(digit) && num.includes(recentDigit)) {
          pairCount += weight
        }
      })
    })

    return totalPossible > 0 ? (pairCount / totalPossible) * 100 : 0
  }

  /**
   * Pattern Recognition - รูปแบบการออกซ้ำ
   */
  const calculatePatternScore = (
    digit: string,
    history: string[]
  ): number => {
    if (history.length < 5) return 50

    // ตรวจสอบว่ามี pattern การออกเป็นรอบๆ หรือไม่
    const appearances: number[] = []
    history.forEach((num, index) => {
      if (num.includes(digit)) {
        appearances.push(index)
      }
    })

    if (appearances.length < 2) return 40

    // คำนวณความสม่ำเสมอของช่วงห่าง
    const gaps: number[] = []
    for (let i = 1; i < appearances.length; i++) {
      gaps.push(appearances[i] - appearances[i - 1])
    }

    // ถ้า gaps ใกล้เคียงกัน = มี pattern
    const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length
    const variance = gaps.reduce((sum, gap) => sum + Math.pow(gap - avgGap, 2), 0) / gaps.length

    // Variance ต่ำ = pattern สม่ำเสมอ = score สูง
    return Math.max(0, 100 - variance * 10)
  }

  /**
   * คำนวณ Confidence โดยรวม
   * Gap 40% + Frequency 30% + Pair 20% + Pattern 10%
   */
  const calculateOverallConfidence = (
    gapScore: number,
    freqScore: number,
    pairScore: number,
    patternScore: number
  ): number => {
    return Math.round(
      gapScore * 0.4 +
      freqScore * 0.3 +
      pairScore * 0.2 +
      patternScore * 0.1
    )
  }

  /**
   * สร้างเหตุผลการแนะนำ
   */
  const generateReason = (scores: {
    gapScore: number
    freqScore: number
    pairScore: number
    patternScore: number
  }): string => {
    const reasons: string[] = []

    if (scores.gapScore >= 80) reasons.push('ไม่ได้ออก 3-7 งวด')
    if (scores.freqScore >= 70) reasons.push('ออกบ่อยในงวดล่าสุด')
    if (scores.pairScore >= 60) reasons.push('มักออกคู่กับเลขเด่น')
    if (scores.patternScore >= 70) reasons.push('มี pattern สม่ำเสมอ')

    return reasons.length > 0 ? reasons.join(', ') : 'วิเคราะห์จากหลายปัจจัย'
  }

  /**
   * คำนวณเลขเด่นแบบแม่นยำสูง (TOP 3 ตัว)
   */
  const getPrecisionHotNumbers = (history: string[]): PrecisionNumber[] => {
    if (history.length < 3) return []

    const digitScores: PrecisionNumber[] = []
    const lastSeen: Record<string, number> = {}

    // หา lastSeen ของแต่ละตัวเลข
    history.forEach((num, index) => {
      num.split('').forEach(digit => {
        if (!lastSeen[digit] || lastSeen[digit] < index) {
          lastSeen[digit] = index
        }
      })
    })

    // หาเลขเด่นจาก 3 งวดล่าสุด
    const recentDigits = history.slice(0, 3).join('').split('')
    const uniqueRecent = [...new Set(recentDigits)]

    // คำนวณ score สำหรับทุกตัวเลข
    for (let i = 0; i < 10; i++) {
      const digit = String(i)

      const gapScore = calculateGapScore(lastSeen[digit] ?? -1, history.length)
      const freqScore = calculateFrequencyScore(digit, history)
      const pairScore = calculatePairScore(digit, history, uniqueRecent)
      const patternScore = calculatePatternScore(digit, history)

      const confidence = calculateOverallConfidence(gapScore, freqScore, pairScore, patternScore)

      digitScores.push({
        number: digit,
        confidence,
        reason: generateReason({ gapScore, freqScore, pairScore, patternScore }),
        gapScore,
        freqScore,
        pairScore,
        patternScore
      })
    }

    // เรียงตาม confidence และเอา TOP 3 (ลบ threshold ออก เอาอันดับแรกไปเลย)
    const sorted = digitScores.sort((a, b) => b.confidence - a.confidence)
    console.log('Hot numbers scores:', sorted.slice(0, 5).map(s => ({ number: s.number, confidence: s.confidence })))
    return sorted.slice(0, 3)
  }

  /**
   * คำนวณเลข 2 ตัวแบบแม่นยำสูง (TOP 3-5 ชุด)
   */
  const getPrecisionTwoDigits = (
    history: string[],
    hotNumbers: PrecisionNumber[]
  ): PrecisionNumber[] => {
    if (history.length < 3) return []

    const twoDigitScores: PrecisionNumber[] = []
    const lastSeen: Record<string, number> = {}

    // หา lastSeen ของเลข 2 ตัว
    history.forEach((num, index) => {
      if (num.length >= 2) {
        const twoDigit = num.slice(-2)
        if (!lastSeen[twoDigit]) {
          lastSeen[twoDigit] = index
        }
      }
    })

    // สร้างเลข 2 ตัวจาก hot numbers
    const candidates: string[] = []

    // 1. Combination จาก hot numbers
    for (let i = 0; i < hotNumbers.length; i++) {
      for (let j = 0; j < hotNumbers.length; j++) {
        const num = hotNumbers[i].number + hotNumbers[j].number
        if (!candidates.includes(num)) candidates.push(num)
      }
    }

    // 2. เลขที่อยู่ใน gap zone (3-7 งวด)
    for (let i = 0; i < 100; i++) {
      const num = i.toString().padStart(2, '0')
      const lastSeenIndex = lastSeen[num]

      if (lastSeenIndex !== undefined) {
        const gap = history.length - lastSeenIndex - 1
        if (gap >= 3 && gap <= 7 && !candidates.includes(num)) {
          candidates.push(num)
        }
      }
    }

    // 3. เลขติดกับงวดล่าสุด
    if (history.length > 0 && history[0] && history[0].length >= 2) {
      const lastNum = parseInt(history[0].slice(-2), 10)
      const sequential = [
        ((lastNum + 1) % 100).toString().padStart(2, '0'),
        ((lastNum - 1 + 100) % 100).toString().padStart(2, '0'),
      ]
      sequential.forEach(num => {
        if (!candidates.includes(num)) candidates.push(num)
      })
    }

    // คำนวณ score สำหรับแต่ละเลข
    candidates.forEach(num => {
      const lastSeenIndex = lastSeen[num] ?? -1
      const gapScore = calculateGapScore(lastSeenIndex, history.length)

      // Frequency: นับว่าเคยออกกี่ครั้ง
      let freqCount = 0
      history.forEach((h, idx) => {
        if (h.includes(num)) {
          const weight = Math.pow(1.5, history.length - idx - 1)
          freqCount += weight
        }
      })
      const freqScore = Math.min(100, freqCount * 10)

      // Pair: ตรวจสอบว่าตัวเลขในเลข 2 ตัวนี้เป็น hot numbers หรือไม่
      const digits = num.split('')
      const hotDigits = hotNumbers.map(h => h.number)
      const pairScore = digits.filter(d => hotDigits.includes(d)).length * 50

      const patternScore = 50 // Default

      const confidence = calculateOverallConfidence(gapScore, freqScore, pairScore, patternScore)

      twoDigitScores.push({
        number: num,
        confidence,
        reason: generateReason({ gapScore, freqScore, pairScore, patternScore }),
        gapScore,
        freqScore,
        pairScore,
        patternScore
      })
    })

    // เรียงตาม confidence และเอา TOP 5 (ลบ threshold ออก)
    const sorted = twoDigitScores.sort((a, b) => b.confidence - a.confidence)
    console.log('2-digit scores:', sorted.slice(0, 5).map(s => ({ number: s.number, confidence: s.confidence })))
    return sorted.slice(0, 5)
  }

  /**
   * คำนวณเลข 3 ตัวแบบแม่นยำสูง (TOP 3-5 ชุด)
   */
  const getPrecisionThreeDigits = (
    history: string[],
    hotNumbers: PrecisionNumber[]
  ): PrecisionNumber[] => {
    if (history.length < 3) return []

    const threeDigitScores: PrecisionNumber[] = []
    const lastSeen: Record<string, number> = {}

    // หา lastSeen ของเลข 3 ตัว
    history.forEach((num, index) => {
      if (!lastSeen[num]) {
        lastSeen[num] = index
      }
    })

    const candidates: string[] = []

    // 1. Combination จาก hot numbers
    for (let i = 0; i < hotNumbers.length; i++) {
      for (let j = 0; j < hotNumbers.length; j++) {
        for (let k = 0; k < hotNumbers.length; k++) {
          const num = hotNumbers[i].number + hotNumbers[j].number + hotNumbers[k].number
          // หลีกเลี่ยงเลขซ้ำหมด (111, 222, ...)
          const uniqueDigits = new Set(num.split('')).size
          if (uniqueDigits >= 2 && !candidates.includes(num)) {
            candidates.push(num)
          }
        }
      }
    }

    // 2. เลขที่อยู่ใน gap zone (3-8 งวด)
    Object.entries(lastSeen).forEach(([num, lastSeenIndex]) => {
      const gap = history.length - lastSeenIndex - 1
      if (gap >= 3 && gap <= 8 && !candidates.includes(num)) {
        candidates.push(num)
      }
    })

    // 3. เลขกลับของงวดล่าสุด (Mirror)
    if (history.length > 0 && history[0]) {
      const mirror = history[0].split('').reverse().join('')
      if (!candidates.includes(mirror)) candidates.push(mirror)
    }

    // 4. เลขติดกับงวดล่าสุด
    if (history.length > 0 && history[0]) {
      const lastNum = parseInt(history[0], 10)
      const sequential = [
        ((lastNum + 1) % 1000).toString().padStart(3, '0'),
        ((lastNum - 1 + 1000) % 1000).toString().padStart(3, '0'),
      ]
      sequential.forEach(num => {
        if (!candidates.includes(num)) candidates.push(num)
      })
    }

    // คำนวณ score สำหรับแต่ละเลข
    candidates.forEach(num => {
      const lastSeenIndex = lastSeen[num] ?? -1
      const gapScore = calculateGapScore(lastSeenIndex, history.length)

      // Frequency
      let freqCount = 0
      history.forEach((h, idx) => {
        if (h === num) {
          const weight = Math.pow(1.5, history.length - idx - 1)
          freqCount += weight
        }
      })
      const freqScore = Math.min(100, freqCount * 20)

      // Pair: ตรวจสอบว่าตัวเลขในเลข 3 ตัวนี้เป็น hot numbers หรือไม่
      const digits = num.split('')
      const hotDigits = hotNumbers.map(h => h.number)
      const matchCount = digits.filter(d => hotDigits.includes(d)).length
      const pairScore = (matchCount / 3) * 100

      const patternScore = calculatePatternScore(num, history)

      const confidence = calculateOverallConfidence(gapScore, freqScore, pairScore, patternScore)

      threeDigitScores.push({
        number: num,
        confidence,
        reason: generateReason({ gapScore, freqScore, pairScore, patternScore }),
        gapScore,
        freqScore,
        pairScore,
        patternScore
      })
    })

    // เรียงตาม confidence และเอา TOP 5 (ลบ threshold ออก)
    const sorted = threeDigitScores.sort((a, b) => b.confidence - a.confidence)
    console.log('3-digit scores:', sorted.slice(0, 5).map(s => ({ number: s.number, confidence: s.confidence })))
    return sorted.slice(0, 5)
  }

  /**
   * Main: คำนวณเลขแบบแม่นยำสูง
   */
  const calculatePrecision = (history: string[]): PrecisionResult => {
    if (history.length < 3) {
      return {
        hotNumbers: [],
        twoDigits: [],
        threeDigits: [],
        overallConfidence: 0,
        analysisDate: new Date().toLocaleDateString('th-TH')
      }
    }

    const hotNumbers = getPrecisionHotNumbers(history)
    const twoDigits = getPrecisionTwoDigits(history, hotNumbers)
    const threeDigits = getPrecisionThreeDigits(history, hotNumbers)

    // คำนวณ confidence โดยรวม
    const allConfidences = [
      ...hotNumbers.map(n => n.confidence),
      ...twoDigits.map(n => n.confidence),
      ...threeDigits.map(n => n.confidence)
    ]

    const overallConfidence = allConfidences.length > 0
      ? Math.round(allConfidences.reduce((a, b) => a + b, 0) / allConfidences.length)
      : 0

    return {
      hotNumbers,
      twoDigits,
      threeDigits,
      overallConfidence,
      analysisDate: new Date().toLocaleDateString('th-TH')
    }
  }

  return {
    calculatePrecision,
    getPrecisionHotNumbers,
    getPrecisionTwoDigits,
    getPrecisionThreeDigits,
    calculateGapScore,
    calculateFrequencyScore,
    calculatePairScore,
    calculatePatternScore
  }
}
