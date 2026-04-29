import { defineEventHandler, getQuery } from 'h3'

/**
 * Server API endpoint สำหรับดึงข้อมูลหวยรัฐบาลจาก glo.or.th
 *
 * API: https://www.glo.or.th/api/checking/getLotteryResult
 *
 * Query Parameters:
 * - date: วันที่ในรูปแบบ DD/MM/YYYY (ถ้าไม่ระบุจะดึงงวดล่าสุด)
 */

interface GLOLotteryResult {
  success: boolean
  data?: {
    date: string // วันที่ออกรางวัล
    period: string // งวดที่
    first: string // รางวัลที่ 1 (6 หลัก)
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

export default defineEventHandler(async (event): Promise<GLOLotteryResult> => {
  try {
    const query = getQuery(event)
    const date = query.date as string | undefined

    // สร้าง URL สำหรับเรียก API
    let apiUrl = 'https://www.glo.or.th/api/checking/getLotteryResult'

    // ถ้ามีการระบุวันที่ ให้เพิ่ม parameter
    if (date) {
      apiUrl += `?date=${encodeURIComponent(date)}`
    }

    console.log('[GLO API] Fetching from:', apiUrl)

    // เรียก API จาก glo.or.th
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    if (!response.ok) {
      console.error('[GLO API] HTTP Error:', response.status, response.statusText)
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`
      }
    }

    const contentType = response.headers.get('content-type')
    if (!contentType?.includes('application/json')) {
      console.error('[GLO API] Invalid content type:', contentType)
      return {
        success: false,
        error: 'Invalid response format (not JSON)'
      }
    }

    const data = await response.json()

    console.log('[GLO API] Success:', data)

    return {
      success: true,
      data
    }

  } catch (error: any) {
    console.error('[GLO API] Error:', error)
    return {
      success: false,
      error: error.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล',
      message: 'ไม่สามารถดึงข้อมูลหวยได้ กรุณาลองใหม่อีกครั้ง'
    }
  }
})
