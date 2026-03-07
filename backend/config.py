"""
Flask Application Configuration
Environment-based configuration for development for BookSwap Hub
"""
import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    """Base configuration"""
    SECRET_KEY = os.getenv('SECRET_KEY', 'bookswap-dev-secret-change-in-production')
    JWT_SECRET = os.getenv('JWT_SECRET', 'bookswap-dev-secret-change-in-production')
    
    # Email Configuration (Gmail SMTP)
    MAIL_SERVER = 'smtp.gmail.com'
    MAIL_PORT = 587
    MAIL_USE_TLS = True
    MAIL_USERNAME = os.getenv('MAIL_USERNAME', 'bookswaphubsupport@gmail.com')
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD', 'ftdxtfaohvhooidh')
    MAIL_DEFAULT_SENDER = ('BookSwap Hub', 'bookswaphubsupport@gmail.com')
    
    # Frontend URL for reset links
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://127.0.0.1:5500')
    
    # PostgreSQL Database Configuration
    DB_HOST = os.getenv('DB_HOST', 'localhost')
    DB_PORT = os.getenv('DB_PORT', '5432')
    DB_NAME = os.getenv('DB_NAME', 'bookswap')
    DB_USER = os.getenv('DB_USER', 'postgres')
    DB_PASSWORD = os.getenv('DB_PASSWORD', 'postgres')
    
    SQLALCHEMY_DATABASE_URI = os.getenv(
        'DATABASE_URL',
        f'postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}'
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = os.getenv('SQLALCHEMY_ECHO', 'false').lower() == 'true'


class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True


class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False


# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
