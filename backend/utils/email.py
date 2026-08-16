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


def send_inventory_alert(admin_email, book_title, book_id, book_author):
    """
    Alert admin when a book's stock drops to zero.
    """
    subject = f'BookSwap Hub — ⚠️ Out of Stock: "{book_title}"'

    text_body = f"""
Hi Admin,

The following book has run out of stock:

  Title  : {book_title}
  Author : {book_author}
  Book ID: #{book_id}

Please restock it from the Admin Panel → Books tab.

BookSwap Hub
    """

    html_body = f"""
    <html>
    <body style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <div style="background:linear-gradient(135deg,#f97316,#ea580c);padding:28px;border-radius:12px 12px 0 0;text-align:center;">
            <h1 style="color:white;margin:0;font-size:26px;">📚 BookSwap Hub</h1>
        </div>
        <div style="background:#fff;padding:28px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;">
            <div style="background:#ef4444;color:white;padding:14px 20px;border-radius:8px;margin-bottom:20px;text-align:center;">
                <h2 style="margin:0;font-size:20px;">⚠️ Out of Stock Alert</h2>
            </div>
            <p style="color:#475569;font-size:15px;">Hi <strong>Admin</strong>,</p>
            <p style="color:#475569;font-size:15px;">A book has just sold its last copy and is now <strong style="color:#ef4444;">out of stock</strong>.</p>
            <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:20px;margin:20px 0;">
                <table style="width:100%;border-collapse:collapse;">
                    <tr><td style="padding:6px 0;color:#64748b;font-size:13px;width:90px;">Title</td><td style="padding:6px 0;font-weight:600;color:#1e293b;">{book_title}</td></tr>
                    <tr><td style="padding:6px 0;color:#64748b;font-size:13px;">Author</td><td style="padding:6px 0;color:#1e293b;">{book_author}</td></tr>
                    <tr><td style="padding:6px 0;color:#64748b;font-size:13px;">Book ID</td><td style="padding:6px 0;color:#1e293b;">#{book_id}</td></tr>
                    <tr><td style="padding:6px 0;color:#64748b;font-size:13px;">Stock</td><td style="padding:6px 0;"><span style="background:#fee2e2;color:#dc2626;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:700;">0 — Out of Stock</span></td></tr>
                </table>
            </div>
            <p style="color:#475569;font-size:14px;">Please update the stock from the <strong>Admin Panel → Books</strong> tab.</p>
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
            <p style="color:#94a3b8;font-size:12px;text-align:center;">© BookSwap Hub | Admin Notification</p>
        </div>
    </body>
    </html>
    """

    return send_email(admin_email, subject, text_body, html_body)


def send_order_confirmation_email(to_email, customer_name, order_id, items, total, address, payment_method):
    """
    Send an order confirmation email to the customer immediately after placing an order.
    """
    subject = f'BookSwap Hub — Order Confirmed! 🎉 (Order #{order_id})'

    items_html = ''.join(
        f'<tr>'
        f'<td style="padding:10px 8px;border-bottom:1px solid #f1f5f9;">{i["title"]}</td>'
        f'<td style="padding:10px 8px;border-bottom:1px solid #f1f5f9;text-align:center;">x{i["quantity"]}</td>'
        f'<td style="padding:10px 8px;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:600;">₹{i["price"]}</td>'
        f'</tr>'
        for i in items
    )
    items_text = '\n'.join(f'  - {i["title"]} x{i["quantity"]} — ₹{i["price"]}' for i in items)

    text_body = f"""
Hi {customer_name},

Thank you for your order! We've received it and it's being processed.

Order #{order_id}
{items_text}

Total       : ₹{total}
Payment     : {payment_method}
Deliver to  : {address}

You'll receive another email when your order ships.

Happy Reading!
BookSwap Hub
    """

    html_body = f"""
    <html>
    <body style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f8fafc;">
        <div style="background:linear-gradient(135deg,#f97316,#ea580c);padding:28px;border-radius:12px 12px 0 0;text-align:center;">
            <h1 style="color:white;margin:0;font-size:26px;">📚 BookSwap Hub</h1>
        </div>
        <div style="background:#fff;padding:28px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;">
            <div style="background:#10b981;color:white;padding:14px 20px;border-radius:8px;margin-bottom:20px;text-align:center;">
                <h2 style="margin:0;font-size:20px;">🎉 Order Placed Successfully!</h2>
            </div>
            <p style="color:#475569;font-size:15px;">Hi <strong>{customer_name}</strong>,</p>
            <p style="color:#475569;font-size:15px;">Thank you for shopping with us! Your order has been received and is being processed.</p>

            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px 20px;margin:20px 0;display:flex;justify-content:space-between;align-items:center;">
                <div>
                    <div style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Order ID</div>
                    <div style="font-size:20px;font-weight:700;color:#1e293b;">#{order_id}</div>
                </div>
                <div style="text-align:right;">
                    <div style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Payment</div>
                    <div style="font-size:14px;font-weight:600;color:#1e293b;">{payment_method}</div>
                </div>
            </div>

            <h3 style="color:#1e293b;margin:24px 0 12px;font-size:15px;">Order Summary</h3>
            <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
                <thead>
                    <tr style="background:#f8fafc;">
                        <th style="padding:8px;text-align:left;color:#64748b;font-size:12px;text-transform:uppercase;">Book</th>
                        <th style="padding:8px;text-align:center;color:#64748b;font-size:12px;text-transform:uppercase;">Qty</th>
                        <th style="padding:8px;text-align:right;color:#64748b;font-size:12px;text-transform:uppercase;">Price</th>
                    </tr>
                </thead>
                <tbody>{items_html}</tbody>
            </table>
            <div style="text-align:right;font-size:18px;font-weight:700;color:#1e293b;border-top:2px solid #f1f5f9;padding-top:12px;">
                Total: ₹{total}
            </div>

            <div style="background:#f8fafc;border-radius:10px;padding:16px 20px;margin:20px 0;">
                <div style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Delivering to</div>
                <div style="font-size:14px;color:#1e293b;">{address}</div>
            </div>

            <p style="color:#64748b;font-size:13px;text-align:center;margin-top:20px;">
                You'll receive another email when your order is shipped. <br>
                Questions? Email us at <a href="mailto:bookswaphubsupport@gmail.com" style="color:#f97316;">bookswaphubsupport@gmail.com</a>
            </p>
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
            <p style="color:#94a3b8;font-size:12px;text-align:center;">© BookSwap Hub | Happy Reading! 📖</p>
        </div>
    </body>
    </html>
    """

    return send_email(to_email, subject, text_body, html_body)
