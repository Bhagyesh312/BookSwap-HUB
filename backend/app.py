"""
BookSwap Hub - Flask Application Factory
Main entry point for the Flask REST API backend
"""
import os
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv

from config import config
from models import db
from extensions import limiter


def create_app(config_name=None):
    """
    Application factory pattern for Flask
    Creates and configures the Flask application instance
    
    Args:
        config_name: Configuration environment name ('development', 'production')
    
    Returns:
        Flask: Configured Flask application instance
    """
    # Load environment variables
    load_dotenv()
    
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'development')
    
    # Get frontend directory (parent of backend)
    frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    
    app = Flask(__name__, static_folder=frontend_dir, static_url_path='')
    
    # Load configuration
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    db.init_app(app)
    limiter.init_app(app)
    
    # Enable CORS for frontend requests
    CORS(app, resources={
        r"/api/*": {
            "origins": os.getenv('FRONTEND_ORIGIN', '*'),
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })
    
    # Register blueprints (routes)
    from routes.auth import auth_bp
    from routes.books import books_bp
    from routes.cart import cart_bp
    from routes.orders import orders_bp
    from routes.admin import admin_bp
    from routes.wishlist import wishlist_bp
    from routes.notifications import notifications_bp
    from routes.reviews import reviews_bp
    from routes.trades import trades_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(books_bp)
    app.register_blueprint(cart_bp)
    app.register_blueprint(orders_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(wishlist_bp)
    app.register_blueprint(notifications_bp)
    app.register_blueprint(reviews_bp)
    app.register_blueprint(trades_bp)
    
    # Serve uploaded files
    @app.route('/uploads/<path:filename>')
    def serve_uploads(filename):
        upload_folder = app.config.get('UPLOAD_FOLDER', os.path.join(os.path.dirname(__file__), 'uploads'))
        return send_from_directory(upload_folder, filename)

    # Health check endpoint
    @app.route('/health')
    def health_check():
        return jsonify({
            'ok': True,
            'service': 'bookswap-backend',
            'timestamp': __import__('datetime').datetime.utcnow().isoformat()
        })
    
    # Serve index page
    @app.route('/')
    def index():
        return send_from_directory(app.static_folder, 'home.html')
    
    # 404 handler - serve HTML files or return JSON for API routes
    @app.errorhandler(404)
    def not_found(error):
        from flask import request
        # Return JSON for API routes
        if request.path.startswith('/api/'):
            return jsonify({
                'error': f'Route not found: {request.method} {request.path}'
            }), 404
        # Try to serve HTML file for other routes
        return jsonify({'error': 'Page not found'}), 404
    
    # Rate limit exceeded handler
    @app.errorhandler(429)
    def rate_limit_exceeded(e):
        return jsonify({'error': 'Too many requests. Please wait and try again.'}), 429

    # Global error handler
    @app.errorhandler(Exception)
    def handle_exception(error):
        status = getattr(error, 'code', 500)
        if status >= 500:
            message = 'Internal server error'
        else:
            message = str(error) or 'Request failed'
        
        app.logger.error(f'Error: {error}')
        return jsonify({'error': message}), status
    
    return app


# Create application instance
app = create_app()


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
