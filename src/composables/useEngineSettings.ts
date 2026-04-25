import { ref } from 'vue'

export type CalculationMode = 'frequency' | 'rank-fusion' | 'raw-score'

export type NumberPreference = 'force' | 'ban' | 'normal'

export interface EngineSettings {
  accuracyLevel: number // 0-10
  calculationMode: CalculationMode
  numberPreferences: Record<string, NumberPreference> // '0'-'9'
}

const STORAGE_KEY = 'engine_settings'

// Default settings
const defaultSettings: EngineSettings = {
  accuracyLevel: 5,
  calculationMode: 'frequency',
  numberPreferences: {
    '0': 'normal',
    '1': 'normal',
    '2': 'normal',
    '3': 'normal',
    '4': 'normal',
    '5': 'normal',
    '6': 'normal',
    '7': 'normal',
    '8': 'normal',
    '9': 'normal',
  },
}

const settings = ref<EngineSettings>({ ...defaultSettings })

export const useEngineSettings = () => {
  // โหลดการตั้งค่าจาก localStorage
  const loadSettings = () => {
    if (import.meta.client) {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        try {
          settings.value = JSON.parse(stored)
        } catch (e) {
          settings.value = { ...defaultSettings }
        }
      }
    }
  }

  // บันทึกการตั้งค่าลง localStorage
  const saveSettings = () => {
    if (import.meta.client) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings.value))
    }
  }

  // รีเซ็ตกลับไปค่าเริ่มต้น
  const resetSettings = () => {
    settings.value = { ...defaultSettings }
    saveSettings()
  }

  // ตั้งค่า accuracy level
  const setAccuracyLevel = (level: number) => {
    settings.value.accuracyLevel = Math.max(0, Math.min(10, level))
    saveSettings()
  }

  // ตั้งค่า calculation mode
  const setCalculationMode = (mode: CalculationMode) => {
    settings.value.calculationMode = mode
    saveSettings()
  }

  // ตั้งค่า number preference
  const setNumberPreference = (digit: string, preference: NumberPreference) => {
    settings.value.numberPreferences[digit] = preference
    saveSettings()
  }

  // Toggle number preference (normal → force → ban → normal)
  const toggleNumberPreference = (digit: string) => {
    const current = settings.value.numberPreferences[digit]
    if (current === 'normal') {
      settings.value.numberPreferences[digit] = 'force'
    } else if (current === 'force') {
      settings.value.numberPreferences[digit] = 'ban'
    } else {
      settings.value.numberPreferences[digit] = 'normal'
    }
    saveSettings()
  }

  // คำนวณสถิติ number preferences
  const getNumberStats = () => {
    const digits = Object.keys(settings.value.numberPreferences)
    const total = digits.length
    const forced = digits.filter(d => settings.value.numberPreferences[d] === 'force').length
    const banned = digits.filter(d => settings.value.numberPreferences[d] === 'ban').length
    const normal = total - forced - banned

    return { total, forced, banned, normal }
  }

  // โหลดครั้งแรก
  loadSettings()

  return {
    settings,
    loadSettings,
    saveSettings,
    resetSettings,
    setAccuracyLevel,
    setCalculationMode,
    setNumberPreference,
    toggleNumberPreference,
    getNumberStats,
  }
}

// Calculation mode descriptions
export const calculationModes = [
  {
    id: 'frequency' as CalculationMode,
    label: 'A — ความถี่สูงสุด (Frequency)',
    description: 'นับเลขที่ต้น Top5 บ่อยสุดจาก 75 สูตร · เลขไหนโผเลขอะ = แม่น · เหมาะกับหวยที่ตัวเลขทวนซ้ำซาย',
    icon: '⚡',
    color: 'green',
  },
  {
    id: 'rank-fusion' as CalculationMode,
    label: 'B — ลำดับคะแนน (Rank Fusion)',
    description: 'ให้คะแนนตามลำดับ: อันดับ1=5, อันดับ2=4 ... · รวมคะแนนหว้าความถี่กับอันดับ',
    icon: '🏆',
    color: 'yellow',
  },
  {
    id: 'raw-score' as CalculationMode,
    label: 'C — คะแนนดิบสูงสุด (Raw Score)',
    description: 'ใช้คะแนนดิบ (0-100) จาก 75 สูตรรวมกันตรงๆ · ไม่ sharpen ไม่ normalize · เลขที่ได้แนนรวมสูงสุดขึ้นมา · ผลต่างจากวิธีอื่นมาก',
    icon: '🎯',
    color: 'red',
  },
]
