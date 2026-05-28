/**
 * สูตรหวย - Lottery Formula Selector
 * ระบบเลือกสูตรคำนวณเลขหวยแบบต่างๆ
 */

import { useLaoFormulaAdvanced } from './useLaoFormulaAdvanced'

// ===== TypeScript Interfaces =====

export interface FormulaConfig {
  id: 'statistics' | 'fixed' | 'probability' | 'daypower'
  name: string
  displayName: string
  description: string
  icon: string
}

export interface StatisticsSettings {
  periodsToAnalyze: number
  focusOnHot: boolean
  analyzeDigitPosition: boolean
}

export interface FixedSettings {
  fixedNumbers: number[]
  targetDigits: 2 | 3
  baseSource: 'lastPrize' | 'topPrize'
}

export interface ProbabilitySettings {
  useAddition: boolean
  reduceToSingleDigit: boolean
}

export interface DaypowerSettings {
  useDayOfWeek: boolean
  combineWithHotNumbers: boolean
  powerNumberOverride: number | null
}

export interface FormulaSettings {
  statisticsFormula: StatisticsSettings
  fixedFormula: FixedSettings
  probabilityFormula: ProbabilitySettings
  daypowerFormula: DaypowerSettings
}

export interface FormulaResult {
  formulaId: string
  lotteryType: string
  calculatedAt: string
  predictions: {
    twoDigits: string[]
    threeDigits: string[]
  }
  confidence: number
  explanation: string[]
  settings: any
}

// ===== Formula Definitions =====

export const FORMULAS: FormulaConfig[] = [
  {
    id: 'statistics',
    name: 'statisticsFormula',
    displayName: 'สูตรสถิติย้อนหลัง',
    description: 'วิเคราะห์ความถี่ของเลขที่ออกในอดีต เพื่อหาเลขที่น่าจะออกในงวดต่อไป',
    icon: '📊'
  },
  {
    id: 'fixed',
    name: 'fixedFormula',
    displayName: 'สูตรเลขคงที่',
    description: 'บวกลบเลขคงที่กับผลหวยงวดล่าสุด เช่น +7, +8, +3',
    icon: '🔢'
  },
  {
    id: 'probability',
    name: 'probabilityFormula',
    displayName: 'สูตรผลรวมและหลักคณิตศาสตร์',
    description: 'คำนวณผลรวมของตัวเลข แล้วลดเป็นเลขหลักเดียว นำมาสร้างคู่เลข',
    icon: '🧮'
  },
  {
    id: 'daypower',
    name: 'daypowerFormula',
    displayName: 'สูตรเลขกำลังวัน',
    description: 'ใช้เลขประจำวัน (จันทร์=2, อังคาร=3, ...) รวมกับเลขร้อน',
    icon: '📅'
  }
]

// ===== Default Settings =====

export const DEFAULT_SETTINGS: FormulaSettings = {
  statisticsFormula: {
    periodsToAnalyze: 10,
    focusOnHot: true,
    analyzeDigitPosition: true
  },
  fixedFormula: {
    fixedNumbers: [7, 8, 3],
    targetDigits: 2,
    baseSource: 'lastPrize'
  },
  probabilityFormula: {
    useAddition: true,
    reduceToSingleDigit: true
  },
  daypowerFormula: {
    useDayOfWeek: true,
    combineWithHotNumbers: true,
    powerNumberOverride: null
  }
}

// ===== Composable =====

export const useLotteryFormula = () => {
  const advanced = useLaoFormulaAdvanced()

  /**
   * 1. สูตรสถิติย้อนหลัง (Statistics Formula)
   * วิเคราะห์ความถี่ของเลขที่ออกในอดีต
   */
  const calculateStatisticsFormula = (
    history: string[],
    settings: StatisticsSettings
  ): FormulaResult => {
    const explanation: string[] = []
    explanation.push(`📊 วิเคราะห์สถิติย้อนหลัง ${settings.periodsToAnalyze} งวด`)

    // เอางวดล่าสุดตามที่กำหนด
    const period = history.slice(0, Math.min(settings.periodsToAnalyze, history.length))
    explanation.push(`📝 ใช้ข้อมูล ${period.length} งวด: ${period.slice(0, 3).join(', ')}...`)

    // วิเคราะห์ความถี่แบบถ่วงน้ำหนัก
    const frequency = advanced.analyzeFrequencyWithWeight(period)
    const hotDigits = Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([digit]) => digit)

    explanation.push(`🔥 เลขร้อน 5 อันดับ: ${hotDigits.join(', ')}`)

    // วิเคราะห์ตำแหน่ง (หลักสิบ/หลักหน่วย) สำหรับเลข 2 ตัว
    const tensPlace: Record<string, number> = {}
    const onesPlace: Record<string, number> = {}

    if (settings.analyzeDigitPosition) {
      period.forEach((num) => {
        if (num.length >= 2) {
          const twoDigit = num.slice(-2)
          const tens = twoDigit[0]
          const ones = twoDigit[1]
          if (tens !== undefined) {
            tensPlace[tens] = (tensPlace[tens] || 0) + 1
          }
          if (ones !== undefined) {
            onesPlace[ones] = (onesPlace[ones] || 0) + 1
          }
        }
      })

      const topTens = Object.entries(tensPlace)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([d]) => d)
      const topOnes = Object.entries(onesPlace)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([d]) => d)

      explanation.push(`📍 หลักสิบที่ออกบ่อย: ${topTens.join(', ')}`)
      explanation.push(`📍 หลักหน่วยที่ออกบ่อย: ${topOnes.join(', ')}`)
    }

    // สร้างเลข 2 ตัว
    const twoDigits: string[] = []
    const usedTwo = new Set<string>()

    // วิธี 1: ใช้ gap analysis
    const gapScores = advanced.analyzeTwoDigitGap(period)
    const highGap = Object.entries(gapScores)
      .filter(([_, score]) => score >= 3)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([num]) => num)

    highGap.forEach((num) => {
      if (!usedTwo.has(num) && twoDigits.length < 8) {
        twoDigits.push(num)
        usedTwo.add(num)
      }
    })

    // วิธี 2: ผสมหลักสิบ + หลักหน่วยที่ร้อน
    if (settings.analyzeDigitPosition) {
      const topTens = Object.entries(tensPlace)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([d]) => d)
      const topOnes = Object.entries(onesPlace)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([d]) => d)

      for (const t of topTens) {
        for (const o of topOnes) {
          const num = t + o
          if (!usedTwo.has(num) && twoDigits.length < 8) {
            twoDigits.push(num)
            usedTwo.add(num)
          }
        }
      }
    }

    // เติมให้ครบ 8 ตัว
    while (twoDigits.length < 8) {
      const rand = Math.floor(Math.random() * 100)
        .toString()
        .padStart(2, '0')
      if (!usedTwo.has(rand)) {
        twoDigits.push(rand)
        usedTwo.add(rand)
      }
    }

    explanation.push(`🎯 สร้างเลข 2 ตัว ${twoDigits.length} ชุด`)

    // สร้างเลข 3 ตัว
    const threeDigits: string[] = []
    const usedThree = new Set<string>()

    // ใช้เลขร้อนสร้าง 3 ตัว
    for (let i = 0; i < hotDigits.length && threeDigits.length < 6; i++) {
      for (let j = 0; j < hotDigits.length && threeDigits.length < 6; j++) {
        for (let k = 0; k < hotDigits.length && threeDigits.length < 6; k++) {
          const digit1 = hotDigits[i]
          const digit2 = hotDigits[j]
          const digit3 = hotDigits[k]
          if (digit1 && digit2 && digit3) {
            const num = digit1 + digit2 + digit3
            if (!usedThree.has(num) && num.length === 3) {
              threeDigits.push(num)
              usedThree.add(num)
            }
          }
        }
      }
    }

    // เติมให้ครบ 6 ตัว
    while (threeDigits.length < 6) {
      const rand = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, '0')
      if (!usedThree.has(rand)) {
        threeDigits.push(rand)
        usedThree.add(rand)
      }
    }

    explanation.push(`🎯 สร้างเลข 3 ตัว ${threeDigits.length} ชุด`)

    // คำนวณความมั่นใจ
    const confidence = Math.min(95, 60 + period.length * 2)
    explanation.push(`✅ ความมั่นใจ: ${confidence}%`)

    return {
      formulaId: 'statistics',
      lotteryType: '',
      calculatedAt: new Date().toISOString(),
      predictions: {
        twoDigits: twoDigits.slice(0, 8),
        threeDigits: threeDigits.slice(0, 6)
      },
      confidence,
      explanation,
      settings
    }
  }

  /**
   * 2. สูตรเลขคงที่ (Fixed Numbers Formula)
   * บวกลบเลขคงที่กับผลหวยงวดล่าสุด
   */
  const calculateFixedFormula = (
    history: string[],
    settings: FixedSettings
  ): FormulaResult => {
    const explanation: string[] = []
    explanation.push(`🔢 สูตรเลขคงที่: +${settings.fixedNumbers.join(', +')}`)

    if (history.length === 0) {
      return {
        formulaId: 'fixed',
        lotteryType: '',
        calculatedAt: new Date().toISOString(),
        predictions: { twoDigits: [], threeDigits: [] },
        confidence: 0,
        explanation: ['❌ ไม่มีข้อมูลหวยงวดล่าสุด'],
        settings
      }
    }

    const latest = history[0]
    if (!latest) {
      return {
        formulaId: 'fixed',
        lotteryType: '',
        calculatedAt: new Date().toISOString(),
        predictions: { twoDigits: [], threeDigits: [] },
        confidence: 0,
        explanation: ['❌ ไม่มีข้อมูลหวยงวดล่าสุด'],
        settings
      }
    }

    const base =
      settings.targetDigits === 2
        ? latest.slice(-2)
        : latest.slice(-3)
    const baseNum = parseInt(base, 10)

    explanation.push(`📝 เลขฐาน: ${base} (${baseNum})`)
    explanation.push(`🎯 จำนวนหลักที่เลือก: ${settings.targetDigits} ตัว`)

    let twoDigits: string[] = []
    let threeDigits: string[] = []

    // ถ้าเลือก 2 ตัว
    if (settings.targetDigits === 2) {
      const usedTwo = new Set<string>()

      settings.fixedNumbers.forEach((fixed) => {
        // บวก
        const addResult = (baseNum + fixed) % 100
        const addStr = addResult.toString().padStart(2, '0')
        if (!usedTwo.has(addStr)) {
          twoDigits.push(addStr)
          usedTwo.add(addStr)
          explanation.push(`➕ ${base} + ${fixed} = ${addStr}`)
        }

        // ลบ
        const subResult = (baseNum - fixed + 100) % 100
        const subStr = subResult.toString().padStart(2, '0')
        if (!usedTwo.has(subStr) && twoDigits.length < 8) {
          twoDigits.push(subStr)
          usedTwo.add(subStr)
          explanation.push(`➖ ${base} - ${fixed} = ${subStr}`)
        }
      })

      // เติมให้ครบ 8 ตัว
      while (twoDigits.length < 8) {
        const rand = Math.floor(Math.random() * 100)
          .toString()
          .padStart(2, '0')
        if (!usedTwo.has(rand)) {
          twoDigits.push(rand)
          usedTwo.add(rand)
        }
      }

      explanation.push(`✅ สร้างเลข 2 ตัว ${twoDigits.length} ชุด`)
    }
    // ถ้าเลือก 3 ตัว
    else {
      const usedThree = new Set<string>()

      settings.fixedNumbers.forEach((fixed) => {
        // บวก
        const addResult = (baseNum + fixed) % 1000
        const addStr = addResult.toString().padStart(3, '0')
        if (!usedThree.has(addStr)) {
          threeDigits.push(addStr)
          usedThree.add(addStr)
          explanation.push(`➕ ${base} + ${fixed} = ${addStr}`)
        }

        // ลบ
        const subResult = (baseNum - fixed + 1000) % 1000
        const subStr = subResult.toString().padStart(3, '0')
        if (!usedThree.has(subStr) && threeDigits.length < 6) {
          threeDigits.push(subStr)
          usedThree.add(subStr)
          explanation.push(`➖ ${base} - ${fixed} = ${subStr}`)
        }
      })

      // เติมให้ครบ 6 ตัว
      while (threeDigits.length < 6) {
        const rand = Math.floor(Math.random() * 1000)
          .toString()
          .padStart(3, '0')
        if (!usedThree.has(rand)) {
          threeDigits.push(rand)
          usedThree.add(rand)
        }
      }

      explanation.push(`✅ สร้างเลข 3 ตัว ${threeDigits.length} ชุด`)
    }

    const confidence = 70
    explanation.push(`✅ ความมั่นใจ: ${confidence}%`)

    return {
      formulaId: 'fixed',
      lotteryType: '',
      calculatedAt: new Date().toISOString(),
      predictions: {
        twoDigits: twoDigits.slice(0, 8),
        threeDigits: threeDigits.slice(0, 6)
      },
      confidence,
      explanation,
      settings
    }
  }

  /**
   * 3. สูตรผลรวมและหลักคณิตศาสตร์ (Probability Formula)
   * คำนวณผลรวมของตัวเลข แล้วนำมาสร้างคู่เลข
   */
  const calculateProbabilityFormula = (
    history: string[],
    settings: ProbabilitySettings
  ): FormulaResult => {
    const explanation: string[] = []
    explanation.push(`🧮 สูตรผลรวมและหลักคณิตศาสตร์`)

    if (history.length === 0) {
      return {
        formulaId: 'probability',
        lotteryType: '',
        calculatedAt: new Date().toISOString(),
        predictions: { twoDigits: [], threeDigits: [] },
        confidence: 0,
        explanation: ['❌ ไม่มีข้อมูลหวยงวดล่าสุด'],
        settings
      }
    }

    const latest = history[0]
    if (!latest) {
      return {
        formulaId: 'probability',
        lotteryType: '',
        calculatedAt: new Date().toISOString(),
        predictions: { twoDigits: [], threeDigits: [] },
        confidence: 0,
        explanation: ['❌ ไม่มีข้อมูลหวยงวดล่าสุด'],
        settings
      }
    }

    const threeDigit = latest.slice(-3)
    const digits = threeDigit.split('').map(Number)

    explanation.push(`📝 เลขงวดล่าสุด: ${threeDigit}`)

    // คำนวณผลรวม
    let sum = digits.reduce((a, b) => a + b, 0)
    explanation.push(`➕ ผลรวม: ${digits.join(' + ')} = ${sum}`)

    // ลดเป็นหลักเดียว
    if (settings.reduceToSingleDigit) {
      while (sum > 9) {
        const oldSum = sum
        sum = sum
          .toString()
          .split('')
          .reduce((a, b) => a + parseInt(b), 0)
        explanation.push(`🔄 ลดหลัก: ${oldSum} → ${sum}`)
      }
    }

    // ใช้เลขร้อนจาก advanced formula
    const hotNumbers = advanced.getAdvancedHotNumbers(history)
    explanation.push(`🔥 เลขร้อน: ${hotNumbers.join(', ')}`)

    // สร้างเลข 2 ตัว: ใช้ sum + hot numbers
    const twoDigits: string[] = []
    const usedTwo = new Set<string>()

    // วิธี 1: sum กับ hot numbers
    hotNumbers.forEach((hot) => {
      if (twoDigits.length < 8) {
        const num1 = sum.toString() + hot
        const num2 = hot + sum.toString()
        if (!usedTwo.has(num1) && num1.length === 2) {
          twoDigits.push(num1)
          usedTwo.add(num1)
        }
        if (!usedTwo.has(num2) && num2.length === 2 && twoDigits.length < 8) {
          twoDigits.push(num2)
          usedTwo.add(num2)
        }
      }
    })

    // วิธี 2: hot numbers กับ hot numbers
    for (let i = 0; i < hotNumbers.length && twoDigits.length < 8; i++) {
      for (let j = 0; j < hotNumbers.length && twoDigits.length < 8; j++) {
        const digit1 = hotNumbers[i]
        const digit2 = hotNumbers[j]
        if (digit1 && digit2) {
          const num = digit1 + digit2
          if (!usedTwo.has(num)) {
            twoDigits.push(num)
            usedTwo.add(num)
          }
        }
      }
    }

    // เติมให้ครบ 8 ตัว
    while (twoDigits.length < 8) {
      const rand = Math.floor(Math.random() * 100)
        .toString()
        .padStart(2, '0')
      if (!usedTwo.has(rand)) {
        twoDigits.push(rand)
        usedTwo.add(rand)
      }
    }

    explanation.push(`🎯 สร้างเลข 2 ตัว ${twoDigits.length} ชุด`)

    // สร้างเลข 3 ตัว
    const threeDigits: string[] = []
    const usedThree = new Set<string>()

    // ใช้ sum + hot numbers
    for (let i = 0; i < hotNumbers.length && threeDigits.length < 6; i++) {
      for (let j = 0; j < hotNumbers.length && threeDigits.length < 6; j++) {
        const digit1 = hotNumbers[i]
        const digit2 = hotNumbers[j]
        if (digit1 && digit2) {
          const num = sum.toString() + digit1 + digit2
          if (!usedThree.has(num) && num.length === 3) {
            threeDigits.push(num)
            usedThree.add(num)
          }
        }
      }
    }

    // เติมให้ครบ 6 ตัว
    while (threeDigits.length < 6) {
      const rand = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, '0')
      if (!usedThree.has(rand)) {
        threeDigits.push(rand)
        usedThree.add(rand)
      }
    }

    explanation.push(`🎯 สร้างเลข 3 ตัว ${threeDigits.length} ชุด`)

    const confidence = 65
    explanation.push(`✅ ความมั่นใจ: ${confidence}%`)

    return {
      formulaId: 'probability',
      lotteryType: '',
      calculatedAt: new Date().toISOString(),
      predictions: {
        twoDigits: twoDigits.slice(0, 8),
        threeDigits: threeDigits.slice(0, 6)
      },
      confidence,
      explanation,
      settings
    }
  }

  /**
   * 4. สูตรเลขกำลังวัน (Day Power Formula)
   * ใช้เลขประจำวันรวมกับเลขร้อน
   */
  const calculateDaypowerFormula = (
    history: string[],
    date: Date,
    settings: DaypowerSettings
  ): FormulaResult => {
    const explanation: string[] = []
    explanation.push(`📅 สูตรเลขกำลังวัน`)

    // แมปวันเป็นตัวเลข
    const dayMap: Record<number, number> = {
      0: 8, // อาทิตย์
      1: 2, // จันทร์
      2: 3, // อังคาร
      3: 4, // พุธ
      4: 5, // พฤหัสบดี
      5: 6, // ศุกร์
      6: 7 // เสาร์
    }

    const dayNames = [
      'อาทิตย์',
      'จันทร์',
      'อังคาร',
      'พุธ',
      'พฤหัสบดี',
      'ศุกร์',
      'เสาร์'
    ]

    const dayOfWeek = date.getDay()
    const dayPower =
      settings.powerNumberOverride ?? dayMap[dayOfWeek] ?? 2 // Default to 2 if undefined

    const dayName = dayNames[dayOfWeek] ?? 'ไม่ทราบ'
    explanation.push(
      `📆 วัน${dayName} = เลขกำลัง ${dayPower}`
    )

    // ใช้เลขร้อน
    const hotNumbers = settings.combineWithHotNumbers
      ? advanced.getAdvancedHotNumbers(history)
      : []

    if (settings.combineWithHotNumbers && hotNumbers.length > 0) {
      explanation.push(`🔥 เลขร้อน: ${hotNumbers.join(', ')}`)
    }

    // สร้างเลข 2 ตัว
    const twoDigits: string[] = []
    const usedTwo = new Set<string>()

    // วิธี 1: day power + hot numbers
    if (settings.combineWithHotNumbers) {
      hotNumbers.forEach((hot) => {
        if (twoDigits.length < 8) {
          const num1 = dayPower.toString() + hot
          const num2 = hot + dayPower.toString()
          if (!usedTwo.has(num1) && num1.length === 2) {
            twoDigits.push(num1)
            usedTwo.add(num1)
            explanation.push(`🔗 ${dayPower} + ${hot} = ${num1}`)
          }
          if (!usedTwo.has(num2) && num2.length === 2 && twoDigits.length < 8) {
            twoDigits.push(num2)
            usedTwo.add(num2)
            explanation.push(`🔗 ${hot} + ${dayPower} = ${num2}`)
          }
        }
      })
    }

    // วิธี 2: day power + 0-9
    for (let i = 0; i < 10 && twoDigits.length < 8; i++) {
      const num = dayPower.toString() + i.toString()
      if (!usedTwo.has(num)) {
        twoDigits.push(num)
        usedTwo.add(num)
      }
    }

    // เติมให้ครบ 8 ตัว
    while (twoDigits.length < 8) {
      const rand = Math.floor(Math.random() * 100)
        .toString()
        .padStart(2, '0')
      if (!usedTwo.has(rand)) {
        twoDigits.push(rand)
        usedTwo.add(rand)
      }
    }

    explanation.push(`🎯 สร้างเลข 2 ตัว ${twoDigits.length} ชุด`)

    // สร้างเลข 3 ตัว
    const threeDigits: string[] = []
    const usedThree = new Set<string>()

    // ใช้ day power + 2 digits
    twoDigits.slice(0, 6).forEach((twoDigit) => {
      const num = dayPower.toString() + twoDigit
      if (!usedThree.has(num) && num.length === 3) {
        threeDigits.push(num)
        usedThree.add(num)
      }
    })

    // เติมให้ครบ 6 ตัว
    while (threeDigits.length < 6) {
      const rand = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, '0')
      if (!usedThree.has(rand)) {
        threeDigits.push(rand)
        usedThree.add(rand)
      }
    }

    explanation.push(`🎯 สร้างเลข 3 ตัว ${threeDigits.length} ชุด`)

    const confidence = 60
    explanation.push(`✅ ความมั่นใจ: ${confidence}%`)

    return {
      formulaId: 'daypower',
      lotteryType: '',
      calculatedAt: new Date().toISOString(),
      predictions: {
        twoDigits: twoDigits.slice(0, 8),
        threeDigits: threeDigits.slice(0, 6)
      },
      confidence,
      explanation,
      settings
    }
  }

  /**
   * บันทึกผลลัพธ์ลง localStorage
   */
  const saveFormulaResult = (result: FormulaResult) => {
    try {
      const key = `formula_results_${result.lotteryType}`
      const existing = localStorage.getItem(key)
      const results: FormulaResult[] = existing ? JSON.parse(existing) : []

      // เก็บไว้ล่าสุด 50 ชุด
      results.unshift(result)
      if (results.length > 50) {
        results.splice(50)
      }

      localStorage.setItem(key, JSON.stringify(results))
    } catch (error) {
      console.error('Error saving formula result:', error)
    }
  }

  /**
   * โหลดผลลัพธ์จาก localStorage
   */
  const loadFormulaResults = (lotteryType?: string): FormulaResult[] => {
    try {
      if (!lotteryType) {
        return []
      }
      const key = `formula_results_${lotteryType}`
      const data = localStorage.getItem(key)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('Error loading formula results:', error)
      return []
    }
  }

  /**
   * บันทึกการตั้งค่าสูตร
   */
  const saveFormulaSettings = (formulaId: string, settings: any) => {
    try {
      const key = `formula_${formulaId}_settings`
      localStorage.setItem(key, JSON.stringify(settings))
    } catch (error) {
      console.error('Error saving formula settings:', error)
    }
  }

  /**
   * โหลดการตั้งค่าสูตร
   */
  const loadFormulaSettings = (formulaId: string): any => {
    try {
      const key = `formula_${formulaId}_settings`
      const data = localStorage.getItem(key)
      if (data) {
        return JSON.parse(data)
      }
      // Return default settings for the formula
      const formula = FORMULAS.find((f) => f.id === formulaId)
      if (formula) {
        return DEFAULT_SETTINGS[formula.name as keyof FormulaSettings]
      }
      return null
    } catch (error) {
      console.error('Error loading formula settings:', error)
      return null
    }
  }

  /**
   * บันทึกสูตรที่เลือก
   */
  const saveActiveFormula = (formulaId: string) => {
    try {
      localStorage.setItem('formula_active', formulaId)
    } catch (error) {
      console.error('Error saving active formula:', error)
    }
  }

  /**
   * โหลดสูตรที่เลือก
   */
  const loadActiveFormula = (): string => {
    try {
      return localStorage.getItem('formula_active') || 'statistics'
    } catch (error) {
      console.error('Error loading active formula:', error)
      return 'statistics'
    }
  }

  return {
    FORMULAS,
    DEFAULT_SETTINGS,
    calculateStatisticsFormula,
    calculateFixedFormula,
    calculateProbabilityFormula,
    calculateDaypowerFormula,
    saveFormulaResult,
    loadFormulaResults,
    saveFormulaSettings,
    loadFormulaSettings,
    saveActiveFormula,
    loadActiveFormula
  }
}
