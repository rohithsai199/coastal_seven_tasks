import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from app.tasks.celery_app import celery_app
from app.config import settings

logger = logging.getLogger(__name__)

@celery_app.task(name="send_order_confirmation_email", bind=True, max_retries=3, default_retry_delay=5, ignore_result=True)
def send_order_confirmation_email(self, recipient_email: str, order_id: int, total_amount: float):
    msg = MIMEMultipart("alternative")
    sender = settings.EMAILS_FROM_EMAIL or settings.SMTP_USER or "noreply@shopstore.com"
    msg["Subject"] = f"Order Confirmation - Order #{order_id}"
    msg["From"] = sender
    msg["To"] = recipient_email

    html_content = f"""
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #2c3e50;">Order Confirmed!</h2>
          <p>Thank you for shopping with us. Your order <strong>#{order_id}</strong> has been successfully placed.</p>
          <hr style="border: 0; border-top: 1px solid #eee;" />
          <p style="font-size: 16px;"><strong>Total Order Amount:</strong> ${total_amount:.2f}</p>
          <p>We are processing your order and will notify you when it ships.</p>
        </div>
      </body>
    </html>
    """
    msg.attach(MIMEText(html_content, "html"))

    if not settings.SMTP_HOST or not settings.SMTP_USER:
        return f"SMTP not configured, skipped email to {recipient_email}"

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=12) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(sender, recipient_email, msg.as_string())
        logger.info(f"Order email sent successfully to {recipient_email} for #{order_id}")
        return f"Email sent successfully to {recipient_email} for Order #{order_id}"
    except Exception as exc:
        logger.error(f"Error sending order confirmation email: {exc}")
        if self.request.retries < self.max_retries:
            raise self.retry(exc=Exception(str(exc)), countdown=5)
        return f"Failed to send email after retries: {exc}"


@celery_app.task(name="send_welcome_registration_email", bind=True, max_retries=3, default_retry_delay=5, ignore_result=True)
def send_welcome_registration_email(self, recipient_email: str):
    msg = MIMEMultipart("alternative")
    sender = settings.EMAILS_FROM_EMAIL or settings.SMTP_USER or "noreply@arise.com"
    msg["Subject"] = "Welcome to ARISE - Sign In to Your New Account"
    msg["From"] = f"ARISE <{sender}>"
    msg["To"] = recipient_email

    login_url = f"{settings.FRONTEND_URL}/login"

    html_content = f"""
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to ARISE</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #ECE9E2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1E272E;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #ECE9E2; padding: 40px 10px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" style="max-width: 580px; background-color: #FFFFFF; border-radius: 16px; border: 1px solid rgba(0,0,0,0.08); box-shadow: 0 10px 30px rgba(0,0,0,0.06); overflow: hidden; padding: 40px 36px;" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding-bottom: 24px;">
                    <div style="display: inline-block; background-color: #000000; color: #FFFFFF; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; padding: 5px 14px; border-radius: 999px; margin-bottom: 12px;">
                      ✦ WELCOME TO ARISE
                    </div>
                    <h1 style="margin: 8px 0 10px; font-size: 26px; font-weight: 800; color: #000000; letter-spacing: -0.5px;">
                      Your Account is Ready
                    </h1>
                    <p style="margin: 0; font-size: 14px; color: #64748B; line-height: 1.5;">
                      Thank you for joining ARISE. Access your personalized cart, express checkout, and tracked orders anytime.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 24px 0; border-top: 1px solid #F1F5F9; border-bottom: 1px solid #F1F5F9;">
                    <p style="margin: 0 0 12px; font-size: 14px; color: #334155;">
                      <strong>Registered Email:</strong> <span style="color: #0F172A;">{recipient_email}</span>
                    </p>
                    <p style="margin: 0; font-size: 13.5px; color: #64748B; line-height: 1.5;">
                      You can now sign in using your credentials to explore our latest high-fashion drops, exclusive member rates, and live order tracking.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding: 30px 0 10px;">
                    <a href="{login_url}" target="_blank" style="display: inline-block; background-color: #ACD0C0; color: #111827; text-decoration: none; padding: 14px 32px; border-radius: 999px; font-size: 14px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; box-shadow: 0 4px 14px rgba(172, 208, 192, 0.45);">
                      Sign In to ARISE →
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 24px;">
                    <p style="margin: 0; font-size: 11px; color: #94A3B8;">
                      If the button doesn't work, copy and paste this link into your browser:<br/>
                      <a href="{login_url}" style="color: #64748B; word-break: break-all;">{login_url}</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
    """
    msg.attach(MIMEText(html_content, "html"))

    if not settings.SMTP_HOST or not settings.SMTP_USER:
        return f"SMTP not configured, simulated welcome email to {recipient_email}"

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=12) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(sender, recipient_email, msg.as_string())
        logger.info(f"Welcome email sent successfully to {recipient_email}")
        return f"Welcome email sent successfully to {recipient_email}"
    except Exception as exc:
        logger.error(f"Error sending welcome email to {recipient_email}: {exc}")
        if self.request.retries < self.max_retries:
            raise self.retry(exc=Exception(str(exc)), countdown=5)
        return f"Failed to send welcome email after retries: {exc}"