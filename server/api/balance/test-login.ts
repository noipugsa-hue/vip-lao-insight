import { defineEventHandler, getQuery } from 'h3'

/**
 * Endpoint สำหรับทดสอบการ login และดูว่าเกิดอะไรขึ้น
 * เพื่อ debug ปัญหา
 */
export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const username = query.username as string || '0991596297'
    const password = query.password as string || 'Wittaya4289'

    console.log('🔍 Starting balance fetch test...')
    console.log('Username:', username)

    // Import puppeteer
    const puppeteer = await import('puppeteer-core')

    // หา Chrome path
    let executablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

    if (process.platform === 'win32') {
      executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    } else if (process.platform === 'linux') {
      executablePath = '/usr/bin/google-chrome'
    }

    console.log('📍 Chrome path:', executablePath)

    // Launch browser with debug output
    console.log('🚀 Launching browser...')
    const browser = await puppeteer.default.launch({
      executablePath,
      headless: false, // เปิด browser ให้เห็น เพื่อ debug
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ],
      devtools: true // เปิด DevTools
    })

    const page = await browser.newPage()

    // Set viewport
    await page.setViewport({ width: 1280, height: 720 })

    console.log('🌐 Navigating to login page...')
    await page.goto('https://www.racha-lotto.net/#/login', {
      waitUntil: 'networkidle2',
      timeout: 30000
    })

    // Take screenshot
    console.log('📸 Taking screenshot 1 - Login page')
    await page.screenshot({ path: '/tmp/racha-login-1.png' })

    // Wait for login form
    console.log('⏳ Waiting for login form...')
    await page.waitForSelector('input', { timeout: 10000 })

    // Get all input fields
    const inputs = await page.$$eval('input', (elements) => {
      return elements.map((el) => ({
        type: el.type,
        name: el.name,
        id: el.id,
        placeholder: el.placeholder,
        class: el.className
      }))
    })
    console.log('📝 Found input fields:', JSON.stringify(inputs, null, 2))

    // Get all buttons
    const buttons = await page.$$eval('button', (elements) => {
      return elements.map((el) => ({
        text: el.textContent?.trim(),
        type: el.type,
        class: el.className
      }))
    })
    console.log('🔘 Found buttons:', JSON.stringify(buttons, null, 2))

    // Try to type username
    console.log('⌨️ Typing username...')
    const usernameInput = await page.$('input[type="text"], input[type="tel"], input[placeholder*="เบอร์"], input[placeholder*="username"]')
    if (usernameInput) {
      await usernameInput.type(username, { delay: 100 })
      console.log('✅ Username typed')
    } else {
      console.log('❌ Username input not found')
    }

    // Try to type password
    console.log('⌨️ Typing password...')
    const passwordInput = await page.$('input[type="password"]')
    if (passwordInput) {
      await passwordInput.type(password, { delay: 100 })
      console.log('✅ Password typed')
    } else {
      console.log('❌ Password input not found')
    }

    // Take screenshot after typing
    console.log('📸 Taking screenshot 2 - After typing')
    await page.screenshot({ path: '/tmp/racha-login-2.png' })

    // Try to click login button
    console.log('🖱️ Clicking login button...')
    const loginButton = await page.$('button[type="submit"], button:has-text("เข้าสู่ระบบ"), .login-btn, .btn-login')
    if (loginButton) {
      await loginButton.click()
      console.log('✅ Login button clicked')
    } else {
      // Try to find any button with login-related text
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
      console.log('✅ Login button clicked via text search')
    }

    // Wait for navigation
    console.log('⏳ Waiting for navigation...')
    await page.waitForNavigation({
      waitUntil: 'networkidle2',
      timeout: 15000
    }).catch(err => {
      console.log('⚠️ Navigation timeout (might be OK if using SPA)')
    })

    // Wait a bit more
    await new Promise(resolve => setTimeout(resolve, 3000))

    // Take screenshot after login
    console.log('📸 Taking screenshot 3 - After login')
    await page.screenshot({ path: '/tmp/racha-login-3.png' })

    // Get current URL
    const currentUrl = page.url()
    console.log('🌐 Current URL:', currentUrl)

    // Try to find balance elements
    console.log('💰 Looking for balance...')
    const balanceSelectors = [
      '.balance',
      '.wallet',
      '.credit',
      '.money',
      '[class*="balance"]',
      '[class*="wallet"]',
      '[class*="credit"]',
      '[class*="money"]'
    ]

    let balance = '0'
    for (const selector of balanceSelectors) {
      try {
        const element = await page.$(selector)
        if (element) {
          const text = await page.evaluate(el => el.textContent, element)
          console.log(`Found element with selector ${selector}:`, text)
          const match = text?.match(/[\d,]+\.?\d*/)
          if (match) {
            balance = match[0].replace(/,/g, '')
            console.log('✅ Balance found:', balance)
            break
          }
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    // If not found, get all text content
    if (balance === '0') {
      console.log('🔍 Searching entire page for balance...')
      const pageText = await page.evaluate(() => document.body.innerText)
      console.log('Page text preview:', pageText.substring(0, 500))

      // Look for patterns
      const patterns = [
        /ยอดเงิน[:\s]*([0-9,]+\.?\d*)/,
        /เครดิต[:\s]*([0-9,]+\.?\d*)/,
        /คงเหลือ[:\s]*([0-9,]+\.?\d*)/,
        /balance[:\s]*([0-9,]+\.?\d*)/i
      ]

      for (const pattern of patterns) {
        const match = pageText.match(pattern)
        if (match) {
          balance = match[1].replace(/,/g, '')
          console.log('✅ Balance found via pattern:', balance)
          break
        }
      }
    }

    // Keep browser open for manual inspection
    console.log('⏸️ Browser will stay open for 30 seconds for manual inspection...')
    console.log('Screenshots saved to:')
    console.log('  - /tmp/racha-login-1.png (login page)')
    console.log('  - /tmp/racha-login-2.png (after typing)')
    console.log('  - /tmp/racha-login-3.png (after login)')

    // Wait 30 seconds
    await new Promise(resolve => setTimeout(resolve, 30000))

    await browser.close()

    return {
      success: true,
      data: {
        balance,
        currentUrl,
        screenshots: [
          '/tmp/racha-login-1.png',
          '/tmp/racha-login-2.png',
          '/tmp/racha-login-3.png'
        ]
      },
      message: 'ตรวจสอบ console และ screenshots เพื่อดูรายละเอียด'
    }

  } catch (error: any) {
    console.error('❌ Error:', error)
    return {
      success: false,
      message: error.message,
      stack: error.stack
    }
  }
})
