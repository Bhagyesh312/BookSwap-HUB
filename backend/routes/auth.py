"""
Authentication API Routes
Handles user registration, login, profile management, and password changes
"""
from flask import Blueprint, request, jsonify, g, current_app
from datetime import datetime, timedelta
import bcrypt
import secrets
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from models import db, User
from middleware import require_auth, create_token

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


def send_reset_email(user_email, user_name, reset_token):
    """
    Send password reset email via Gmail SMTP
    """
    try:
        frontend_url = current_app.config.get('FRONTEND_URL', 'http://127.0.0.1:5500')
        reset_link = f"{frontend_url}/reset-password.html?token={reset_token}"
        
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = 'Reset Your BookSwap Hub Password'
        msg['From'] = current_app.config['MAIL_DEFAULT_SENDER'][1]
        msg['To'] = user_email
        
        # Plain text version
        text = f"""
Hi {user_name},

You requested to reset your password for BookSwap Hub.

Click the link below to reset your password (valid for 1 hour):
{reset_link}

If you didn't request this, please ignore this email.

Happy Reading!
BookSwap Hub Team
        """
        
        # HTML version
        html = f"""
        <html>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #f97316, #ea580c); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">📚 BookSwap Hub</h1>
            </div>
            <div style="background: #fff; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
                <h2 style="color: #1e293b; margin-top: 0;">Password Reset Request</h2>
                <p style="color: #475569; font-size: 16px; line-height: 1.6;">
                    Hi <strong>{user_name}</strong>,
                </p>
                <p style="color: #475569; font-size: 16px; line-height: 1.6;">
                    You requested to reset your password. Click the button below to create a new password:
                </p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{reset_link}" style="background: linear-gradient(135deg, #f97316, #ea580c); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">
                        Reset Password
                    </a>
                </div>
                <p style="color: #64748b; font-size: 14px;">
                    This link will expire in <strong>1 hour</strong>.
                </p>
                <p style="color: #64748b; font-size: 14px;">
                    If you didn't request this, you can safely ignore this email.
                </p>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
                <p style="color: #94a3b8; font-size: 12px; text-align: center;">
                    &copy; BookSwap Hub | Happy Reading! 📖
                </p>
            </div>
        </body>
        </html>
        """
        
        msg.attach(MIMEText(text, 'plain'))
        msg.attach(MIMEText(html, 'html'))
        
        # Send email
        server = smtplib.SMTP(current_app.config['MAIL_SERVER'], current_app.config['MAIL_PORT'])
        server.starttls()
        server.login(current_app.config['MAIL_USERNAME'], current_app.config['MAIL_PASSWORD'])
        server.sendmail(msg['From'], user_email, msg.as_string())
        server.quit()
        
        print(f"✉️  Password reset email sent to {user_email}")
        return True
        
    except Exception as e:
        print(f"❌ Email send failed: {e}")
        print(f"📋 Reset link (for testing): {reset_link}")
        return False


@auth_bp.route('/register', methods=['POST'])
def register():
    """
    Register new user with email and password
    - Validates input and password strength
    - Hashes password with bcrypt
    - Creates user account in database
    - Returns JWT token for immediate login
    """
    data = request.get_json() or {}
    
    name = (data.get('name') or '').strip()
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''
    
    if not name or not email or not password:
        return jsonify({'error': 'name, email and password are required'}), 400
    
    if '@' not in email:
        return jsonify({'error': 'A valid email is required'}), 400
    
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400
    
    # Check if email exists
    existing = User.query.filter_by(email=email).first()
    if existing:
        return jsonify({'error': 'Email already registered'}), 409
    
    # Hash password
    password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    # Create user
    user = User(name=name, email=email, password_hash=password_hash)
    db.session.add(user)
    db.session.commit()
    
    return jsonify({
        'token': create_token(user),
        'user': user.to_public_dict()
    }), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Login user with email and password
    - Validates credentials
    - Updates last_login_at timestamp
    - Returns JWT token
    """
    data = request.get_json() or {}
    
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''
    
    if not email or not password:
        return jsonify({'error': 'email and password are required'}), 400
    
    # Find user
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'error': 'Invalid credentials'}), 401
    
    # Verify password
    if not bcrypt.checkpw(password.encode('utf-8'), user.password_hash.encode('utf-8')):
        return jsonify({'error': 'Invalid credentials'}), 401
    
    # Update last login
    user.last_login_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify({
        'token': create_token(user),
        'user': user.to_public_dict()
    })


@auth_bp.route('/me', methods=['GET'])
@require_auth
def get_profile():
    """
    Get current user profile
    Requires valid JWT token
    """
    user = User.query.get(g.user['id'])
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({'user': user.to_public_dict()})


@auth_bp.route('/me', methods=['PUT'])
@require_auth
def update_profile():
    """
    Update user profile information
    - Update name, email, phone, address, city, state, zip, country
    - Email must be unique (unless unchanged)
    """
    user_id = g.user['id']
    data = request.get_json() or {}
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    name = data.get('name')
    email = data.get('email')
    
    if name:
        user.name = name.strip()
    
    if email:
        safe_email = email.strip().lower()
        if '@' not in safe_email:
            return jsonify({'error': 'A valid email is required'}), 400
        
        # Check if email is taken by another user
        existing = User.query.filter(User.email == safe_email, User.id != user_id).first()
        if existing:
            return jsonify({'error': 'Email already in use'}), 409
        
        user.email = safe_email
    
    # Update optional fields
    if 'phone' in data:
        user.phone = data['phone'].strip() if data['phone'] else None
    if 'address' in data:
        user.address = data['address'].strip() if data['address'] else None
    if 'city' in data:
        user.city = data['city'].strip() if data['city'] else None
    if 'state' in data:
        user.state = data['state'].strip() if data['state'] else None
    if 'zip' in data:
        user.zip = data['zip'].strip() if data['zip'] else None
    if 'country' in data:
        user.country = data['country'].strip() if data['country'] else user.country
    
    db.session.commit()
    
    return jsonify({
        'message': 'Profile updated successfully',
        'user': user.to_full_dict()
    })


@auth_bp.route('/change-password', methods=['PUT'])
@require_auth
def change_password():
    """
    Change user password
    - Validates current password before allowing change
    - New password must be at least 6 characters
    """
    user_id = g.user['id']
    data = request.get_json() or {}
    
    current_password = data.get('currentPassword') or ''
    new_password = data.get('newPassword') or ''
    
    if not current_password or not new_password:
        return jsonify({'error': 'currentPassword and newPassword are required'}), 400
    
    if len(new_password) < 6:
        return jsonify({'error': 'New password must be at least 6 characters'}), 400
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Verify current password
    if not bcrypt.checkpw(current_password.encode('utf-8'), user.password_hash.encode('utf-8')):
        return jsonify({'error': 'Current password is incorrect'}), 401
    
    # Check if same password
    if bcrypt.checkpw(new_password.encode('utf-8'), user.password_hash.encode('utf-8')):
        return jsonify({'error': 'New password must be different from current password'}), 400
    
    # Hash and update new password
    user.password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    db.session.commit()
    
    return jsonify({'message': 'Password changed successfully'})


@auth_bp.route('/delete-account', methods=['DELETE'])
@require_auth
def delete_account():
    """
    Delete user account and all associated data
    - Removes user record
    - Cascades delete to orders, order_items, and cart_items
    """
    user_id = g.user['id']
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    db.session.delete(user)
    db.session.commit()
    
    return jsonify({'message': 'Account deleted successfully'})


@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """
    Request password reset email
    - Generates secure reset token
    - Sends email with reset link
    - Token expires in 1 hour
    """
    data = request.get_json() or {}
    email = (data.get('email') or '').strip().lower()
    
    if not email:
        return jsonify({'error': 'Email is required'}), 400
    
    # Find user
    user = User.query.filter_by(email=email).first()
    
    # Always return success to prevent email enumeration
    if not user:
        return jsonify({'message': 'If an account exists with this email, you will receive a password reset link.'})
    
    # Generate secure token
    token = secrets.token_urlsafe(32)
    
    # Save token with expiration (1 hour)
    user.reset_token = token
    user.reset_token_expires = datetime.utcnow() + timedelta(hours=1)
    db.session.commit()
    
    # Send email
    send_reset_email(user.email, user.name, token)
    
    return jsonify({'message': 'If an account exists with this email, you will receive a password reset link.'})


@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    """
    Reset password using token from email
    - Validates token and expiration
    - Updates password
    - Clears reset token
    """
    data = request.get_json() or {}
    token = data.get('token') or ''
    new_password = data.get('password') or ''
    
    if not token:
        return jsonify({'error': 'Reset token is required'}), 400
    
    if not new_password or len(new_password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400
    
    # Find user by token
    user = User.query.filter_by(reset_token=token).first()
    
    if not user:
        return jsonify({'error': 'Invalid or expired reset link'}), 400
    
    # Check if token is expired
    if user.reset_token_expires and user.reset_token_expires < datetime.utcnow():
        # Clear expired token
        user.reset_token = None
        user.reset_token_expires = None
        db.session.commit()
        return jsonify({'error': 'Reset link has expired. Please request a new one.'}), 400
    
    # Update password
    user.password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    user.reset_token = None
    user.reset_token_expires = None
    db.session.commit()
    
    return jsonify({'message': 'Password reset successful. You can now login with your new password.'})


@auth_bp.route('/verify-reset-token', methods=['POST'])
def verify_reset_token():
    """
    Verify if a reset token is valid (for frontend validation)
    """
    data = request.get_json() or {}
    token = data.get('token') or ''
    
    if not token:
        return jsonify({'valid': False, 'error': 'Token is required'}), 400
    
    user = User.query.filter_by(reset_token=token).first()
    
    if not user:
        return jsonify({'valid': False, 'error': 'Invalid reset link'}), 400
    
    if user.reset_token_expires and user.reset_token_expires < datetime.utcnow():
        return jsonify({'valid': False, 'error': 'Reset link has expired'}), 400
    
    return jsonify({'valid': True, 'email': user.email})


@auth_bp.route('/settings', methods=['PUT'])
@require_auth
def save_settings():
    """
    Save user notification and preference settings
    Settings are typically stored in frontend localStorage
    """
    return jsonify({'message': 'Settings saved successfully'})
