import { defineEventHandler, getQuery } from 'h3'

/**
 * Server API endpoint สำหรับดึงข้อมูลหวยรัฐบาลจาก rayriffy API
 *
 * API: https://lotto.api.rayriffy.com
 * - /latest - งวดล่าสุด
 * - /list - รายการงวดทั้งหมด
 * - /:id - งวดเฉพาะ (เช่น 16-04-2025)
 *
 * Query Parameters:
 * - id: ID ของงวด (รูปแบบ DD-MM-YYYY เช่น 16-04-2025)
 */

interface RayriffyLotteryResult {
  success: boolean
  data?: {
    id: string // รูปแบบ DD-MM-YYYY
    date: string // วันที่ออกรางวัล
    endpoint: string
    prizes: {
      first?: { id: string, number: string }[]
      last2?: { number: string }[]
      last3back?: { number: string }[]
      last3front?: { number: string }[]
      near1?: { id: string, number: string }[]
      second?: { id: string, number: string }[]
      third?: { id: string, number: string }[]
      fourth?: { id: string, number: string }[]
      fifth?: { id: string, number: string }[]
    }
  }
  message?: string
  error?: string
}

// แปลงข้อมูลจาก rayriffy format เป็น format เดิมของเรา
const transformData = (rawData: any) => {
  if (!rawData) return null

  const prizes = rawData.prizes || {}

  return {
    date: rawData.date || rawData.id?.split('-').join('/') || '',
    period: rawData.id || '',
    first: prizes.first?.[0]?.number || '',
    firstNear: prizes.near1?.map((p: any) => p.number) || [],
    second: prizes.second?.map((p: any) => p.number) || [],
    third: prizes.third?.map((p: any) => p.number) || [],
    fourth: prizes.fourth?.map((p: any) => p.number) || [],
    fifth: prizes.fifth?.map((p: any) => p.number) || [],
    runningNumberFront: prizes.last3front?.map((p: any) => p.number) || [],
    runningNumberBack: prizes.last3back?.map((p: any) => p.number) || [],
    runningNumberBack2: prizes.last2?.map((p: any) => p.number) || []
  }
}

export default defineEventHandler(async (event): Promise<RayriffyLotteryResult> => {
  try {
    const query = getQuery(event)
    const id = query.id as string | undefined

    // สร้าง URL สำหรับเรียก API
    let apiUrl = 'https://lotto.api.rayriffy.com'

    if (id) {
      // ถ้ามี id ให้เรียกงวดเฉพาะ (รูปแบบ DD-MM-YYYY)
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
    console.log('[Rayriffy API] Raw data:', rawData)

    // แปลงข้อมูลเป็น format ของเรา
    const transformedData = transformData(rawData)

    console.log('[Rayriffy API] Transformed data:', transformedData)

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
