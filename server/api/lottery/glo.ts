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

// ฟังก์ชันสำหรับดึงจาก glo.or.th API (fallback)
const fetchFromGLO = async (id?: string) => {
  try {
    const gloUrl = id
      ? `https://www.glo.or.th/api/lottery/${id}`
      : 'https://www.glo.or.th/api/lottery/latest'

    const response = await fetch(gloUrl, {
      signal: AbortSignal.timeout(8000) // timeout 8 วินาที
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()

    // แปลงข้อมูลจาก glo.or.th format
    if (data && data.date) {
      return {
        date: data.date,
        period: data.period || data.id,
        first: data.first || '',
        firstNear: data.firstNear || [],
        second: data.second || [],
        third: data.third || [],
        fourth: data.fourth || [],
        fifth: data.fifth || [],
        runningNumberFront: data.runningNumberFront || [],
        runningNumberBack: data.runningNumberBack || [],
        runningNumberBack2: data.runningNumberBack2 || []
      }
    }

    return null
  } catch (err) {
    return null
  }
}

export default defineEventHandler(async (event): Promise<RayriffyLotteryResult> => {
  const query = getQuery(event)
  const id = query.id as string | undefined

  console.log('[GLO API] 🔍 Request:', { id: id || 'latest' })

  // ลอง rayriffy ก่อน (ด้วย timeout สั้น)
  try {
    const apiUrl = id
      ? `https://lotto.api.rayriffy.com/${id}`
      : 'https://lotto.api.rayriffy.com/latest'

    console.log('[Rayriffy API] 📞 Fetching:', apiUrl)

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      signal: AbortSignal.timeout(5000) // timeout 5 วินาที
    })

    console.log('[Rayriffy API] 📡 Response status:', response.status)

    if (response.ok) {
      const contentType = response.headers.get('content-type')
      console.log('[Rayriffy API] 📄 Content-Type:', contentType)

      if (contentType?.includes('application/json')) {
        const rawData = await response.json()
        console.log('[Rayriffy API] 📦 Data status:', rawData.status)

        if (rawData.status === 'success') {
          const transformedData = transformData(rawData)

          if (transformedData) {
            console.log('[Rayriffy API] ✅ Success - Period:', transformedData.period)
            return {
              success: true,
              data: transformedData
            }
          } else {
            console.warn('[Rayriffy API] ⚠️ Transform failed')
          }
        } else {
          console.warn('[Rayriffy API] ⚠️ Status not success:', rawData.status)
        }
      }
    }
  } catch (err: any) {
    console.error('[Rayriffy API] ❌ Error:', err.message)
  }

  // Fallback: ลอง glo.or.th API
  try {
    console.log('[GLO API] 📞 Trying fallback...')
    const gloData = await fetchFromGLO(id)

    if (gloData) {
      console.log('[GLO API] ✅ Success (fallback) - Period:', gloData.period)
      return {
        success: true,
        data: gloData
      }
    } else {
      console.warn('[GLO API] ⚠️ No data returned')
    }
  } catch (err: any) {
    console.error('[GLO API] ❌ Error:', err.message)
  }

  // ถ้าทั้งสอง API ล้มเหลว
  console.error('[GLO API] 💥 Both APIs failed!')
  return {
    success: false,
    error: 'ไม่สามารถดึงข้อมูลหวยได้ในขณะนี้',
    message: 'กรุณาลองใหม่อีกครั้ง'
  }
})
