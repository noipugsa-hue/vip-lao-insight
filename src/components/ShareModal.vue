<script setup lang="ts">
import { ref, computed } from 'vue'
import ShareImageGenerator from './ShareImageGenerator.vue'
import { useShare, type ShareData } from '../composables/useShare'

interface Props {
  show: boolean
  shareData: ShareData
}

const props = defineProps<Props>()
const emit = defineEmits(['close'])

const {
  copySuccess,
  isGeneratingImage,
  formatShareText,
  copyToClipboard,
  shareToLine,
  shareToFacebook,
  shareToWhatsApp,
} = useShare()

const shareImageGeneratorRef = ref<InstanceType<typeof ShareImageGenerator>>()

// คำนวณวันที่ปัจจุบัน
const todayStr = computed(() => {
  const now = new Date()
  return now.toLocaleDateString('th-TH')
})

// แชร์เป็นรูปภาพ
const shareAsImage = async () => {
  if (!shareImageGeneratorRef.value) {
    alert('❌ ไม่สามารถสร้างภาพได้')
    return
  }

  isGeneratingImage.value = true

  try {
    await shareImageGeneratorRef.value.shareImage()
  } catch (error) {
    console.error('Failed to share image:', error)
    alert('❌ ไม่สามารถแชร์ภาพได้')
  } finally {
    isGeneratingImage.value = false
  }
}

// ดาวน์โหลดรูปภาพ
const downloadImage = async () => {
  if (!shareImageGeneratorRef.value) {
    alert('❌ ไม่สามารถสร้างภาพได้')
    return
  }

  isGeneratingImage.value = true

  try {
    await shareImageGeneratorRef.value.downloadImage()
    alert('✅ บันทึกภาพสำเร็จ!')
  } catch (error) {
    console.error('Failed to download image:', error)
    alert('❌ ไม่สามารถบันทึกภาพได้')
  } finally {
    isGeneratingImage.value = false
  }
}

// ฟังก์ชันสำหรับการคัดลอก
const handleCopy = async () => {
  await copyToClipboard(props.shareData)
}

// ฟังก์ชันสำหรับแชร์ไปยัง social media
const handleShareLine = () => shareToLine(props.shareData)
const handleShareFacebook = () => shareToFacebook(props.shareData)
const handleShareWhatsApp = () => shareToWhatsApp(props.shareData)
</script>

<template>
  <!-- Share Modal -->
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="show"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      @click.self="emit('close')"
    >
      <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
      >
        <div
          v-if="show"
          class="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 space-y-6"
        >
          <!-- Share Icon -->
          <div class="flex justify-center">
            <div class="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
              <span class="text-5xl">📤</span>
            </div>
          </div>

          <!-- Title -->
          <div class="text-center space-y-2">
            <h3 class="text-2xl font-black text-gray-900 dark:text-white">
              แชร์เลขที่คำนวณ
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              เลือกช่องทางที่ต้องการแชร์
            </p>
          </div>

          <!-- Preview Text -->
          <div class="bg-gray-50 dark:bg-gray-900/50 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-4 max-h-40 overflow-y-auto">
            <pre class="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono">{{ formatShareText(shareData) }}</pre>
          </div>

          <!-- Share Options -->
          <div class="space-y-4">
            <!-- Share as Image -->
            <div class="grid grid-cols-2 gap-3">
              <button
                @click="shareAsImage"
                :disabled="isGeneratingImage"
                class="group relative flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-md hover:shadow-lg transform transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span class="text-3xl">{{ isGeneratingImage ? '⏳' : '🖼️' }}</span>
                <span class="text-sm font-bold text-white">
                  {{ isGeneratingImage ? 'กำลังสร้าง...' : 'แชร์เป็นรูป' }}
                </span>
              </button>

              <button
                @click="downloadImage"
                :disabled="isGeneratingImage"
                class="group relative flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl shadow-md hover:shadow-lg transform transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span class="text-3xl">{{ isGeneratingImage ? '⏳' : '💾' }}</span>
                <span class="text-sm font-bold text-white">
                  {{ isGeneratingImage ? 'กำลังสร้าง...' : 'บันทึกรูป' }}
                </span>
              </button>
            </div>

            <!-- Divider -->
            <div class="relative">
              <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div class="relative flex justify-center text-sm">
                <span class="px-2 bg-white dark:bg-gray-800 text-gray-500">หรือ</span>
              </div>
            </div>

            <!-- Text Share Options -->
            <div class="grid grid-cols-2 gap-3">
              <!-- Copy Button -->
              <button
                @click="handleCopy"
                class="group relative flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-2xl shadow-md hover:shadow-lg transform transition-all hover:scale-105 active:scale-95"
              >
                <span class="text-3xl">{{ copySuccess ? '✅' : '📋' }}</span>
                <span class="text-sm font-bold text-gray-900 dark:text-white">
                  {{ copySuccess ? 'คัดลอกแล้ว!' : 'คัดลอกข้อความ' }}
                </span>
              </button>

              <!-- Line Button -->
              <button
                @click="handleShareLine"
                class="group relative flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl shadow-md hover:shadow-lg transform transition-all hover:scale-105 active:scale-95"
              >
                <span class="text-3xl">💬</span>
                <span class="text-sm font-bold text-white">Line</span>
              </button>

              <!-- Facebook Button -->
              <button
                @click="handleShareFacebook"
                class="group relative flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl shadow-md hover:shadow-lg transform transition-all hover:scale-105 active:scale-95"
              >
                <span class="text-3xl">📘</span>
                <span class="text-sm font-bold text-white">Facebook</span>
              </button>

              <!-- WhatsApp Button -->
              <button
                @click="handleShareWhatsApp"
                class="group relative flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl shadow-md hover:shadow-lg transform transition-all hover:scale-105 active:scale-95"
              >
                <span class="text-3xl">📱</span>
                <span class="text-sm font-bold text-white">WhatsApp</span>
              </button>
            </div>
          </div>

          <!-- Close Button -->
          <button
            @click="emit('close')"
            class="w-full px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-2xl font-bold shadow-md hover:shadow-lg transform transition-all hover:scale-105 active:scale-95"
          >
            ปิด
          </button>
        </div>
      </Transition>
    </div>
  </Transition>

  <!-- Share Image Generator (Hidden) -->
  <ShareImageGenerator
    ref="shareImageGeneratorRef"
    :hot-numbers="shareData.hotNumbers || []"
    :two-digits="shareData.twoDigits || []"
    :three-digits="shareData.threeDigits || []"
    :lottery-type="shareData.lotteryType"
    :date="todayStr"
  />
</template>
