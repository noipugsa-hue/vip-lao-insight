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
  { id: 'lao-vip', name: 'lao-vip', displayName: 'ลาวVIP' },
  { id: 'lao-special', name: 'lao-special', displayName: 'ลาวพิเศษ' },
  { id: 'nikkei-vip-morning', name: 'nikkei-vip-morning', displayName: 'นิเคอิVIPเช้า' },
  { id: 'dow-jones', name: 'dow-jones', displayName: 'ดาวโจนส์อเมริกา' },
  { id: 'hanoi', name: 'hanoi', displayName: 'ฮานอย' },
  { id: 'hanoi-vip', name: 'hanoi-vip', displayName: 'ฮานอยVIP' },
  { id: 'hanoi-special', name: 'hanoi-special', displayName: 'ฮานอยพิเศษ' },
  { id: 'hanoi-chaiyo', name: 'hanoi-chaiyo', displayName: 'ฮานอยไชโย' },
]

const STORAGE_KEY = 'selected_lottery_type'

// ประเภทหวยที่เลือกอยู่ (default: ลาวพัฒนา)
const defaultLotteryType = lotteryTypes.find(t => t.id === 'lao-dev') || lotteryTypes[0]
if (!defaultLotteryType) {
  throw new Error('No lottery types available')
}
const selectedLotteryType = ref<LotteryType>(defaultLotteryType)

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
