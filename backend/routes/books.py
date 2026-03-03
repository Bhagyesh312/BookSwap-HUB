"""
Books API Routes
Handles book listing, individual book retrieval, and sell-form submissions
"""
from flask import Blueprint, jsonify, request
from models import Book, db

books_bp = Blueprint('books', __name__, url_prefix='/api/books')


@books_bp.route('/', methods=['GET'])
def get_books():
    """
    Get all books
    Returns list of all books ordered by ID
    """
    books = Book.query.order_by(Book.id.asc()).all()
    return jsonify({'items': [book.to_dict() for book in books]})


@books_bp.route('/<int:book_id>', methods=['GET'])
def get_book(book_id):
    """
    Get single book by ID
    Returns 404 if book not found
    """
    book = Book.query.get(book_id)
    
    if not book:
        return jsonify({'error': 'Book not found'}), 404
    
    return jsonify(book.to_dict())


@books_bp.route('/', methods=['POST'])
def sell_book():
    """
    Create a new book listing from the Sell form.
    Accepts JSON body with seller-provided details.
    Returns the created book object with 201 status.
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'error': 'Request body must be JSON'}), 400

    # Required fields
    title = (data.get('title') or '').strip()
    author = (data.get('author') or '').strip()
    price_str = data.get('price')

    if not title or not author or price_str is None:
        return jsonify({'error': 'title, author and price are required'}), 400

    try:
        price = float(price_str)
    except (ValueError, TypeError):
        return jsonify({'error': 'price must be a number'}), 400

    original = None
    if data.get('original') is not None:
        try:
            original = float(data['original'])
        except (ValueError, TypeError):
            original = None

    book = Book(
        title=title,
        author=author,
        price=price,
        original=original,
        type='old',
        edition=(data.get('edition') or '').strip() or None,
        language=data.get('language'),
        condition=data.get('condition'),
        quantity=int(data.get('quantity', 1) or 1),
        delivery_option=data.get('deliveryOption'),
        seller_name=(data.get('sellerName') or '').strip() or None,
        seller_contact=(data.get('sellerContact') or '').strip() or None,
        seller_city=(data.get('sellerCity') or '').strip() or None,
        payment_mode=data.get('paymentMode'),
        description=(data.get('description') or '').strip() or None
    )

    db.session.add(book)
    db.session.commit()

    return jsonify({'message': 'Book listed successfully!', 'book': book.to_dict()}), 201


@books_bp.route('/<int:book_id>', methods=['DELETE'])
def delete_book(book_id):
    """
    Delete a book listing by ID.
    Returns 404 if book not found.
    """
    book = db.session.get(Book, book_id)

    if not book:
        return jsonify({'error': 'Book not found'}), 404

    db.session.delete(book)
    db.session.commit()

    return jsonify({'message': f'Book (id={book_id}) deleted successfully'}), 200
