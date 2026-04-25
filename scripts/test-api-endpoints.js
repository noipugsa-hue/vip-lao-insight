// Script to test various API endpoint patterns for racha-lotto.net
// Run: node scripts/test-api-endpoints.js

const endpoints = [
  // REST API patterns
  'https://www.racha-lotto.net/api/result-product/LA',
  'https://www.racha-lotto.net/api/results/LA',
  'https://www.racha-lotto.net/api/lottery/LA',
  'https://www.racha-lotto.net/api/lao/latest',
  'https://www.racha-lotto.net/api/v1/results/LA',
  'https://www.racha-lotto.net/api/v1/lottery/lao',

  // Different domain patterns
  'https://api.racha-lotto.net/result-product/LA',
  'https://api.racha-lotto.net/results/LA',
  'https://api.racha-lotto.net/lottery/LA',
  'https://api.racha-lotto.net/lao/latest',
  'https://api.racha-lotto.net/v1/results/LA',

  // Backend patterns
  'https://backend.racha-lotto.net/results/LA',
  'https://backend.racha-lotto.net/lottery/lao',

  // Data patterns
  'https://data.racha-lotto.net/LA',
  'https://data.racha-lotto.net/results/LA',
]

async function testEndpoint(url) {
  try {
    console.log(`\n🔍 Testing: ${url}`)

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'th-TH,th;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': 'https://www.racha-lotto.net/'
      }
    })

    console.log(`   Status: ${response.status} ${response.statusText}`)
    console.log(`   Content-Type: ${response.headers.get('content-type')}`)

    if (response.ok) {
      const contentType = response.headers.get('content-type')

      if (contentType && contentType.includes('application/json')) {
        const data = await response.json()
        console.log(`   ✅ SUCCESS! Got JSON data:`)
        console.log(`   ${JSON.stringify(data, null, 2).substring(0, 500)}...`)
        return { url, success: true, data }
      } else {
        const text = await response.text()
        if (text.includes('<!DOCTYPE') || text.includes('<html')) {
          console.log(`   ⚠️  Got HTML (not API)`)
        } else {
          console.log(`   📄 Got text response (first 200 chars):`)
          console.log(`   ${text.substring(0, 200)}...`)
        }
      }
    } else {
      console.log(`   ❌ Failed: ${response.status}`)
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`)
  }

  return { url, success: false }
}

async function main() {
  console.log('🚀 Testing racha-lotto.net API endpoints...\n')
  console.log(`Testing ${endpoints.length} possible endpoints...\n`)

  const results = []

  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint)
    results.push(result)

    // ถ้าเจอที่ใช้ได้ ให้หยุด
    if (result.success) {
      console.log(`\n\n🎉 FOUND WORKING ENDPOINT!`)
      console.log(`\nURL: ${result.url}`)
      console.log(`\nAdd this to server/api/lottery/fetch.ts:`)
      console.log(`const possibleEndpoints = ['${result.url}', ...]`)
      break
    }
  }

  const successful = results.filter(r => r.success)

  if (successful.length === 0) {
    console.log(`\n\n❌ No working API endpoints found.`)
    console.log(`\n📝 Next steps:`)
    console.log(`1. Open racha-lotto.net in Chrome`)
    console.log(`2. Open DevTools (F12) > Network tab`)
    console.log(`3. Filter by Fetch/XHR`)
    console.log(`4. Refresh the page`)
    console.log(`5. Look for API calls and copy the URL`)
    console.log(`6. Run: node scripts/test-api-endpoints.js <URL>`)
  }
}

// ถ้าส่ง URL เดี่ยวมา
if (process.argv[2]) {
  testEndpoint(process.argv[2])
} else {
  main()
}
