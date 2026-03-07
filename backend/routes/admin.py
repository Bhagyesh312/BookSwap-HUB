"""
Admin API Routes
Protected routes for admin dashboard functionality
"""
from flask import Blueprint, jsonify, g
from models import db, User, Book, Order
from middleware import require_auth, require_admin
from sqlalchemy import func

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')


@admin_bp.route('/stats', methods=['GET'])
@require_auth
@require_admin
def get_stats():
    """
    Get dashboard statistics
    Returns counts and recent activity metrics - real-time data
    """
    try:
        from datetime import datetime, timedelta
        
        total_users = User.query.count()
        total_books = Book.query.count()
        total_orders = Order.query.count()
        
        # Revenue calculation (using correct column name)
        total_revenue = db.session.query(func.sum(Order.total_amount)).scalar() or 0
        
        # Order status breakdown
        pending_orders = Order.query.filter(Order.status.ilike('pending')).count()
        processing_orders = Order.query.filter(Order.status.ilike('processing')).count()
        shipped_orders = Order.query.filter(Order.status.ilike('shipped')).count()
        delivered_orders = Order.query.filter(Order.status.ilike('delivered')).count()
        cancelled_orders = Order.query.filter(Order.status.ilike('cancelled')).count()
        
        # Recent counts (last 7 days)
        week_ago = datetime.utcnow() - timedelta(days=7)
        
        new_users = User.query.filter(User.created_at >= week_ago).count()
        new_orders = Order.query.filter(Order.created_at >= week_ago).count()
        week_revenue = db.session.query(func.sum(Order.total_amount)).filter(Order.created_at >= week_ago).scalar() or 0
        
        # Today's stats
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        today_orders = Order.query.filter(Order.created_at >= today_start).count()
        today_revenue = db.session.query(func.sum(Order.total_amount)).filter(Order.created_at >= today_start).scalar() or 0
        
        return jsonify({
            'totalUsers': total_users,
            'totalBooks': total_books,
            'totalOrders': total_orders,
            'totalRevenue': float(total_revenue),
            'pendingOrders': pending_orders,
            'processingOrders': processing_orders,
            'shippedOrders': shipped_orders,
            'deliveredOrders': delivered_orders,
            'cancelledOrders': cancelled_orders,
            'newUsersThisWeek': new_users,
            'newOrdersThisWeek': new_orders,
            'weekRevenue': float(week_revenue),
            'todayOrders': today_orders,
            'todayRevenue': float(today_revenue)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/users', methods=['GET'])
@require_auth
@require_admin
def get_users():
    """
    Get all users for admin management
    """
    try:
        users = User.query.order_by(User.created_at.desc()).all()
        return jsonify({
            'users': [u.to_full_dict() for u in users]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@require_auth
@require_admin
def delete_user(user_id):
    """
    Delete a user account
    Cannot delete self or other admins
    """
    try:
        if user_id == g.user['id']:
            return jsonify({'error': 'Cannot delete your own account'}), 400
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if user.role == 'admin':
            return jsonify({'error': 'Cannot delete admin users'}), 400
        
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({'message': 'User deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/users/<int:user_id>/role', methods=['PATCH'])
@require_auth
@require_admin
def update_user_role(user_id):
    """
    Update a user's role (promote/demote)
    """
    from flask import request
    
    try:
        data = request.get_json() or {}
        new_role = data.get('role', 'user')
        
        if new_role not in ['user', 'admin']:
            return jsonify({'error': 'Invalid role'}), 400
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        user.role = new_role
        db.session.commit()
        
        return jsonify({
            'message': f'User role updated to {new_role}',
            'user': user.to_full_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/books', methods=['GET'])
@require_auth
@require_admin
def get_books():
    """
    Get all books for admin management
    """
    try:
        books = Book.query.order_by(Book.id.desc()).all()
        return jsonify({
            'books': [b.to_dict() for b in books]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/books', methods=['POST'])
@require_auth
@require_admin
def add_book():
    """
    Add a new book (admin only)
    Books added here go to 'new' section by default
    """
    from flask import request
    
    try:
        data = request.get_json() or {}
        
        # Required fields
        title = (data.get('title') or '').strip()
        author = (data.get('author') or '').strip()
        price = data.get('price')
        
        if not title or not author or not price:
            return jsonify({'error': 'Title, author, and price are required'}), 400
        
        # Create new book
        book = Book(
            title=title,
            author=author,
            price=float(price),
            original=float(data.get('original') or price),
            category=data.get('category') or 'Fiction',
            type='new',  # Admin-added books go to "new" section
            image=data.get('image') or '',
            publisher=data.get('publisher') or '',
            year=int(data.get('year')) if data.get('year') else None,
            edition=data.get('edition') or '',
            pages=int(data.get('pages')) if data.get('pages') else None,
            language=data.get('language') or 'English',
            binding=data.get('binding') or 'Paperback',
            synopsis=data.get('synopsis') or '',
            condition='New',
            quantity=int(data.get('quantity') or 1),
            listed_by=g.user['id']
        )
        
        db.session.add(book)
        db.session.commit()
        
        return jsonify({
            'message': 'Book added successfully',
            'book': book.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/books/<int:book_id>', methods=['DELETE'])
@require_auth
@require_admin
def delete_book(book_id):
    """
    Delete a book listing
    """
    try:
        book = Book.query.get(book_id)
        if not book:
            return jsonify({'error': 'Book not found'}), 404
        
        db.session.delete(book)
        db.session.commit()
        
        return jsonify({'message': 'Book deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/orders', methods=['GET'])
@require_auth
@require_admin
def get_orders():
    """
    Get all orders for admin management
    Returns orders with items and user info
    """
    try:
        orders = Order.query.order_by(Order.created_at.desc()).all()
        orders_data = []
        
        for order in orders:
            order_dict = order.to_dict()
            # Add items
            order_dict['items'] = [item.to_dict() for item in order.items]
            # Add user_name for display
            order_dict['user_name'] = order.full_name
            # Add total as alias for totalAmount
            order_dict['total'] = order_dict.get('totalAmount', 0)
            # Add created_at as alias for createdAt
            order_dict['created_at'] = order_dict.get('createdAt')
            orders_data.append(order_dict)
        
        return jsonify({
            'orders': orders_data
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/orders/<int:order_id>/status', methods=['PATCH'])
@require_auth
@require_admin
def update_order_status(order_id):
    """
    Update an order's status
    """
    from flask import request
    
    try:
        data = request.get_json() or {}
        new_status = data.get('status')
        
        valid_statuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']
        if new_status not in valid_statuses:
            return jsonify({'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'}), 400
        
        order = Order.query.get(order_id)
        if not order:
            return jsonify({'error': 'Order not found'}), 404
        
        order.status = new_status
        db.session.commit()
        
        return jsonify({
            'message': f'Order status updated to {new_status}',
            'order': order.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
