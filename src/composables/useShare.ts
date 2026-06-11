import { ref, type Ref } from 'vue'

export interface ShareData {
  hotNumbers?: number[]
  twoDigits?: string[]
  threeDigits?: string[]
  predictions?: string[] // สำหรับ two-digit หรือสูตรอื่นๆ
  lotteryType: string
  formulaName?: string // เช่น "สูตรสถิติ", "เลข 2 ตัว"
}

export function useShare() {
  const showShareModal = ref(false)
  const copySuccess = ref(false)
  const isGeneratingImage = ref(false)

  /**
   * สร้างข้อความสำหรับแชร์
   */
  const formatShareText = (data: ShareData): string => {
    const now = new Date()
    const day = now.getDate().toString().padStart(2, '0')
    const month = (now.getMonth() + 1).toString().padStart(2, '0')
    const year = now.getFullYear()
    const date = `${day}/${month}/${year}`

    let text = `🎯 Numora Lotto AI`
    if (data.formulaName) {
      text += ` - ${data.formulaName}`
    }
    text += `\n`
    text += `🎲 ${data.lotteryType}\n`
    text += `📅 วันที่: ${date}\n`
    text += `━━━━━━━━━━━━━━━━━━━━\n\n`

    if (data.hotNumbers && data.hotNumbers.length > 0) {
      text += `🔥 เลขเด่น (${data.hotNumbers.length} ตัว)\n`
      text += `${data.hotNumbers.join(', ')}\n\n`
    }

    if (data.twoDigits && data.twoDigits.length > 0) {
      text += `💎 เลข 2 ตัว (${data.twoDigits.length} ตัว)\n`
      text += `${data.twoDigits.join(', ')}\n\n`
    }

    if (data.threeDigits && data.threeDigits.length > 0) {
      text += `✨ เลข 3 ตัว (${data.threeDigits.length} ตัว)\n`
      text += `${data.threeDigits.join(', ')}\n\n`
    }

    if (data.predictions && data.predictions.length > 0) {
      text += `🎯 เลขทำนาย (${data.predictions.length} ชุด)\n`
      text += `${data.predictions.join(', ')}\n\n`
    }

    text += `━━━━━━━━━━━━━━━━━━━━\n\n`
    text += `🌐 vip-lao-insight.vercel.app`

    return text
  }

  /**
   * คัดลอกข้อความไปยัง clipboard
   */
  const copyToClipboard = async (data: ShareData): Promise<boolean> => {
    try {
      const text = formatShareText(data)
      await navigator.clipboard.writeText(text)
      copySuccess.value = true
      setTimeout(() => {
        copySuccess.value = false
      }, 2000)
      return true
    } catch (err) {
      console.error('Failed to copy:', err)
      return false
    }
  }

  /**
   * แชร์ไป Line
   */
  const shareToLine = (data: ShareData) => {
    const text = formatShareText(data)
    const url = `https://line.me/R/msg/text/?${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  /**
   * แชร์ไป Facebook
   */
  const shareToFacebook = (data: ShareData) => {
    const text = formatShareText(data)
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://vip-lao-insight.vercel.app')}&quote=${encodeURIComponent(text)}`
    window.open(url, '_blank', 'width=600,height=400')
  }

  /**
   * แชร์ไป WhatsApp
   */
  const shareToWhatsApp = (data: ShareData) => {
    const text = formatShareText(data)
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  /**
   * แชร์ผ่าน Native Share API (สำหรับมือถือ)
   */
  const shareNative = async (data: ShareData): Promise<boolean> => {
    try {
      if (navigator.share) {
        const text = formatShareText(data)
        await navigator.share({
          title: 'Numora Lotto AI',
          text: text,
        })
        return true
      }
      return false
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Failed to share:', err)
      }
      return false
    }
  }

  /**
   * เปิด modal แชร์
   */
  const openShareModal = () => {
    showShareModal.value = true
  }

  /**
   * ปิด modal แชร์
   */
  const closeShareModal = () => {
    showShareModal.value = false
  }

  return {
    showShareModal,
    copySuccess,
    isGeneratingImage,
    formatShareText,
    copyToClipboard,
    shareToLine,
    shareToFacebook,
    shareToWhatsApp,
    shareNative,
    openShareModal,
    closeShareModal,
  }
}
