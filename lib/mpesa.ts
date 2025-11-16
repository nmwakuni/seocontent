/**
 * M-Pesa Payment Integration (Safaricom Daraja API)
 * https://developer.safaricom.co.ke/
 */

interface MpesaConfig {
  consumerKey: string
  consumerSecret: string
  shortcode: string
  passkey: string
  environment: "sandbox" | "live"
}

interface MpesaAuthResponse {
  access_token: string
  expires_in: string
}

interface MpesaStkPushRequest {
  amount: number
  phoneNumber: string
  accountReference: string
  transactionDesc: string
  callbackUrl: string
}

interface MpesaStkPushResponse {
  MerchantRequestID: string
  CheckoutRequestID: string
  ResponseCode: string
  ResponseDescription: string
  CustomerMessage: string
}

export class MpesaClient {
  private config: MpesaConfig
  private baseUrl: string
  private token: string | null = null
  private tokenExpiry: Date | null = null

  constructor() {
    this.config = {
      consumerKey: process.env.MPESA_CONSUMER_KEY || "",
      consumerSecret: process.env.MPESA_CONSUMER_SECRET || "",
      shortcode: process.env.MPESA_SHORTCODE || "",
      passkey: process.env.MPESA_PASSKEY || "",
      environment: (process.env.MPESA_ENVIRONMENT as "sandbox" | "live") || "sandbox",
    }

    this.baseUrl =
      this.config.environment === "sandbox"
        ? "https://sandbox.safaricom.co.ke"
        : "https://api.safaricom.co.ke"
  }

  /**
   * Authenticate with M-Pesa API
   */
  async authenticate(): Promise<string> {
    // Check if we have a valid token
    if (this.token && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.token
    }

    const auth = Buffer.from(
      `${this.config.consumerKey}:${this.config.consumerSecret}`
    ).toString("base64")

    const response = await fetch(
      `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
      {
        method: "GET",
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`M-Pesa authentication failed: ${response.statusText}`)
    }

    const data: MpesaAuthResponse = await response.json()

    this.token = data.access_token
    // Token expires in 1 hour, set expiry to 55 minutes from now
    this.tokenExpiry = new Date(Date.now() + 55 * 60 * 1000)

    return this.token
  }

  /**
   * Generate password for STK Push
   */
  private generatePassword(): { password: string; timestamp: string } {
    const timestamp = new Date()
      .toISOString()
      .replace(/[^0-9]/g, "")
      .slice(0, 14)

    const password = Buffer.from(
      `${this.config.shortcode}${this.config.passkey}${timestamp}`
    ).toString("base64")

    return { password, timestamp }
  }

  /**
   * Format phone number to M-Pesa format (2547XXXXXXXX)
   */
  private formatPhoneNumber(phone: string): string {
    // Remove any non-numeric characters
    phone = phone.replace(/\D/g, "")

    // Handle different phone number formats
    if (phone.startsWith("254")) {
      return phone
    } else if (phone.startsWith("0")) {
      return "254" + phone.substring(1)
    } else if (phone.startsWith("7") || phone.startsWith("1")) {
      return "254" + phone
    }

    return phone
  }

  /**
   * Initiate STK Push payment
   */
  async stkPush(request: MpesaStkPushRequest): Promise<MpesaStkPushResponse> {
    const token = await this.authenticate()
    const { password, timestamp } = this.generatePassword()
    const formattedPhone = this.formatPhoneNumber(request.phoneNumber)

    const payload = {
      BusinessShortCode: this.config.shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.ceil(request.amount), // Round up to nearest whole number
      PartyA: formattedPhone,
      PartyB: this.config.shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: request.callbackUrl,
      AccountReference: request.accountReference,
      TransactionDesc: request.transactionDesc,
    }

    const response = await fetch(`${this.baseUrl}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(`M-Pesa STK Push failed: ${response.statusText}`)
    }

    const data: MpesaStkPushResponse = await response.json()

    if (data.ResponseCode !== "0") {
      throw new Error(`M-Pesa error: ${data.ResponseDescription}`)
    }

    return data
  }

  /**
   * Query STK Push transaction status
   */
  async queryTransaction(checkoutRequestId: string): Promise<any> {
    const token = await this.authenticate()
    const { password, timestamp } = this.generatePassword()

    const payload = {
      BusinessShortCode: this.config.shortcode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    }

    const response = await fetch(`${this.baseUrl}/mpesa/stkpushquery/v1/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(`M-Pesa query failed: ${response.statusText}`)
    }

    return await response.json()
  }
}

export const mpesaClient = new MpesaClient()
