import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { pesapalClient } from "@/lib/pesapal"
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
    const { plan, billingPeriod } = body

    if (!plan || !billingPeriod) {
      return NextResponse.json(
        { error: "Missing required fields: plan and billingPeriod" },
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

    // Generate unique order reference
    const orderReference = `ORDER-${session.user.id}-${Date.now()}`

    // Register IPN if not already registered
    const ipnUrl = process.env.PESAPAL_IPN_URL || ""
    let ipnId = process.env.PESAPAL_IPN_ID || ""

    if (!ipnId && ipnUrl) {
      try {
        ipnId = await pesapalClient.registerIPN(ipnUrl)
        console.log("Registered IPN:", ipnId)
      } catch (error) {
        console.error("Failed to register IPN:", error)
        // Continue without IPN registration
      }
    }

    // Submit order to Pesapal
    const orderData = {
      id: orderReference,
      currency: "KES",
      amount,
      description: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan - ${billingPeriod}`,
      callback_url: process.env.PESAPAL_CALLBACK_URL || `${process.env.NEXT_PUBLIC_BETTER_AUTH_URL}/dashboard/billing`,
      notification_id: ipnId,
      billing_address: {
        email_address: session.user.email,
        phone_number: "",
        country_code: "KE",
        first_name: session.user.name?.split(" ")[0] || "",
        last_name: session.user.name?.split(" ").slice(1).join(" ") || "",
      },
    }

    const orderResponse = await pesapalClient.submitOrder(orderData)

    // Create pending subscription record
    await db.insert(subscriptions).values({
      userId: session.user.id,
      plan,
      status: "pending",
      billingPeriod,
      amount,
      currency: "KES",
      paymentMethod: "pesapal",
      orderTrackingId: orderResponse.order_tracking_id,
      merchantReference: orderReference,
    })

    return NextResponse.json({
      success: true,
      redirectUrl: orderResponse.redirect_url,
      orderTrackingId: orderResponse.order_tracking_id,
    })
  } catch (error: any) {
    console.error("Error initiating Pesapal payment:", error)
    return NextResponse.json(
      {
        error: "Failed to initiate payment",
        details: error.message,
      },
      { status: 500 }
    )
  }
}
