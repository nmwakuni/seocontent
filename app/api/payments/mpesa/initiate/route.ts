import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { mpesaClient } from "@/lib/mpesa"
import { subscriptions } from "@/lib/db/schema"

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { plan, billingPeriod, phoneNumber } = body

    if (!plan || !billingPeriod || !phoneNumber) {
      return NextResponse.json(
        { error: "Missing required fields: plan, billingPeriod, and phoneNumber" },
        { status: 400 }
      )
    }

    // Validate phone number format
    const phoneRegex = /^(254|0)?[17]\d{8}$/
    if (!phoneRegex.test(phoneNumber.replace(/\s/g, ""))) {
      return NextResponse.json(
        { error: "Invalid phone number. Use format: 0712345678 or 254712345678" },
        { status: 400 }
      )
    }

    // Define pricing
    const pricing: Record<string, { monthly: number; annual: number }> = {
      starter: {
        monthly: 9999,
        annual: 99990, // ~10 months pricing
      },
      pro: {
        monthly: 29999,
        annual: 299990, // ~10 months pricing
      },
    }

    if (!pricing[plan]) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
    }

    const amount = pricing[plan][billingPeriod as "monthly" | "annual"]

    // Generate unique account reference
    const accountReference = `SUB-${session.user.id.substring(0, 8)}-${Date.now()}`

    // Initiate STK Push
    const stkResponse = await mpesaClient.stkPush({
      amount,
      phoneNumber,
      accountReference,
      transactionDesc: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan - ${billingPeriod}`,
      callbackUrl: process.env.MPESA_CALLBACK_URL || "",
    })

    // Create pending subscription record
    await db.insert(subscriptions).values({
      userId: session.user.id,
      plan,
      status: "pending",
      billingPeriod,
      amount,
      currency: "KES",
      paymentMethod: "mpesa",
      mpesaCheckoutRequestId: stkResponse.CheckoutRequestID,
      merchantReference: accountReference,
    })

    return NextResponse.json({
      success: true,
      message: stkResponse.CustomerMessage,
      checkoutRequestId: stkResponse.CheckoutRequestID,
      merchantRequestId: stkResponse.MerchantRequestID,
    })
  } catch (error: any) {
    console.error("Error initiating M-Pesa payment:", error)
    return NextResponse.json(
      {
        error: "Failed to initiate payment",
        details: error.message,
      },
      { status: 500 }
    )
  }
}
