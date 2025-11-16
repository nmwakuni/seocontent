/**
 * Pesapal Payment Integration
 * https://developer.pesapal.com/
 */

interface PesapalConfig {
  consumerKey: string
  consumerSecret: string
  environment: "sandbox" | "live"
}

interface PesapalAuthResponse {
  token: string
  expiryDate: string
  error: string | null
  status: string
  message: string
}

interface PesapalOrderRequest {
  id: string
  currency: string
  amount: number
  description: string
  callback_url: string
  notification_id: string
  billing_address: {
    email_address: string
    phone_number?: string
    country_code?: string
    first_name?: string
    last_name?: string
  }
}

interface PesapalOrderResponse {
  order_tracking_id: string
  merchant_reference: string
  redirect_url: string
  error: string | null
  status: string
}

export class PesapalClient {
  private config: PesapalConfig
  private baseUrl: string
  private token: string | null = null
  private tokenExpiry: Date | null = null

  constructor() {
    this.config = {
      consumerKey: process.env.PESAPAL_CONSUMER_KEY || "",
      consumerSecret: process.env.PESAPAL_CONSUMER_SECRET || "",
      environment: (process.env.PESAPAL_ENVIRONMENT as "sandbox" | "live") || "sandbox",
    }

    this.baseUrl =
      this.config.environment === "sandbox"
        ? "https://cybqa.pesapal.com/pesapalv3"
        : "https://pay.pesapal.com/v3"
  }

  /**
   * Authenticate with Pesapal API
   */
  async authenticate(): Promise<string> {
    // Check if we have a valid token
    if (this.token && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.token
    }

    const response = await fetch(`${this.baseUrl}/api/Auth/RequestToken`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        consumer_key: this.config.consumerKey,
        consumer_secret: this.config.consumerSecret,
      }),
    })

    if (!response.ok) {
      throw new Error(`Pesapal authentication failed: ${response.statusText}`)
    }

    const data: PesapalAuthResponse = await response.json()

    if (data.error) {
      throw new Error(`Pesapal authentication error: ${data.error}`)
    }

    this.token = data.token
    this.tokenExpiry = new Date(data.expiryDate)

    return this.token
  }

  /**
   * Register IPN (Instant Payment Notification) URL
   */
  async registerIPN(url: string, ipnType: string = "GET"): Promise<string> {
    const token = await this.authenticate()

    const response = await fetch(`${this.baseUrl}/api/URLSetup/RegisterIPN`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        url,
        ipn_notification_type: ipnType,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to register IPN: ${response.statusText}`)
    }

    const data = await response.json()
    return data.ipn_id
  }

  /**
   * Submit payment order
   */
  async submitOrder(orderData: PesapalOrderRequest): Promise<PesapalOrderResponse> {
    const token = await this.authenticate()

    const response = await fetch(`${this.baseUrl}/api/Transactions/SubmitOrderRequest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(orderData),
    })

    if (!response.ok) {
      throw new Error(`Failed to submit order: ${response.statusText}`)
    }

    const data: PesapalOrderResponse = await response.json()

    if (data.error) {
      throw new Error(`Pesapal order error: ${data.error}`)
    }

    return data
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(orderTrackingId: string): Promise<any> {
    const token = await this.authenticate()

    const response = await fetch(
      `${this.baseUrl}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to get transaction status: ${response.statusText}`)
    }

    return await response.json()
  }
}

export const pesapalClient = new PesapalClient()
