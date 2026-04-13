"""
Reviews API Routes
Handles book reviews and ratings — only verified buyers can review.
"""
from flask import Blueprint, request, jsonify, g
from models import db, Review, Order, OrderItem, User
from middleware import require_auth
from sqlalchemy import func

reviews_bp = Blueprint('reviews', __name__)


def _avg_rating(book_id):
    """Return (avg_rating, review_count) for a book."""
    result = db.session.query(
        func.avg(Review.rating).label('avg'),
        func.count(Review.id).label('count')
    ).filter(Review.book_id == book_id).one()
    avg = round(float(result.avg), 1) if result.avg else 0.0
    return avg, result.count


@reviews_bp.route('/api/reviews/bulk-ratings', methods=['GET'])
def bulk_ratings():
    """
    Return avg rating and review count for multiple books at once.
    Query param: ids=1,2,3,4
    """
    ids_param = request.args.get('ids', '')
    try:
        book_ids = [int(x) for x in ids_param.split(',') if x.strip().isdigit()]
    except Exception:
        return jsonify({'ratings': {}}), 200

    if not book_ids:
        return jsonify({'ratings': {}}), 200

    rows = db.session.query(
        Review.book_id,
        func.avg(Review.rating).label('avg'),
        func.count(Review.id).label('count')
    ).filter(Review.book_id.in_(book_ids)).group_by(Review.book_id).all()

    ratings = {
        row.book_id: {
            'avgRating': round(float(row.avg), 1) if row.avg else 0.0,
            'reviewCount': row.count
        }
        for row in rows
    }
    return jsonify({'ratings': ratings})


@reviews_bp.route('/api/books/<int:book_id>/reviews', methods=['GET'])
def get_reviews(book_id):
    """List all reviews for a book with average rating."""
    reviews = (
        Review.query
        .filter_by(book_id=book_id)
        .order_by(Review.created_at.desc())
        .all()
    )
    # Batch-load reviewer names
    user_ids = list({r.user_id for r in reviews})
    users = {u.id: u.name for u in User.query.filter(User.id.in_(user_ids)).all()} if user_ids else {}

    avg, count = _avg_rating(book_id)
    return jsonify({
        'avgRating': avg,
        'reviewCount': count,
        'reviews': [r.to_dict(reviewer_name=users.get(r.user_id)) for r in reviews]
    })


@reviews_bp.route('/api/books/<int:book_id>/reviews', methods=['POST'])
@require_auth
def submit_review(book_id):
    """Submit a review. User must have purchased the book."""
    user_id = g.user['id']
    data = request.get_json() or {}

    rating = data.get('rating')
    review_text = (data.get('reviewText') or '').strip()[:2000]

    if not rating or not isinstance(rating, int) or not (1 <= rating <= 5):
        return jsonify({'error': 'rating must be an integer between 1 and 5'}), 400

    # Check purchase — user must have an order containing this book
    purchased = db.session.query(OrderItem).join(Order, OrderItem.order_id == Order.id).filter(
        Order.user_id == user_id,
        OrderItem.book_id == book_id
    ).first()
    if not purchased:
        return jsonify({'error': 'You can only review books you have purchased'}), 403

    # Upsert — update if already reviewed
    existing = Review.query.filter_by(book_id=book_id, user_id=user_id).first()
    if existing:
        existing.rating = rating
        existing.review_text = review_text
        review = existing
    else:
        review = Review(book_id=book_id, user_id=user_id, rating=rating, review_text=review_text)
        db.session.add(review)

    db.session.commit()

    user = User.query.get(user_id)
    avg, count = _avg_rating(book_id)
    return jsonify({
        'message': 'Review saved',
        'review': review.to_dict(reviewer_name=user.name if user else None),
        'avgRating': avg,
        'reviewCount': count,
    }), 201


@reviews_bp.route('/api/reviews/<int:review_id>', methods=['DELETE'])
@require_auth
def delete_review(review_id):
    """Delete own review (or admin can delete any)."""
    user_id = g.user['id']
    is_admin = g.user.get('role') == 'admin'

    review = Review.query.get(review_id)
    if not review:
        return jsonify({'error': 'Review not found'}), 404
    if review.user_id != user_id and not is_admin:
        return jsonify({'error': 'Not authorised'}), 403

    db.session.delete(review)
    db.session.commit()
    return jsonify({'message': 'Review deleted'})
