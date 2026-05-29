import { ref, computed } from 'vue'
import { collection, query, orderBy, getDocs, onSnapshot, where, Timestamp } from 'firebase/firestore'
import { useNuxtApp } from '#app'

export interface HourlyData {
  hour: string
  count: number
}

export interface DailyData {
  date: string
  count: number
  label: string
}

export interface ExtensionData {
  date: string
  count: number
  label: string
}

export interface LoginAnalytics {
  hourly: HourlyData[]
  daily: DailyData[]
  todayCount: number
  weekCount: number
  monthCount: number
  totalUsers: number
  activeToday: number
  extensionDaily: ExtensionData[]
  extensionTodayCount: number
  extensionWeekCount: number
  extensionMonthCount: number
}

export const useLoginAnalytics = () => {
  const nuxtApp = useNuxtApp()
  const db = nuxtApp.$db
  const loading = ref(false)
  const error = ref<string | null>(null)

  const analytics = ref<LoginAnalytics>({
    hourly: [],
    daily: [],
    todayCount: 0,
    weekCount: 0,
    monthCount: 0,
    totalUsers: 0,
    activeToday: 0,
    extensionDaily: [],
    extensionTodayCount: 0,
    extensionWeekCount: 0,
    extensionMonthCount: 0
  })

  // สร้างข้อมูล 24 ชั่วโมงล่าสุด
  const generateHourlyData = (loginData: any[]) => {
    const now = new Date()
    const hourlyMap = new Map<number, number>()

    // Initialize 24 hours
    for (let i = 23; i >= 0; i--) {
      const hourDate = new Date(now.getTime() - i * 60 * 60 * 1000)
      hourlyMap.set(hourDate.getHours(), 0)
    }

    // Count logins per hour
    loginData.forEach(login => {
      const loginDate = login.timestamp.toDate()
      const hoursDiff = Math.floor((now.getTime() - loginDate.getTime()) / (1000 * 60 * 60))
      if (hoursDiff < 24) {
        const hour = loginDate.getHours()
        hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + 1)
      }
    })

    // Convert to array
    const result: HourlyData[] = []
    for (let i = 23; i >= 0; i--) {
      const hourDate = new Date(now.getTime() - i * 60 * 60 * 1000)
      const hour = hourDate.getHours()
      result.push({
        hour: hour.toString().padStart(2, '0') + ':00',
        count: hourlyMap.get(hour) || 0
      })
    }

    return result
  }

  // สร้างข้อมูล 7 วันล่าสุด
  const generateDailyData = (loginData: any[]) => {
    const now = new Date()
    const dailyMap = new Map<string, number>()

    // Initialize 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dateKey = date.toISOString().split('T')[0]
      dailyMap.set(dateKey, 0)
    }

    // Count logins per day
    loginData.forEach(login => {
      const loginDate = login.timestamp.toDate()
      const dateKey = loginDate.toISOString().split('T')[0]
      if (dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + 1)
      }
    })

    // Convert to array with Thai day names
    const thaiDays = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']
    const result: DailyData[] = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dateKey = date.toISOString().split('T')[0]
      const dayName = thaiDays[date.getDay()]
      const dayMonth = `${date.getDate()}/${date.getMonth() + 1}`

      result.push({
        date: dateKey,
        count: dailyMap.get(dateKey) || 0,
        label: i === 0 ? 'วันนี้' : `${dayName} ${dayMonth}`
      })
    }

    return result
  }

  // สร้างข้อมูลการต่ออายุ 7 วันล่าสุด
  const generateExtensionDailyData = (extensionData: any[]) => {
    const now = new Date()
    const dailyMap = new Map<string, number>()

    // Initialize 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dateKey = date.toISOString().split('T')[0]
      dailyMap.set(dateKey, 0)
    }

    // Count extensions per day
    extensionData.forEach(ext => {
      const extDate = ext.timestamp.toDate()
      const dateKey = extDate.toISOString().split('T')[0]
      if (dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + 1)
      }
    })

    // Convert to array with Thai day names
    const thaiDays = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']
    const result: ExtensionData[] = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dateKey = date.toISOString().split('T')[0]
      const dayName = thaiDays[date.getDay()]
      const dayMonth = `${date.getDate()}/${date.getMonth() + 1}`

      result.push({
        date: dateKey,
        count: dailyMap.get(dateKey) || 0,
        label: i === 0 ? 'วันนี้' : `${dayName} ${dayMonth}`
      })
    }

    return result
  }

  // คำนวณสถิติต่าง ๆ
  const calculateStats = (loginData: any[]) => {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    let todayCount = 0
    let weekCount = 0
    let monthCount = 0
    const todayUsers = new Set<string>()
    const allUsers = new Set<string>()

    loginData.forEach(login => {
      const loginDate = login.timestamp.toDate()
      allUsers.add(login.email)

      if (loginDate >= todayStart) {
        todayCount++
        todayUsers.add(login.email)
      }
      if (loginDate >= weekStart) {
        weekCount++
      }
      if (loginDate >= monthStart) {
        monthCount++
      }
    })

    return {
      todayCount,
      weekCount,
      monthCount,
      totalUsers: allUsers.size,
      activeToday: todayUsers.size
    }
  }

  // ดึงข้อมูลจาก Firestore
  const fetchAnalytics = async () => {
    loading.value = true
    error.value = null

    try {
      const loginCollection = collection(db, 'login_history')
      const adminActionsCollection = collection(db, 'admin_actions')

      // ดึงข้อมูล 30 วันล่าสุด
      const monthAgo = new Date()
      monthAgo.setDate(monthAgo.getDate() - 30)
      const monthTimestamp = Timestamp.fromDate(monthAgo)

      // ดึงข้อมูล login
      const loginQuery = query(
        loginCollection,
        where('timestamp', '>=', monthTimestamp),
        orderBy('timestamp', 'desc')
      )
      const loginSnapshot = await getDocs(loginQuery)
      const loginData = loginSnapshot.docs.map(doc => doc.data())

      // ดึงข้อมูลการต่ออายุ
      const extensionQuery = query(
        adminActionsCollection,
        where('timestamp', '>=', monthTimestamp),
        where('action', '==', 'extend_subscription'),
        orderBy('timestamp', 'desc')
      )
      const extensionSnapshot = await getDocs(extensionQuery)
      const extensionData = extensionSnapshot.docs.map(doc => doc.data())

      // สร้างข้อมูลกราฟ login
      analytics.value.hourly = generateHourlyData(loginData)
      analytics.value.daily = generateDailyData(loginData)

      // คำนวณสถิติ login
      const stats = calculateStats(loginData)
      analytics.value.todayCount = stats.todayCount
      analytics.value.weekCount = stats.weekCount
      analytics.value.monthCount = stats.monthCount
      analytics.value.totalUsers = stats.totalUsers
      analytics.value.activeToday = stats.activeToday

      // สร้างข้อมูลกราฟการต่ออายุ
      analytics.value.extensionDaily = generateExtensionDailyData(extensionData)

      // คำนวณสถิติการต่ออายุ
      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const monthStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      analytics.value.extensionTodayCount = extensionData.filter(ext => ext.timestamp.toDate() >= todayStart).length
      analytics.value.extensionWeekCount = extensionData.filter(ext => ext.timestamp.toDate() >= weekStart).length
      analytics.value.extensionMonthCount = extensionData.filter(ext => ext.timestamp.toDate() >= monthStart).length

      console.log('✅ Login analytics fetched successfully')
    } catch (err: any) {
      error.value = err.message
      console.error('❌ Error fetching analytics:', err)
    } finally {
      loading.value = false
    }
  }

  // Subscribe to real-time updates
  const subscribeToAnalytics = () => {
    try {
      const loginCollection = collection(db, 'login_history')
      const adminActionsCollection = collection(db, 'admin_actions')

      // ดึงข้อมูล 30 วันล่าสุด
      const monthAgo = new Date()
      monthAgo.setDate(monthAgo.getDate() - 30)
      const monthTimestamp = Timestamp.fromDate(monthAgo)

      // Subscribe to login data
      const loginQuery = query(
        loginCollection,
        where('timestamp', '>=', monthTimestamp),
        orderBy('timestamp', 'desc')
      )

      const unsubscribeLogin = onSnapshot(loginQuery, (snapshot) => {
        const loginData = snapshot.docs.map(doc => doc.data())

        // สร้างข้อมูลกราฟ login
        analytics.value.hourly = generateHourlyData(loginData)
        analytics.value.daily = generateDailyData(loginData)

        // คำนวณสถิติ login
        const stats = calculateStats(loginData)
        analytics.value.todayCount = stats.todayCount
        analytics.value.weekCount = stats.weekCount
        analytics.value.monthCount = stats.monthCount
        analytics.value.totalUsers = stats.totalUsers
        analytics.value.activeToday = stats.activeToday

        console.log('🔄 Real-time login analytics update')
      })

      // Subscribe to extension data
      const extensionQuery = query(
        adminActionsCollection,
        where('timestamp', '>=', monthTimestamp),
        where('action', '==', 'extend_subscription'),
        orderBy('timestamp', 'desc')
      )

      const unsubscribeExtension = onSnapshot(extensionQuery, (snapshot) => {
        const extensionData = snapshot.docs.map(doc => doc.data())

        // สร้างข้อมูลกราฟการต่ออายุ
        analytics.value.extensionDaily = generateExtensionDailyData(extensionData)

        // คำนวณสถิติการต่ออายุ
        const now = new Date()
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        const monthStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

        analytics.value.extensionTodayCount = extensionData.filter(ext => ext.timestamp.toDate() >= todayStart).length
        analytics.value.extensionWeekCount = extensionData.filter(ext => ext.timestamp.toDate() >= weekStart).length
        analytics.value.extensionMonthCount = extensionData.filter(ext => ext.timestamp.toDate() >= monthStart).length

        console.log('🔄 Real-time extension analytics update')
      })

      // Return combined unsubscribe function
      return () => {
        unsubscribeLogin()
        unsubscribeExtension()
      }
    } catch (err) {
      console.error('❌ Error subscribing to analytics:', err)
      return () => {}
    }
  }

  // Computed: Max value for scaling charts
  const maxHourlyValue = computed(() => {
    return Math.max(...analytics.value.hourly.map(h => h.count), 1)
  })

  const maxDailyValue = computed(() => {
    return Math.max(...analytics.value.daily.map(d => d.count), 1)
  })

  const maxExtensionValue = computed(() => {
    return Math.max(...analytics.value.extensionDaily.map(e => e.count), 1)
  })

  return {
    analytics,
    loading,
    error,
    fetchAnalytics,
    subscribeToAnalytics,
    maxHourlyValue,
    maxDailyValue,
    maxExtensionValue
  }
}
