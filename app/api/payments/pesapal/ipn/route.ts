import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { subscriptions } from "@/lib/db/schema"
import { pesapalClient } from "@/lib/pesapal"
import { eq } from "drizzle-orm"

/**
 * Pesapal IPN (Instant Payment Notification) Handler
 * This endpoint receives payment status updates from Pesapal
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const orderTrackingId = searchParams.get("OrderTrackingId")
    const merchantReference = searchParams.get("OrderMerchantReference")

    if (!orderTrackingId) {
      return NextResponse.json(
        { error: "Missing OrderTrackingId" },
        { status: 400 }
      )
    }

    // Get transaction status from Pesapal
    const transactionStatus = await pesapalClient.getTransactionStatus(orderTrackingId)

    console.log("Pesapal IPN received:", {
      orderTrackingId,
      merchantReference,
      status: transactionStatus.payment_status_description,
    })

    // Find the subscription
    const subscription = await db.query.subscriptions.findFirst({
      where: (subscriptions, { eq }) =>
        eq(subscriptions.orderTrackingId, orderTrackingId),
    })

    if (!subscription) {
      console.error("Subscription not found for order:", orderTrackingId)
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      )
    }

    // Update subscription status based on payment status
    let newStatus = subscription.status

    switch (transactionStatus.payment_status_description?.toLowerCase()) {
      case "completed":
      case "success":
        newStatus = "active"
        break
      case "failed":
      case "cancelled":
        newStatus = "cancelled"
        break
      case "pending":
        newStatus = "pending"
        break
      default:
        console.warn("Unknown payment status:", transactionStatus.payment_status_description)
    }

    // Calculate subscription period
    const currentPeriodEnd = new Date()
    if (subscription.billingPeriod === "monthly") {
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1)
    } else if (subscription.billingPeriod === "annual") {
      currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1)
    }

    // Update subscription
    await db
      .update(subscriptions)
      .set({
        status: newStatus,
        currentPeriodEnd: newStatus === "active" ? currentPeriodEnd : undefined,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, subscription.id))

    return NextResponse.json({
      success: true,
      status: newStatus,
    })
  } catch (error: any) {
    console.error("Error processing Pesapal IPN:", error)
    return NextResponse.json(
      {
        error: "Failed to process IPN",
        details: error.message,
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}
