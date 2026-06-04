// server/api/payment/create-charge.ts
/**
 * API Endpoint สำหรับสร้าง Charge ผ่าน Omise Payment Gateway
 *
 * ⚠️ สถานะ: TESTING MODE - ระบบยังไม่เปิดใช้งานจริง
 * - ไม่มีการเรียก Omise API จริง
 * - ทำงานในโหมด Mock สำหรับทดสอบเท่านั้น
 * - ต้องตั้งค่า OMISE_SECRET_KEY ก่อนใช้งานจริง
 *
 * Usage:
 * POST /api/payment/create-charge
 * Body: {
 *   token: string (Omise token from frontend),
 *   plan: 'basic' | 'pro' | 'premium',
 *   method: 'promptpay' | 'credit_card' | 'truemoney',
 *   userId: string
 * }
 */

import { defineEventHandler, readBody, createError } from 'h3'

// Plan prices
const PLAN_PRICES: Record<string, number> = {
  basic: 19900, // in satang (199.00 THB)
  pro: 39900,   // in satang (399.00 THB)
  premium: 69900 // in satang (699.00 THB)
}

export default defineEventHandler(async (event) => {
  try {
    // Read request body
    const body = await readBody(event)
    const { token, plan, method, userId } = body

    // Validate input
    if (!plan || !method || !userId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required fields'
      })
    }

    if (!['basic', 'pro', 'premium'].includes(plan)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid plan'
      })
    }

    if (!['promptpay', 'credit_card', 'truemoney'].includes(method)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid payment method'
      })
    }

    // Get Omise secret key from environment
    const omiseSecretKey = process.env.OMISE_SECRET_KEY

    if (!omiseSecretKey) {
      console.warn('⚠️ OMISE_SECRET_KEY not found in environment variables. Using mock mode.')

      // Mock response for development
      return createMockChargeResponse(plan, method, userId)
    }

    // Initialize Omise client
    // Note: Install omise package with: npm install omise
    // const omise = require('omise')({
    //   secretKey: omiseSecretKey
    // })

    const amount = PLAN_PRICES[plan]
    const currency = 'THB'
    const description = `Numora Lotto AI - ${plan.toUpperCase()} Plan`

    // Create charge based on payment method
    let chargeResult: any

    if (method === 'credit_card') {
      // Credit Card payment
      if (!token) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Token is required for credit card payment'
        })
      }

      // chargeResult = await omise.charges.create({
      //   amount,
      //   currency,
      //   card: token,
      //   description,
      //   metadata: {
      //     userId,
      //     plan
      //   }
      // })

      // Mock for development
      chargeResult = {
        id: 'chrg_test_' + Date.now(),
        object: 'charge',
        status: 'successful',
        amount,
        currency
      }
    } else if (method === 'promptpay') {
      // PromptPay payment
      // chargeResult = await omise.charges.create({
      //   amount,
      //   currency,
      //   source: {
      //     type: 'promptpay'
      //   },
      //   description,
      //   metadata: {
      //     userId,
      //     plan
      //   }
      // })

      // Mock for development
      chargeResult = {
        id: 'chrg_test_' + Date.now(),
        object: 'charge',
        status: 'pending',
        amount,
        currency,
        source: {
          type: 'promptpay',
          scannable_code: {
            type: 'qr',
            image: {
              download_uri: 'https://api.omise.co/charges/chrg_test/documents/qr_code',
              uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
            }
          }
        }
      }
    } else if (method === 'truemoney') {
      // TrueMoney Wallet payment
      // chargeResult = await omise.charges.create({
      //   amount,
      //   currency,
      //   source: {
      //     type: 'truemoney'
      //   },
      //   return_uri: 'https://viplaoinsight.com/payment/callback',
      //   description,
      //   metadata: {
      //     userId,
      //     plan
      //   }
      // })

      // Mock for development
      chargeResult = {
        id: 'chrg_test_' + Date.now(),
        object: 'charge',
        status: 'pending',
        amount,
        currency,
        authorize_uri: 'https://pay.omise.co/offsites/test_truemoney'
      }
    }

    console.log('✅ Charge created:', chargeResult.id)

    // Return success response
    return {
      success: true,
      chargeId: chargeResult.id,
      transactionId: chargeResult.id,
      status: chargeResult.status,
      amount: amount / 100, // Convert from satang to THB
      qrCode: chargeResult.source?.scannable_code?.image?.uri,
      redirectUrl: chargeResult.authorize_uri,
      message: 'Payment initiated successfully'
    }
  } catch (error: any) {
    console.error('❌ Error creating charge:', error)

    // Handle Omise errors
    if (error.type === 'omise_error') {
      throw createError({
        statusCode: 400,
        statusMessage: error.message || 'Payment processing error'
      })
    }

    // Handle other errors
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Internal server error'
    })
  }
})

// Mock charge response for development
function createMockChargeResponse(plan: string, method: string, userId: string) {
  const amount = PLAN_PRICES[plan]
  const chargeId = 'chrg_test_' + Date.now()

  const baseResponse = {
    success: true,
    chargeId,
    transactionId: chargeId,
    amount: amount / 100,
    message: 'Payment initiated successfully (MOCK MODE)'
  }

  if (method === 'promptpay') {
    return {
      ...baseResponse,
      status: 'pending',
      qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    }
  }

  if (method === 'truemoney') {
    return {
      ...baseResponse,
      status: 'pending',
      redirectUrl: 'https://pay.omise.co/offsites/test_truemoney'
    }
  }

  // Credit card
  return {
    ...baseResponse,
    status: 'successful'
  }
}
