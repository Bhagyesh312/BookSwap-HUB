"""
Orders API Routes
Handles order creation and retrieval for authenticated users
"""
from flask import Blueprint, request, jsonify, g
from models import db, CartItem, Order, OrderItem
from middleware import require_auth

orders_bp = Blueprint('orders', __name__, url_prefix='/api/orders')


@orders_bp.route('/', methods=['POST'])
@require_auth
def create_order():
    """
    Create new order from cart items
    - Validates shipping and payment info
    - Creates order record in database
    - Copies cart items to order_items table
    - Clears user's cart after order creation
    - Returns created order with items
    """
    user_id = g.user['id']
    data = request.get_json() or {}
    
    full_name = data.get('fullName')
    email = data.get('email')
    phone = data.get('phone')
    address = data.get('address')
    city = data.get('city')
    state = data.get('state')
    zip_code = data.get('zip')
    country = data.get('country')
    payment_method = data.get('paymentMethod')
    notes = data.get('notes')
    
    # Validation
    if not full_name or not email or not address or not country or not payment_method:
        return jsonify({
            'error': 'fullName, email, address, country, and paymentMethod are required'
        }), 400
    
    # Get user's cart items
    cart_items = CartItem.query.filter_by(user_id=user_id).all()
    
    if not cart_items:
        return jsonify({'error': 'Cart is empty'}), 400
    
    # Calculate total amount
    total_amount = sum(item.price * item.quantity for item in cart_items)
    
    try:
        # Create order
        order = Order(
            user_id=user_id,
            full_name=full_name.strip(),
            email=email.strip().lower(),
            phone=phone.strip() if phone else None,
            address=address.strip(),
            city=city.strip() if city else None,
            state=state.strip() if state else None,
            zip=zip_code.strip() if zip_code else None,
            country=country.strip() or 'India',
            total_amount=total_amount,
            status='Pending',
            payment_method=payment_method.strip(),
            notes=notes.strip() if notes else None
        )
        db.session.add(order)
        db.session.flush()  # Get order ID before committing
        
        # Create order items from cart
        order_items = []
        for cart_item in cart_items:
            order_item = OrderItem(
                order_id=order.id,
                book_id=cart_item.book_id,
                title=cart_item.title,
                price=cart_item.price,
                quantity=cart_item.quantity,
                image=cart_item.image
            )
            db.session.add(order_item)
            order_items.append(order_item)
        
        # Clear user's cart
        CartItem.query.filter_by(user_id=user_id).delete()
        
        db.session.commit()
        
        return jsonify({
            'orderId': order.id,
            'order': order.to_dict(),
            'items': [item.to_dict() for item in order_items]
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f'Order creation error: {e}')
        return jsonify({'error': 'Failed to create order'}), 500


@orders_bp.route('/', methods=['GET'])
@require_auth
def get_orders():
    """
    Get user's orders with items
    - Returns all orders for authenticated user
    - Includes order items for each order
    - Sorted by creation date (newest first)
    """
    user_id = g.user['id']
    
    try:
        orders = Order.query.filter_by(user_id=user_id).order_by(Order.created_at.desc()).all()
        
        orders_with_items = []
        for order in orders:
            order_dict = order.to_dict()
            order_dict['items'] = [item.to_dict() for item in order.items]
            orders_with_items.append(order_dict)
        
        return jsonify({'orders': orders_with_items})
        
    except Exception as e:
        print(f'Fetch orders error: {e}')
        return jsonify({'error': 'Failed to fetch orders'}), 500


@orders_bp.route('/<int:order_id>', methods=['GET'])
@require_auth
def get_order(order_id):
    """
    Get specific order with items
    - Returns single order owned by authenticated user
    - Includes all order items
    - Returns 404 if order not found or belongs to different user
    """
    user_id = g.user['id']
    
    try:
        order = Order.query.filter_by(id=order_id, user_id=user_id).first()
        
        if not order:
            return jsonify({'error': 'Order not found'}), 404
        
        return jsonify({
            'order': order.to_dict(),
            'items': [item.to_dict() for item in order.items]
        })
        
    except Exception as e:
        print(f'Fetch order error: {e}')
        return jsonify({'error': 'Failed to fetch order'}), 500
