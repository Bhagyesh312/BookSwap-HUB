"""
Shared email utility for BookSwap Hub.
Used by auth (password reset) and admin (order notifications).
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import current_app


def send_email(to_email, subject, text_body, html_body):
    """
    Send an email via Gmail SMTP.
    Returns True on success, False on failure.
    """
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From']    = current_app.config['MAIL_DEFAULT_SENDER'][1]
        msg['To']      = to_email

        msg.attach(MIMEText(text_body, 'plain'))
        msg.attach(MIMEText(html_body, 'html'))

        server = smtplib.SMTP(current_app.config['MAIL_SERVER'], current_app.config['MAIL_PORT'])
        server.starttls()
        server.login(current_app.config['MAIL_USERNAME'], current_app.config['MAIL_PASSWORD'])
        server.sendmail(msg['From'], to_email, msg.as_string())
        server.quit()
        return True
    except Exception as e:
        current_app.logger.error(f'Email send failed to {to_email}: {e}')
        return False


def send_order_status_email(to_email, customer_name, order_id, new_status, items, total):
    """
    Send an order status update email to the customer.
    """
    status_messages = {
        'confirmed':  ('Order Confirmed ✅',  'Your order has been confirmed and is being prepared.'),
        'shipped':    ('Order Shipped 🚚',     'Great news! Your order is on its way.'),
        'delivered':  ('Order Delivered 📦',   'Your order has been delivered. Enjoy your books!'),
        'cancelled':  ('Order Cancelled ❌',   'Your order has been cancelled. Contact us if you have questions.'),
    }

    title, subtitle = status_messages.get(new_status, ('Order Update', 'Your order status has been updated.'))
    subject = f'BookSwap Hub — {title} (Order #{order_id})'

    status_colors = {
        'confirmed': '#3b82f6',
        'shipped':   '#8b5cf6',
        'delivered': '#10b981',
        'cancelled': '#ef4444',
    }
    color = status_colors.get(new_status, '#f97316')

    items_html = ''.join(
        f'<tr><td style="padding:8px;border-bottom:1px solid #f1f5f9;">{i["title"]}</td>'
        f'<td style="padding:8px;border-bottom:1px solid #f1f5f9;text-align:center;">x{i["quantity"]}</td>'
        f'<td style="padding:8px;border-bottom:1px solid #f1f5f9;text-align:right;">₹{i["price"]}</td></tr>'
        for i in items
    )
    items_text = '\n'.join(f'  - {i["title"]} x{i["quantity"]} — ₹{i["price"]}' for i in items)

    text_body = f"""
Hi {customer_name},

{subtitle}

Order #{order_id}
{items_text}

Total: ₹{total}

Thank you for shopping with BookSwap Hub!
    """

    html_body = f"""
    <html>
    <body style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <div style="background:linear-gradient(135deg,#f97316,#ea580c);padding:28px;border-radius:12px 12px 0 0;text-align:center;">
            <h1 style="color:white;margin:0;font-size:26px;">📚 BookSwap Hub</h1>
        </div>
        <div style="background:#fff;padding:28px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;">
            <div style="background:{color};color:white;padding:14px 20px;border-radius:8px;margin-bottom:20px;text-align:center;">
                <h2 style="margin:0;font-size:20px;">{title}</h2>
            </div>
            <p style="color:#475569;font-size:15px;">Hi <strong>{customer_name}</strong>,</p>
            <p style="color:#475569;font-size:15px;">{subtitle}</p>
            <h3 style="color:#1e293b;margin-top:24px;">Order #{order_id}</h3>
            <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
                <thead>
                    <tr style="background:#f8fafc;">
                        <th style="padding:8px;text-align:left;color:#64748b;font-size:13px;">Book</th>
                        <th style="padding:8px;text-align:center;color:#64748b;font-size:13px;">Qty</th>
                        <th style="padding:8px;text-align:right;color:#64748b;font-size:13px;">Price</th>
                    </tr>
                </thead>
                <tbody>{items_html}</tbody>
            </table>
            <div style="text-align:right;font-size:16px;font-weight:600;color:#1e293b;border-top:2px solid #f1f5f9;padding-top:12px;">
                Total: ₹{total}
            </div>
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
            <p style="color:#94a3b8;font-size:12px;text-align:center;">© BookSwap Hub | Happy Reading! 📖</p>
        </div>
    </body>
    </html>
    """

    return send_email(to_email, subject, text_body, html_body)
