"""
Admin API Routes
Protected routes for admin dashboard functionality
"""
from flask import Blueprint, jsonify, g, current_app
from models import db, User, Book, Order, OrderItem, ActivityLog
from middleware import require_auth, require_admin
from sqlalchemy import func
from utils.email import send_order_status_email

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')


def log_action(action, resource=None, resource_id=None, detail=None):
    """Write an entry to the activity log. Silently ignores errors."""
    try:
        entry = ActivityLog(
            admin_id=g.user['id'],
            admin_name=g.user.get('name', 'Admin'),
            action=action,
            resource=resource,
            resource_id=resource_id,
            detail=detail,
        )
        db.session.add(entry)
        # Don't commit here — caller commits with the main change
    except Exception:
        pass


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
        
        # Revenue calculation (exclude cancelled orders)
        total_revenue = db.session.query(func.sum(Order.total_amount)).filter(
            ~Order.status.ilike('cancelled')
        ).scalar() or 0
        
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
        week_revenue = db.session.query(func.sum(Order.total_amount)).filter(
            Order.created_at >= week_ago,
            ~Order.status.ilike('cancelled')
        ).scalar() or 0
        
        # Today's stats
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        today_orders = Order.query.filter(Order.created_at >= today_start).count()
        today_revenue = db.session.query(func.sum(Order.total_amount)).filter(
            Order.created_at >= today_start,
            ~Order.status.ilike('cancelled')
        ).scalar() or 0
        
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


@admin_bp.route('/stats/daily', methods=['GET'])
@require_auth
@require_admin
def get_daily_stats():
    """
    Return real revenue and order counts for the last 7 days.
    Used to power the Revenue Overview chart on the dashboard.
    """
    try:
        from datetime import datetime, timedelta

        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        result = []

        for i in range(6, -1, -1):  # 6 days ago → today
            day_start = today - timedelta(days=i)
            day_end   = day_start + timedelta(days=1)

            revenue = db.session.query(func.sum(Order.total_amount)).filter(
                Order.created_at >= day_start,
                Order.created_at <  day_end,
                ~Order.status.ilike('cancelled')
            ).scalar() or 0

            orders = Order.query.filter(
                Order.created_at >= day_start,
                Order.created_at <  day_end
            ).count()

            result.append({
                'date':    day_start.strftime('%d %b'),
                'day':     day_start.strftime('%a'),
                'revenue': float(revenue),
                'orders':  orders,
            })

        return jsonify({'daily': result})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/users', methods=['GET'])
@require_auth
@require_admin
def get_users():
    """
    Get users with server-side search and pagination.
    Query params: page, per_page, search
    """
    from flask import request
    try:
        page     = max(1, int(request.args.get('page', 1) or 1))
        per_page = min(50, max(1, int(request.args.get('per_page', 20) or 20)))
        search   = (request.args.get('search') or '').strip()

        query = User.query
        if search:
            like = f'%{search}%'
            query = query.filter(
                db.or_(User.name.ilike(like), User.email.ilike(like))
            )

        pagination = query.order_by(User.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        return jsonify({
            'users': [u.to_full_dict() for u in pagination.items],
            'pagination': {
                'page': pagination.page, 'per_page': pagination.per_page,
                'total': pagination.total, 'pages': pagination.pages,
                'has_next': pagination.has_next, 'has_prev': pagination.has_prev,
            }
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
        log_action('delete_user', 'user', user_id, f'Deleted user {user.name} ({user.email})')
        db.session.commit()
        return jsonify({'message': 'User deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/users/<int:user_id>/suspend', methods=['PATCH'])
@require_auth
@require_admin
def suspend_user(user_id):
    """Suspend or unsuspend a user account."""
    from flask import request
    data = request.get_json() or {}
    suspend = bool(data.get('suspend', True))
    reason  = (data.get('reason') or '').strip()[:500]

    if user_id == g.user['id']:
        return jsonify({'error': 'Cannot suspend your own account'}), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    if user.role == 'admin':
        return jsonify({'error': 'Cannot suspend admin accounts'}), 400

    user.is_suspended = suspend
    user.suspended_reason = reason if suspend else None
    action_label = 'suspend_user' if suspend else 'unsuspend_user'
    log_action(action_label, 'user', user_id,
               f'{"Suspended" if suspend else "Unsuspended"} user {user.name} ({user.email})'
               + (f' — reason: {reason}' if reason and suspend else ''))
    db.session.commit()
    return jsonify({
        'message': f'User {"suspended" if suspend else "unsuspended"} successfully',
        'user': user.to_full_dict()
    })


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
        log_action('update_role', 'user', user_id, f'Role changed to {new_role} for {user.name}')
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
    Get books with server-side search and pagination.
    Query params: page, per_page, search
    """
    from flask import request
    try:
        page     = max(1, int(request.args.get('page', 1) or 1))
        per_page = min(50, max(1, int(request.args.get('per_page', 20) or 20)))
        search   = (request.args.get('search') or '').strip()

        query = Book.query
        if search:
            like = f'%{search}%'
            query = query.filter(
                db.or_(Book.title.ilike(like), Book.author.ilike(like))
            )

        pagination = query.order_by(Book.is_approved.asc(), Book.id.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        return jsonify({
            'books': [b.to_dict() for b in pagination.items],
            'pagination': {
                'page': pagination.page, 'per_page': pagination.per_page,
                'total': pagination.total, 'pages': pagination.pages,
                'has_next': pagination.has_next, 'has_prev': pagination.has_prev,
            }
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
            listed_by=g.user['id'],
            is_approved=True,  # admin-added books go live immediately
        )
        
        db.session.add(book)
        db.session.flush()  # get book.id before commit
        log_action('add_book', 'book', book.id, f'Added book "{book.title}" by {book.author}')
        db.session.commit()
        
        return jsonify({
            'message': 'Book added successfully',
            'book': book.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/books/<int:book_id>', methods=['PUT'])
@require_auth
@require_admin
def edit_book(book_id):
    """
    Edit an existing book's details (admin only).
    """
    from flask import request
    from sanitize import clean, clean_float, clean_int

    try:
        book = Book.query.get(book_id)
        if not book:
            return jsonify({'error': 'Book not found'}), 404

        data = request.get_json() or {}

        if 'title'     in data: book.title     = clean(data['title'], max_length=255) or book.title
        if 'author'    in data: book.author    = clean(data['author'], max_length=255) or book.author
        if 'price'     in data: book.price     = clean_float(data['price']) or book.price
        if 'original'  in data: book.original  = clean_float(data['original'])
        if 'category'  in data: book.category  = clean(data['category'], max_length=100)
        if 'language'  in data: book.language  = clean(data['language'], max_length=50)
        if 'publisher' in data: book.publisher = clean(data['publisher'], max_length=255)
        if 'year'      in data: book.year      = int(data['year']) if data['year'] else None
        if 'pages'     in data: book.pages     = int(data['pages']) if data['pages'] else None
        if 'binding'   in data: book.binding   = clean(data['binding'], max_length=100)
        if 'quantity'  in data: book.quantity  = clean_int(data['quantity'], default=book.quantity, min_val=0)
        if 'image'     in data: book.image     = clean(data['image'], max_length=500)
        if 'synopsis'  in data: book.synopsis  = clean(data['synopsis'], max_length=2000)
        if 'type'      in data and data['type'] in ('new', 'old'): book.type = data['type']

        db.session.commit()
        log_action('edit_book', 'book', book_id, f'Edited book "{book.title}"')
        db.session.commit()
        return jsonify({'message': 'Book updated successfully', 'book': book.to_dict()})
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
        log_action('delete_book', 'book', book_id, f'Deleted book "{book.title}"')
        db.session.commit()
        
        return jsonify({'message': 'Book deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/books/<int:book_id>/approve', methods=['PATCH'])
@require_auth
@require_admin
def approve_book(book_id):
    """Approve or reject a seller book listing."""
    from flask import request
    data = request.get_json() or {}
    approved = bool(data.get('approved', True))
    book = Book.query.get(book_id)
    if not book:
        return jsonify({'error': 'Book not found'}), 404
    book.is_approved = approved
    log_action('approve_book' if approved else 'reject_book', 'book', book_id,
               f'Book "{book.title}" {"approved" if approved else "rejected"}')
    db.session.commit()
    return jsonify({'message': f'Book {"approved" if approved else "rejected"}', 'book': book.to_dict()})


@admin_bp.route('/bulk', methods=['POST'])
@require_auth
@require_admin
def bulk_action():
    """
    Perform a bulk action on multiple records.
    Body: { "resource": "books|users|orders", "ids": [1,2,3], "action": "delete|approve|reject|status", "value": "shipped" }
    """
    from flask import request
    data = request.get_json() or {}
    resource = data.get('resource')
    ids      = data.get('ids', [])
    action   = data.get('action')
    value    = data.get('value')

    if not resource or not ids or not action:
        return jsonify({'error': 'resource, ids, and action are required'}), 400

    affected = 0
    try:
        if resource == 'books':
            if action == 'delete':
                affected = Book.query.filter(Book.id.in_(ids)).delete(synchronize_session=False)
            elif action == 'approve':
                affected = Book.query.filter(Book.id.in_(ids)).update({'is_approved': True}, synchronize_session=False)
            elif action == 'reject':
                affected = Book.query.filter(Book.id.in_(ids)).update({'is_approved': False}, synchronize_session=False)

        elif resource == 'users':
            if action == 'delete':
                # Never bulk-delete admins or self
                affected = User.query.filter(
                    User.id.in_(ids),
                    User.role != 'admin',
                    User.id != g.user['id']
                ).delete(synchronize_session=False)

        elif resource == 'orders':
            if action == 'delete':
                affected = Order.query.filter(Order.id.in_(ids)).delete(synchronize_session=False)
            elif action == 'status' and value:
                valid = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']
                if value not in valid:
                    return jsonify({'error': f'Invalid status: {value}'}), 400
                affected = Order.query.filter(Order.id.in_(ids)).update({'status': value}, synchronize_session=False)

        db.session.commit()
        log_action(f'bulk_{action}', resource, None, f'Bulk {action} on {affected} {resource}(s): ids={ids}')
        db.session.commit()
        return jsonify({'message': f'{affected} record(s) updated', 'affected': affected})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/books/<int:book_id>/stock', methods=['PATCH'])
@require_auth
@require_admin
def update_book_stock(book_id):
    """
    Update a book's stock quantity (admin only)
    """
    from flask import request
    
    try:
        data = request.get_json() or {}
        new_quantity = data.get('quantity')
        
        if new_quantity is None or int(new_quantity) < 0:
            return jsonify({'error': 'Valid positive quantity is required'}), 400
            
        book = Book.query.get(book_id)
        if not book:
            return jsonify({'error': 'Book not found'}), 404
            
        book.quantity = int(new_quantity)
        db.session.commit()

        # Fire inventory alert if admin manually sets stock to zero
        if book.quantity == 0:
            try:
                from utils.email import send_inventory_alert
                admins = User.query.filter_by(role='admin').all()
                for admin in admins:
                    send_inventory_alert(admin.email, book.title, book.id, book.author)
            except Exception:
                pass

        return jsonify({
            'message': 'Book stock updated successfully',
            'book': book.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/orders', methods=['GET'])
@require_auth
@require_admin
def get_orders():
    """
    Get orders with server-side search, status filter, and pagination.
    Query params: page, per_page, search, status
    """
    from flask import request
    try:
        page     = max(1, int(request.args.get('page', 1) or 1))
        per_page = min(50, max(1, int(request.args.get('per_page', 20) or 20)))
        search   = (request.args.get('search') or '').strip()
        status   = (request.args.get('status') or '').strip().lower()

        query = Order.query
        if search:
            like = f'%{search}%'
            query = query.filter(
                db.or_(Order.full_name.ilike(like), Order.email.ilike(like))
            )
        if status and status != 'all':
            query = query.filter(Order.status.ilike(status))

        pagination = query.order_by(Order.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )

        orders_data = []
        for order in pagination.items:
            order_dict = order.to_dict()
            order_dict['items']      = [item.to_dict() for item in order.items]
            order_dict['user_name']  = order.full_name
            order_dict['total']      = order_dict.get('totalAmount', 0)
            order_dict['created_at'] = order_dict.get('createdAt')
            orders_data.append(order_dict)

        return jsonify({
            'orders': orders_data,
            'pagination': {
                'page': pagination.page, 'per_page': pagination.per_page,
                'total': pagination.total, 'pages': pagination.pages,
                'has_next': pagination.has_next, 'has_prev': pagination.has_prev,
            }
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
        log_action('update_order_status', 'order', order_id, f'Order #{order_id} status → {new_status}')
        db.session.commit()

        # Push real-time notification to buyer
        try:
            from routes.notifications import push_notification
            push_notification(order.user_id, 'order_update', {
                'message': f'Your order #{order_id} is now {new_status}',
                'orderId': order_id,
                'status': new_status,
            })
        except Exception:
            pass

        # Send email notification for key status changes
        notify_statuses = {'confirmed', 'shipped', 'delivered', 'cancelled'}
        if new_status in notify_statuses:
            try:
                items = [item.to_dict() for item in OrderItem.query.filter_by(order_id=order_id).all()]
                send_order_status_email(
                    to_email=order.email,
                    customer_name=order.full_name,
                    order_id=order.id,
                    new_status=new_status,
                    items=items,
                    total=float(order.total_amount)
                )
            except Exception as mail_err:
                current_app.logger.warning(f'Order email failed for order {order_id}: {mail_err}')

        return jsonify({
            'message': f'Order status updated to {new_status}',
            'order': order.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/logs', methods=['GET'])
@require_auth
@require_admin
def get_logs():
    """
    Get activity log with pagination and optional filters.
    Query params: page, per_page, resource, action
    """
    from flask import request
    try:
        page     = max(1, int(request.args.get('page', 1) or 1))
        per_page = min(100, max(1, int(request.args.get('per_page', 30) or 30)))
        resource = (request.args.get('resource') or '').strip().lower()
        action   = (request.args.get('action') or '').strip().lower()

        query = ActivityLog.query
        if resource and resource != 'all':
            query = query.filter(ActivityLog.resource == resource)
        if action and action != 'all':
            query = query.filter(ActivityLog.action.ilike(f'%{action}%'))

        pagination = query.order_by(ActivityLog.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        return jsonify({
            'logs': [log.to_dict() for log in pagination.items],
            'pagination': {
                'page': pagination.page, 'per_page': pagination.per_page,
                'total': pagination.total, 'pages': pagination.pages,
                'has_next': pagination.has_next, 'has_prev': pagination.has_prev,
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
