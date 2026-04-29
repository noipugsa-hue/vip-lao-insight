// server/api/lottery/fetch.ts
/**
 * API Endpoint สำหรับดึงข้อมูลหวยจาก racha-lotto.net
 * ใช้เป็น proxy เพื่อหลีกเลี่ยงปัญหา CORS
 *
 * Usage:
 * GET /api/lottery/fetch
 * POST /api/lottery/fetch?customUrl=https://your-api.com/lottery
 */

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const customUrl = query.customUrl as string | undefined

    // ลิสต์ของ API endpoints ที่เป็นไปได้
    const possibleEndpoints = [
      'https://www.racha-lotto.net/api/result-product/LA',
      'https://api.racha-lotto.net/result-product/LA',
      'https://www.racha-lotto.net/api/results/LA',
      'https://api.racha-lotto.net/results/LA',
      'https://www.racha-lotto.net/api/lao/latest',
      'https://api.racha-lotto.net/lao/latest'
    ]

    // ถ้ามี custom URL ให้ใช้อันนั้นก่อน
    const endpoints = customUrl ? [customUrl, ...possibleEndpoints] : possibleEndpoints

    let responseData: any = null
    let successUrl = ''

    // ลองดึงข้อมูลจากแต่ละ endpoint
    for (const endpoint of endpoints) {
      try {
        console.log(`🔍 Trying to fetch from: ${endpoint}`)

        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'th-TH,th;q=0.9,en-US;q=0.8,en;q=0.7'
          }
        })

        if (response.ok) {
          const contentType = response.headers.get('content-type')
          const text = await response.text()

          // ตรวจสอบว่าเป็น HTML หรือไม่
          if (text.includes('<!DOCTYPE') || text.includes('<html')) {
            console.log(`⚠️ ${endpoint} returned HTML (not a valid API endpoint)`)
            continue
          }

          // ตรวจสอบว่าเป็น JSON หรือไม่
          try {
            const data = JSON.parse(text)
            responseData = data
            successUrl = endpoint
            console.log(`✅ Success from: ${endpoint}`)
            break
          } catch (parseError) {
            console.log(`❌ Cannot parse JSON from ${endpoint}`)
            continue
          }
        } else {
          console.log(`❌ Failed from ${endpoint}: ${response.status} ${response.statusText}`)
        }
      } catch (error: any) {
        console.log(`❌ Error from ${endpoint}:`, error.message)
        continue
      }
    }

    if (!responseData) {
      return {
        success: false,
        error: 'ไม่สามารถดึงข้อมูลจาก API ใดๆ ได้',
        message: `ลอง endpoints ทั้งหมด (${endpoints.length} endpoints) แล้วแต่ไม่สำเร็จ\n\n💡 แนะนำ:\n• ใช้ปุ่ม "✏️ เพิ่มเลขด้วยตัวเอง" ด้านล่าง\n• ลองใช้ "🧪 ทดสอบระบบ (Demo)" เพื่อทดสอบ\n• หรือติดต่อผู้ดูแลเว็บ racha-lotto.net`,
        triedEndpoints: endpoints,
        suggestion: 'manual-entry'
      }
    }

    // แปลงข้อมูลให้เป็นรูปแบบมาตรฐาน
    // โครงสร้างข้อมูลอาจแตกต่างกันไปตาม API จริง
    const normalizedData = {
      success: true,
      data: {
        date: responseData.date || responseData.drawDate || new Date().toISOString().split('T')[0],
        period: responseData.period || responseData.round || responseData.periodNumber || 'latest',
        threeDigit: responseData.threeDigit || responseData.number3 || responseData.result || responseData.winning3Digit,
        twoDigit: responseData.twoDigit || responseData.number2 || responseData.winning2Digit,
        fourDigit: responseData.fourDigit || responseData.number4 || responseData.winning4Digit,
        source: successUrl,
        fetchedAt: new Date().toISOString()
      },
      rawData: responseData // เก็บข้อมูลดิบไว้สำหรับ debug
    }

    return normalizedData

  } catch (error: any) {
    console.error('❌ Server error:', error)

    return {
      success: false,
      error: 'เกิดข้อผิดพลาดในการดึงข้อมูล',
      message: error.message || 'Unknown error',
      details: error.toString()
    }
  }
})
