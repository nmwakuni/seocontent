import { NextRequest, NextResponse } from "next/server"
import { pesapalClient } from "@/lib/pesapal"
import { db } from "@/lib/db"
import { subscriptions } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

/**
 * Pesapal Payment Callback Handler
 * This endpoint handles redirects after payment (success or failure)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const orderTrackingId = searchParams.get("OrderTrackingId")
    const merchantReference = searchParams.get("OrderMerchantReference")

    if (!orderTrackingId) {
      return NextResponse.redirect(
        new URL("/dashboard/billing?status=error&message=Missing+order+tracking+id", request.url)
      )
    }

    // Get transaction status from Pesapal
    const transactionStatus = await pesapalClient.getTransactionStatus(orderTrackingId)

    console.log("Pesapal callback received:", {
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
      return NextResponse.redirect(
        new URL("/dashboard/billing?status=error&message=Subscription+not+found", request.url)
      )
    }

    // Update subscription status based on payment status
    let newStatus = subscription.status
    let redirectStatus = "pending"

    switch (transactionStatus.payment_status_description?.toLowerCase()) {
      case "completed":
      case "success":
        newStatus = "active"
        redirectStatus = "success"

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
            currentPeriodEnd,
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.id, subscription.id))
        break

      case "failed":
      case "cancelled":
        newStatus = "cancelled"
        redirectStatus = "cancelled"

        await db
          .update(subscriptions)
          .set({
            status: newStatus,
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.id, subscription.id))
        break

      case "pending":
        redirectStatus = "pending"
        break

      default:
        redirectStatus = "unknown"
    }

    // Redirect to billing page with status
    return NextResponse.redirect(
      new URL(
        `/dashboard/billing?status=${redirectStatus}&plan=${subscription.plan}`,
        request.url
      )
    )
  } catch (error: any) {
    console.error("Error processing Pesapal callback:", error)
    return NextResponse.redirect(
      new URL(
        `/dashboard/billing?status=error&message=${encodeURIComponent(error.message)}`,
        request.url
      )
    )
  }
}
