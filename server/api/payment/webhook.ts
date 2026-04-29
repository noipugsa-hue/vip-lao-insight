// server/api/payment/webhook.ts
/**
 * Webhook Endpoint สำหรับรับ callback จาก Omise
 * จะถูกเรียกเมื่อมีการเปลี่ยนแปลงสถานะของ payment
 *
 * Omise will POST to: /api/payment/webhook
 *
 * Note: ต้องติดตั้ง firebase-admin ก่อนใช้งาน:
 * npm install firebase-admin
 */

import { defineEventHandler, readBody, createError } from 'h3'

// Firebase Admin - lazy loaded
let admin: any = null
let db: any = null
let adminInitialized = false

// Initialize Firebase Admin lazily
async function initializeFirebaseAdmin() {
  if (adminInitialized) return

  try {
    // Try to import firebase-admin dynamically
    admin = await import('firebase-admin').then(m => m.default || m)

    // Initialize Firebase Admin (if not already initialized)
    if (!admin.apps || !admin.apps.length) {
      const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
      if (serviceAccount) {
        admin.initializeApp({
          credential: admin.credential.cert(JSON.parse(serviceAccount))
        })
      } else {
        // Development mode - use default credentials
        admin.initializeApp()
      }
    }

    db = admin.firestore()
    adminInitialized = true
    console.log('✅ Firebase Admin initialized for webhooks')
  } catch (error) {
    console.warn('⚠️ Firebase Admin not available. Install with: npm install firebase-admin')
    console.warn('⚠️ Webhooks will log events but not update database')
    adminInitialized = true // Mark as attempted
  }
}

export default defineEventHandler(async (event) => {
  try {
    // Initialize Firebase Admin if needed
    await initializeFirebaseAdmin()

    // Read webhook payload
    const payload = await readBody(event)

    console.log('📨 Received webhook from Omise:', {
      key: payload.key,
      id: payload.id
    })

    // Verify webhook signature (optional but recommended)
    // const signature = getHeader(event, 'x-omise-signature')
    // if (!verifyWebhookSignature(signature, payload)) {
    //   throw createError({
    //     statusCode: 401,
    //     statusMessage: 'Invalid webhook signature'
    //   })
    // }

    // Handle different event types
    const eventType = payload.key

    switch (eventType) {
      case 'charge.complete':
        await handleChargeComplete(payload.data)
        break

      case 'charge.create':
        await handleChargeCreate(payload.data)
        break

      case 'charge.update':
        await handleChargeUpdate(payload.data)
        break

      case 'transfer.create':
      case 'transfer.update':
        // Handle transfer events if needed
        console.log('📤 Transfer event:', eventType)
        break

      default:
        console.log('🔔 Unhandled event type:', eventType)
    }

    // Always return 200 OK to acknowledge receipt
    return {
      success: true,
      message: 'Webhook processed'
    }
  } catch (error: any) {
    console.error('❌ Error processing webhook:', error)

    // Still return 200 OK to prevent Omise from retrying
    // Log the error for manual investigation
    return {
      success: false,
      message: 'Webhook processing error',
      error: error.message
    }
  }
})

// Handle charge.complete event (payment successful)
async function handleChargeComplete(charge: any) {
  try {
    console.log('✅ Charge completed:', charge.id)

    // Extract metadata
    const userId = charge.metadata?.userId
    const plan = charge.metadata?.plan

    if (!userId || !plan) {
      console.warn('⚠️ Missing metadata in charge:', charge.id)
      return
    }

    // Check if Firebase Admin is available
    if (!db) {
      console.warn('⚠️ Firebase Admin not available, skipping database update')
      return
    }

    // Update payment status in Firestore
    const paymentsRef = db.collection('payments')
    const paymentQuery = await paymentsRef
      .where('omiseChargeId', '==', charge.id)
      .limit(1)
      .get()

    if (!paymentQuery.empty) {
      const paymentDoc = paymentQuery.docs[0]
      await paymentDoc.ref.update({
        status: 'completed',
        completedAt: new Date(),
        chargeData: charge
      })
      console.log('💾 Payment status updated in Firestore')
    }

    // Update subscription status
    const subscriptionRef = db.collection('subscriptions').doc(userId)
    const subscriptionDoc = await subscriptionRef.get()

    if (subscriptionDoc.exists) {
      await subscriptionRef.update({
        status: 'active',
        updatedAt: new Date()
      })
      console.log('💾 Subscription activated for user:', userId)
    }

    // Send confirmation email or notification (optional)
    // await sendPaymentConfirmation(userId, charge)

  } catch (error) {
    console.error('❌ Error handling charge.complete:', error)
  }
}

// Handle charge.create event (payment initiated)
async function handleChargeCreate(charge: any) {
  try {
    console.log('🆕 Charge created:', charge.id)

    const userId = charge.metadata?.userId
    const plan = charge.metadata?.plan

    if (!userId || !plan) {
      return
    }

    // You can create a pending payment record here if needed
    // or send a notification that payment was initiated
  } catch (error) {
    console.error('❌ Error handling charge.create:', error)
  }
}

// Handle charge.update event (payment status changed)
async function handleChargeUpdate(charge: any) {
  try {
    console.log('🔄 Charge updated:', charge.id, 'Status:', charge.status)

    const userId = charge.metadata?.userId

    if (!userId) {
      return
    }

    // Check if Firebase Admin is available
    if (!db) {
      console.warn('⚠️ Firebase Admin not available, skipping database update')
      return
    }

    // Update payment status based on charge status
    const paymentsRef = db.collection('payments')
    const paymentQuery = await paymentsRef
      .where('omiseChargeId', '==', charge.id)
      .limit(1)
      .get()

    if (!paymentQuery.empty) {
      const paymentDoc = paymentQuery.docs[0]
      await paymentDoc.ref.update({
        status: mapChargeStatus(charge.status),
        updatedAt: new Date(),
        chargeData: charge
      })
      console.log('💾 Payment status updated:', charge.status)
    }

    // If payment failed, update subscription status
    if (charge.status === 'failed' || charge.status === 'expired') {
      const subscriptionRef = db.collection('subscriptions').doc(userId)
      await subscriptionRef.update({
        status: 'expired',
        updatedAt: new Date()
      })
      console.log('💾 Subscription expired due to payment failure')
    }
  } catch (error) {
    console.error('❌ Error handling charge.update:', error)
  }
}

// Map Omise charge status to our internal status
function mapChargeStatus(omiseStatus: string): string {
  const statusMap: Record<string, string> = {
    'successful': 'completed',
    'failed': 'failed',
    'pending': 'pending',
    'expired': 'expired',
    'reversed': 'refunded'
  }

  return statusMap[omiseStatus] || omiseStatus
}

// Verify webhook signature (implement based on Omise documentation)
// Uncomment and implement when needed:
// function verifyWebhookSignature(signature: string | undefined, payload: any): boolean {
//   // Implement signature verification logic
//   // See: https://www.omise.co/webhook-verification
//   return true // Placeholder
// }
