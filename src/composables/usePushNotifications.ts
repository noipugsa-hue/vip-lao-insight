/**
 * Push Notifications Composable
 * ใช้สำหรับจัดการ push notifications ด้วย Firebase Cloud Messaging
 */

import { ref } from 'vue'

export const usePushNotifications = () => {
  const isSupported = ref(false)
  const isPermissionGranted = ref(false)
  const notificationToken = ref<string | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // ตรวจสอบว่า browser รองรับ notifications หรือไม่
  const checkSupport = () => {
    if (process.client) {
      isSupported.value = 'Notification' in window && 'serviceWorker' in navigator
      isPermissionGranted.value = Notification.permission === 'granted'
    }
    return isSupported.value
  }

  // ขอ permission จาก user
  const requestPermission = async (): Promise<boolean> => {
    if (!checkSupport()) {
      error.value = 'Browser ไม่รองรับ push notifications'
      return false
    }

    if (isPermissionGranted.value) {
      return true
    }

    try {
      const permission = await Notification.requestPermission()
      isPermissionGranted.value = permission === 'granted'

      if (!isPermissionGranted.value) {
        error.value = 'User ปฏิเสธการรับ notifications'
      }

      return isPermissionGranted.value
    } catch (err) {
      console.error('Error requesting notification permission:', err)
      error.value = 'ไม่สามารถขอ permission ได้'
      return false
    }
  }

  // แสดง notification ทดสอบ (ใช้ Web API โดยตรง)
  const showTestNotification = async (title: string, body: string) => {
    if (!checkSupport()) {
      error.value = 'Browser ไม่รองรับ notifications'
      return
    }

    const granted = await requestPermission()
    if (!granted) {
      return
    }

    try {
      // ใช้ Service Worker ส่ง notification
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready
        await registration.showNotification(title, {
          body,
          icon: '/icon-192x192.png',
          badge: '/icon-96x96.png',
          vibrate: [200, 100, 200],
          tag: 'test-notification',
          requireInteraction: false,
          data: {
            url: window.location.origin + '/home',
          },
        })
      } else {
        // Fallback: ใช้ Notification API โดยตรง
        new Notification(title, {
          body,
          icon: '/icon-192x192.png',
          tag: 'test-notification',
        })
      }
    } catch (err) {
      console.error('Error showing notification:', err)
      error.value = 'ไม่สามารถแสดง notification ได้'
    }
  }

  // Subscribe to lottery update notifications
  const subscribeToLotteryUpdates = async () => {
    const granted = await requestPermission()
    if (!granted) {
      return false
    }

    try {
      isLoading.value = true

      // ในอนาคต: เชื่อม Firebase Cloud Messaging
      // const { $messaging } = useNuxtApp()
      // const token = await getToken($messaging)
      // notificationToken.value = token

      // บันทึก subscription ลง localStorage
      if (process.client) {
        localStorage.setItem('notification_subscribed', 'true')
        localStorage.setItem('notification_subscribed_at', new Date().toISOString())
      }

      // แสดง notification ทดสอบ
      await showTestNotification(
        '🎉 เปิดการแจ้งเตือนสำเร็จ!',
        'คุณจะได้รับการแจ้งเตือนเมื่อมีผลหวยออกใหม่'
      )

      isLoading.value = false
      return true
    } catch (err) {
      console.error('Error subscribing to notifications:', err)
      error.value = 'ไม่สามารถเปิดการแจ้งเตือนได้'
      isLoading.value = false
      return false
    }
  }

  // Unsubscribe from notifications
  const unsubscribeFromNotifications = async () => {
    try {
      isLoading.value = true

      // ในอนาคต: ยกเลิก FCM token
      // const { $messaging } = useNuxtApp()
      // await deleteToken($messaging)

      // ลบ subscription จาก localStorage
      if (process.client) {
        localStorage.removeItem('notification_subscribed')
        localStorage.removeItem('notification_subscribed_at')
      }

      notificationToken.value = null
      isLoading.value = false

      return true
    } catch (err) {
      console.error('Error unsubscribing from notifications:', err)
      error.value = 'ไม่สามารถปิดการแจ้งเตือนได้'
      isLoading.value = false
      return false
    }
  }

  // ตรวจสอบว่า user subscribe อยู่หรือไม่
  const isSubscribed = () => {
    if (process.client) {
      return localStorage.getItem('notification_subscribed') === 'true'
    }
    return false
  }

  // Send notification when lottery result is available
  const notifyLotteryResult = async (lotteryType: string, date: string) => {
    if (!isSubscribed() || !checkSupport()) {
      return
    }

    await showTestNotification(
      `🎰 ผลหวย${lotteryType}ออกแล้ว!`,
      `งวดวันที่ ${date} - คลิกเพื่อดูผล`
    )
  }

  // Initialize on mount
  if (process.client) {
    checkSupport()
  }

  return {
    isSupported,
    isPermissionGranted,
    notificationToken,
    isLoading,
    error,
    checkSupport,
    requestPermission,
    showTestNotification,
    subscribeToLotteryUpdates,
    unsubscribeFromNotifications,
    isSubscribed,
    notifyLotteryResult,
  }
}
