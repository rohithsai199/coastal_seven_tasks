import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from app.tasks.celery_app import celery_app
from app.config import settings

@celery_app.task(name="send_order_confirmation_email", bind=True, max_retries=3, default_retry_delay=5)
def send_order_confirmation_email(self, recipient_email: str, order_id: int, total_amount: float):
    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"Order Confirmation - Order #{order_id}"
    msg["From"] = settings.EMAILS_FROM_EMAIL
    msg["To"] = recipient_email

    html_content = f"""
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #2c3e50;">Order Confirmed!</h2>
          <p>Thank you for shopping with us. Your order <strong>#{order_id}</strong> has been successfully placed.</p>
          <hr style="border: 0; border-top: 1px solid #eee;" />
          <p style="font-size: 16px;"><strong>Total Amount Paid:</strong> ${total_amount:.2f}</p>
          <p>We are processing your order and will notify you when it ships.</p>
        </div>
      </body>
    </html>
    """
    msg.attach(MIMEText(html_content, "html"))

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.EMAILS_FROM_EMAIL, recipient_email, msg.as_string())
        return f"Email sent successfully to {recipient_email} for Order #{order_id}"
    except Exception as exc:
        raise self.retry(exc=exc)