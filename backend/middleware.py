"""
JWT Authentication Middleware for Flask
Provides token verification and user authentication decorators
"""
from functools import wraps
from flask import request, jsonify, g
import jwt
from config import Config


def require_auth(f):
    """
    Authentication decorator - verifies JWT token
    Extracts the Bearer token from Authorization header and validates it
    Sets g.user with decoded payload on success, returns 401 on failure
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        
        # Parse Bearer token
        parts = auth_header.split(' ')
        if len(parts) != 2 or parts[0] != 'Bearer':
            return jsonify({'error': 'Authentication required'}), 401
        
        token = parts[1]
        
        try:
            # Verify token and extract user data
            payload = jwt.decode(token, Config.JWT_SECRET, algorithms=['HS256'])
            g.user = {
                'id': int(payload.get('sub', 0)),
                'email': payload.get('email'),
                'name': payload.get('name'),
                'role': payload.get('role', 'user')
            }
            return f(*args, **kwargs)
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid or expired token'}), 401
    
    return decorated_function


def require_admin(f):
    """
    Admin authorization decorator - requires user to have admin role
    Must be used after require_auth decorator
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not hasattr(g, 'user') or g.user.get('role') != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated_function


def create_token(user):
    """
    Create JWT token for authenticated user
    Token expires in 7 days and includes user email, name, and role
    
    Args:
        user: User object with id, email, name, role attributes
    
    Returns:
        str: Signed JWT token
    """
    import datetime
    
    payload = {
        'sub': str(user.id),
        'email': user.email,
        'name': user.name,
        'role': getattr(user, 'role', 'user') or 'user',
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7),
        'iat': datetime.datetime.utcnow()
    }
    
    return jwt.encode(payload, Config.JWT_SECRET, algorithm='HS256')


def decode_token(token):
    """Decode a JWT token and return payload dict with 'id' key."""
    payload = jwt.decode(token, Config.JWT_SECRET, algorithms=['HS256'])
    payload['id'] = int(payload.get('sub', 0))
    return payload
