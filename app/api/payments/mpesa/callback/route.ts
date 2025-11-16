import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { subscriptions } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

/**
 * M-Pesa STK Push Callback Handler
 * This endpoint receives payment status updates from M-Pesa
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log("M-Pesa callback received:", JSON.stringify(body, null, 2))

    const { Body } = body

    if (!Body || !Body.stkCallback) {
      return NextResponse.json({ error: "Invalid callback format" }, { status: 400 })
    }

    const { stkCallback } = Body
    const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } =
      stkCallback

    // Find the subscription
    const subscription = await db.query.subscriptions.findFirst({
      where: (subscriptions, { eq }) =>
        eq(subscriptions.mpesaCheckoutRequestId, CheckoutRequestID),
    })

    if (!subscription) {
      console.error("Subscription not found for CheckoutRequestID:", CheckoutRequestID)
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      )
    }

    // Update subscription based on result code
    let newStatus = subscription.status

    if (ResultCode === 0) {
      // Payment successful
      newStatus = "active"

      // Extract payment details from callback metadata
      let receiptNumber = ""
      if (CallbackMetadata && CallbackMetadata.Item) {
        const receiptItem = CallbackMetadata.Item.find(
          (item: any) => item.Name === "MpesaReceiptNumber"
        )
        if (receiptItem) {
          receiptNumber = receiptItem.Value
        }
      }

      // Calculate subscription period
      const currentPeriodEnd = new Date()
      if (subscription.billingPeriod === "monthly") {
        currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1)
      } else if (subscription.billingPeriod === "annual") {
        currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1)
      }

      await db
        .update(subscriptions)
        .set({
          status: newStatus,
          mpesaReceiptNumber: receiptNumber,
          currentPeriodEnd,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, subscription.id))
    } else {
      // Payment failed or cancelled
      newStatus = "cancelled"

      await db
        .update(subscriptions)
        .set({
          status: newStatus,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, subscription.id))
    }

    console.log("M-Pesa payment processed:", {
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      newStatus,
    })

    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: "Success",
    })
  } catch (error: any) {
    console.error("Error processing M-Pesa callback:", error)
    return NextResponse.json(
      {
        ResultCode: 1,
        ResultDesc: error.message,
      },
      { status: 500 }
    )
  }
}
