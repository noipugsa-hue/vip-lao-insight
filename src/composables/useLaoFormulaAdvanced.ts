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
   * สร้างเลข 2 ตัวแบบอัจฉริยะ
   * ใช้การวิเคราะห์คู่ที่ออกด้วยกันบ่อย
   */
  const generateSmartTwoDigits = (history: string[], hot: string[]) => {
    const pairAnalysis = analyzePairs(history)
    const results: Array<{ number: string; score: number }> = []

    // สร้างคู่จาก hot numbers
    for (let i = 0; i < hot.length; i++) {
      for (let j = 0; j < hot.length; j++) {
        const pair = hot[i] + hot[j]
        const pairKey = [hot[i], hot[j]].sort().join('')
        const pairScore = pairAnalysis[pairKey] || 0

        results.push({
          number: pair,
          score: pairScore
        })
      }
    }

    // เรียงตาม score และเอา 8 คู่แรก
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map(r => r.number)
  }

  /**
   * สร้างเลข 3 ตัวแบบอัจฉริยะ
   * ใช้การวิเคราะห์ตำแหน่งและความถี่
   */
  const generateSmartThreeDigits = (history: string[], hot: string[]) => {
    const positions = analyzePositions(history)
    const results: Array<{ number: string; score: number }> = []

    // สร้างชุด 3 ตัวจาก hot numbers
    for (let i = 0; i < hot.length; i++) {
      for (let j = 0; j < hot.length; j++) {
        for (let k = 0; k < hot.length; k++) {
          // ไม่เอาเลขซ้ำทั้งหมด
          if (hot[i] === hot[j] && hot[j] === hot[k]) continue

          const number = hot[i] + hot[j] + hot[k]

          // คำนวณ position score
          const pos0 = positions[hot[i]]?.[0] || 0
          const pos1 = positions[hot[j]]?.[1] || 0
          const pos2 = positions[hot[k]]?.[2] || 0
          const positionScore = pos0 + pos1 + pos2

          results.push({
            number,
            score: positionScore
          })
        }
      }
    }

    // เรียงตาม score และเอา 6 ชุดแรก
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map(r => r.number)
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
    analyzeGaps
  }
}
