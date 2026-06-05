<script setup lang="ts">
import { ref, onMounted } from 'vue'

const showTutorial = ref(false)
const currentStep = ref(0)

const steps = [
  {
    emoji: '👋',
    title: 'ยินดีต้อนรับสู่ Numora Lotto AI',
    description: 'ระบบทำนายและวิเคราะห์หวยด้วย AI แม่นยำสูง',
    details: [
      'วิเคราะห์ข้อมูลหวยย้อนหลัง',
      'ทำนายเลขเด่นด้วย AI',
      'ติดตามเลขที่ซื้อ',
      'ตรวจผลรางวัลอัตโนมัติ',
    ],
  },
  {
    emoji: '🎯',
    title: 'หน้าหลัก - ทำนายหวย',
    description: 'เลือกประเภทหวยและดูเลขเด่นแนะนำ',
    details: [
      '1. เลือกประเภทหวย (ลาว/รัฐบาล/ฮานอย)',
      '2. คลิก "คำนวณเลขเด่น"',
      '3. ดูเลขเด่น 4 ตัว, 2 ตัว, 3 ตัว',
      '4. บันทึกเลขที่ชอบได้',
    ],
    highlight: '🏠 คลิกไอคอน "หลัก" ที่เมนู',
  },
  {
    emoji: '🎫',
    title: 'ตรวจรางวัล',
    description: 'ตรวจว่าเลขของคุณถูกรางวัลหรือไม่',
    details: [
      '1. ใส่เลขที่ซื้อ (2-6 หลัก)',
      '2. เลือกงวดหวยที่ต้องการตรวจ',
      '3. คลิก "ตรวจรางวัล"',
      '4. ดูผลว่าถูกรางวัลอะไร',
    ],
    highlight: '🎯 คลิก "ตรวจรางวัล" ที่เมนู',
  },
  {
    emoji: '📝',
    title: 'เลขที่ซื้อ',
    description: 'บันทึกและติดตามเลขที่ซื้อทั้งหมด',
    details: [
      '1. บันทึกเลขที่ซื้อ',
      '2. ระบุงวดที่ซื้อ',
      '3. ระบบจะตรวจให้อัตโนมัติ',
      '4. ดูประวัติเลขที่ถูกรางวัล',
    ],
    highlight: '📝 คลิก "เลขที่ซื้อ" ที่เมนู',
  },
  {
    emoji: '💎',
    title: 'สมัคร VIP',
    description: 'ฟีเจอร์พิเศษสำหรับสมาชิก VIP',
    details: [
      'วิเคราะห์แม่นยำยิ่งขึ้น',
      'ดูสถิติย้อนหลังไม่จำกัด',
      'บันทึกเลขได้ไม่จำกัด',
      'รับการแจ้งเตือนพิเศษ',
    ],
    highlight: '💎 คลิก "สมัคร VIP" เพื่อดูแพ็กเกจ',
  },
  {
    emoji: '🎁',
    title: 'แนะนำเพื่อน - รับรางวัล',
    description: 'ชวนเพื่อนมาใช้งานรับ VIP ฟรี',
    details: [
      '1. คัดลอกลิงก์แนะนำเพื่อน',
      '2. แชร์ให้เพื่อนสมัคร',
      '3. เพื่อนได้ VIP ฟรี 3 วัน',
      '4. คุณได้ VIP ฟรี 7 วัน + คะแนน',
    ],
    highlight: '🎁 คลิก "แนะนำเพื่อน" ที่เมนู',
  },
  {
    emoji: '✨',
    title: 'พร้อมเริ่มต้นแล้ว!',
    description: 'เริ่มใช้งานและทำนายหวยกันเลย',
    details: [
      'ดูคำแนะนำได้ทุกเมื่อ',
      'ติดต่อ admin ถ้ามีปัญหา',
      'มีคำถาม? ดูที่ "คู่มือการใช้งาน"',
      'โชคดีกับการทายหวย! 🍀',
    ],
  },
]

onMounted(() => {
  if (!process.client) return

  // ตรวจสอบว่าเคยดู tutorial แล้วหรือยัง
  const hasSeenTutorial = localStorage.getItem('has_seen_tutorial')

  if (!hasSeenTutorial) {
    // รอ 1 วินาทีก่อนแสดง tutorial
    setTimeout(() => {
      showTutorial.value = true
    }, 1000)
  }
})

const nextStep = () => {
  if (currentStep.value < steps.length - 1) {
    currentStep.value++
  } else {
    closeTutorial()
  }
}

const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

const closeTutorial = () => {
  showTutorial.value = false
  localStorage.setItem('has_seen_tutorial', 'true')
}

const skipTutorial = () => {
  if (confirm('คุณต้องการข้าม Tutorial หรือไม่?\n\nคุณสามารถดูได้อีกครั้งที่เมนู "คู่มือการใช้งาน"')) {
    closeTutorial()
  }
}
</script>

<template>
  <Transition
    enter-active-class="transition ease-out duration-300"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition ease-in duration-200"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="showTutorial"
      class="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
    >
      <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden">
        <!-- Header -->
        <div class="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 p-6 text-white">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-3">
              <div class="text-5xl">{{ steps[currentStep].emoji }}</div>
              <div>
                <h2 class="text-2xl font-black">{{ steps[currentStep].title }}</h2>
                <p class="text-sm text-white/90">{{ steps[currentStep].description }}</p>
              </div>
            </div>
            <button
              @click="skipTutorial"
              class="text-white/80 hover:text-white transition-colors"
              title="ข้าม Tutorial"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Progress Dots -->
          <div class="flex gap-2 mt-4">
            <div
              v-for="(step, index) in steps"
              :key="index"
              class="h-2 rounded-full transition-all"
              :class="index === currentStep ? 'bg-white flex-1' : 'bg-white/30 w-8'"
            ></div>
          </div>
        </div>

        <!-- Content -->
        <div class="p-8">
          <div class="space-y-4">
            <div
              v-for="(detail, index) in steps[currentStep].details"
              :key="index"
              class="flex items-start gap-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl"
            >
              <div class="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                {{ index + 1 }}
              </div>
              <p class="text-gray-700 dark:text-gray-300 flex-1 pt-1">{{ detail }}</p>
            </div>

            <!-- Highlight Box -->
            <div v-if="steps[currentStep].highlight" class="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 dark:border-yellow-600 rounded-xl">
              <div class="flex items-center gap-2 text-yellow-800 dark:text-yellow-400">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                </svg>
                <span class="font-bold">เคล็ดลับ:</span>
              </div>
              <p class="text-yellow-900 dark:text-yellow-300 mt-1 ml-7">{{ steps[currentStep].highlight }}</p>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-6 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <!-- Step Counter -->
            <div class="text-sm text-gray-600 dark:text-gray-400">
              ขั้นตอน {{ currentStep + 1 }} จาก {{ steps.length }}
            </div>

            <!-- Buttons -->
            <div class="flex gap-3">
              <button
                v-if="currentStep > 0"
                @click="prevStep"
                class="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
              >
                ← ย้อนกลับ
              </button>

              <button
                @click="nextStep"
                class="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:shadow-lg transition-all flex items-center gap-2"
              >
                <span>{{ currentStep < steps.length - 1 ? 'ถัดไป' : 'เริ่มใช้งาน' }}</span>
                <span v-if="currentStep < steps.length - 1">→</span>
                <span v-else>🚀</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>
