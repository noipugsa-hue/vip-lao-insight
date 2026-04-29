import { defineEventHandler, getQuery } from 'h3'

/**
 * Server API endpoint สำหรับดึงข้อมูลหวยรัฐบาลจาก rayriffy API
 *
 * API: https://lotto.api.rayriffy.com
 * - /latest - งวดล่าสุด
 * - /list - รายการงวดทั้งหมด
 * - /:id - งวดเฉพาะ (เช่น 16042569)
 *
 * Query Parameters:
 * - id: ID ของงวด (รูปแบบ DDMMYYYY เช่น 16042569 = 16/04/2569)
 */

interface RayriffyLotteryResult {
  success: boolean
  data?: {
    date: string // วันที่ออกรางวัล
    period: string // งวดที่
    first: string // รางวัลที่ 1
    firstNear: string[] // รางวัลใกล้เคียงรางวัลที่ 1
    second: string[] // รางวัลที่ 2
    third: string[] // รางวัลที่ 3
    fourth: string[] // รางวัลที่ 4
    fifth: string[] // รางวัลที่ 5
    runningNumberFront: string[] // เลขหน้า 3 ตัว
    runningNumberBack: string[] // เลขท้าย 3 ตัว
    runningNumberBack2: string[] // เลขท้าย 2 ตัว
  }
  message?: string
  error?: string
}

// แปลงข้อมูลจาก rayriffy format เป็น format เดิมของเรา
const transformData = (rawData: any) => {
  if (!rawData || !rawData.response) return null

  const response = rawData.response
  const prizes = response.prizes || []
  const runningNumbers = response.runningNumbers || []

  // แปลง prizes array เป็น object
  const prizesMap: any = {}
  prizes.forEach((prize: any) => {
    prizesMap[prize.id] = prize.number || []
  })

  // แปลง runningNumbers array เป็น object
  const runningMap: any = {}
  runningNumbers.forEach((running: any) => {
    runningMap[running.id] = running.number || []
  })

  // แปลงวันที่จาก "16 เมษายน 2569" เป็น "16/04/2026" (2569 - 543 = 2026)
  const thaiDate = response.date || ''
  const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ]

  let formattedDate = thaiDate
  const dateParts = thaiDate.match(/(\d+)\s+(\S+)\s+(\d+)/)
  if (dateParts) {
    const day = dateParts[1].padStart(2, '0')
    const monthName = dateParts[2]
    const year = parseInt(dateParts[3]) - 543 // แปลงจาก พ.ศ. เป็น ค.ศ.
    const monthIndex = thaiMonths.indexOf(monthName)
    const month = monthIndex >= 0 ? String(monthIndex + 1).padStart(2, '0') : '01'
    formattedDate = `${day}/${month}/${year}`
  }

  // สร้าง period ID จาก endpoint หรือ date
  const endpoint = response.endpoint || ''
  const periodMatch = endpoint.match(/check\/(\d+)/)
  const period = periodMatch ? periodMatch[1] : formattedDate.split('/').join('')

  return {
    date: formattedDate,
    period,
    first: prizesMap.prizeFirst?.[0] || '',
    firstNear: prizesMap.prizeFirstNear || [],
    second: prizesMap.prizeSecond || [],
    third: prizesMap.prizeThird || [],
    fourth: prizesMap.prizeForth || [], // ใช้ prizeForth (ไม่ใช่ Fourth)
    fifth: prizesMap.prizeFifth || [],
    runningNumberFront: runningMap.runningNumberFrontThree || [],
    runningNumberBack: runningMap.runningNumberBackThree || [],
    runningNumberBack2: runningMap.runningNumberBackTwo || []
  }
}

export default defineEventHandler(async (event): Promise<RayriffyLotteryResult> => {
  try {
    const query = getQuery(event)
    const id = query.id as string | undefined

    // สร้าง URL สำหรับเรียก API
    let apiUrl = 'https://lotto.api.rayriffy.com'

    if (id) {
      // ถ้ามี id ให้เรียกงวดเฉพาะ (รูปแบบ DDMMYYYY เช่น 16042569)
      apiUrl += `/${id}`
    } else {
      // ถ้าไม่มี id ให้เรียกงวดล่าสุด
      apiUrl += '/latest'
    }

    console.log('[Rayriffy API] Fetching from:', apiUrl)

    // เรียก API จาก rayriffy
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    if (!response.ok) {
      console.error('[Rayriffy API] HTTP Error:', response.status, response.statusText)
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`
      }
    }

    const contentType = response.headers.get('content-type')
    if (!contentType?.includes('application/json')) {
      console.error('[Rayriffy API] Invalid content type:', contentType)
      return {
        success: false,
        error: 'Invalid response format (not JSON)'
      }
    }

    const rawData = await response.json()
    console.log('[Rayriffy API] Raw data:', JSON.stringify(rawData).substring(0, 200))

    // เช็คว่า API return success หรือไม่
    if (rawData.status !== 'success') {
      console.error('[Rayriffy API] API returned error status')
      return {
        success: false,
        error: 'API returned error status'
      }
    }

    // แปลงข้อมูลเป็น format ของเรา
    const transformedData = transformData(rawData)

    if (!transformedData) {
      console.error('[Rayriffy API] Failed to transform data')
      return {
        success: false,
        error: 'Failed to transform data'
      }
    }

    console.log('[Rayriffy API] Success:', transformedData)

    return {
      success: true,
      data: transformedData
    }

  } catch (error: any) {
    console.error('[Rayriffy API] Error:', error)
    return {
      success: false,
      error: error.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล',
      message: 'ไม่สามารถดึงข้อมูลหวยได้ กรุณาลองใหม่อีกครั้ง'
    }
  }
})
