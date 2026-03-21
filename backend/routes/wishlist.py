"""
Wishlist API Routes
Persists wishlist items per authenticated user.
Guests continue to use localStorage (handled on the frontend).
"""
from flask import Blueprint, request, jsonify, g
from models import db, WishlistItem
from middleware import require_auth
from sanitize import clean, clean_float

wishlist_bp = Blueprint('wishlist', __name__, url_prefix='/api/wishlist')


@wishlist_bp.route('/', methods=['GET'])
@require_auth
def get_wishlist():
    """Return all wishlist items for the logged-in user."""
    items = WishlistItem.query.filter_by(user_id=g.user['id']).order_by(WishlistItem.added_at.desc()).all()
    return jsonify({'items': [i.to_dict() for i in items]})


@wishlist_bp.route('/', methods=['POST'])
@require_auth
def add_to_wishlist():
    """Add a book to the wishlist (idempotent — safe to call if already exists)."""
    data = request.get_json() or {}
    book_id = data.get('bookId')
    if not book_id:
        return jsonify({'error': 'bookId is required'}), 400

    book_id = int(book_id)
    user_id = g.user['id']

    # Already in wishlist — just return it
    existing = WishlistItem.query.filter_by(user_id=user_id, book_id=book_id).first()
    if existing:
        return jsonify({'item': existing.to_dict()}), 200

    price = clean_float(data.get('price')) or 0
    item = WishlistItem(
        user_id=user_id,
        book_id=book_id,
        title=clean(data.get('title'), max_length=255) or f'Book #{book_id}',
        author=clean(data.get('author'), max_length=255),
        price=price,
        price_when_added=price,
        original=clean_float(data.get('original')) or price,
        image=clean(data.get('image'), max_length=500),
    )
    db.session.add(item)
    db.session.commit()
    return jsonify({'item': item.to_dict()}), 201


@wishlist_bp.route('/<int:book_id>', methods=['DELETE'])
@require_auth
def remove_from_wishlist(book_id):
    """Remove a single book from the wishlist."""
    item = WishlistItem.query.filter_by(user_id=g.user['id'], book_id=book_id).first()
    if not item:
        return jsonify({'error': 'Item not found'}), 404
    db.session.delete(item)
    db.session.commit()
    return jsonify({'message': 'Removed from wishlist'})


@wishlist_bp.route('/', methods=['DELETE'])
@require_auth
def clear_wishlist():
    """Clear the entire wishlist for the logged-in user."""
    WishlistItem.query.filter_by(user_id=g.user['id']).delete()
    db.session.commit()
    return jsonify({'message': 'Wishlist cleared'})
