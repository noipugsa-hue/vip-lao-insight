# 🔐 Google Sign-In Setup Guide

## ✅ เพิ่มฟีเจอร์ Google Sign-In แล้ว!

ตอนนี้ระบบรองรับการเข้าสู่ระบบด้วย Google แล้ว ผู้ใช้สามารถ:
- ✨ สมัครสมาชิกด้วย Gmail ได้ทันที
- 🚀 เข้าสู่ระบบด้วย Google Account ได้โดยไม่ต้องจำรหัสผ่าน
- 🔒 ปลอดภัยและสะดวกกว่า

---

## 📋 การตั้งค่า Firebase Console

เพื่อให้ Google Sign-In ทำงานได้ คุณต้องเปิดใช้งานใน Firebase Console:

### ขั้นตอนที่ 1: เปิด Firebase Console
1. ไปที่ [Firebase Console](https://console.firebase.google.com/)
2. เลือก Project: **Numora Lotto AI**

### ขั้นตอนที่ 2: เปิดใช้งาน Google Sign-In
1. ไปที่เมนู **Authentication** (ซ้ายมือ)
2. คลิกแท็บ **Sign-in method**
3. หา **Google** ในรายการ Providers
4. คลิก **Google** แล้วคลิก **Enable**
5. ใส่ข้อมูล:
   - **Project public-facing name**: Numora Lotto AI
   - **Project support email**: อีเมลของคุณ (เลือกจาก dropdown)
6. คลิก **Save**

### ขั้นตอนที่ 3: ⚠️ เพิ่ม Authorized Domains (สำคัญมาก!)
**จำเป็นสำหรับ Production!** ต้องเพิ่ม domain ของ Vercel:
1. ไปที่ **Authentication** (เมนูซ้าย)
2. คลิกแท็บ **Settings** (บนสุด)
3. เลื่อนลงมาหา section **Authorized domains**
4. คลิก **Add domain**
5. ใส่: `vip-lao-insight.vercel.app`
6. คลิก **Add**

**ถ้าไม่ทำขั้นตอนนี้:**
- Google Sign-In จะใช้งานไม่ได้บน production
- จะเห็น error: "The current domain is not authorized for OAuth operations"

**Domains ที่ควรเพิ่ม:**
   - ✅ `vip-lao-insight.vercel.app` (Vercel deployment)
   - ✅ `yourdomain.com` (ถ้ามี custom domain)
   - ✅ `localhost` (มีอยู่แล้ว default)

📖 **ดูคำแนะนำละเอียด:** อ่าน `OAUTH_DOMAIN_FIX.md`

---

## 🎯 วิธีใช้งาน (สำหรับผู้ใช้)

1. ไปที่หน้า Login
2. เห็นปุ่ม **"เข้าสู่ระบบด้วย Google"**
3. คลิกปุ่ม
4. เลือก Google Account ที่ต้องการ
5. เข้าสู่ระบบทันที! 🎉

---

## 🔧 โค้ดที่เพิ่ม

### ไฟล์ที่แก้ไข:

#### 1. `src/composables/useAuth.ts`
เพิ่มฟังก์ชัน `loginWithGoogle()`:
```typescript
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth'

const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({
    prompt: 'select_account' // ให้เลือก account ทุกครั้ง
  })
  const cred = await signInWithPopup(auth, provider)
  user.value = cred.user
  return cred.user
}
```

#### 2. `src/pages/login.vue`
เพิ่ม:
- ปุ่ม Google Sign-In พร้อม Google logo
- Handler function `loginWithGoogleAccount()`
- Divider "หรือ" ระหว่างฟอร์มและปุ่ม Google

---

## 🚨 Troubleshooting

### ปัญหา: Popup ถูกบล็อก
**สาเหตร:** Browser บล็อก popup
**วิธีแก้:**
- อนุญาต popup สำหรับเว็บไซต์ของคุณใน browser settings
- หรือใช้ `signInWithRedirect` แทน (ต้องแก้โค้ด)

### ปัญหา: "auth/unauthorized-domain"
**สาเหตร:** Domain ไม่ได้อยู่ใน Authorized domains
**วิธีแก้:**
1. ไปที่ Firebase Console > Authentication > Settings
2. เพิ่ม domain ของคุณใน Authorized domains

### ปัญหา: "auth/operation-not-allowed"
**สาเหตร:** Google Sign-In ยังไม่ได้เปิดใน Firebase
**วิธีแก้:**
- ทำตามขั้นตอนที่ 2 ข้างบน (เปิดใช้งาน Google Sign-In)

---

## 📊 ข้อมูลที่ได้จาก Google Sign-In

เมื่อผู้ใช้ลงชื่อเข้าใช้ด้วย Google คุณจะได้:
- `uid` - User ID จาก Firebase
- `email` - อีเมล Gmail
- `displayName` - ชื่อที่แสดง
- `photoURL` - รูปโปรไฟล์
- `emailVerified` - true (Google verify email ให้แล้ว)

---

## 🎨 UI/UX Features

✅ ปุ่ม Google มี Google logo 4 สี (official colors)
✅ Hover effect และ animation
✅ Error handling ครบถ้วน:
   - Popup ถูกปิด
   - Popup ถูกยกเลิก
   - Network error
✅ Success message เมื่อเข้าสู่ระบบสำเร็จ
✅ บันทึกสถิติการ login เหมือนกับ email/password

---

## 🔐 ความปลอดภัย

- ✅ ใช้ Firebase Authentication (มาตรฐาน OAuth 2.0)
- ✅ ไม่ต้องเก็บรหัสผ่าน
- ✅ Google verify email ให้อัตโนมัติ
- ✅ Session management ผ่าน Firebase
- ✅ Token refresh อัตโนมัติ

---

## 📱 รองรับทุกแพลตฟอร์ม

- ✅ Desktop (Chrome, Firefox, Safari, Edge)
- ✅ Mobile (iOS Safari, Android Chrome)
- ✅ Tablet
- ✅ Local development (localhost)
- ✅ Production (Vercel, custom domain)

---

## 🚀 Next Steps

### ถ้าต้องการเพิ่ม Social Login อื่นๆ:

1. **Facebook Login**
   - เปิดใน Firebase Console
   - ใช้ `FacebookAuthProvider`

2. **Apple Sign-In**
   - เปิดใน Firebase Console
   - ใช้ `OAuthProvider` with `apple.com`

3. **Microsoft Account**
   - ใช้ `OAuthProvider` with `microsoft.com`

4. **GitHub**
   - ใช้ `GithubAuthProvider`

---

## 📞 ต้องการความช่วยเหลือ?

ถ้ามีปัญหาหรือต้องการคำแนะนำเพิ่มเติม:
1. เช็ค Firebase Console logs
2. เช็ค Browser console (F12)
3. อ่าน [Firebase Auth Docs](https://firebase.google.com/docs/auth/web/google-signin)

---

Made with ❤️ by Claude Code
