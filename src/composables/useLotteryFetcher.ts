// ~/composables/useLotteryFetcher.ts
import { ref } from 'vue'
import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore'

export interface LotteryResult {
  date: string
  period: string
  threeDigit: string // เลข 3 ตัว
  twoDigit?: string // เลข 2 ตัว (ถ้ามี)
  fourDigit?: string // เลข 4 ตัว (ถ้ามี)
  source: string
  fetchedAt: Date
  lotteryType?: string // ประเภทหวย (government, savings, baac, etc.)
}

export const useLotteryFetcher = () => {
  const db = useNuxtApp().$db
  const isFetching = ref(false)
  const error = ref<string | null>(null)
  const lastResult = ref<LotteryResult | null>(null)

  /**
   * fetchFromRachaLotto
   * ดึงข้อมูลผลหวยจาก racha-lotto.net API ผ่าน server endpoint
   */
  const fetchFromRachaLotto = async (): Promise<LotteryResult | null> => {
    try {
      isFetching.value = true
      error.value = null

      // ใช้ server API endpoint เพื่อหลีกเลี่ยงปัญหา CORS
      const response = await fetch('/api/lottery/fetch')

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || 'ไม่สามารถดึงข้อมูลได้')
      }

      // แปลงข้อมูลเป็นรูปแบบ LotteryResult
      const result: LotteryResult = {
        date: data.data.date,
        period: data.data.period,
        threeDigit: data.data.threeDigit,
        twoDigit: data.data.twoDigit,
        fourDigit: data.data.fourDigit,
        source: data.data.source,
        fetchedAt: new Date(data.data.fetchedAt)
      }

      lastResult.value = result
      return result

    } catch (e: any) {
      error.value = e.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล'
      console.error('Error fetching lottery:', e)
      return null
    } finally {
      isFetching.value = false
    }
  }

  /**
   * fetchDemo
   * ดึงข้อมูลทดสอบจาก demo API (สำหรับทดสอบระบบ)
   */
  const fetchDemo = async (): Promise<LotteryResult | null> => {
    try {
      isFetching.value = true
      error.value = null

      const response = await fetch('/api/lottery/demo')

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error('ไม่สามารถดึงข้อมูล demo ได้')
      }

      const result: LotteryResult = {
        date: data.data.date,
        period: data.data.period,
        threeDigit: data.data.threeDigit,
        twoDigit: data.data.twoDigit,
        fourDigit: data.data.fourDigit,
        source: data.data.source,
        fetchedAt: new Date(data.data.fetchedAt)
      }

      lastResult.value = result
      return result

    } catch (e: any) {
      error.value = e.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล demo'
      console.error('Error fetching demo:', e)
      return null
    } finally {
      isFetching.value = false
    }
  }

  /**
   * fetchWithCustomAPI
   * ดึงข้อมูลโดยใช้ API ที่กำหนดเอง (สำหรับกรณีที่ต้อง scrape หรือใช้ proxy)
   */
  const fetchWithCustomAPI = async (customEndpoint: string): Promise<LotteryResult | null> => {
    try {
      isFetching.value = true
      error.value = null

      const response = await fetch(customEndpoint)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      const result: LotteryResult = {
        date: data.date || new Date().toISOString().split('T')[0],
        period: data.period || data.round || 'latest',
        threeDigit: data.threeDigit || data.number3 || data.result,
        twoDigit: data.twoDigit || data.number2,
        fourDigit: data.fourDigit || data.number4,
        source: customEndpoint,
        fetchedAt: new Date()
      }

      lastResult.value = result
      return result

    } catch (e: any) {
      error.value = e.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล'
      console.error('Error fetching with custom API:', e)
      return null
    } finally {
      isFetching.value = false
    }
  }

  /**
   * saveToFirestore
   * บันทึกผลหวยลง Firestore
   */
  const saveToFirestore = async (result: LotteryResult, lotteryType?: string): Promise<boolean> => {
    try {
      const lotteriesRef = collection(db, 'lotteryResults')

      await addDoc(lotteriesRef, {
        ...result,
        lotteryType: lotteryType || result.lotteryType || 'lao-dev',
        createdAt: new Date(),
        updatedAt: new Date()
      })

      console.log('✅ บันทึกผลหวยลง Firestore สำเร็จ')
      return true
    } catch (e: any) {
      console.error('❌ Error saving to Firestore:', e)
      error.value = 'ไม่สามารถบันทึกข้อมูลลง Firestore ได้'
      return false
    }
  }

  /**
   * fetchAndSave
   * ดึงข้อมูลและบันทึกลง Firestore ในคำสั่งเดียว
   */
  const fetchAndSave = async (): Promise<boolean> => {
    const result = await fetchFromRachaLotto()

    if (!result) {
      return false
    }

    return await saveToFirestore(result)
  }

  /**
   * getLatestFromFirestore
   * ดึงผลหวยงวดใหม่จาก Firestore (กรองตามประเภทหวย)
   */
  const getLatestFromFirestore = async (lotteryType?: string): Promise<LotteryResult | null> => {
    try {
      const lotteriesRef = collection(db, 'lotteryResults')
      let q = query(lotteriesRef, orderBy('fetchedAt', 'desc'), limit(1))

      // ถ้ามีการระบุประเภทหวย ให้กรองตามประเภท
      if (lotteryType) {
        const { where } = await import('firebase/firestore')
        q = query(lotteriesRef, where('lotteryType', '==', lotteryType), orderBy('fetchedAt', 'desc'), limit(1))
      }

      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        return null
      }

      const doc = querySnapshot.docs[0]
      return doc.data() as LotteryResult
    } catch (e: any) {
      console.error('❌ Error getting latest from Firestore:', e)
      return null
    }
  }

  /**
   * getAllFromFirestore
   * ดึงผลหวยทั้งหมดจาก Firestore (กรองตามประเภทหวย)
   */
  const getAllFromFirestore = async (limitCount: number = 50, lotteryType?: string): Promise<LotteryResult[]> => {
    try {
      const lotteriesRef = collection(db, 'lotteryResults')
      let q = query(lotteriesRef, orderBy('fetchedAt', 'desc'), limit(limitCount))

      // ถ้ามีการระบุประเภทหวย ให้กรองตามประเภท
      if (lotteryType) {
        const { where } = await import('firebase/firestore')
        q = query(lotteriesRef, where('lotteryType', '==', lotteryType), orderBy('fetchedAt', 'desc'), limit(limitCount))
      }

      const querySnapshot = await getDocs(q)

      return querySnapshot.docs.map(doc => doc.data() as LotteryResult)
    } catch (e: any) {
      console.error('❌ Error getting all from Firestore:', e)
      return []
    }
  }

  /**
   * testEndpoint
   * ทดสอบ endpoint แต่ละตัวเพื่อดูรายละเอียดการเชื่อมต่อ
   */
  const testEndpoint = async (url: string): Promise<any> => {
    try {
      const response = await fetch(`/api/lottery/test-endpoint?url=${encodeURIComponent(url)}`)
      const data = await response.json()
      return data
    } catch (e: any) {
      console.error('Error testing endpoint:', e)
      return {
        success: false,
        error: e.message || 'เกิดข้อผิดพลาด'
      }
    }
  }

  /**
   * testAllEndpoints
   * ทดสอบ endpoints ทั้งหมดและส่งคืนรายงานสถานะ
   */
  const testAllEndpoints = async (): Promise<any[]> => {
    const endpoints = [
      'https://www.racha-lotto.net/api/result-product/LA',
      'https://api.racha-lotto.net/result-product/LA',
      'https://www.racha-lotto.net/api/results/LA',
      'https://api.racha-lotto.net/results/LA',
      'https://www.racha-lotto.net/api/lao/latest',
      'https://api.racha-lotto.net/lao/latest'
    ]

    const results = []
    for (const endpoint of endpoints) {
      const result = await testEndpoint(endpoint)
      results.push({ endpoint, ...result })
    }

    return results
  }

  /**
   * manualAddResult
   * เพิ่มผลหวยด้วยตัวเองแบบ manual
   */
  const manualAddResult = async (
    threeDigit: string,
    lotteryType: string,
    date?: string,
    period?: string,
    twoDigit?: string,
    fourDigit?: string
  ): Promise<boolean> => {
    const result: LotteryResult = {
      date: date || new Date().toISOString().split('T')[0],
      period: period || 'manual',
      threeDigit,
      twoDigit: twoDigit || undefined,
      fourDigit: fourDigit || undefined,
      source: 'manual',
      fetchedAt: new Date(),
      lotteryType
    }

    return await saveToFirestore(result, lotteryType)
  }

  /**
   * fetchDemoAndSave
   * ดึงข้อมูล demo และบันทึกลง Firestore
   */
  const fetchDemoAndSave = async (): Promise<boolean> => {
    const result = await fetchDemo()

    if (!result) {
      return false
    }

    return await saveToFirestore(result)
  }

  /**
   * fetchFromScraper
   * ดึงข้อมูลจาก Puppeteer scraper (local development only)
   */
  const fetchFromScraper = async (): Promise<LotteryResult | null> => {
    try {
      isFetching.value = true
      error.value = null

      const response = await fetch('/api/lottery/scrape')

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || 'ไม่สามารถดึงข้อมูลได้')
      }

      const result: LotteryResult = {
        date: data.data.date,
        period: data.data.period,
        threeDigit: data.data.threeDigit,
        twoDigit: data.data.twoDigit,
        fourDigit: data.data.fourDigit,
        source: data.data.source,
        fetchedAt: new Date(data.data.fetchedAt)
      }

      lastResult.value = result
      return result

    } catch (e: any) {
      error.value = e.message || 'เกิดข้อผิดพลาดในการ scrape ข้อมูล'
      console.error('Error scraping lottery:', e)
      return null
    } finally {
      isFetching.value = false
    }
  }

  /**
   * fetchScraperAndSave
   * ดึงข้อมูลจาก scraper และบันทึกลง Firestore
   */
  const fetchScraperAndSave = async (): Promise<boolean> => {
    const result = await fetchFromScraper()

    if (!result) {
      return false
    }

    return await saveToFirestore(result)
  }

  return {
    isFetching,
    error,
    lastResult,
    fetchFromRachaLotto,
    fetchDemo,
    fetchFromScraper,
    fetchWithCustomAPI,
    saveToFirestore,
    fetchAndSave,
    fetchDemoAndSave,
    fetchScraperAndSave,
    getLatestFromFirestore,
    getAllFromFirestore,
    manualAddResult,
    testEndpoint,
    testAllEndpoints
  }
}
