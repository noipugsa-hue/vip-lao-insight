// server/api/lottery/demo.ts
/**
 * Demo API Endpoint สำหรับทดสอบระบบ
 * ใช้สำหรับทดสอบว่าระบบดึงข้อมูลและบันทึกลง Firebase ทำงานได้หรือไม่
 *
 * Usage: GET /api/lottery/demo
 */

export default defineEventHandler(() => {
  // สุ่มเลข 3 ตัว
  const randomThreeDigit = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  const randomTwoDigit = randomThreeDigit.slice(1, 3)

  // สร้างข้อมูล demo
  const demoData = {
    success: true,
    data: {
      date: new Date().toISOString().split('T')[0],
      period: `demo-${Date.now()}`,
      threeDigit: randomThreeDigit,
      twoDigit: randomTwoDigit,
      fourDigit: `1${randomThreeDigit}`,
      source: 'demo-api',
      fetchedAt: new Date().toISOString()
    },
    message: '🎯 นี่คือข้อมูลทดสอบ (Demo) - ไม่ใช่ผลหวยจริง'
  }

  return demoData
})
