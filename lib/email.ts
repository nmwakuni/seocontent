import { Resend } from "resend"

// Lazy initialization to avoid build-time errors
function getResendClient() {
  return new Resend(process.env.RESEND_API_KEY || "")
}

interface WelcomeEmailProps {
  name: string
  email: string
}

interface PaymentConfirmationProps {
  name: string
  email: string
  plan: string
  amount: number
  currency: string
  paymentMethod: string
  receiptNumber?: string
}

interface ArticleCompletedProps {
  name: string
  email: string
  articleTitle: string
  projectName: string
  wordCount: number
  articleUrl: string
}

export async function sendWelcomeEmail({ name, email }: WelcomeEmailProps) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not configured, skipping welcome email")
    return null
  }

  try {
    const resend = getResendClient()
    const { data, error } = await resend.emails.send({
      from: "SEO Content Cluster <onboarding@yourdomain.com>",
      to: [email],
      subject: "Welcome to SEO Content Cluster! 🎉",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to SEO Content Cluster</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to SEO Content Cluster!</h1>
            </div>

            <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
              <h2 style="color: #1f2937; margin-top: 0;">Hi ${name}! 👋</h2>

              <p style="font-size: 16px; color: #4b5563;">
                Thank you for joining SEO Content Cluster! We're excited to help you create amazing SEO-optimized content with the power of AI.
              </p>

              <div style="background: #f9fafb; border-left: 4px solid #667eea; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <h3 style="margin-top: 0; color: #1f2937;">Getting Started</h3>
                <ol style="margin: 0; padding-left: 20px; color: #4b5563;">
                  <li style="margin-bottom: 10px;">Create your first project</li>
                  <li style="margin-bottom: 10px;">Generate a content cluster strategy</li>
                  <li style="margin-bottom: 10px;">Let AI write your articles</li>
                  <li>Watch your organic traffic grow!</li>
                </ol>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000"}/dashboard"
                   style="display: inline-block; background: #667eea; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                  Go to Dashboard
                </a>
              </div>

              <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                Need help? Reply to this email or visit our <a href="#" style="color: #667eea; text-decoration: none;">help center</a>.
              </p>

              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

              <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">
                SEO Content Cluster - AI-Powered SEO Content Generation<br>
                You're receiving this email because you signed up for an account.
              </p>
            </div>
          </body>
        </html>
      `,
    })

    if (error) {
      console.error("Error sending welcome email:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error sending welcome email:", error)
    return null
  }
}

export async function sendPaymentConfirmationEmail({
  name,
  email,
  plan,
  amount,
  currency,
  paymentMethod,
  receiptNumber,
}: PaymentConfirmationProps) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not configured, skipping payment confirmation email")
    return null
  }

  const formattedAmount = new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: currency || "KES",
  }).format(amount / 100)

  try {
    const resend = getResendClient()
    const { data, error } = await resend.emails.send({
      from: "SEO Content Cluster <billing@yourdomain.com>",
      to: [email],
      subject: `Payment Confirmation - ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Payment Confirmation</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">✅ Payment Confirmed!</h1>
            </div>

            <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
              <h2 style="color: #1f2937; margin-top: 0;">Hi ${name}!</h2>

              <p style="font-size: 16px; color: #4b5563;">
                Your payment has been successfully processed. Thank you for subscribing to SEO Content Cluster!
              </p>

              <div style="background: #f0fdf4; border: 1px solid #86efac; padding: 20px; margin: 30px 0; border-radius: 8px;">
                <h3 style="margin-top: 0; color: #166534; font-size: 18px;">Payment Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #4b5563; font-weight: 500;">Plan:</td>
                    <td style="padding: 8px 0; color: #1f2937; text-align: right; font-weight: 600;">${plan.charAt(0).toUpperCase() + plan.slice(1)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #4b5563; font-weight: 500;">Amount:</td>
                    <td style="padding: 8px 0; color: #1f2937; text-align: right; font-weight: 600;">${formattedAmount}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #4b5563; font-weight: 500;">Payment Method:</td>
                    <td style="padding: 8px 0; color: #1f2937; text-align: right; font-weight: 600;">${paymentMethod === "mpesa" ? "M-Pesa" : "Card (Pesapal)"}</td>
                  </tr>
                  ${receiptNumber ? `
                  <tr>
                    <td style="padding: 8px 0; color: #4b5563; font-weight: 500;">Receipt Number:</td>
                    <td style="padding: 8px 0; color: #1f2937; text-align: right; font-weight: 600;">${receiptNumber}</td>
                  </tr>
                  ` : ""}
                  <tr>
                    <td style="padding: 8px 0; color: #4b5563; font-weight: 500;">Date:</td>
                    <td style="padding: 8px 0; color: #1f2937; text-align: right; font-weight: 600;">${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</td>
                  </tr>
                </table>
              </div>

              <p style="font-size: 16px; color: #4b5563;">
                Your subscription is now active and you have full access to all features.
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000"}/dashboard"
                   style="display: inline-block; background: #10b981; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                  Start Creating Content
                </a>
              </div>

              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

              <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">
                SEO Content Cluster - AI-Powered SEO Content Generation<br>
                Questions? Contact us at support@yourdomain.com
              </p>
            </div>
          </body>
        </html>
      `,
    })

    if (error) {
      console.error("Error sending payment confirmation email:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error sending payment confirmation email:", error)
    return null
  }
}

export async function sendArticleCompletedEmail({
  name,
  email,
  articleTitle,
  projectName,
  wordCount,
  articleUrl,
}: ArticleCompletedProps) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not configured, skipping article completion email")
    return null
  }

  try {
    const resend = getResendClient()
    const { data, error } = await resend.emails.send({
      from: "SEO Content Cluster <articles@yourdomain.com>",
      to: [email],
      subject: `✨ Your Article is Ready: ${articleTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Article Completed</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">✨ Your Article is Ready!</h1>
            </div>

            <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
              <h2 style="color: #1f2937; margin-top: 0;">Hi ${name}!</h2>

              <p style="font-size: 16px; color: #4b5563;">
                Great news! Your AI-generated article is ready for review.
              </p>

              <div style="background: #f5f3ff; border-left: 4px solid #8b5cf6; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <h3 style="margin-top: 0; color: #1f2937; font-size: 18px;">${articleTitle}</h3>
                <p style="margin: 10px 0; color: #4b5563;">
                  <strong>Project:</strong> ${projectName}<br>
                  <strong>Word Count:</strong> ${wordCount.toLocaleString()} words
                </p>
              </div>

              <p style="font-size: 16px; color: #4b5563;">
                Your SEO-optimized article includes keyword integration, meta descriptions, and proper heading structure.
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${articleUrl}"
                   style="display: inline-block; background: #8b5cf6; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                  View Your Article
                </a>
              </div>

              <div style="background: #fffbeb; border: 1px solid #fcd34d; padding: 15px; margin: 30px 0; border-radius: 6px;">
                <p style="margin: 0; font-size: 14px; color: #92400e;">
                  💡 <strong>Tip:</strong> Review and edit the article to match your brand voice perfectly before publishing.
                </p>
              </div>

              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

              <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">
                SEO Content Cluster - AI-Powered SEO Content Generation
              </p>
            </div>
          </body>
        </html>
      `,
    })

    if (error) {
      console.error("Error sending article completion email:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error sending article completion email:", error)
    return null
  }
}
