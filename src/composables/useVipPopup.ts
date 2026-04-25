// composables/useVipPopup.ts
import { ref } from 'vue'

export const useVipPopup = () => {
  const vipPopup = ref<{
    show: boolean
    message: string
    type: 'success' | 'error' | 'info'
  }>({
    show: false,
    message: '',
    type: 'success'
  })

  const showPopup = (
    message: string,
    type: 'success' | 'error' | 'info' = 'success',
    duration = 3000
  ) => {
    vipPopup.value = { show: true, message, type }
    setTimeout(() => (vipPopup.value.show = false), duration)
  }

  return { vipPopup, showPopup }
}