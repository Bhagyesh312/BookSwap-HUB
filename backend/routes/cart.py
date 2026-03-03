"""
Cart API Routes
Handles shopping cart operations for authenticated users
"""
from flask import Blueprint, request, jsonify, g
from models import db, CartItem, Book
from middleware import require_auth

cart_bp = Blueprint('cart', __name__, url_prefix='/api/cart')


@cart_bp.route('/', methods=['GET'])
@require_auth
def get_cart():
    """
    Retrieve all items in authenticated user's shopping cart
    Returns items scoped to user_id from cart_items table
    """
    user_id = g.user['id']
    
    items = CartItem.query.filter_by(user_id=user_id).order_by(CartItem.book_id.asc()).all()
    
    return jsonify({'items': [item.to_dict() for item in items]})


@cart_bp.route('/', methods=['POST'])
@require_auth
def add_to_cart():
    """
    Add book to cart or increment quantity if already exists
    Uses upsert logic for atomic operation
    """
    user_id = g.user['id']
    data = request.get_json() or {}
    
    book_id = data.get('bookId')
    quantity = data.get('quantity', 1)
    
    if not book_id or int(quantity) < 1:
        return jsonify({'error': 'bookId and quantity (>=1) are required'}), 400
    
    book_id = int(book_id)
    quantity = int(quantity)
    
    # Try to get book from database
    book = Book.query.get(book_id)
    
    item_title = book.title if book else data.get('title')
    item_price = float(book.price if book else data.get('price', 0))
    item_original = float(book.original if book else data.get('original', item_price))
    item_image = book.image if book else data.get('image', '')
    
    if not item_title or item_price <= 0:
        return jsonify({'error': 'Valid title and price are required when book is not in catalog'}), 400
    
    # Check if item already in cart
    existing_item = CartItem.query.filter_by(user_id=user_id, book_id=book_id).first()
    
    if existing_item:
        # Update existing item
        existing_item.quantity += quantity
        existing_item.title = item_title
        existing_item.price = item_price
        existing_item.original = item_original
        existing_item.image = item_image
    else:
        # Create new cart item
        cart_item = CartItem(
            user_id=user_id,
            book_id=book_id,
            quantity=quantity,
            title=item_title,
            price=item_price,
            original=item_original,
            image=item_image
        )
        db.session.add(cart_item)
    
    db.session.commit()
    
    # Return updated cart
    items = CartItem.query.filter_by(user_id=user_id).order_by(CartItem.book_id.asc()).all()
    
    return jsonify({'items': [item.to_dict() for item in items]}), 201


@cart_bp.route('/<int:book_id>', methods=['DELETE'])
@require_auth
def remove_from_cart(book_id):
    """
    Remove item from cart by book ID
    """
    user_id = g.user['id']
    
    item = CartItem.query.filter_by(user_id=user_id, book_id=book_id).first()
    
    if not item:
        return jsonify({'error': 'Cart item not found'}), 404
    
    db.session.delete(item)
    db.session.commit()
    
    # Return updated cart
    items = CartItem.query.filter_by(user_id=user_id).order_by(CartItem.book_id.asc()).all()
    
    return jsonify({'items': [item.to_dict() for item in items]})


@cart_bp.route('/', methods=['DELETE'])
@require_auth
def clear_cart():
    """
    Clear all items from user's cart
    """
    user_id = g.user['id']
    
    CartItem.query.filter_by(user_id=user_id).delete()
    db.session.commit()
    
    return jsonify({'items': []})
