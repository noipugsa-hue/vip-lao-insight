<script setup lang="ts">
import { ref, onMounted } from 'vue'

const showPrompt = ref(false)
const deferredPrompt = ref<any>(null)
const isIOS = ref(false)
const isStandalone = ref(false)

onMounted(() => {
  if (!process.client) return

  // ตรวจสอบว่าเป็น iOS หรือไม่
  isIOS.value = /iPad|iPhone|iPod/.test(navigator.userAgent)

  // ตรวจสอบว่าเปิดในโหมด standalone (ติดตั้งแล้ว) หรือไม่
  isStandalone.value = window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true

  // ถ้าติดตั้งแล้ว ไม่แสดง prompt
  if (isStandalone.value) {
    return
  }

  // ตรวจสอบว่าเคยปิด prompt ไปแล้วหรือไม่
  const dismissed = localStorage.getItem('pwa_install_dismissed')
  const dismissedDate = dismissed ? new Date(dismissed) : null
  const daysSinceDismissed = dismissedDate
    ? Math.floor((Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24))
    : 999

  // แสดง prompt ถ้าไม่เคยปิด หรือปิดไปแล้วมากกว่า 7 วัน
  if (!dismissed || daysSinceDismissed > 7) {
    // รอ 3 วินาทีก่อนแสดง prompt
    setTimeout(() => {
      showPrompt.value = true
    }, 3000)
  }

  // รอรับ beforeinstallprompt event (Android Chrome)
  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('📱 [PWA] beforeinstallprompt event received')
    e.preventDefault()
    deferredPrompt.value = e
    showPrompt.value = true
  })

  // Debug: ตรวจสอบว่า PWA พร้อมติดตั้งหรือไม่
  console.log('📱 [PWA] Component mounted:', {
    isIOS: isIOS.value,
    isStandalone: isStandalone.value,
    hasDeferredPrompt: !!deferredPrompt.value,
  })
})

const installApp = async () => {
  console.log('📱 [PWA] Install button clicked')

  if (!deferredPrompt.value) {
    console.log('❌ [PWA] No deferredPrompt available')

    // ถ้าเป็น iOS แสดงคำแนะนำ
    if (isIOS.value) {
      console.log('ℹ️ [PWA] iOS detected - showing manual instructions')
      return
    }

    // Browser ไม่รองรับ PWA install
    alert('เบราว์เซอร์ของคุณไม่รองรับการติดตั้ง PWA โดยตรง\n\nลองใช้ Chrome หรือ Edge แทนครับ')
    return
  }

  try {
    console.log('📱 [PWA] Showing install prompt...')

    // แสดง install prompt
    deferredPrompt.value.prompt()

    // รอผลลัพธ์
    const { outcome } = await deferredPrompt.value.userChoice

    console.log('📱 [PWA] User choice:', outcome)

    if (outcome === 'accepted') {
      console.log('✅ [PWA] User accepted PWA install')
    } else {
      console.log('❌ [PWA] User dismissed PWA install')
    }

    deferredPrompt.value = null
    showPrompt.value = false
  } catch (err) {
    console.error('❌ [PWA] Install error:', err)
    alert('เกิดข้อผิดพลาดในการติดตั้ง\nกรุณาลองใหม่อีกครั้ง')
  }
}

const dismissPrompt = () => {
  showPrompt.value = false
  localStorage.setItem('pwa_install_dismissed', new Date().toISOString())
}
</script>

<template>
  <Transition
    enter-active-class="transition ease-out duration-300"
    enter-from-class="translate-y-full opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transition ease-in duration-200"
    leave-from-class="translate-y-0 opacity-100"
    leave-to-class="translate-y-full opacity-0"
  >
    <div
      v-if="showPrompt"
      class="fixed bottom-4 left-4 right-4 lg:left-auto lg:right-4 lg:w-96 z-50"
    >
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <!-- Header -->
        <div class="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 p-4 text-white">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <span class="text-2xl">📱</span>
            </div>
            <div class="flex-1">
              <h3 class="font-bold text-lg">ติดตั้งแอปฟรี</h3>
              <p class="text-sm text-white/90">เข้าถึงได้รวดเร็วขึ้น</p>
            </div>
            <button
              @click="dismissPrompt"
              class="text-white/80 hover:text-white transition-colors"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="p-4">
          <!-- iOS Instructions -->
          <div v-if="isIOS && !deferredPrompt" class="space-y-3">
            <p class="text-sm text-gray-700 dark:text-gray-300 font-medium">
              วิธีติดตั้งบน iOS:
            </p>
            <ol class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li class="flex items-start gap-2">
                <span class="text-blue-600 dark:text-blue-400 font-bold">1.</span>
                <span>กด <span class="inline-flex items-center px-1 bg-gray-100 dark:bg-gray-700 rounded">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
                  </svg>
                </span> ที่แถบล่าง</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-blue-600 dark:text-blue-400 font-bold">2.</span>
                <span>เลือก "เพิ่มที่หน้าจอ Home"</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-blue-600 dark:text-blue-400 font-bold">3.</span>
                <span>กด "เพิ่ม" เพื่อติดตั้ง</span>
              </li>
            </ol>
          </div>

          <!-- Android Install Button -->
          <div v-else class="space-y-3">
            <div class="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
              <span class="text-xl">✨</span>
              <div>
                <p class="font-medium text-gray-900 dark:text-white mb-1">ประโยชน์ที่คุณจะได้:</p>
                <ul class="space-y-1">
                  <li>• เปิดแอปได้เร็วขึ้น</li>
                  <li>• ใช้งานได้แม้ offline</li>
                  <li>• รับการแจ้งเตือนผลหวย</li>
                  <li>• ไม่เปลืองพื้นที่เก็บข้อมูล</li>
                </ul>
              </div>
            </div>

            <div class="flex gap-2">
              <button
                @click="installApp"
                class="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:shadow-lg transition-shadow transition-transform active:scale-95"
              >
                📥 ติดตั้งเลย
              </button>
              <button
                @click="dismissPrompt"
                class="py-3 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors transition-transform active:scale-95"
              >
                ภายหลัง
              </button>
            </div>
          </div>

          <!-- Features -->
          <div class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              <span class="flex items-center gap-1">
                <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                ไม่มีค่าใช้จ่าย
              </span>
              <span class="flex items-center gap-1">
                <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                ปลอดภัย 100%
              </span>
              <span class="flex items-center gap-1">
                <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                อัพเดทอัตโนมัติ
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>
