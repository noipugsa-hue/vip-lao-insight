import { ref } from 'vue'
import { collection, addDoc, query, orderBy, limit, getDocs, onSnapshot, where, Timestamp } from 'firebase/firestore'
import { useNuxtApp } from '#app'

export interface LoginRecord {
  email: string
  timestamp: Date
  userAgent: string
  userId: string
}

export interface LoginStats {
  totalLogins: number
  todayLogins: number
  uniqueUsers: Set<string>
  recentLogins: LoginRecord[]
}

export interface DailyUserStat {
  date: string
  count: number
  logins: number
}

export const useLoginStats = () => {
  const nuxtApp = useNuxtApp()
  const db = nuxtApp.$db
  const stats = ref<LoginStats>({
    totalLogins: 0,
    todayLogins: 0,
    uniqueUsers: new Set(),
    recentLogins: []
  })

  // บันทึก login
  const recordLogin = async (userId: string, email: string) => {
    try {
      const loginData = {
        userId,
        email,
        timestamp: Timestamp.now(),
        userAgent: navigator.userAgent,
        device: /mobile/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
      }

      console.log('📝 Attempting to record login for user:', userId, email)
      await addDoc(collection(db, 'login_history'), loginData)
      console.log('✅ Login recorded successfully')
    } catch (error: any) {
      console.error('❌ Error recording login:', error)
      console.error('❌ Error code:', error?.code)
      console.error('❌ Error message:', error?.message)
      // Don't throw - allow login to continue even if logging fails
    }
  }

  // ดึงสถิติการ login
  const fetchStats = async () => {
    try {
      const loginCollection = collection(db, 'login_history')

      // ดึง login ทั้งหมด (จำกัด 1000 รายการ)
      const allQuery = query(loginCollection, orderBy('timestamp', 'desc'), limit(1000))
      const allSnapshot = await getDocs(allQuery)

      stats.value.totalLogins = allSnapshot.size

      // นับ unique users
      const uniqueUsers = new Set<string>()
      allSnapshot.forEach(doc => {
        uniqueUsers.add(doc.data().email)
      })
      stats.value.uniqueUsers = uniqueUsers

      // ดึง login วันนี้
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayTimestamp = Timestamp.fromDate(today)

      const todayQuery = query(
        loginCollection,
        where('timestamp', '>=', todayTimestamp),
        orderBy('timestamp', 'desc')
      )
      const todaySnapshot = await getDocs(todayQuery)
      stats.value.todayLogins = todaySnapshot.size

      // ดึง login ล่าสุด 20 รายการ
      const recentQuery = query(loginCollection, orderBy('timestamp', 'desc'), limit(20))
      const recentSnapshot = await getDocs(recentQuery)

      stats.value.recentLogins = recentSnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          email: data.email,
          timestamp: data.timestamp.toDate(),
          userAgent: data.userAgent,
          userId: data.userId
        }
      })

      console.log('✅ Stats fetched successfully')
    } catch (error) {
      console.error('❌ Error fetching stats:', error)
    }
  }

  // Subscribe to real-time updates
  const subscribeToStats = () => {
    try {
      const loginCollection = collection(db, 'login_history')

      // Subscribe to recent logins (real-time)
      const recentQuery = query(loginCollection, orderBy('timestamp', 'desc'), limit(20))
      const unsubscribeRecent = onSnapshot(recentQuery, (snapshot) => {
        stats.value.recentLogins = snapshot.docs.map(doc => {
          const data = doc.data()
          return {
            email: data.email,
            timestamp: data.timestamp.toDate(),
            userAgent: data.userAgent,
            userId: data.userId
          }
        })
        console.log('🔄 Real-time update: Recent logins')
      })

      // Subscribe to all logins for total count
      const allQuery = query(loginCollection, orderBy('timestamp', 'desc'), limit(1000))
      const unsubscribeAll = onSnapshot(allQuery, (snapshot) => {
        stats.value.totalLogins = snapshot.size

        // นับ unique users
        const uniqueUsers = new Set<string>()
        snapshot.forEach(doc => {
          uniqueUsers.add(doc.data().email)
        })
        stats.value.uniqueUsers = uniqueUsers
        console.log('🔄 Real-time update: Total logins')
      })

      // Subscribe to today's logins
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayTimestamp = Timestamp.fromDate(today)

      const todayQuery = query(
        loginCollection,
        where('timestamp', '>=', todayTimestamp),
        orderBy('timestamp', 'desc')
      )
      const unsubscribeToday = onSnapshot(todayQuery, (snapshot) => {
        stats.value.todayLogins = snapshot.size
        console.log('🔄 Real-time update: Today logins')
      })

      // Return unsubscribe function
      return () => {
        unsubscribeRecent()
        unsubscribeAll()
        unsubscribeToday()
        console.log('👋 Unsubscribed from real-time updates')
      }
    } catch (error) {
      console.error('❌ Error subscribing to stats:', error)
      return () => {}
    }
  }

  // คำนวณสถิติผู้ใช้รายวัน
  const getDailyUserStats = async (days: number = 30): Promise<DailyUserStat[]> => {
    try {
      const loginCollection = collection(db, 'login_history')

      // คำนวณวันที่เริ่มต้น
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
      startDate.setHours(0, 0, 0, 0)
      const startTimestamp = Timestamp.fromDate(startDate)

      // ดึงข้อมูล login ย้อนหลัง N วัน
      const dailyQuery = query(
        loginCollection,
        where('timestamp', '>=', startTimestamp),
        orderBy('timestamp', 'desc')
      )
      const snapshot = await getDocs(dailyQuery)

      console.log('📊 Total login records fetched:', snapshot.size)

      // จัดกลุ่มตามวัน (ใช้ format YYYY-MM-DD เพื่อความแม่นยำ)
      const dailyData = new Map<string, Set<string>>()
      const dailyLogins = new Map<string, number>()

      snapshot.forEach(doc => {
        const data = doc.data()
        const date = data.timestamp.toDate()

        // ใช้ local time zone และ format เป็น YYYY-MM-DD
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const dateKey = `${year}-${month}-${day}`

        // นับผู้ใช้ที่ไม่ซ้ำในแต่ละวัน
        if (!dailyData.has(dateKey)) {
          dailyData.set(dateKey, new Set())
          dailyLogins.set(dateKey, 0)
        }
        dailyData.get(dateKey)!.add(data.email)
        dailyLogins.set(dateKey, (dailyLogins.get(dateKey) || 0) + 1)
      })

      console.log('📅 Days with data:', Array.from(dailyData.keys()))

      // สร้าง array สำหรับทุกวัน (รวมวันที่ไม่มีข้อมูล)
      const result: DailyUserStat[] = []
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        date.setHours(0, 0, 0, 0)

        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const dateKey = `${year}-${month}-${day}`

        // แปลงเป็นภาษาไทยสำหรับแสดงผล
        const displayDate = date.toLocaleDateString('th-TH', {
          day: 'numeric',
          month: 'short'
        })

        const userCount = dailyData.get(dateKey)?.size || 0
        const loginCount = dailyLogins.get(dateKey) || 0

        result.push({
          date: displayDate,
          count: userCount,
          logins: loginCount
        })

        if (i === 0) {
          console.log(`📊 Today (${dateKey}): ${userCount} users, ${loginCount} logins`)
        }
      }

      console.log('✅ Daily stats calculated for', days, 'days')
      return result
    } catch (error) {
      console.error('❌ Error calculating daily stats:', error)
      return []
    }
  }

  return {
    stats,
    recordLogin,
    fetchStats,
    subscribeToStats,
    getDailyUserStats
  }
}
