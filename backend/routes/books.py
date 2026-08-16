"""
Books API Routes
Handles book listing, individual book retrieval, and sell-form submissions
"""
import os
import uuid
from flask import Blueprint, jsonify, request, current_app
from models import Book, db
from sanitize import clean, clean_float, clean_int

books_bp = Blueprint('books', __name__, url_prefix='/api/books')


@books_bp.route('/', methods=['GET'])
def get_books():
    """
    Get books with optional pagination.
    Query params:
      page     (int, default 1)
      per_page (int, default 20, max 100)
    Returns items + pagination metadata.
    """
    page     = max(1, int(request.args.get('page', 1) or 1))
    per_page = min(100, max(1, int(request.args.get('per_page', 20) or 20)))

    pagination = Book.query.filter(
        db.or_(Book.is_approved == True, Book.is_approved == None)
    ).order_by(Book.id.asc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    return jsonify({
        'items': [book.to_dict() for book in pagination.items],
        'pagination': {
            'page':       pagination.page,
            'per_page':   pagination.per_page,
            'total':      pagination.total,
            'pages':      pagination.pages,
            'has_next':   pagination.has_next,
            'has_prev':   pagination.has_prev,
        }
    })


@books_bp.route('/my', methods=['GET'])
def get_my_listings():
    """Get all listings by the authenticated user (approved + pending)."""
    from flask import g
    from middleware import require_auth
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    if not token:
        return jsonify({'error': 'Authentication required'}), 401
    try:
        from middleware import decode_token
        payload = decode_token(token)
        user_id = payload.get('id') or payload.get('user_id')
    except Exception:
        return jsonify({'error': 'Invalid token'}), 401

    books = Book.query.filter_by(listed_by=user_id).order_by(Book.listed_at.desc()).all()
    return jsonify({'books': [b.to_dict() for b in books]})


@books_bp.route('/<int:book_id>', methods=['DELETE'])
def delete_my_book(book_id):
    """Allow a seller to delete their own listing."""
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    if not token:
        return jsonify({'error': 'Authentication required'}), 401
    try:
        from middleware import decode_token
        payload = decode_token(token)
        user_id = payload.get('id') or payload.get('user_id')
    except Exception:
        return jsonify({'error': 'Invalid token'}), 401

    book = Book.query.get(book_id)
    if not book:
        return jsonify({'error': 'Book not found'}), 404
    if book.listed_by != user_id:
        return jsonify({'error': 'Not authorized'}), 403

    db.session.delete(book)
    db.session.commit()
    return jsonify({'message': 'Listing removed'})


@books_bp.route('/<int:book_id>', methods=['GET'])
def get_book(book_id):
    """Get single book by ID — also returns unapproved books by their owner."""
    book = Book.query.get(book_id)
    if not book:
        return jsonify({'error': 'Book not found'}), 404
    if not book.is_approved:
        # Allow owner to view their own pending listing
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if token:
            try:
                from middleware import decode_token
                payload = decode_token(token)
                if payload.get('id') == book.listed_by or payload.get('role') == 'admin':
                    return jsonify(book.to_dict())
            except Exception:
                pass
        # Also show books with is_approved=None (seeded books not yet explicitly approved)
        if book.is_approved is None:
            return jsonify(book.to_dict())
        return jsonify({'error': 'Book not found'}), 404
    return jsonify(book.to_dict())


def _allowed(filename, allowed_set):
    """Check file extension is in the allowed set."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_set


def _save_file(file_obj, subfolder, allowed_set):
    """
    Save an uploaded file to uploads/<subfolder>/ with a UUID filename.
    Returns the public URL path or None if invalid.
    """
    if not file_obj or not file_obj.filename:
        return None
    if not _allowed(file_obj.filename, allowed_set):
        return None
    ext = file_obj.filename.rsplit('.', 1)[1].lower()
    filename = f"{uuid.uuid4().hex}.{ext}"
    upload_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], subfolder)
    os.makedirs(upload_dir, exist_ok=True)
    file_obj.save(os.path.join(upload_dir, filename))
    return f"/uploads/{subfolder}/{filename}"


@books_bp.route('/', methods=['POST'])
def sell_book():
    """
    Create a new book listing from the Sell form.
    Accepts multipart/form-data (text fields + optional image/video files).
    Returns the created book object with 201 status.
    """
    # Support both multipart/form-data and JSON
    if request.content_type and 'multipart/form-data' in request.content_type:
        data = request.form
        image_files = request.files.getlist('images')
        video_file  = request.files.get('video')
    else:
        data = request.get_json(silent=True) or {}
        image_files = []
        video_file  = None

    # Required fields — sanitized
    title  = clean(data.get('title'), max_length=255)
    author = clean(data.get('author'), max_length=255)
    price  = clean_float(data.get('price'))

    if not title or not author or price is None:
        return jsonify({'error': 'title, author and price are required'}), 400

    original = clean_float(data.get('original'))

    # Handle image uploads (save up to 5 images, store first as main image)
    allowed_img = current_app.config.get('ALLOWED_IMAGE_EXTENSIONS', {'jpg', 'jpeg', 'png', 'webp'})
    allowed_vid = current_app.config.get('ALLOWED_VIDEO_EXTENSIONS', {'mp4', 'mov', 'avi', 'webm'})

    image_urls = []
    for f in image_files[:5]:  # max 5 images
        url = _save_file(f, 'images', allowed_img)
        if url:
            image_urls.append(url)

    video_url = _save_file(video_file, 'videos', allowed_vid)

    book = Book(
        title=title,
        author=author,
        price=price,
        original=original,
        type='old',
        edition=clean(data.get('edition'), max_length=100),
        language=clean(data.get('language'), max_length=50),
        condition=clean(data.get('condition'), max_length=50),
        quantity=clean_int(data.get('quantity', 1), default=1),
        delivery_option=clean(data.get('deliveryOption'), max_length=50),
        seller_name=clean(data.get('sellerName'), max_length=255),
        seller_contact=clean(data.get('sellerContact'), max_length=50),
        seller_city=clean(data.get('sellerCity'), max_length=100),
        payment_mode=clean(data.get('paymentMode'), max_length=50),
        description=clean(data.get('description'), max_length=2000),
        image=image_urls[0] if image_urls else None,
        is_approved=False,  # requires admin approval before going live
    )

    # Store extra images and video URL as JSON in a dedicated field if needed
    # For now, attach them to the description as metadata
    extras = []
    if len(image_urls) > 1:
        extras.append(f"extra_images:{','.join(image_urls[1:])}")
    if video_url:
        extras.append(f"video:{video_url}")
    if extras and book.description:
        book.description = book.description + '\n' + '\n'.join(extras)
    elif extras:
        book.description = '\n'.join(extras)

    db.session.add(book)
    db.session.commit()

    return jsonify({'message': 'Book submitted for review! It will go live once approved by admin.', 'book': book.to_dict()}), 201


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
