// server/api/lottery/test-endpoint.ts
/**
 * API Endpoint สำหรับทดสอบ lottery endpoints แต่ละตัว
 * ส่งคืนรายละเอียดสำหรับ debugging
 *
 * Usage: GET /api/lottery/test-endpoint?url=https://example.com/api
 */

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const testUrl = query.url as string | undefined

    if (!testUrl) {
      return {
        success: false,
        error: 'Missing url parameter',
        message: 'กรุณาระบุ URL ที่ต้องการทดสอบ (?url=...)'
      }
    }

    console.log(`🔍 Testing endpoint: ${testUrl}`)

    const startTime = Date.now()

    try {
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'th-TH,th;q=0.9,en-US;q=0.8,en;q=0.7'
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      })

      const endTime = Date.now()
      const responseTime = endTime - startTime

      const contentType = response.headers.get('content-type') || 'unknown'
      const text = await response.text()

      // ตรวจสอบว่าเป็น HTML หรือไม่
      const isHtml = text.includes('<!DOCTYPE') || text.includes('<html')

      // ตรวจสอบว่าเป็น JSON หรือไม่
      let jsonData = null
      let isValidJson = false

      try {
        jsonData = JSON.parse(text)
        isValidJson = true
      } catch (e) {
        // Not JSON
      }

      return {
        success: response.ok,
        url: testUrl,
        status: response.status,
        statusText: response.statusText,
        responseTime: `${responseTime}ms`,
        contentType,
        isHtml,
        isValidJson,
        dataPreview: isValidJson
          ? jsonData
          : text.substring(0, 200) + (text.length > 200 ? '...' : ''),
        headers: Object.fromEntries(response.headers.entries()),
        message: response.ok
          ? (isValidJson ? '✅ Endpoint ใช้งานได้และส่งคืน JSON' : '⚠️ Endpoint ใช้งานได้แต่ไม่ใช่ JSON')
          : `❌ Endpoint ล้มเหลว: ${response.status} ${response.statusText}`
      }

    } catch (fetchError: any) {
      const endTime = Date.now()
      const responseTime = endTime - startTime

      return {
        success: false,
        url: testUrl,
        error: fetchError.message,
        errorType: fetchError.name,
        responseTime: `${responseTime}ms`,
        message: `❌ ไม่สามารถเชื่อมต่อ: ${fetchError.message}`,
        details: fetchError.toString()
      }
    }

  } catch (error: any) {
    console.error('❌ Test error:', error)

    return {
      success: false,
      error: 'เกิดข้อผิดพลาดในการทดสอบ',
      message: error.message || 'Unknown error',
      details: error.toString()
    }
  }
})
