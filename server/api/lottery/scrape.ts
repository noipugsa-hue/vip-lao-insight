// server/api/lottery/scrape.ts
/**
 * Puppeteer-based scraper for racha-lotto.net
 *
 * ⚠️ WARNING: This endpoint requires Puppeteer/Chrome which may not work on Vercel
 *
 * For local development: Works fine
 * For production: Consider using:
 *  1. External scraping service (ScrapingBee, Bright Data)
 *  2. Manual entry form
 *  3. Separate scraping server
 *
 * Usage: GET /api/lottery/scrape
 */

export default defineEventHandler(async (event) => {
  try {
    // ตรวจสอบว่าเป็น development หรือ production
    const isDev = process.env.NODE_ENV === 'development'

    if (!isDev) {
      return {
        success: false,
        error: 'Puppeteer scraping is not available in production',
        message: 'กรุณาใช้ฟอร์มเพิ่มเลขด้วยตัวเอง หรือใช้ปุ่มทดสอบระบบ (Demo)',
        suggestion: 'Use manual entry form or demo API for production'
      }
    }

    // Dynamic import เพื่อหลีกเลี่ยง error ตอน build
    let puppeteer: any
    let chromium: any

    try {
      // ลอง import puppeteer-core และ chrome-aws-lambda
      puppeteer = await import('puppeteer-core')
      chromium = await import('chrome-aws-lambda')
    } catch (importError) {
      // ถ้า import ไม่ได้ แสดงว่ายังไม่ได้ติดตั้ง
      return {
        success: false,
        error: 'Puppeteer not installed',
        message: 'กรุณารัน: npm install puppeteer-core chrome-aws-lambda',
        details: 'Dependencies required for scraping are not installed'
      }
    }

    console.log('🚀 Starting Puppeteer scraper...')

    // เริ่ม browser
    const browser = await puppeteer.default.launch({
      args: chromium.default.args,
      defaultViewport: chromium.default.defaultViewport,
      executablePath: await chromium.default.executablePath || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      headless: true,
    })

    const page = await browser.newPage()

    // ตั้งค่า User Agent
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')

    console.log('📄 Navigating to racha-lotto.net...')

    // ไปที่หน้าเว็บ
    await page.goto('https://www.racha-lotto.net/#/result-product/LA', {
      waitUntil: 'networkidle2',
      timeout: 30000
    })

    console.log('⏳ Waiting for lottery results to load...')

    // รอให้ข้อมูลโหลด (ปรับ selector ตามโครงสร้างเว็บจริง)
    // ต้องตรวจสอบ HTML structure ของเว็บจริงก่อน
    try {
      await page.waitForSelector('[class*="result"], [class*="lottery"], [class*="number"]', { timeout: 10000 })
    } catch (e) {
      console.log('⚠️  Selector not found, trying to extract any visible text...')
    }

    console.log('📊 Extracting lottery data...')

    // ดึงข้อมูล
    const data = await page.evaluate(() => {
      // ⚠️ ต้องปรับ logic นี้ให้ตรงกับโครงสร้าง HTML จริง
      // นี่เป็นตัวอย่างทั่วไป

      // วิธีที่ 1: หาจาก class หรือ id ที่มีคำว่า result, lottery, number
      const resultElements = document.querySelectorAll('[class*="result"], [class*="lottery"], [class*="number"], [class*="draw"]')

      const texts: string[] = []
      resultElements.forEach(el => {
        const text = el.textContent?.trim()
        if (text && text.length >= 2 && text.length <= 10) {
          // เลขที่เป็นไปได้
          if (/^\d+$/.test(text)) {
            texts.push(text)
          }
        }
      })

      // วิธีที่ 2: หาเลข 3 ตัวจาก body ทั้งหมด
      const bodyText = document.body.innerText
      const matches = bodyText.match(/\b\d{3}\b/g) || []

      return {
        foundNumbers: texts,
        threeDigitMatches: [...new Set(matches)], // unique only
        pageTitle: document.title,
        timestamp: new Date().toISOString()
      }
    })

    await browser.close()

    console.log('✅ Scraping completed!')
    console.log('Found data:', data)

    // ตรวจสอบว่าได้ข้อมูลหรือไม่
    if (data.foundNumbers.length === 0 && data.threeDigitMatches.length === 0) {
      return {
        success: false,
        error: 'No lottery numbers found',
        message: 'ไม่พบข้อมูลเลขหวยในหน้าเว็บ กรุณาเช็ค HTML selectors',
        debug: data
      }
    }

    // เดาเลข 3 ตัวที่น่าจะเป็นผลหวย (เลขแรกที่เจอ หรือ เลขที่ปรากฏบ่อยสุด)
    const threeDigit = data.foundNumbers.find(n => n.length === 3) || data.threeDigitMatches[0] || '000'

    const result = {
      success: true,
      data: {
        date: new Date().toISOString().split('T')[0],
        period: 'scraped',
        threeDigit: threeDigit,
        twoDigit: threeDigit.slice(1, 3),
        fourDigit: `1${threeDigit}`,
        source: 'racha-lotto.net (puppeteer)',
        fetchedAt: new Date().toISOString()
      },
      debug: {
        foundNumbers: data.foundNumbers,
        threeDigitMatches: data.threeDigitMatches.slice(0, 10), // first 10 only
        pageTitle: data.pageTitle
      }
    }

    return result

  } catch (error: any) {
    console.error('❌ Scraping error:', error)

    return {
      success: false,
      error: 'Scraping failed',
      message: error.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล',
      details: error.toString()
    }
  }
})
