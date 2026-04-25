import { ref } from 'vue'

export interface LotteryType {
  id: string
  name: string
  displayName: string
}

// รายการประเภทหวยทั้งหมด
export const lotteryTypes: LotteryType[] = [
  { id: 'government', name: 'government', displayName: 'รัฐบาล' },
  { id: 'savings', name: 'savings', displayName: 'ออมสิน' },
  { id: 'baac', name: 'baac', displayName: 'ธกส.' },
  { id: 'lao-dev', name: 'lao-dev', displayName: 'ลาวพัฒนา' },
  { id: 'lao-ex', name: 'lao-ex', displayName: 'ลาวEx' },
  { id: 'nikkei-vip-morning', name: 'nikkei-vip-morning', displayName: 'นิเคอิVIPเช้า' },
  { id: 'hanoi-star', name: 'hanoi-star', displayName: 'ฮานอยดาวเซียน' },
  { id: 'nikkei-morning', name: 'nikkei-morning', displayName: 'นิเคอิเช้า' },
  { id: 'china-vip-morning', name: 'china-vip-morning', displayName: 'จีนVIPเช้า' },
  { id: 'china-morning', name: 'china-morning', displayName: 'จีนเช้า' },
  { id: 'lao-tv', name: 'lao-tv', displayName: 'ลาวTV' },
]

const STORAGE_KEY = 'selected_lottery_type'

// ประเภทหวยที่เลือกอยู่ (default: ลาวพัฒนา)
const selectedLotteryType = ref<LotteryType>(lotteryTypes[3]) // ลาวพัฒนา

export const useLotteryType = () => {
  // โหลดประเภทหวยจาก localStorage
  const loadLotteryType = () => {
    if (import.meta.client) {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const found = lotteryTypes.find(type => type.id === stored)
        if (found) {
          selectedLotteryType.value = found
        }
      }
    }
  }

  // บันทึกประเภทหวยลง localStorage
  const setLotteryType = (type: LotteryType) => {
    selectedLotteryType.value = type
    if (import.meta.client) {
      localStorage.setItem(STORAGE_KEY, type.id)
    }
  }

  // โหลดครั้งแรก
  loadLotteryType()

  return {
    lotteryTypes,
    selectedLotteryType,
    setLotteryType,
    loadLotteryType,
  }
}
