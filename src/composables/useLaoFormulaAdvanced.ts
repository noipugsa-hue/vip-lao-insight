/**
 * สูตรคำนวณเลขหวยลาวแบบขั้นสูง
 * ใช้การวิเคราะห์หลายมิติเพื่อความแม่นยำสูง
 */

export const useLaoFormulaAdvanced = () => {

  /**
   * วิเคราะห์ความถี่ของตัวเลข พร้อมน้ำหนักตามงวดล่าสุด
   * งวดล่าสุดจะมีน้ำหนักมากกว่างวดเก่า
   */
  const analyzeFrequencyWithWeight = (history: string[]) => {
    const weightedCount: Record<string, number> = {}

    history.forEach((num, index) => {
      // งวดล่าสุดมีน้ำหนักมากที่สุด
      const weight = Math.pow(1.5, history.length - index - 1)

      num.split('').forEach(digit => {
        weightedCount[digit] = (weightedCount[digit] || 0) + weight
      })
    })

    return weightedCount
  }

  /**
   * วิเคราะห์คู่ตัวเลขที่ออกด้วยกันบ่อย
   */
  const analyzePairs = (history: string[]) => {
    const pairCount: Record<string, number> = {}

    history.forEach((num, index) => {
      const weight = Math.pow(1.3, history.length - index - 1)
      const digits = num.split('')

      // วิเคราะห์ทุกคู่ที่เป็นไปได้
      for (let i = 0; i < digits.length; i++) {
        for (let j = i + 1; j < digits.length; j++) {
          const pair = [digits[i], digits[j]].sort().join('')
          pairCount[pair] = (pairCount[pair] || 0) + weight
        }
      }
    })

    return pairCount
  }

  /**
   * วิเคราะห์ตำแหน่งที่ตัวเลขมักออก
   */
  const analyzePositions = (history: string[]) => {
    const positionCount: Record<string, number[]> = {}

    history.forEach((num, historyIndex) => {
      const weight = Math.pow(1.4, history.length - historyIndex - 1)
      const digits = num.split('')

      digits.forEach((digit, position) => {
        if (!positionCount[digit]) {
          positionCount[digit] = [0, 0, 0] // 3 ตำแหน่ง
        }
        if (position < 3) {
          positionCount[digit][position] += weight
        }
      })
    })

    return positionCount
  }

  /**
   * วิเคราะห์ช่วงห่างของการออก (Gap Analysis)
   * เลขที่ไม่ได้ออกนานมีโอกาสออกมากขึ้น
   */
  const analyzeGaps = (history: string[]) => {
    const lastSeen: Record<string, number> = {}
    const gapScores: Record<string, number> = {}

    history.forEach((num, index) => {
      num.split('').forEach(digit => {
        lastSeen[digit] = index
      })
    })

    // คำนวณ gap score (ยิ่งนานไม่เห็น score ยิ่งสูง)
    for (let i = 0; i < 10; i++) {
      const digit = String(i)
      const gap = lastSeen[digit] !== undefined
        ? history.length - lastSeen[digit] - 1
        : history.length

      // Gap ปานกลาง (3-5 งวด) มี score สูงสุด
      if (gap >= 3 && gap <= 5) {
        gapScores[digit] = 3
      } else if (gap >= 6 && gap <= 8) {
        gapScores[digit] = 2
      } else if (gap <= 2) {
        gapScores[digit] = 1
      } else {
        gapScores[digit] = 0.5
      }
    }

    return gapScores
  }

  /**
   * คำนวณ Hot Numbers แบบขั้นสูง
   * รวมการวิเคราะห์หลายมิติ
   */
  const getAdvancedHotNumbers = (history: string[]) => {
    const frequency = analyzeFrequencyWithWeight(history)
    const gaps = analyzeGaps(history)

    // คำนวณ score รวม
    const scores: Record<string, number> = {}

    for (let i = 0; i < 10; i++) {
      const digit = String(i)
      const freqScore = frequency[digit] || 0
      const gapScore = gaps[digit] || 0

      // น้ำหนัก: frequency 60%, gap 40%
      scores[digit] = (freqScore * 0.6) + (gapScore * 0.4)
    }

    // เรียงตาม score และเอา top 4
    return Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([digit]) => digit)
  }

  /**
   * วิเคราะห์ Gap สำหรับเลข 2 ตัว
   */
  const analyzeTwoDigitGap = (history: string[]): Record<string, number> => {
    const lastSeen: Record<string, number> = {}
    const gapScore: Record<string, number> = {}

    // หาเลข 2 ตัวจากประวัติ (เอา 2 ตัวท้าย)
    history.forEach((num, index) => {
      if (num.length >= 2) {
        const twoDigit = num.slice(-2)
        if (!lastSeen[twoDigit]) {
          lastSeen[twoDigit] = index
        }
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
   * สร้างเลข 2 ตัวแบบอัจฉริยะ (ปรับปรุงใหม่)
   * ใช้การวิเคราะห์หลายมิติ
   */
  const generateSmartTwoDigits = (history: string[], hot: string[]) => {
    const gapScores = analyzeTwoDigitGap(history)
    const results: string[] = []
    const usedNumbers = new Set<string>()

    // 1. Gap Numbers - เลขที่ไม่ได้ออกนาน 3-7 งวด (3 ชุด)
    const highGapNumbers = Object.entries(gapScores)
      .filter(([_num, score]) => score === 5)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(([num]) => num)

    highGapNumbers.forEach(num => {
      if (!usedNumbers.has(num) && results.length < 8) {
        results.push(num)
        usedNumbers.add(num)
      }
    })

    // 2. Sequential - เลข 2 ตัวที่ติดกับงวดล่าสุด (2 ชุด)
    if (history.length > 0 && history[0] && history[0].length >= 2) {
      const lastTwoDigit = parseInt(history[0].slice(-2), 10)
      const sequential = [
        ((lastTwoDigit + 1) % 100).toString().padStart(2, '0'),
        ((lastTwoDigit - 1 + 100) % 100).toString().padStart(2, '0'),
      ]

      sequential.forEach(num => {
        if (!usedNumbers.has(num) && results.length < 8) {
          results.push(num)
          usedNumbers.add(num)
        }
      })
    }

    // 3. Medium Gap Numbers (2 ชุด)
    const mediumGapNumbers = Object.entries(gapScores)
      .filter(([_num, score]) => score === 3)
      .sort(() => Math.random() - 0.5)
      .slice(0, 2)
      .map(([num]) => num)

    mediumGapNumbers.forEach(num => {
      if (!usedNumbers.has(num) && results.length < 8) {
        results.push(num)
        usedNumbers.add(num)
      }
    })

    // 4. Hot Number Pairs (1 ชุด)
    let pairCount = 0
    for (let i = 0; i < hot.length && pairCount < 1 && results.length < 8; i++) {
      for (let j = 0; j < hot.length && pairCount < 1 && results.length < 8; j++) {
        const digit1 = hot[i]
        const digit2 = hot[j]
        if (!digit1 || !digit2) continue

        const pair = digit1 + digit2
        if (usedNumbers.has(pair)) continue

        results.push(pair)
        usedNumbers.add(pair)
        pairCount++
      }
    }

    // 5. เติมเลขเพิ่มจาก gap numbers อื่นๆ
    if (results.length < 8) {
      const remainingGaps = Object.entries(gapScores)
        .filter(([num]) => !usedNumbers.has(num))
        .filter(([_num, score]) => score >= 2)
        .sort(() => Math.random() - 0.5)
        .slice(0, 8 - results.length)
        .map(([num]) => num)

      remainingGaps.forEach(num => {
        if (results.length < 8) {
          results.push(num)
          usedNumbers.add(num)
        }
      })
    }

    // 6. ถ้ายังไม่ครบ 8 ให้สุ่มเลขที่ยังไม่เคยใช้
    if (results.length < 8) {
      const allPossible = Array.from({ length: 100 }, (_, i) => i.toString().padStart(2, '0'))
        .filter(num => !usedNumbers.has(num))
        .sort(() => Math.random() - 0.5)
        .slice(0, 8 - results.length)

      allPossible.forEach(num => {
        if (results.length < 8) {
          results.push(num)
          usedNumbers.add(num)
        }
      })
    }

    return results.slice(0, 8)
  }

  /**
   * วิเคราะห์ Gap สำหรับเลข 3 ตัว
   * เลขที่ไม่ได้ออกนาน 3-7 งวด มีโอกาสสูง
   */
  const analyzeThreeDigitGap = (history: string[]): Record<string, number> => {
    const lastSeen: Record<string, number> = {}
    const gapScore: Record<string, number> = {}

    // หาว่าแต่ละเลขออกครั้งล่าสุดเมื่อไหร่
    history.forEach((num, index) => {
      if (!lastSeen[num]) {
        lastSeen[num] = index
      }
    })

    // คำนวณ gap score สำหรับทุกเลข 000-999
    for (let i = 0; i < 1000; i++) {
      const num = i.toString().padStart(3, '0')
      const gap = lastSeen[num] !== undefined
        ? lastSeen[num]
        : history.length

      // Gap 3-8 งวด = โอกาสสูงสุด
      if (gap >= 3 && gap <= 8) {
        gapScore[num] = 5
      } else if (gap >= 9 && gap <= 15) {
        gapScore[num] = 3
      } else if (gap >= 1 && gap <= 2) {
        gapScore[num] = 2
      } else if (gap > 15) {
        gapScore[num] = 1
      } else {
        gapScore[num] = 0
      }
    }

    return gapScore
  }

  /**
   * สร้างเลขจาก Sequential Pattern สำหรับเลข 3 ตัว
   */
  const generateSequentialThreeDigits = (history: string[], count: number): string[] => {
    const results: string[] = []

    if (history.length === 0 || !history[0]) return results

    const lastNumber = parseInt(history[0], 10)

    // สร้างเลขติดกันกับเลขงวดล่าสุด
    const sequences = [
      ((lastNumber + 1) % 1000).toString().padStart(3, '0'),
      ((lastNumber - 1 + 1000) % 1000).toString().padStart(3, '0'),
      ((lastNumber + 10) % 1000).toString().padStart(3, '0'),
      ((lastNumber - 10 + 1000) % 1000).toString().padStart(3, '0'),
      ((lastNumber + 100) % 1000).toString().padStart(3, '0'),
      ((lastNumber - 100 + 1000) % 1000).toString().padStart(3, '0'),
      ((lastNumber + 11) % 1000).toString().padStart(3, '0'),
      ((lastNumber - 11 + 1000) % 1000).toString().padStart(3, '0'),
      ((lastNumber + 111) % 1000).toString().padStart(3, '0'),
      ((lastNumber - 111 + 1000) % 1000).toString().padStart(3, '0'),
    ]

    sequences.forEach(num => {
      if (results.length < count && !results.includes(num)) {
        results.push(num)
      }
    })

    return results
  }

  /**
   * สร้างเลข 3 ตัวแบบอัจฉริยะ (ปรับปรุงใหม่)
   * ใช้การวิเคราะห์หลายมิติ
   */
  const generateSmartThreeDigits = (history: string[], hot: string[]) => {
    const gapScores = analyzeThreeDigitGap(history)
    const sequential = generateSequentialThreeDigits(history, 10)
    const results: string[] = []
    const usedNumbers = new Set<string>()

    // 1. Gap Numbers - เลขที่ไม่ได้ออกนาน 3-8 งวด (2 ชุด)
    const highGapNumbers = Object.entries(gapScores)
      .filter(([_num, score]) => score === 5) // เฉพาะที่มี gap 3-8 งวด
      .sort((a, b) => {
        // เรียงตาม gap score และ random เพื่อความหลากหลาย
        if (b[1] === a[1]) {
          return Math.random() - 0.5
        }
        return b[1] - a[1]
      })
      .slice(0, 2)
      .map(([num]) => num)

    highGapNumbers.forEach(num => {
      if (!usedNumbers.has(num) && results.length < 6) {
        results.push(num)
        usedNumbers.add(num)
      }
    })

    // 2. Sequential Numbers - เลขติดกับงวดล่าสุด (2 ชุด)
    sequential.forEach(num => {
      if (!usedNumbers.has(num) && results.length < 6) {
        results.push(num)
        usedNumbers.add(num)
      }
    })

    // 3. Medium Gap Numbers - เลขที่ไม่ได้ออก 9-15 งวด (1 ชุด)
    const mediumGapNumbers = Object.entries(gapScores)
      .filter(([_num, score]) => score === 3) // gap 9-15 งวด
      .sort(() => Math.random() - 0.5) // random
      .slice(0, 1)
      .map(([num]) => num)

    mediumGapNumbers.forEach(num => {
      if (!usedNumbers.has(num) && results.length < 6) {
        results.push(num)
        usedNumbers.add(num)
      }
    })

    // 4. Position-based - จาก hot numbers (1 ชุด)
    let positionCount = 0
    for (let i = 0; i < hot.length && positionCount < 1 && results.length < 6; i++) {
      for (let j = 0; j < hot.length && positionCount < 1 && results.length < 6; j++) {
        for (let k = 0; k < hot.length && positionCount < 1 && results.length < 6; k++) {
          const digit1 = hot[i]
          const digit2 = hot[j]
          const digit3 = hot[k]

          if (!digit1 || !digit2 || !digit3) continue
          if (digit1 === digit2 && digit2 === digit3) continue

          const number = digit1 + digit2 + digit3
          if (usedNumbers.has(number)) continue

          results.push(number)
          usedNumbers.add(number)
          positionCount++
        }
      }
    }

    // 5. เติมเลขเพิ่มจาก gap numbers อื่นๆ ถ้ายังไม่ครบ 6
    if (results.length < 6) {
      const remainingGaps = Object.entries(gapScores)
        .filter(([num]) => !usedNumbers.has(num))
        .filter(([_num, score]) => score >= 2) // เอาที่มี gap score อย่างน้อย 2
        .sort(() => Math.random() - 0.5) // random เพื่อความหลากหลาย
        .slice(0, 6 - results.length)
        .map(([num]) => num)

      remainingGaps.forEach(num => {
        if (results.length < 6) {
          results.push(num)
          usedNumbers.add(num)
        }
      })
    }

    // 6. ถ้ายังไม่ครบ 6 ให้สุ่มเลขที่ยังไม่เคยใช้
    if (results.length < 6) {
      const allPossible = Array.from({ length: 1000 }, (_, i) => i.toString().padStart(3, '0'))
        .filter(num => !usedNumbers.has(num))
        .sort(() => Math.random() - 0.5)
        .slice(0, 6 - results.length)

      allPossible.forEach(num => {
        if (results.length < 6) {
          results.push(num)
          usedNumbers.add(num)
        }
      })
    }

    return results.slice(0, 6)
  }

  /**
   * ตัดเลขเย็น (Cold Numbers) แบบอัจฉริยะ
   * เลขที่ไม่ได้ออกนานเกินไป
   */
  const getSmartColdNumbers = (history: string[]) => {
    const lastSeen: Record<string, number> = {}

    history.forEach((num, index) => {
      num.split('').forEach(digit => {
        lastSeen[digit] = index
      })
    })

    const coldNumbers: string[] = []

    for (let i = 0; i < 10; i++) {
      const digit = String(i)
      const gap = lastSeen[digit] !== undefined
        ? history.length - lastSeen[digit] - 1
        : history.length

      // ถ้าไม่เคยออกเลย หรือไม่ได้ออกมานานมาก (>10 งวด) = เลขเย็น
      if (gap > 10 || lastSeen[digit] === undefined) {
        coldNumbers.push(digit)
      }
    }

    return coldNumbers
  }

  /**
   * Main function: คำนวณเลขทั้งหมดด้วยสูตรขั้นสูง
   */
  const calculateAdvanced = (history: string[]) => {
    // ต้องมีข้อมูลอย่างน้อย 5 งวด
    if (history.length < 5) {
      return {
        hot: [],
        twoDigits: [],
        threeDigits: [],
        cold: [],
        confidence: 0
      }
    }

    const hot = getAdvancedHotNumbers(history)
    const cold = getSmartColdNumbers(history)
    const twoDigits = generateSmartTwoDigits(history, hot)
    const threeDigits = generateSmartThreeDigits(history, hot)

    // คำนวณความมั่นใจ (ยิ่งมีข้อมูลเยอะ ยิ่งแม่น)
    const confidence = Math.min(95, 50 + (history.length * 3))

    return {
      hot,
      twoDigits,
      threeDigits,
      cold,
      confidence
    }
  }

  return {
    calculateAdvanced,
    getAdvancedHotNumbers,
    generateSmartTwoDigits,
    generateSmartThreeDigits,
    getSmartColdNumbers,
    analyzeFrequencyWithWeight,
    analyzePairs,
    analyzePositions,
    analyzeGaps,
    analyzeThreeDigitGap,
    generateSequentialThreeDigits,
    analyzeTwoDigitGap
  }
}
