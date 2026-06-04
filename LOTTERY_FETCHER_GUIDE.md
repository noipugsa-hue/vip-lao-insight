# 🎯 คู่มือการใช้งานระบบดึงข้อมูลหวยอัตโนมัติ

## 📌 ภาพรวม

ระบบนี้จะช่วยให้คุณสามารถดึงข้อมูลผลหวยลาวจาก **racha-lotto.net** มาเพิ่มในระบบ Numora Lotto AI ได้แบบอัตโนมัติ

## 🚀 วิธีใช้งาน

### 1. เข้าหน้า Admin

เปิดเว็บไซต์และไปที่หน้า `/admin` คุณจะเห็นส่วนใหม่ชื่อ **"ระบบดึงข้อมูลหวยอัตโนมัติ"**

### 2. วิธีการดึงข้อมูล

มี 3 วิธีในการเพิ่มข้อมูลผลหวย:

#### 📥 วิธีที่ 1: ดึงข้อมูลทันที (Manual Fetch)
- กดปุ่ม **"🎯 ดึงข้อมูลตอนนี้"**
- ระบบจะพยายามดึงข้อมูลจาก API ของ racha-lotto.net
- ถ้าสำเร็จจะแสดงข้อความ "✅ ดึงข้อมูลหวยสำเร็จ!"

#### ⏰ วิธีที่ 2: เปิดการดึงอัตโนมัติ (Auto-Fetch)
- กดปุ่ม **"▶️ เปิดใช้งาน"** ในส่วน "ดึงอัตโนมัติ"
- ระบบจะดึงข้อมูลทุก 1 ชั่วโมงโดยอัตโนมัติ
- สถานะจะแสดง "🟢 เปิดอยู่"
- หากต้องการหยุด กดปุ่ม **"⏸️ ปิดใช้งาน"**

#### ✏️ วิธีที่ 3: เพิ่มเลขด้วยตัวเอง (Manual Entry)
- ใส่เลข 3 ตัวในช่อง "เลข 3 ตัว"
- เลือกวันที่
- ใส่งวด (ถ้าต้องการ)
- กดปุ่ม **"➕ เพิ่มผลหวย"**

### 3. ดูผลหวยที่บันทึกไว้

ด้านขวามือจะแสดงผลหวย 10 งวดล่าสุดที่บันทึกไว้ใน Firebase Firestore:
- แสดงเลข 3 ตัว
- วันที่และงวด
- แหล่งที่มา (racha-lotto.net, manual, etc.)

## 🔧 การตั้งค่า API Endpoint

เนื่องจาก **racha-lotto.net เป็น SPA (Single Page Application)** การดึงข้อมูลโดยตรงอาจไม่ได้ผล คุณมี 2 ทางเลือก:

### ทางเลือกที่ 1: ใช้ API ที่มีอยู่
ถ้า racha-lotto.net มี API endpoint สาธารณะ เช่น:
- `https://api.racha-lotto.net/results/LA`
- `https://www.racha-lotto.net/api/result-product/LA`

ระบบจะพยายามเชื่อมต่ออัตโนมัติ

### ทางเลือกที่ 2: สร้าง Proxy API หรือ Web Scraper

เนื่องจากเว็บอาจใช้ JavaScript ในการโหลดข้อมูล คุณอาจต้องสร้าง:

1. **Proxy API** - สร้าง endpoint ที่ดึงข้อมูลจาก racha-lotto.net แล้วส่งกลับมา
2. **Web Scraper** - ใช้เครื่องมือเช่น Puppeteer หรือ Playwright ในการ scrape ข้อมูล

#### ตัวอย่างการใช้ Custom API Endpoint:

```typescript
const { fetchWithCustomAPI } = useLotteryFetcher()

// ใช้ custom endpoint ที่คุณสร้างเอง
await fetchWithCustomAPI('https://your-proxy-api.com/lottery/LA')
```

### ทางเลือกที่ 3: ใช้การเพิ่มเลขด้วยตัวเอง

ถ้าการดึงอัตโนมัติไม่ทำงาน แนะนำให้:
1. เข้าไปดูผลหวยจาก racha-lotto.net ด้วยตนเอง
2. กลับมาที่หน้า Admin
3. ใช้ฟอร์ม **"เพิ่มเลขด้วยตัวเอง"** เพื่อบันทึกผลหวย

## 📊 โครงสร้างข้อมูลใน Firebase

ข้อมูลหวยจะถูกบันทึกใน Firestore collection: `lotteryResults`

โครงสร้าง:
```javascript
{
  date: "2026-04-25",           // วันที่
  period: "123",                 // งวด
  threeDigit: "456",             // เลข 3 ตัว
  twoDigit: "56",                // เลข 2 ตัว (optional)
  fourDigit: "4567",             // เลข 4 ตัว (optional)
  source: "racha-lotto.net",     // แหล่งที่มา
  fetchedAt: Timestamp,          // เวลาที่ดึงข้อมูล
  createdAt: Timestamp,          // เวลาที่สร้าง
  updatedAt: Timestamp           // เวลาที่อัปเดต
}
```

## 🔐 การตั้งค่า Firebase

ตรวจสอบว่า Firebase Firestore ได้รับการตั้งค่าแล้ว:

1. ไปที่ [Firebase Console](https://console.firebase.google.com)
2. เลือก project: `kinetic-abbey-408904`
3. ไปที่ Firestore Database
4. สร้าง collection ชื่อ `lotteryResults` (ถ้ายังไม่มี)
5. ตั้งค่า Security Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // อนุญาตให้อ่านได้ทุกคน
    match /lotteryResults/{docId} {
      allow read: if true;
      allow write: if request.auth != null; // เขียนได้เฉพาะผู้ที่ login
    }
  }
}
```

## 🐛 การแก้ปัญหา

### ปัญหา: ดึงข้อมูลไม่สำเร็จ
**สาเหตุ:** API endpoint อาจไม่ถูกต้อง หรือเว็บใช้ JavaScript ในการโหลดข้อมูล

**แก้ไข:**
1. ตรวจสอบ Console ว่ามี error อะไร
2. ลองเปิด Developer Tools > Network tab แล้วดูว่า racha-lotto.net ใช้ API อะไร
3. อัปเดต endpoint ใน `useLotteryFetcher.ts`

### ปัญหา: Auto-fetch ไม่ทำงาน
**สาเหตุ:** หน้าเว็บอาจถูกปิดหรือ refresh

**แก้ไข:**
- Auto-fetch จะทำงานตราบเท่าที่หน้า Admin เปิดอยู่
- ถ้าต้องการให้ทำงานตลอดเวลา ต้องสร้าง Server-side cron job

### ปัญหา: ข้อมูลไม่แสดงใน Firebase
**สาเหตุ:** Security Rules อาจไม่อนุญาตให้เขียนข้อมูล

**แก้ไข:**
- ตรวจสอบว่าคุณ login แล้ว
- ตรวจสอบ Firebase Security Rules

## 🎓 ตัวอย่าง Code

### ใช้งานใน Component อื่น

```vue
<script setup>
import { useLotteryFetcher } from '../composables/useLotteryFetcher'

const {
  isFetching,
  error,
  lastResult,
  fetchAndSave,
  getAllFromFirestore
} = useLotteryFetcher()

// ดึงข้อมูลและบันทึก
const fetch = async () => {
  await fetchAndSave()
  console.log('Latest result:', lastResult.value)
}

// ดึงผลหวยทั้งหมด
const results = await getAllFromFirestore(50)
console.log('All results:', results)
</script>
```

## 📝 หมายเหตุ

- ระบบนี้ออกแบบมาให้ใช้งานง่าย แต่ต้องการความร่วมมือจาก API ของ racha-lotto.net
- ถ้า API ไม่มีหรือไม่สามารถใช้ได้ แนะนำให้ใช้การเพิ่มเลขด้วยตัวเอง
- สำหรับการใช้งานจริง แนะนำให้สร้าง Server-side API หรือ Cloud Function เพื่อดึงข้อมูลแบบอัตโนมัติ

## 🚀 ขั้นตอนต่อไป (Optional)

### สร้าง Cloud Function สำหรับ Auto-fetch

คุณสามารถสร้าง Firebase Cloud Function ที่ทำงานทุกชั่วโมง:

```javascript
// functions/index.js
const functions = require('firebase-functions')
const admin = require('firebase-admin')

exports.fetchLotteryScheduled = functions.pubsub
  .schedule('every 1 hours')
  .onRun(async (context) => {
    // ดึงข้อมูลจาก API
    const response = await fetch('https://api.racha-lotto.net/results/LA')
    const data = await response.json()

    // บันทึกลง Firestore
    await admin.firestore().collection('lotteryResults').add({
      date: data.date,
      period: data.period,
      threeDigit: data.threeDigit,
      source: 'cloud-function',
      fetchedAt: new Date()
    })

    console.log('Lottery data fetched successfully')
  })
```

## 📞 ติดต่อ

หากมีปัญหาหรือคำถาม สามารถเพิ่ม issue ใน GitHub repository
