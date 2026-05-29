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

export const useLoginStats = () => {
  const nuxtApp = useNuxtApp()
  const db = nuxtApp.$db
  const stats = ref<LoginStats>({
    totalLogins: 0,
    todayLogins: 0,
    uniqueUsers: new Set(),
    recentLogins: []
  })

  // บันทึก login (ปิดชั่วคราวเพื่อหลีกเลี่ยง Error 400)
  const recordLogin = async (userId: string, email: string) => {
    // TODO: Enable this after fixing Firestore rules issues
    console.log('⏸️ Login recording temporarily disabled to avoid Error 400')
    console.log('📝 Would record login for user:', userId, email)
    return

    /* COMMENTED OUT TEMPORARILY
    try {
      const loginData = {
        userId,
        email,
        timestamp: Timestamp.now(),
        userAgent: navigator.userAgent,
        device: /mobile/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
      }

      console.log('📝 Attempting to record login for user:', userId)
      await addDoc(collection(db, 'login_history'), loginData)
      console.log('✅ Login recorded successfully')
    } catch (error: any) {
      console.error('❌ Error recording login:', error)
      console.error('❌ Error code:', error?.code)
      console.error('❌ Error message:', error?.message)
      // Don't throw - allow login to continue even if logging fails
    }
    */
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

  return {
    stats,
    recordLogin,
    fetchStats,
    subscribeToStats
  }
}
