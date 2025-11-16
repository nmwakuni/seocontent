"use client"

import { useState, useEffect } from "react"
import { useSession } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Check, CreditCard, Smartphone, Loader2 } from "lucide-react"
import { useSearchParams } from "next/navigation"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

type Plan = "starter" | "pro"
type BillingPeriod = "monthly" | "annual"
type PaymentMethod = "pesapal" | "mpesa"

export default function BillingPage() {
  const session = useSession()
  const { toast } = useToast()
  const searchParams = useSearchParams()

  const [selectedPlan, setSelectedPlan] = useState<Plan>("starter")
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly")
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pesapal")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  const pricing = {
    starter: {
      monthly: 9999,
      annual: 99990,
    },
    pro: {
      monthly: 29999,
      annual: 299990,
    },
  }

  // Check for payment status in URL
  useEffect(() => {
    const status = searchParams.get("status")
    const plan = searchParams.get("plan")
    const message = searchParams.get("message")

    if (status === "success") {
      toast({
        title: "Payment Successful!",
        description: `Your ${plan} plan is now active.`,
      })
    } else if (status === "cancelled") {
      toast({
        title: "Payment Cancelled",
        description: "Your payment was cancelled or failed.",
        variant: "destructive",
      })
    } else if (status === "error") {
      toast({
        title: "Payment Error",
        description: message || "An error occurred during payment.",
        variant: "destructive",
      })
    }
  }, [searchParams, toast])

  const handlePayment = async () => {
    if (!session.data?.user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to continue.",
        variant: "destructive",
      })
      return
    }

    if (paymentMethod === "mpesa" && !phoneNumber) {
      toast({
        title: "Phone Number Required",
        description: "Please enter your M-Pesa phone number.",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)

    try {
      if (paymentMethod === "pesapal") {
        // Pesapal payment
        const response = await fetch("/api/payments/pesapal/initiate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            plan: selectedPlan,
            billingPeriod,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Payment initiation failed")
        }

        // Redirect to Pesapal payment page
        window.location.href = data.redirectUrl
      } else if (paymentMethod === "mpesa") {
        // M-Pesa STK Push
        const response = await fetch("/api/payments/mpesa/initiate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            plan: selectedPlan,
            billingPeriod,
            phoneNumber,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Payment initiation failed")
        }

        toast({
          title: "STK Push Sent",
          description: data.message || "Please check your phone and enter your M-Pesa PIN.",
        })

        // Poll for payment status (optional - could be improved with WebSocket)
        setTimeout(() => {
          setIsProcessing(false)
          toast({
            title: "Payment Processing",
            description: "We'll notify you once the payment is confirmed.",
          })
        }, 5000)
      }
    } catch (error: any) {
      console.error("Payment error:", error)
      toast({
        title: "Payment Failed",
        description: error.message || "An error occurred during payment.",
        variant: "destructive",
      })
      setIsProcessing(false)
    }
  }

  const getAmount = () => {
    return pricing[selectedPlan][billingPeriod]
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Billing & Subscription</h1>
        <p className="text-muted-foreground mt-2">
          Choose your plan and payment method
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Plan Selection */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Select Plan</CardTitle>
              <CardDescription>Choose the plan that fits your needs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Billing Period Toggle */}
              <div className="flex gap-2 p-1 bg-muted rounded-lg">
                <button
                  onClick={() => setBillingPeriod("monthly")}
                  className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                    billingPeriod === "monthly"
                      ? "bg-background shadow-sm"
                      : "hover:bg-background/50"
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingPeriod("annual")}
                  className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                    billingPeriod === "annual"
                      ? "bg-background shadow-sm"
                      : "hover:bg-background/50"
                  }`}
                >
                  Annual (Save 17%)
                </button>
              </div>

              {/* Plans */}
              <div className="space-y-3">
                <Card
                  className={`cursor-pointer transition-all ${
                    selectedPlan === "starter"
                      ? "border-primary border-2"
                      : "hover:border-primary/50"
                  }`}
                  onClick={() => setSelectedPlan("starter")}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>Starter</CardTitle>
                        <CardDescription>Perfect for small businesses</CardDescription>
                      </div>
                      {selectedPlan === "starter" && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div className="text-3xl font-bold mt-4">
                      KES {pricing.starter[billingPeriod].toLocaleString()}
                      <span className="text-sm text-muted-foreground font-normal">
                        /{billingPeriod === "monthly" ? "month" : "year"}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>10 content clusters/month</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>50 articles/month</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Basic analytics</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card
                  className={`cursor-pointer transition-all ${
                    selectedPlan === "pro"
                      ? "border-primary border-2"
                      : "hover:border-primary/50"
                  }`}
                  onClick={() => setSelectedPlan("pro")}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>Pro</CardTitle>
                        <CardDescription>For growing content teams</CardDescription>
                      </div>
                      {selectedPlan === "pro" && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div className="text-3xl font-bold mt-4">
                      KES {pricing.pro[billingPeriod].toLocaleString()}
                      <span className="text-sm text-muted-foreground font-normal">
                        /{billingPeriod === "monthly" ? "month" : "year"}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>50 content clusters/month</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>250 articles/month</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Advanced analytics</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Priority support</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Method Selection */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
              <CardDescription>Choose how you want to pay</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Payment Methods */}
              <div className="space-y-3">
                <Card
                  className={`cursor-pointer transition-all ${
                    paymentMethod === "pesapal"
                      ? "border-primary border-2"
                      : "hover:border-primary/50"
                  }`}
                  onClick={() => setPaymentMethod("pesapal")}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-6 w-6 text-primary" />
                        <div>
                          <CardTitle className="text-base">Card Payment</CardTitle>
                          <CardDescription className="text-xs">
                            Visa, Mastercard via Pesapal
                          </CardDescription>
                        </div>
                      </div>
                      {paymentMethod === "pesapal" && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </CardHeader>
                </Card>

                <Card
                  className={`cursor-pointer transition-all ${
                    paymentMethod === "mpesa"
                      ? "border-primary border-2"
                      : "hover:border-primary/50"
                  }`}
                  onClick={() => setPaymentMethod("mpesa")}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Smartphone className="h-6 w-6 text-primary" />
                        <div>
                          <CardTitle className="text-base">M-Pesa</CardTitle>
                          <CardDescription className="text-xs">
                            Pay with M-Pesa mobile money
                          </CardDescription>
                        </div>
                      </div>
                      {paymentMethod === "mpesa" && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </CardHeader>
                </Card>
              </div>

              {/* M-Pesa Phone Number Input */}
              {paymentMethod === "mpesa" && (
                <div className="space-y-2">
                  <Label htmlFor="phone">M-Pesa Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="0712345678 or 254712345678"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the phone number registered with M-Pesa
                  </p>
                </div>
              )}

              {/* Order Summary */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Plan</span>
                  <span className="font-medium">
                    {selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Billing Period</span>
                  <span className="font-medium">
                    {billingPeriod === "monthly" ? "Monthly" : "Annual"}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total</span>
                  <span>KES {getAmount().toLocaleString()}</span>
                </div>
              </div>

              {/* Payment Button */}
              <Button
                onClick={handlePayment}
                disabled={isProcessing}
                className="w-full"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {paymentMethod === "pesapal" ? "Proceed to Payment" : "Send STK Push"}
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Your payment is secure and encrypted. You can cancel anytime.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
