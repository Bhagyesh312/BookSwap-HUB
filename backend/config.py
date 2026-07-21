"""
Flask Application Configuration
Environment-based configuration for BookSwap Hub
All sensitive values MUST be set via environment variables (.env file).
"""
import os
from dotenv import load_dotenv

load_dotenv()


def _require_env(key):
    """Raise an error if a required env variable is missing in production."""
    val = os.getenv(key)
    if not val:
        raise RuntimeError(f"Missing required environment variable: {key}")
    return val


class Config:
    """Base configuration — no secrets hardcoded here."""

    SECRET_KEY = os.getenv('SECRET_KEY')
    JWT_SECRET = os.getenv('JWT_SECRET')

    # Email Configuration (Gmail SMTP)
    MAIL_SERVER = 'smtp.gmail.com'
    MAIL_PORT = 587
    MAIL_USE_TLS = True
    MAIL_USERNAME = os.getenv('MAIL_USERNAME')
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD')
    MAIL_DEFAULT_SENDER = ('BookSwap Hub', os.getenv('MAIL_USERNAME', ''))

    # Frontend URL for password reset links
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://127.0.0.1:5500')

    # PostgreSQL Database Configuration
    DB_HOST = os.getenv('DB_HOST', 'localhost')
    DB_PORT = os.getenv('DB_PORT', '5432')
    DB_NAME = os.getenv('DB_NAME', 'bookswap')
    DB_USER = os.getenv('DB_USER', 'postgres')
    DB_PASSWORD = os.getenv('DB_PASSWORD', '')

    SQLALCHEMY_DATABASE_URI = os.getenv(
        'DATABASE_URL',
        f"postgresql://{os.getenv('DB_USER', 'postgres')}:{os.getenv('DB_PASSWORD', '')}@{os.getenv('DB_HOST', 'localhost')}:{os.getenv('DB_PORT', '5432')}/{os.getenv('DB_NAME', 'bookswap')}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = os.getenv('SQLALCHEMY_ECHO', 'false').lower() == 'true'

    # File Upload Configuration
    UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
    MAX_CONTENT_LENGTH = 20 * 1024 * 1024  # 20 MB max per request
    ALLOWED_IMAGE_EXTENSIONS = {'jpg', 'jpeg', 'png', 'webp', 'gif'}
    ALLOWED_VIDEO_EXTENSIONS = {'mp4', 'mov', 'avi', 'webm'}


class DevelopmentConfig(Config):
    """Development configuration — reads all secrets from .env, no hardcoded fallbacks."""
    DEBUG = True

    SECRET_KEY = os.getenv('SECRET_KEY')
    JWT_SECRET = os.getenv('JWT_SECRET')


class ProductionConfig(Config):
    """Production configuration — all secrets must be explicitly set."""
    DEBUG = False

    @classmethod
    def validate(cls):
        """Call this on startup to ensure all required secrets are present."""
        _require_env('SECRET_KEY')
        _require_env('JWT_SECRET')
        _require_env('MAIL_USERNAME')
        _require_env('MAIL_PASSWORD')
        _require_env('DB_PASSWORD')


# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
