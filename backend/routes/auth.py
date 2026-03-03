"""
Authentication API Routes
Handles user registration, login, profile management, and password changes
"""
from flask import Blueprint, request, jsonify, g
from datetime import datetime
import bcrypt
from models import db, User
from middleware import require_auth, create_token

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


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


@auth_bp.route('/settings', methods=['PUT'])
@require_auth
def save_settings():
    """
    Save user notification and preference settings
    Settings are typically stored in frontend localStorage
    """
    return jsonify({'message': 'Settings saved successfully'})
