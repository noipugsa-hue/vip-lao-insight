import { ref, computed } from 'vue'

export interface PredictionRecord {
  date: string
  lotteryType: string
  predictedNumbers: string[]
  actualNumber: string | null
  isCorrect: boolean | null
  confidence: number
}

const STORAGE_KEY = 'accuracy_tracking'
const records = ref<PredictionRecord[]>([])

export const useAccuracyTracking = () => {
  // โหลดข้อมูลจาก localStorage
  const loadRecords = () => {
    if (import.meta.client) {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        try {
          records.value = JSON.parse(stored)
        } catch (e) {
          records.value = []
        }
      }
    }
  }

  // บันทึกข้อมูลลง localStorage
  const saveRecords = () => {
    if (import.meta.client) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records.value))
    }
  }

  // เพิ่มการทำนาย
  const addPrediction = (
    lotteryType: string,
    predictedNumbers: string[],
    confidence: number
  ) => {
    const record: PredictionRecord = {
      date: new Date().toISOString(),
      lotteryType,
      predictedNumbers,
      actualNumber: null,
      isCorrect: null,
      confidence,
    }

    records.value.unshift(record)
    saveRecords()
  }

  // บันทึกผลจริง
  const recordActualResult = (index: number, actualNumber: string) => {
    if (records.value[index]) {
      records.value[index].actualNumber = actualNumber
      records.value[index].isCorrect = records.value[index].predictedNumbers.includes(actualNumber)
      saveRecords()
    }
  }

  // คำนวณสถิติความแม่น
  const accuracyStats = computed(() => {
    const verified = records.value.filter(r => r.isCorrect !== null)
    const correct = verified.filter(r => r.isCorrect).length
    const total = verified.length

    const accuracy = total > 0 ? (correct / total) * 100 : 0

    // แยกตาม confidence level
    const highConf = verified.filter(r => r.confidence >= 80)
    const medConf = verified.filter(r => r.confidence >= 50 && r.confidence < 80)
    const lowConf = verified.filter(r => r.confidence < 50)

    return {
      total,
      correct,
      incorrect: total - correct,
      accuracy: Math.round(accuracy * 10) / 10,
      highConfidence: {
        total: highConf.length,
        correct: highConf.filter(r => r.isCorrect).length,
        accuracy: highConf.length > 0 ? Math.round((highConf.filter(r => r.isCorrect).length / highConf.length) * 1000) / 10 : 0
      },
      medConfidence: {
        total: medConf.length,
        correct: medConf.filter(r => r.isCorrect).length,
        accuracy: medConf.length > 0 ? Math.round((medConf.filter(r => r.isCorrect).length / medConf.length) * 1000) / 10 : 0
      },
      lowConfidence: {
        total: lowConf.length,
        correct: lowConf.filter(r => r.isCorrect).length,
        accuracy: lowConf.length > 0 ? Math.round((lowConf.filter(r => r.isCorrect).length / lowConf.length) * 1000) / 10 : 0
      }
    }
  })

  // ล้างข้อมูล
  const clearRecords = () => {
    records.value = []
    saveRecords()
  }

  // โหลดครั้งแรก
  loadRecords()

  return {
    records,
    addPrediction,
    recordActualResult,
    accuracyStats,
    clearRecords,
    loadRecords,
  }
}
