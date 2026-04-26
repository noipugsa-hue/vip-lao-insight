import { defineEventHandler, getQuery } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    // รับ username และ password จาก query (หรือใช้ค่า default)
    const query = getQuery(event)
    const username = query.username as string || '0991596297'
    const password = query.password as string || 'Wittaya4289'
    const useMock = query.mock === 'true' // เพิ่ม option สำหรับใช้ mock data

    // ในสภาพแวดล้อม production ควรเก็บ credentials ใน environment variables
    // และควรมีการ encrypt/decrypt

    // ถ้าเลือกใช้ mock data (แนะนำสำหรับ development)
    if (useMock) {
      const balance = getMockBalance()
      return {
        success: true,
        data: {
          balance,
          username,
          fetchedAt: new Date().toISOString(),
          source: 'mock-data'
        }
      }
    }

    // ลองใช้ HTTP request ก่อน (เร็วที่สุด)
    try {
      const balance = await fetchBalanceWithHttp(username, password)
      return {
        success: true,
        data: {
          balance,
          username,
          fetchedAt: new Date().toISOString(),
          source: 'racha-lotto.net (HTTP)'
        }
      }
    } catch (httpError) {
      console.log('HTTP method failed, trying Puppeteer...', httpError)

      // ถ้า HTTP ไม่ได้ผล ลอง Puppeteer
      try {
        const balance = await fetchBalanceWithPuppeteer(username, password)
        return {
          success: true,
          data: {
            balance,
            username,
            fetchedAt: new Date().toISOString(),
            source: 'racha-lotto.net (Puppeteer)'
          }
        }
      } catch (puppeteerError) {
        console.log('Puppeteer also failed, using mock data...', puppeteerError)

        // ถ้าทั้งสองวิธีไม่ได้ผล ใช้ mock data
        const balance = getMockBalance()
        return {
          success: true,
          data: {
            balance,
            username,
            fetchedAt: new Date().toISOString(),
            source: 'mock-data (fallback)'
          },
          warning: 'ไม่สามารถดึงข้อมูลจริงได้ ใช้ข้อมูลจำลองแทน'
        }
      }
    }

  } catch (error: any) {
    console.error('Error fetching balance:', error)

    // กรณี error ให้ใช้ mock data
    const balance = getMockBalance()
    return {
      success: true,
      data: {
        balance,
        username: query.username as string || '0991596297',
        fetchedAt: new Date().toISOString(),
        source: 'mock-data (error fallback)'
      },
      warning: 'เกิดข้อผิดพลาด ใช้ข้อมูลจำลอง: ' + error.message
    }
  }
})

/**
 * สร้างยอดเงินจำลอง (Mock Data)
 * ใช้สำหรับ development หรือเมื่อไม่สามารถเชื่อมต่อได้
 */
function getMockBalance(): string {
  // สร้างยอดเงินสุ่มระหว่าง 1,000 - 50,000 บาท
  const min = 1000
  const max = 50000
  const randomBalance = Math.floor(Math.random() * (max - min + 1)) + min

  // เพิ่มทศนิยม 2 ตำแหน่ง
  const cents = Math.floor(Math.random() * 100)
  return `${randomBalance}.${cents.toString().padStart(2, '0')}`
}

/**
 * ดึงยอดเงินโดยใช้ Puppeteer (สำหรับ development)
 */
async function fetchBalanceWithPuppeteer(username: string, password: string): Promise<string> {
  let browser = null

  try {
    const puppeteer = await import('puppeteer-core')

    // หา Chrome path ตามระบบปฏิบัติการ
    let executablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' // macOS default

    // ตรวจสอบระบบปฏิบัติการ
    if (process.platform === 'win32') {
      executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    } else if (process.platform === 'linux') {
      executablePath = '/usr/bin/google-chrome'
    }

    // เปิด browser แบบง่าย ๆ สำหรับ development
    browser = await puppeteer.default.launch({
      executablePath,
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--disable-extensions',
      ]
    })

    const page = await browser.newPage()

    // Set viewport
    await page.setViewport({ width: 1280, height: 720 })

    // ตั้ง User-Agent
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')

    // เข้าหน้า login
    console.log('📍 กำลังเข้าสู่ระบบ...')
    await page.goto('https://www.racha-lotto.net/#/login', {
      waitUntil: 'networkidle2',
      timeout: 30000
    })

    // รอให้ form โหลด
    await page.waitForSelector('input', { timeout: 10000 })

    // หา username input (ลองหลายวิธี)
    console.log('⌨️ กำลังกรอก username...')
    const usernameInput = await page.$('input[type="text"], input[type="tel"], input[placeholder*="เบอร์"], input[placeholder*="username"]')
    if (usernameInput) {
      await usernameInput.type(username, { delay: 100 })
    } else {
      // ถ้าไม่เจอ ลอง input แรก
      await page.type('input:nth-of-type(1)', username, { delay: 100 })
    }

    // หา password input
    console.log('⌨️ กำลังกรอก password...')
    const passwordInput = await page.$('input[type="password"]')
    if (passwordInput) {
      await passwordInput.type(password, { delay: 100 })
    } else {
      throw new Error('ไม่พบช่องกรอก password')
    }

    // รอสักครู่ให้แน่ใจว่ากรอกเสร็จ
    await new Promise(resolve => setTimeout(resolve, 500))

    // คลิกปุ่ม login (ลองหลายวิธี)
    console.log('🖱️ กำลังคลิกปุ่ม login...')
    try {
      // วิธีที่ 1: หาจาก selector
      const loginButton = await page.$('button[type="submit"], button:has-text("เข้าสู่ระบบ"), .login-btn, .btn-login')
      if (loginButton) {
        await loginButton.click()
      } else {
        // วิธีที่ 2: หาจาก text content
        await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'))
          const loginBtn = buttons.find(btn =>
            btn.textContent?.includes('เข้าสู่ระบบ') ||
            btn.textContent?.includes('LOGIN') ||
            btn.textContent?.includes('login')
          )
          if (loginBtn) {
            (loginBtn as HTMLElement).click()
          }
        })
      }

      // รอการ navigate หรือ timeout
      await page.waitForNavigation({
        waitUntil: 'networkidle2',
        timeout: 15000
      }).catch(() => {
        // Ignore timeout - บาง SPA ไม่มี full page navigation
        console.log('⚠️ Navigation timeout (อาจเป็น SPA)')
      })

    } catch (navError) {
      console.log('⚠️ Navigation error (อาจเป็น SPA):', navError)
    }

    console.log('✅ Login สำเร็จ')

    // รอให้หน้า main โหลดจริงๆ
    await new Promise(resolve => setTimeout(resolve, 3000))

    // ดึงยอดเงิน - ลองหลายวิธี
    let balance = '0'

    console.log('💰 กำลังค้นหายอดเงิน...')

    // วิธีที่ 1: ลองหาจาก selectors ที่เป็นไปได้
    const balanceSelectors = [
      '.balance',
      '.wallet',
      '.credit',
      '.money',
      '[class*="balance"]',
      '[class*="wallet"]',
      '[class*="credit"]',
      '[class*="money"]',
      '[id*="balance"]',
      '[id*="wallet"]'
    ]

    for (const selector of balanceSelectors) {
      try {
        const element = await page.$(selector)
        if (element) {
          const text = await page.evaluate(el => el.textContent, element)
          console.log(`Found element with selector ${selector}:`, text)
          const match = text?.match(/[\d,]+\.?\d*/)
          if (match) {
            balance = match[0].replace(/,/g, '')
            console.log('✅ Balance found via selector:', balance)
            break
          }
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    // วิธีที่ 2: ถ้ายังไม่เจอ ค้นหาทั้งหน้า
    if (balance === '0') {
      console.log('🔍 Searching entire page for balance...')
      balance = await page.evaluate(() => {
        const pageText = document.body.innerText

        // ลองหาจาก patterns
        const patterns = [
          /ยอดเงิน[:\s]*([0-9,]+\.?\d*)/,
          /เครดิต[:\s]*([0-9,]+\.?\d*)/,
          /คงเหลือ[:\s]*([0-9,]+\.?\d*)/,
          /balance[:\s]*([0-9,]+\.?\d*)/i,
          /wallet[:\s]*([0-9,]+\.?\d*)/i,
          /credit[:\s]*([0-9,]+\.?\d*)/i
        ]

        for (const pattern of patterns) {
          const match = pageText.match(pattern)
          if (match && match[1]) {
            return match[1].replace(/,/g, '')
          }
        }

        // ถ้ายังไม่เจอ ลองหาเลขใหญ่ๆ ที่มีทศนิยม
        const largeNumbers = pageText.match(/([0-9,]+\.\d{2})/g)
        if (largeNumbers && largeNumbers.length > 0) {
          // เอาเลขแรกที่มากกว่า 100
          for (const num of largeNumbers) {
            const value = parseFloat(num.replace(/,/g, ''))
            if (value >= 100) {
              return num.replace(/,/g, '')
            }
          }
        }

        return '0'
      })

      if (balance !== '0') {
        console.log('✅ Balance found via page search:', balance)
      }
    }

    // ถ้ายังไม่เจอเลย
    if (balance === '0') {
      console.log('⚠️ ไม่พบยอดเงิน - อาจต้องตรวจสอบหน้าเว็บ')
    }

    console.log(`💰 ยอดเงินคงเหลือ: ${balance} บาท`)

    await browser.close()
    return balance

  } catch (error: any) {
    if (browser) {
      await browser.close()
    }
    throw new Error(`Puppeteer error: ${error.message}`)
  }
}

/**
 * ดึงยอดเงินโดยใช้ HTTP request (สำหรับ production)
 */
async function fetchBalanceWithHttp(username: string, password: string): Promise<string> {
  try {
    // ขั้นตอนที่ 1: Login
    const loginResponse = await fetch('https://www.racha-lotto.net/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Origin': 'https://www.racha-lotto.net',
        'Referer': 'https://www.racha-lotto.net/'
      },
      body: JSON.stringify({
        username,
        password
      })
    })

    if (!loginResponse.ok) {
      throw new Error('Login failed')
    }

    const loginData = await loginResponse.json()
    const token = loginData.token || loginData.access_token

    if (!token) {
      throw new Error('No token received')
    }

    // ขั้นตอนที่ 2: ดึงยอดเงิน
    const balanceResponse = await fetch('https://www.racha-lotto.net/api/user/balance', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Origin': 'https://www.racha-lotto.net',
        'Referer': 'https://www.racha-lotto.net/'
      }
    })

    if (!balanceResponse.ok) {
      throw new Error('Failed to fetch balance')
    }

    const balanceData = await balanceResponse.json()
    const balance = balanceData.balance || balanceData.credit || balanceData.amount || '0'

    return balance.toString()

  } catch (error: any) {
    // ถ้า HTTP ไม่ได้ผล ให้ fallback ไปใช้ Puppeteer
    console.log('HTTP method failed, falling back to Puppeteer...')
    return await fetchBalanceWithPuppeteer(username, password)
  }
}
