<script setup lang="ts">
import { ref } from 'vue'
import html2canvas from 'html2canvas'

interface Props {
  hotNumbers: number[]
  twoDigits: string[]
  threeDigits: string[]
  lotteryType: string
  date: string
}

const props = defineProps<Props>()
const emit = defineEmits(['image-generated', 'error'])

const cardRef = ref<HTMLElement>()
const isGenerating = ref(false)

// Generate image from card
const generateImage = async (): Promise<string> => {
  if (!cardRef.value) {
    throw new Error('Card ref not found')
  }

  isGenerating.value = true

  try {
    // Wait for next tick to ensure DOM is ready
    await new Promise(resolve => setTimeout(resolve, 100))

    // Generate canvas from card element
    const canvas = await html2canvas(cardRef.value, {
      backgroundColor: '#ffffff',
      scale: 2, // Higher quality
      logging: false,
      useCORS: true,
    })

    // Convert canvas to blob/data URL
    const dataUrl = canvas.toDataURL('image/png')

    isGenerating.value = false
    emit('image-generated', dataUrl)

    return dataUrl
  } catch (error) {
    console.error('Failed to generate image:', error)
    isGenerating.value = false
    emit('error', error)
    throw error
  }
}

// Download image
const downloadImage = async () => {
  try {
    const dataUrl = await generateImage()
    const link = document.createElement('a')
    link.download = `numora-lotto-${Date.now()}.png`
    link.href = dataUrl
    link.click()
  } catch (error) {
    console.error('Failed to download image:', error)
  }
}

// Share to native share API (if available)
const shareImage = async () => {
  try {
    const dataUrl = await generateImage()

    // Convert data URL to blob
    const response = await fetch(dataUrl)
    const blob = await response.blob()
    const file = new File([blob], 'numora-lotto.png', { type: 'image/png' })

    // Check if Web Share API is available
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: 'Numora Lotto AI - ทำนายหวย',
        text: `เลขเด่น ${props.hotNumbers.join(', ')} | ${props.lotteryType}`,
        files: [file],
      })
    } else {
      // Fallback: open dialog to save
      await downloadImage()
    }
  } catch (error: any) {
    if (error.name !== 'AbortError') {
      console.error('Failed to share image:', error)
    }
  }
}

defineExpose({
  generateImage,
  downloadImage,
  shareImage,
})
</script>

<template>
  <div>
    <!-- Hidden card for image generation -->
    <div
      ref="cardRef"
      class="fixed -left-[9999px] w-[800px] bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 p-8 rounded-3xl"
      style="font-family: 'Inter', sans-serif;"
    >
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-5xl font-black text-white mb-2 drop-shadow-lg">
          Numora Lotto AI
        </h1>
        <p class="text-xl text-white/90 font-bold">
          {{ lotteryType }}
        </p>
        <p class="text-lg text-white/80">
          {{ date }}
        </p>
      </div>

      <!-- Hot Numbers -->
      <div v-if="hotNumbers.length > 0" class="mb-6">
        <div class="bg-white/20 backdrop-blur-xl rounded-2xl p-6">
          <h2 class="text-2xl font-black text-white mb-4 flex items-center gap-2">
            <span class="text-3xl">🔥</span>
            <span>เลขเด่น</span>
          </h2>
          <div class="grid grid-cols-4 gap-3">
            <div
              v-for="num in hotNumbers"
              :key="num"
              class="bg-gradient-to-br from-green-400 to-emerald-600 text-white rounded-xl py-4 text-center font-black text-4xl shadow-lg"
            >
              {{ num }}
            </div>
          </div>
        </div>
      </div>

      <!-- 2-Digit Numbers -->
      <div v-if="twoDigits.length > 0" class="mb-6">
        <div class="bg-white/20 backdrop-blur-xl rounded-2xl p-6">
          <h2 class="text-2xl font-black text-white mb-4 flex items-center gap-2">
            <span class="text-3xl">🎯</span>
            <span>เลข 2 ตัว</span>
          </h2>
          <div class="grid grid-cols-5 gap-2">
            <div
              v-for="num in twoDigits.slice(0, 10)"
              :key="num"
              class="bg-gradient-to-br from-yellow-400 to-orange-600 text-white rounded-xl py-3 text-center font-black text-2xl shadow-md"
            >
              {{ num }}
            </div>
          </div>
        </div>
      </div>

      <!-- 3-Digit Numbers -->
      <div v-if="threeDigits.length > 0" class="mb-6">
        <div class="bg-white/20 backdrop-blur-xl rounded-2xl p-6">
          <h2 class="text-2xl font-black text-white mb-4 flex items-center gap-2">
            <span class="text-3xl">🎲</span>
            <span>เลข 3 ตัว</span>
          </h2>
          <div class="grid grid-cols-4 gap-2">
            <div
              v-for="num in threeDigits.slice(0, 12)"
              :key="num"
              class="bg-gradient-to-r from-blue-400 to-indigo-600 text-white rounded-xl py-3 text-center font-black text-xl shadow-md"
            >
              {{ num }}
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="text-center mt-8 pt-6 border-t-2 border-white/30">
        <p class="text-white text-xl font-bold mb-2">
          🌐 vip-lao-insight.vercel.app
        </p>
        <p class="text-white/80 text-sm">
          ทำนายหวยด้วย AI · ความแม่นยำสูง · ฟรี 30 วัน
        </p>
      </div>
    </div>

    <!-- Loading overlay -->
    <div v-if="isGenerating" class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div class="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl text-center">
        <div class="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
        <p class="text-lg font-bold text-gray-900 dark:text-white">กำลังสร้างภาพ...</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Ensure fonts load properly for image generation */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
</style>
