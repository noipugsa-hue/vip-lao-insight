import { computed } from 'vue'

export interface Pattern {
  sequence: string[]
  occurrences: number
  nextNumbers: string[]
  confidence: number
}

export const usePatternRecognition = (history: string[]) => {
  // หาลวดลาย 2 งวดติดต่อกัน
  const findTwoStepPatterns = computed(() => {
    if (history.length < 3) return []

    const patterns: Record<string, string[]> = {}

    // วนดูทุกคู่ติดกัน
    for (let i = 0; i < history.length - 2; i++) {
      const pattern = `${history[i]}-${history[i + 1]}`
      const next = history[i + 2]

      if (!patterns[pattern]) {
        patterns[pattern] = []
      }
      patterns[pattern].push(next)
    }

    // แปลงเป็น array และเรียงตามความถี่
    const result: Pattern[] = []
    for (const [key, nextNums] of Object.entries(patterns)) {
      const [first, second] = key.split('-')
      const uniqueNext = [...new Set(nextNums)]

      result.push({
        sequence: [first, second],
        occurrences: nextNums.length,
        nextNumbers: uniqueNext,
        confidence: Math.min(95, (nextNums.length / uniqueNext.length) * 20) // คำนวณ confidence
      })
    }

    return result.sort((a, b) => b.occurrences - a.occurrences).slice(0, 10)
  })

  // หาเลขที่มักออกตามหลังเลขนี้
  const findFollowingNumbers = (num: string) => {
    const following: Record<string, number> = {}

    for (let i = 0; i < history.length - 1; i++) {
      if (history[i] === num) {
        const next = history[i + 1]
        following[next] = (following[next] || 0) + 1
      }
    }

    return Object.entries(following)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([num, count]) => ({ num, count, confidence: Math.min(90, count * 25) }))
  }

  // ตรวจสอบลวดลายปัจจุบัน
  const checkCurrentPattern = computed(() => {
    if (history.length < 2) return null

    const last2 = [history[0], history[1]]
    const matchingPattern = findTwoStepPatterns.value.find(
      p => p.sequence[0] === last2[0] && p.sequence[1] === last2[1]
    )

    if (matchingPattern) {
      return {
        pattern: matchingPattern,
        message: `ลวดลายนี้เกิดขึ้น ${matchingPattern.occurrences} ครั้ง`,
        predictedNext: matchingPattern.nextNumbers,
        confidence: matchingPattern.confidence
      }
    }

    return null
  })

  // หา "Hot Streak" - เลขที่ออกซ้ำติดกัน
  const findHotStreaks = computed(() => {
    const streaks: Record<string, number> = {}

    for (let i = 0; i < history.length - 1; i++) {
      const current = history[i]
      const digits = current.split('')

      // เช็คว่าเลขไหนซ้ำในงวดถัดไป
      for (const digit of digits) {
        if (history[i + 1].includes(digit)) {
          streaks[digit] = (streaks[digit] || 0) + 1
        }
      }
    }

    return Object.entries(streaks)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([digit, count]) => ({
        digit,
        count,
        confidence: Math.min(85, count * 15)
      }))
  })

  // คำนวณ Confidence Score โดยรวม
  const calculateOverallConfidence = (numbers: string[]) => {
    let totalConfidence = 50 // เริ่มต้น 50%

    // เพิ่มจาก pattern matching
    const currentPattern = checkCurrentPattern.value
    if (currentPattern && numbers.some(n => currentPattern.predictedNext.includes(n))) {
      totalConfidence += currentPattern.confidence * 0.3
    }

    // เพิ่มจาก hot streaks
    const hotStreaks = findHotStreaks.value
    const hotDigits = hotStreaks.map(h => h.digit)
    const hasHotDigits = numbers.some(n => hotDigits.some(d => n.includes(d)))
    if (hasHotDigits) {
      totalConfidence += 15
    }

    // เพิ่มจากความถี่
    const recentFreq = history.slice(0, 5).join('')
    const freqScore = numbers.reduce((score, num) => {
      const digits = num.split('')
      const matchCount = digits.filter(d => recentFreq.includes(d)).length
      return score + (matchCount * 5)
    }, 0)
    totalConfidence += Math.min(20, freqScore)

    return Math.min(99, Math.round(totalConfidence))
  }

  return {
    findTwoStepPatterns,
    findFollowingNumbers,
    checkCurrentPattern,
    findHotStreaks,
    calculateOverallConfidence,
  }
}
