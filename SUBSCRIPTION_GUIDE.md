# คู่มือระบบสมาชิก VIP จ่ายรายเดือน

## ⚠️ สถานะระบบ

**ระบบยังไม่เปิดใช้บริการจริง** - ขณะนี้อยู่ในโหมดทดสอบ (Testing/Development Mode)

- ❌ ไม่สามารถชำระเงินได้จริง
- ❌ Omise Payment Gateway ยังไม่ได้เชื่อมต่อ
- ✅ ระบบทำงานในโหมด Mock (สำหรับทดสอบเท่านั้น)
- ✅ UI/UX พร้อมใช้งาน รอเปิดบริการจริง

หากต้องการสมัครสมาชิก VIP กรุณาติดต่อ Admin: **noipugsa@gmail.com**

---

## ภาพรวม

ระบบสมาชิก VIP จ่ายรายเดือนสำหรับ Numora Lotto AI ใช้ Omise Payment Gateway รองรับการชำระเงินผ่าน PromptPay, บัตรเครดิต/เดบิต และ TrueMoney Wallet

## แพ็กเกจสมาชิก

### Basic Plan - 199 ฿/เดือน
- เห็นการพยากรณ์ขั้นสูง
- ดูสถิติย้อนหลัง 3 เดือน
- วิเคราะห์ฝัน
- ไม่มีโฆษณา

### Pro Plan - 399 ฿/เดือน (แนะนำ)
- เห็นการพยากรณ์ขั้นสูง
- ดูสถิติย้อนหลัง 6 เดือน
- วิเคราะห์ฝัน
- ติดตามความแม่นยำ
- บันทึกเลขซื้อไม่จำกัด
- ไม่มีโฆษณา

### Premium Plan - 699 ฿/เดือน
- เห็นการพยากรณ์ขั้นสูงแบบ AI
- ดูสถิติย้อนหลังไม่จำกัด
- วิเคราะห์ฝันขั้นสูง
- ติดตามความแม่นยำแบบละเอียด
- บันทึกเลขซื้อไม่จำกัด
- รับแจ้งเตือนพิเศษ
- ปรึกษาผู้เชี่ยวชาญ
- ไม่มีโฆษณา

## โครงสร้างระบบ

### Frontend (Vue 3 + Nuxt 4)

#### หน้าต่างๆ
- `/src/pages/pricing.vue` - หน้าแสดงแพ็กเกจทั้งหมด
- `/src/pages/subscription.vue` - หน้าจัดการสมาชิก
- `/src/pages/payment.vue` - หน้าชำระเงิน

#### Composables
- `/src/composables/useSubscription.ts` - จัดการสถานะสมาชิก VIP

### Backend (Nuxt Server API)

#### API Endpoints
- `/server/api/payment/create-charge.ts` - สร้าง charge ผ่าน Omise
- `/server/api/payment/webhook.ts` - รับ webhook callback จาก Omise

### Database (Firestore)

#### Collections

##### subscriptions
เก็บข้อมูลสมาชิก VIP ของแต่ละ user

```typescript
{
  userId: string           // Firebase Auth UID
  plan: 'free' | 'basic' | 'pro' | 'premium'
  status: 'active' | 'expired' | 'cancelled' | 'pending'
  startDate: Timestamp     // วันเริ่มต้น
  endDate: Timestamp       // วันหมดอายุ
  paymentMethod?: 'promptpay' | 'credit_card' | 'truemoney'
  amount: number           // จำนวนเงิน (บาท)
  transactionId?: string   // Transaction ID
  omiseChargeId?: string   // Omise Charge ID
  autoRenew: boolean       // ต่ออายุอัตโนมัติ (ปิดใช้งาน)
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

##### payments
เก็บประวัติการชำระเงิน

```typescript
{
  userId: string           // Firebase Auth UID
  plan: SubscriptionPlan   // แพ็กเกจที่ซื้อ
  amount: number           // จำนวนเงิน (บาท)
  paymentMethod: string    // ช่องทางชำระเงิน
  transactionId: string    // Transaction ID
  omiseChargeId?: string   // Omise Charge ID
  status: 'completed' | 'pending' | 'failed'
  createdAt: Timestamp
  completedAt?: Timestamp
  chargeData?: object      // ข้อมูลเต็มจาก Omise
}
```

## การติดตั้ง

### 1. ติดตั้ง Package

```bash
npm install omise
```

### 2. ตั้งค่า Environment Variables

สร้างไฟล์ `.env` และเพิ่ม:

```bash
# Omise Keys
OMISE_PUBLIC_KEY=pkey_test_xxxxxxxxxxxxx
OMISE_SECRET_KEY=skey_test_xxxxxxxxxxxxx

# Optional: Firebase Service Account (สำหรับ webhook)
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
```

### 3. Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

### 4. ตั้งค่า Omise Webhook

1. เข้า Omise Dashboard
2. ไปที่ Settings > Webhooks
3. เพิ่ม Webhook URL: `https://your-domain.com/api/payment/webhook`
4. เลือก Events:
   - `charge.complete`
   - `charge.create`
   - `charge.update`

## วิธีใช้งาน

### สำหรับผู้ใช้

1. **ดูแพ็กเกจ**: ไปที่หน้า `/pricing` หรือคลิก "VIP" ที่เมนูล่าง
2. **เลือกแพ็กเกจ**: คลิก "เลือกแพ็กเกจนี้"
3. **ชำระเงิน**: เลือกช่องทางชำระเงินและกรอกข้อมูล
4. **ยืนยัน**: ระบบจะอัพเดทสถานะเมื่อชำระเงินสำเร็จ
5. **จัดการสมาชิก**: ดูสถานะและประวัติการชำระเงินที่หน้า `/subscription`

### การเช็คสิทธิ์ในโค้ด

```typescript
import { useSubscription } from '../composables/useSubscription'

const { isVIP, canUseFeature, currentPlan } = useSubscription()

// เช็คว่าเป็น VIP หรือไม่
if (isVIP.value) {
  // ให้เข้าถึงฟีเจอร์พิเศษ
}

// เช็คสิทธิ์ตามแพ็กเกจ
if (canUseFeature('pro')) {
  // ฟีเจอร์นี้ต้องเป็น Pro ขึ้นไป
}

// แสดงแพ็กเกจปัจจุบัน
console.log('Current plan:', currentPlan.value) // 'free', 'basic', 'pro', 'premium'
```

## Flow การชำระเงิน

### Credit Card

1. User กรอกข้อมูลบัตร
2. Frontend เรียก Omise.js เพื่อสร้าง token
3. Frontend ส่ง token ไปยัง `/api/payment/create-charge`
4. Backend สร้าง charge ด้วย token
5. Omise ประมวลผลการชำระเงิน
6. Omise ส่ง webhook callback
7. Backend อัพเดทสถานะ subscription

### PromptPay

1. User เลือก PromptPay
2. Frontend เรียก `/api/payment/create-charge`
3. Backend สร้าง charge แบบ PromptPay
4. Backend ส่ง QR Code กลับไป
5. User สแกน QR Code เพื่อชำระเงิน
6. Omise ส่ง webhook เมื่อชำระเงินสำเร็จ
7. Backend อัพเดทสถานะ subscription

### TrueMoney

1. User เลือก TrueMoney
2. Frontend เรียก `/api/payment/create-charge`
3. Backend สร้าง charge แบบ TrueMoney
4. Frontend redirect ไปหน้า TrueMoney
5. User ชำระเงินผ่าน TrueMoney
6. TrueMoney redirect กลับมา
7. Omise ส่ง webhook
8. Backend อัพเดทสถานะ subscription

## Security

### Frontend
- ใช้ Omise.js เพื่อสร้าง token (ข้อมูลบัตรไม่ผ่าน server)
- Validate ข้อมูลก่อนส่ง
- ใช้ HTTPS เท่านั้น

### Backend
- Secret Key เก็บใน environment variables
- Validate webhook signature
- ใช้ Firebase Auth เพื่อยืนยันตัวตน
- Firestore Rules ป้องกันการเข้าถึงข้อมูล

## Testing

### Mock Mode

ถ้าไม่มี `OMISE_SECRET_KEY` ระบบจะทำงานในโหมด mock:
- สร้าง charge แบบ mock
- ไม่มีการเรียก Omise API จริง
- ใช้สำหรับ development

### Test Cards

Omise มี test cards สำหรับทดสอบ:
- Success: `4242 4242 4242 4242`
- Failure: `4000 0000 0000 0002`
- ดูเพิ่มเติม: https://www.omise.co/test-cards

## Troubleshooting

### ชำระเงินไม่สำเร็จ
1. เช็ค Omise Dashboard > Logs
2. เช็ค Server logs
3. เช็ค Firestore logs

### Webhook ไม่ทำงาน
1. เช็คว่า URL ถูกต้อง
2. เช็ค webhook signature
3. เช็ค Firestore permissions

### Subscription ไม่อัพเดท
1. เช็ค webhook logs
2. เช็ค Firestore rules
3. ลองเรียก `fetchSubscription()` ใหม่

## Roadmap

- [ ] เพิ่มการต่ออายุอัตโนมัติ
- [ ] เพิ่มแพ็กเกจรายปี (ลด 20%)
- [ ] ส่งอีเมลยืนยันการชำระเงิน
- [ ] แจ้งเตือนเมื่อใกล้หมดอายุ
- [ ] ระบบ referral code
- [ ] Gift subscription

## Support

หากมีปัญหาติดต่อ: support@viplayinsight.com
