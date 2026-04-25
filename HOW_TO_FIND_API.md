# 🔍 วิธีหา API Endpoint จริงของ racha-lotto.net

ถ้าคุณต้องการให้ระบบดึงข้อมูลอัตโนมัติได้จริงๆ ให้ทำตามขั้นตอนนี้:

## 📋 ขั้นตอนการหา API:

### 1. เปิดเว็บ racha-lotto.net
```
https://www.racha-lotto.net/#/result-product/LA
```

### 2. เปิด Developer Tools
- กด `F12` หรือ
- คลิกขวา > Inspect

### 3. ไปที่แท็บ Network
- คลิกแท็บ **"Network"**
- ติ๊กถูก **"Preserve log"** (ด้านบน)

### 4. Filter เป็น Fetch/XHR
- ใน Network tab จะมี filter bar
- เลือก **"Fetch/XHR"** เพื่อดูเฉพาะ API calls

### 5. Refresh หน้าเว็บ
- กด `Ctrl/Cmd + R` หรือปุ่ม refresh
- ดู requests ที่ปรากฏขึ้นมา

### 6. หา Request ที่ดึงข้อมูลหวย
มองหา request ที่มีชื่อเกี่ยวกับ:
- `result`
- `lottery`
- `lao`
- `draw`
- `winning`
- API path ที่ดูเหมือนจะเป็น endpoint

**ตัวอย่าง URL ที่อาจพบ:**
- `https://api.racha-lotto.net/v1/results/la`
- `https://www.racha-lotto.net/api/lottery/latest`
- `https://backend.racha-lotto.net/draws/lao`

### 7. ตรวจสอบ Response
- คลิกที่ request นั้น
- ไปที่แท็บ **"Response"**
- ดูว่ามีข้อมูลหวยในรูปแบบ JSON หรือไม่

**ตัวอย่าง JSON ที่ถูกต้อง:**
```json
{
  "date": "2026-04-25",
  "period": "123",
  "result": "456",
  "number3": "456",
  "threeDigit": "456"
}
```

### 8. คัดลอก URL
- คลิกขวาที่ request นั้น
- เลือก **"Copy"** > **"Copy URL"**
- หรือดูใน **Headers** tab > **Request URL**

### 9. เพิ่ม URL ลงในโค้ด

แก้ไขไฟล์: `server/api/lottery/fetch.ts`

หา section นี้:
```typescript
const possibleEndpoints = [
  'https://www.racha-lotto.net/api/result-product/LA',
  'https://api.racha-lotto.net/result-product/LA',
  // ... endpoints อื่น ๆ
]
```

**เพิ่ม URL ที่คุณหาเจอไว้ด้านบนสุด:**
```typescript
const possibleEndpoints = [
  'URL_ที่คุณหาเจอ',  // ← เพิ่มตรงนี้
  'https://www.racha-lotto.net/api/result-product/LA',
  'https://api.racha-lotto.net/result-product/LA',
  // ...
]
```

### 10. Restart Dev Server
```bash
# หยุด server (Ctrl+C)
npm run dev
```

### 11. ทดสอบใหม่
- เปิดหน้า `/admin`
- กดปุ่ม **"🎯 ดึงจาก racha-lotto.net"**
- ควรจะดึงข้อมูลได้สำเร็จ

---

## 🎯 เคล็ดลับการหา API:

### เทคนิค 1: ดูจาก Request Method
- API ที่ดึงข้อมูลมักจะเป็น **GET request**
- URL มักจะมี path ที่สื่อความหมาย เช่น `/api/`, `/v1/`, `/results/`

### เทคนิค 2: ดูจาก Content-Type
- Response ของ API ที่เราต้องการจะเป็น:
  - `Content-Type: application/json`
- ถ้าเป็น `text/html` แสดงว่าไม่ใช่ API endpoint

### เทคนิค 3: ทดสอบ URL โดยตรง
- Copy URL ที่คิดว่าเป็น API
- เปิดในแท็บใหม่
- ถ้าได้ JSON กลับมา แสดงว่าถูกต้อง

### เทคนิค 4: ดู Query Parameters
บาง API อาจต้องมี parameters:
```
https://api.example.com/results?type=LA&date=2026-04-25
```

---

## ⚠️ กรณีพิเศษ

### ถ้า API ต้อง Authentication
บาง API ต้องการ token หรือ login ก่อน:

**Headers ที่อาจต้องมี:**
- `Authorization: Bearer TOKEN`
- `X-API-Key: API_KEY`
- `Cookie: session_id=...`

**วิธีแก้:**
1. ดู request headers ใน Developer Tools
2. คัดลอก headers ที่จำเป็น
3. เพิ่มใน server API:

```typescript
const response = await fetch(endpoint, {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'X-API-Key': 'YOUR_KEY'
  }
})
```

### ถ้า API มี Rate Limiting
- API บางตัวจำกัดจำนวน requests ต่อชั่วโมง
- ควรตั้ง interval ให้เหมาะสม (เช่น 1 ชั่วโมง แทน 1 นาที)

### ถ้าใช้ GraphQL
บาง API ใช้ GraphQL แทน REST:
- URL มักจะเป็น `/graphql`
- ใช้ POST method
- ต้องส่ง query ใน body

---

## 🚫 เมื่อไหร่ควรใช้วิธีอื่น

ถ้าคุณพบว่า:
- ✅ API ต้อง login
- ✅ API ต้อง token ที่หมดอายุ
- ✅ เว็บใช้ WebSocket แทน HTTP
- ✅ ข้อมูลถูก encrypt หรือ obfuscate
- ✅ เว็บมีการป้องกัน bot (Cloudflare, reCAPTCHA)

**แนะนำให้ใช้:**
1. **การเพิ่มเลขด้วยตัวเอง** - วิธีที่ง่ายและเชื่อถือได้ที่สุด
2. **Web Scraping with Puppeteer** - ซับซ้อนแต่ bypass ได้หลายอย่าง
3. **Chrome Extension** - ดึงข้อมูลจาก client-side

---

## 💡 ตัวอย่างการใช้ Puppeteer (ขั้นสูง)

ถ้าไม่มี API ให้ใช้ web scraping:

```bash
npm install puppeteer
```

สร้างไฟล์ `server/api/lottery/scrape.ts`:

```typescript
import puppeteer from 'puppeteer'

export default defineEventHandler(async () => {
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()

  await page.goto('https://www.racha-lotto.net/#/result-product/LA')
  await page.waitForSelector('.lottery-result') // รอ element โหลด

  // Extract ข้อมูล
  const result = await page.evaluate(() => {
    const element = document.querySelector('.lottery-result')
    return element?.textContent
  })

  await browser.close()

  return { success: true, result }
})
```

**ข้อเสีย:**
- ใช้ resources เยอะ
- ช้ากว่า API
- อาจถูก block

---

## 📞 ติดต่อเจ้าของเว็บ

อีกทางเลือกคือติดต่อ racha-lotto.net โดยตรง:
- ถามว่ามี public API หรือไม่
- ขอ API documentation
- ขออนุญาตใช้ข้อมูล

---

## ✅ สรุป

**วิธีที่ดีที่สุดตอนนี้:**
1. ใช้ปุ่ม **"🧪 ทดสอบระบบ"** เพื่อทดสอบ
2. ใช้ฟอร์ม **"✏️ เพิ่มเลขด้วยตัวเอง"** สำหรับใช้งานจริง
3. ถ้าต้องการอัตโนมัติจริงๆ ให้หา API ตามขั้นตอนข้างต้น

**ข้อดีของการเพิ่มเลขด้วยตัวเอง:**
- ✅ ใช้ได้ 100%
- ✅ ข้อมูลถูกต้องแม่นยำ
- ✅ ไม่มีปัญหา rate limiting
- ✅ ไม่ต้องกังวลเรื่อง API เปลี่ยน

---

Made with ❤️ by Claude Code
