import { ref } from 'vue'

export interface DreamResult {
  interpretation: string
  luckyNumbers: {
    twoDigit: string[]
    threeDigit: string[]
    fourDigit: string[]
  }
  confidence: number
  keywords: string[]
}

export const useDreamPrediction = () => {
  const isAnalyzing = ref(false)
  const dreamResult = ref<DreamResult | null>(null)
  const error = ref<string | null>(null)

  // ฐานข้อมูลการทำนายฝัน (แบบง่าย)
  const dreamDatabase: Record<string, { keywords: string[], numbers: number[] }> = {
    'งู': { keywords: ['งู', 'เหลื่อม', 'จงอาง', 'แมวเซา'], numbers: [1, 13, 23, 31] },
    'ปลา': { keywords: ['ปลา', 'ทะเล', 'ตกปลา', 'ปลาดุก'], numbers: [2, 12, 22, 32] },
    'ช้าง': { keywords: ['ช้าง', 'ช้างเผือก', 'งาช้าง'], numbers: [3, 33, 43, 53] },
    'เสือ': { keywords: ['เสือ', 'เสือโคร่ง', 'เสือดาว'], numbers: [4, 14, 24, 34] },
    'วัว': { keywords: ['วัว', 'ควาย', 'โค'], numbers: [5, 15, 25, 35] },
    'ม้า': { keywords: ['ม้า', 'ม้าแข่ง', 'ขี่ม้า'], numbers: [6, 16, 26, 36] },
    'หมู': { keywords: ['หมู', 'หมูป่า', 'สุกร'], numbers: [7, 17, 27, 37] },
    'ไก่': { keywords: ['ไก่', 'ไก่ฟ้า', 'เจ้าฟ้า'], numbers: [8, 18, 28, 38] },
    'สุนัข': { keywords: ['สุนัข', 'หมา', 'ลูกหมา'], numbers: [9, 19, 29, 39] },
    'แมว': { keywords: ['แมว', 'ลูกแมว', 'เหมียว'], numbers: [10, 20, 30, 40] },
    'น้ำ': { keywords: ['น้ำ', 'ทะเล', 'แม่น้ำ', 'ตก', 'น้ำท่วม'], numbers: [11, 21, 41, 51] },
    'ไฟ': { keywords: ['ไฟ', 'ไฟไหม้', 'เพลิง', 'ลุก'], numbers: [7, 77, 87, 97] },
    'ทอง': { keywords: ['ทอง', 'เงิน', 'ทองคำ', 'ร่ำรวย'], numbers: [8, 88, 98, 68] },
    'เงิน': { keywords: ['เงิน', 'เหรียญ', 'ธนบัตร', 'รวย'], numbers: [6, 66, 86, 96] },
    'รถ': { keywords: ['รถ', 'รถยนต์', 'ขับรถ', 'ขี่'], numbers: [4, 44, 54, 64] },
    'บ้าน': { keywords: ['บ้าน', 'เรือน', 'ที่พัก'], numbers: [5, 55, 65, 75] },
    'คน': { keywords: ['คน', 'ผู้คน', 'มนุษย์', 'คนตาย'], numbers: [3, 33, 63, 73] },
    'ผี': { keywords: ['ผี', 'ผีสาง', 'ผีปอบ', 'ผีเสื้อ'], numbers: [0, 10, 20, 30] },
    'พระ': { keywords: ['พระ', 'พระพุทธเจ้า', 'วัด', 'สวด'], numbers: [9, 99, 89, 79] },
    'ตาย': { keywords: ['ตาย', 'ศพ', 'งานศพ', 'เสีย'], numbers: [1, 11, 91, 81] },
    'เกิด': { keywords: ['เกิด', 'คลอด', 'เด็ก', 'ทารก'], numbers: [2, 22, 82, 92] },
    'แต่งงาน': { keywords: ['แต่งงาน', 'แต่ง', 'งานแต่ง', 'เจ้าบ่าว', 'เจ้าสาว'], numbers: [6, 66, 76, 86] },
    'ต้นไม้': { keywords: ['ต้นไม้', 'ป่า', 'ดอกไม้', 'ผล'], numbers: [5, 45, 55, 95] },
    'นก': { keywords: ['นก', 'นกยูง', 'นกแก้ว', 'บิน'], numbers: [8, 48, 58, 88] },
    'กบ': { keywords: ['กบ', 'คางคก', 'ลูกอ๊อด'], numbers: [3, 23, 43, 93] },
    'เต่า': { keywords: ['เต่า', 'เต่าทะเล'], numbers: [7, 47, 57, 87] },
  }

  const analyzeDream = async (dreamText: string): Promise<void> => {
    isAnalyzing.value = true
    error.value = null
    dreamResult.value = null

    try {
      // จำลองการวิเคราะห์ด้วย AI (ใช้เวลาเล็กน้อย)
      await new Promise(resolve => setTimeout(resolve, 2000))

      const lowerDreamText = dreamText.toLowerCase()
      const matchedKeywords: string[] = []
      const allNumbers: number[] = []

      // ค้นหาคีย์เวิร์ดที่ตรงกับฝัน
      Object.entries(dreamDatabase).forEach(([category, data]) => {
        const hasMatch = data.keywords.some(keyword => lowerDreamText.includes(keyword))
        if (hasMatch) {
          matchedKeywords.push(category)
          allNumbers.push(...data.numbers)
        }
      })

      // ถ้าไม่เจอคีย์เวิร์ด ให้สุ่มเลข
      if (allNumbers.length === 0) {
        matchedKeywords.push('ทั่วไป')
        allNumbers.push(
          Math.floor(Math.random() * 100),
          Math.floor(Math.random() * 100),
          Math.floor(Math.random() * 100),
          Math.floor(Math.random() * 100),
        )
      }

      // สร้างเลข 2 ตัว, 3 ตัว, 4 ตัว
      const twoDigit = Array.from(new Set(allNumbers.map(n => String(n % 100).padStart(2, '0')))).slice(0, 6)
      const threeDigit = Array.from(new Set(allNumbers.map(n => String(n % 1000).padStart(3, '0')))).slice(0, 5)
      const fourDigit = Array.from(new Set(allNumbers.map(n => String((n * 11) % 10000).padStart(4, '0')))).slice(0, 4)

      // สร้างคำอธิบาย
      const interpretation = matchedKeywords.length > 0
        ? `จากฝันของคุณ พบสัญลักษณ์: ${matchedKeywords.join(', ')} ซึ่งมีความหมายเกี่ยวกับ ${generateInterpretation(matchedKeywords)}`
        : 'ฝันของคุณมีความหมายลึกซึ้ง อาจเป็นสัญญาณของโชคลาภที่กำลังจะมาถึง'

      dreamResult.value = {
        interpretation,
        luckyNumbers: {
          twoDigit,
          threeDigit,
          fourDigit,
        },
        confidence: Math.min(85 + matchedKeywords.length * 5, 99),
        keywords: matchedKeywords,
      }
    }
    catch (err) {
      error.value = 'เกิดข้อผิดพลาดในการวิเคราะห์ฝัน กรุณาลองใหม่อีกครั้ง'
      console.error(err)
    }
    finally {
      isAnalyzing.value = false
    }
  }

  const generateInterpretation = (keywords: string[]): string => {
    const interpretations: Record<string, string> = {
      'งู': 'การเปลี่ยนแปลง การฟื้นฟู หรือภัยอันตราย',
      'ปลา': 'ความอุดมสมบูรณ์ โชคลาภ หรือการเดินทาง',
      'ช้าง': 'อำนาจ เกียรติยศ หรือความมั่งคั่ง',
      'เสือ': 'พลัง ความกล้า หรือศัตรู',
      'วัว': 'ความอดทน ความมั่นคง หรือการทำงานหนัก',
      'ม้า': 'การเดินทาง ความเร็ว หรือความก้าวหน้า',
      'หมู': 'ความอุดมสมบูรณ์ โชคลาภ',
      'ไก่': 'การเริ่มต้นใหม่ ข่าวดี',
      'สุนัข': 'ความจงรักภักดี มิตรภาพ',
      'แมว': 'ความลึกลับ ปัญญา',
      'น้ำ': 'อารมณ์ การชำระล้าง หรือความเปลี่ยนแปลง',
      'ไฟ': 'พลังงาน ความหลงใหล หรือการทำลาย',
      'ทอง': 'ความมั่งคั่ง ความสำเร็จ',
      'เงิน': 'โชคลาภ ความร่ำรวย',
      'รถ': 'การเดินทาง ความก้าวหน้า',
      'บ้าน': 'ความมั่นคง ครอบครัว',
      'คน': 'ความสัมพันธ์ สังคม',
      'ผี': 'ความกลัว สิ่งที่ซ่อนเร้น',
      'พระ': 'ความศักดิ์สิทธิ์ การปกป้อง',
      'ตาย': 'การสิ้นสุด การเริ่มต้นใหม่',
      'เกิด': 'จุดเริ่มต้นใหม่ ความหวัง',
      'แต่งงาน': 'ความรัก การเริ่มต้นใหม่',
      'ต้นไม้': 'การเติบโต ความอุดมสมบูรณ์',
      'นก': 'เสรีภาพ ความมุ่งหวัง',
      'กบ': 'การเปลี่ยนแปลง โชคลาภ',
      'เต่า': 'ความอดทน ความยืนยาว',
    }

    return keywords.map(k => interpretations[k] || 'โชคลาภ').join(', ')
  }

  return {
    isAnalyzing,
    dreamResult,
    error,
    analyzeDream,
  }
}
