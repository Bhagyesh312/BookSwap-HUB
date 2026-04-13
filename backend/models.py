"""
Flask SQLAlchemy Models for BookSwap Hub
PostgreSQL database models for books, users, cart, and orders
"""
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class Book(db.Model):
    """Book model for storing book information"""
    __tablename__ = 'books'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    author = db.Column(db.String(255), nullable=False)
    category = db.Column(db.String(100))
    type = db.Column(db.String(50))  # 'new' or 'old'
    price = db.Column(db.Numeric(10, 2), nullable=False)
    original = db.Column(db.Numeric(10, 2))
    image = db.Column(db.Text)
    publisher = db.Column(db.String(255))
    year = db.Column(db.Integer)
    edition = db.Column(db.String(100))
    pages = db.Column(db.Integer)
    language = db.Column(db.String(50))
    binding = db.Column(db.String(100))
    synopsis = db.Column(db.Text)
    
    # Sell-listing fields
    condition = db.Column(db.String(50))
    quantity = db.Column(db.Integer, default=1)
    delivery_option = db.Column(db.String(50))
    seller_name = db.Column(db.String(255))
    seller_contact = db.Column(db.String(50))
    seller_city = db.Column(db.String(100))
    payment_mode = db.Column(db.String(50))
    description = db.Column(db.Text)
    listed_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    listed_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_approved = db.Column(db.Boolean, default=False, nullable=False)  # seller listings need admin approval
    
    def to_dict(self):
        """Convert book to dictionary"""
        return {
            'id': self.id,
            'title': self.title,
            'author': self.author,
            'category': self.category,
            'type': self.type,
            'price': str(self.price) if self.price else None,
            'original': str(self.original) if self.original else None,
            'image': self.image,
            'publisher': self.publisher,
            'year': self.year,
            'edition': self.edition,
            'pages': self.pages,
            'language': self.language,
            'binding': self.binding,
            'synopsis': self.synopsis,
            'condition': self.condition,
            'quantity': self.quantity,
            'deliveryOption': self.delivery_option,
            'sellerName': self.seller_name,
            'sellerContact': self.seller_contact,
            'sellerCity': self.seller_city,
            'paymentMode': self.payment_mode,
            'description': self.description,
            'listedBy': self.listed_by,
            'listedAt': self.listed_at.isoformat() if self.listed_at else None,
            'isApproved': self.is_approved,
        }


class User(db.Model):
    """User model for authentication and profile"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), nullable=False, unique=True)
    password_hash = db.Column(db.Text, nullable=False)
    phone = db.Column(db.String(50))
    address = db.Column(db.Text)
    city = db.Column(db.String(100))
    state = db.Column(db.String(100))
    zip = db.Column(db.String(20))
    country = db.Column(db.String(100), default='India')
    role = db.Column(db.String(20), default='user')  # 'user' or 'admin'
    is_suspended = db.Column(db.Boolean, default=False, nullable=False)
    suspended_reason = db.Column(db.String(500), nullable=True)
    last_login_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    # Password reset fields
    reset_token = db.Column(db.String(100), nullable=True)
    reset_token_expires = db.Column(db.DateTime, nullable=True)
    
    # Relationships
    cart_items = db.relationship('CartItem', backref='user', lazy=True, cascade='all, delete-orphan')
    orders = db.relationship('Order', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def to_public_dict(self):
        """Convert user to public dictionary (excludes password)"""
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'role': self.role
        }
    
    def to_full_dict(self):
        """Convert user to full dictionary with all profile info"""
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'phone': self.phone,
            'address': self.address,
            'city': self.city,
            'state': self.state,
            'zip': self.zip,
            'country': self.country,
            'role': self.role,
            'isSuspended': self.is_suspended,
            'suspendedReason': self.suspended_reason,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'lastLogin': self.last_login_at.isoformat() if self.last_login_at else None
        }


class CartItem(db.Model):
    """Shopping cart item model"""
    __tablename__ = 'cart_items'
    
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), primary_key=True)
    book_id = db.Column(db.Integer, primary_key=True)
    quantity = db.Column(db.Integer, nullable=False, default=1)
    title = db.Column(db.String(255), nullable=False)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    original = db.Column(db.Numeric(10, 2))
    image = db.Column(db.Text)
    
    def to_dict(self):
        """Convert cart item to dictionary"""
        return {
            'bookId': self.book_id,
            'quantity': self.quantity,
            'title': self.title,
            'price': float(self.price) if self.price else 0,
            'original': float(self.original) if self.original else float(self.price) if self.price else 0,
            'image': self.image
        }


class Order(db.Model):
    """Order model for tracking purchases"""
    __tablename__ = 'orders'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    full_name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), nullable=False)
    phone = db.Column(db.String(50))
    address = db.Column(db.Text, nullable=False)
    city = db.Column(db.String(100))
    state = db.Column(db.String(100))
    zip = db.Column(db.String(20))
    country = db.Column(db.String(100), nullable=False, default='India')
    total_amount = db.Column(db.Numeric(10, 2), nullable=False)
    status = db.Column(db.String(50), nullable=False, default='Pending')
    payment_method = db.Column(db.String(100), nullable=False)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    # Relationships
    items = db.relationship('OrderItem', backref='order', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        """Convert order to dictionary"""
        return {
            'id': self.id,
            'userId': self.user_id,
            'fullName': self.full_name,
            'email': self.email,
            'phone': self.phone,
            'address': self.address,
            'city': self.city,
            'state': self.state,
            'zip': self.zip,
            'country': self.country,
            'totalAmount': float(self.total_amount) if self.total_amount else 0,
            'status': self.status,
            'paymentMethod': self.payment_method,
            'notes': self.notes,
            'createdAt': self.created_at.isoformat() if self.created_at else None
        }


class WishlistItem(db.Model):
    """Wishlist model — persists wishlisted books per user"""
    __tablename__ = 'wishlist_items'

    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), primary_key=True)
    book_id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    price = db.Column(db.Numeric(10, 2))
    price_when_added = db.Column(db.Numeric(10, 2))  # for price-drop detection
    original = db.Column(db.Numeric(10, 2))
    image = db.Column(db.Text)
    author = db.Column(db.String(255))
    added_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    def to_dict(self):
        return {
            'bookId':        self.book_id,
            'title':         self.title,
            'author':        self.author,
            'price':         float(self.price) if self.price else 0,
            'priceWhenAdded': float(self.price_when_added) if self.price_when_added else float(self.price) if self.price else 0,
            'original':      float(self.original) if self.original else 0,
            'image':         self.image,
            'addedAt':       self.added_at.isoformat() if self.added_at else None,
        }


class ActivityLog(db.Model):
    """Audit trail — records admin and user actions."""
    __tablename__ = 'activity_logs'

    id         = db.Column(db.Integer, primary_key=True, autoincrement=True)
    admin_id   = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    admin_name = db.Column(db.String(255))          # snapshot in case user is deleted
    action     = db.Column(db.String(100), nullable=False)   # e.g. 'delete_user', 'approve_book'
    resource   = db.Column(db.String(50))            # 'user', 'book', 'order'
    resource_id= db.Column(db.Integer)
    detail     = db.Column(db.Text)                  # human-readable description
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id':         self.id,
            'adminId':    self.admin_id,
            'adminName':  self.admin_name,
            'action':     self.action,
            'resource':   self.resource,
            'resourceId': self.resource_id,
            'detail':     self.detail,
            'createdAt':  self.created_at.isoformat() if self.created_at else None,
        }


class Review(db.Model):
    """Book review and rating model — one review per user per book, only for buyers."""
    __tablename__ = 'reviews'

    id         = db.Column(db.Integer, primary_key=True, autoincrement=True)
    book_id    = db.Column(db.Integer, db.ForeignKey('books.id', ondelete='CASCADE'), nullable=False)
    user_id    = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    rating     = db.Column(db.Integer, nullable=False)   # 1–5
    review_text= db.Column(db.Text)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    __table_args__ = (db.UniqueConstraint('book_id', 'user_id', name='uq_review_book_user'),)

    def to_dict(self, reviewer_name=None):
        return {
            'id':         self.id,
            'bookId':     self.book_id,
            'userId':     self.user_id,
            'reviewerName': reviewer_name or 'Anonymous',
            'rating':     self.rating,
            'reviewText': self.review_text,
            'createdAt':  self.created_at.isoformat() if self.created_at else None,
        }


class OrderItem(db.Model):
    """Order item model for individual items in an order"""
    __tablename__ = 'order_items'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id', ondelete='CASCADE'), nullable=False)
    book_id = db.Column(db.Integer, nullable=False)
    title = db.Column(db.String(255), nullable=False)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=1)
    image = db.Column(db.Text)
    
    def to_dict(self):
        """Convert order item to dictionary"""
        return {
            'id': self.id,
            'bookId': self.book_id,
            'title': self.title,
            'price': float(self.price) if self.price else 0,
            'quantity': self.quantity,
            'image': self.image
        }


class TradeRequest(db.Model):
    """Peer-to-Peer Trade Request Model"""
    __tablename__ = 'trade_requests'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    requester_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    receiver_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    offered_book_id = db.Column(db.Integer, db.ForeignKey('books.id', ondelete='CASCADE'), nullable=False)
    target_book_id = db.Column(db.Integer, db.ForeignKey('books.id', ondelete='CASCADE'), nullable=False)
    status = db.Column(db.String(20), default='pending')  # 'pending', 'accepted', 'declined', 'completed'
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    requester = db.relationship('User', foreign_keys=[requester_id])
    receiver = db.relationship('User', foreign_keys=[receiver_id])
    offered_book = db.relationship('Book', foreign_keys=[offered_book_id])
    target_book = db.relationship('Book', foreign_keys=[target_book_id])

    def to_dict(self):
        return {
            'id': self.id,
            'requesterId': self.requester_id,
            'requesterName': self.requester.name if self.requester else 'Unknown',
            'receiverId': self.receiver_id,
            'receiverName': self.receiver.name if self.receiver else 'Unknown',
            'offeredBookId': self.offered_book_id,
            'offeredBookTitle': self.offered_book.title if self.offered_book else 'Deleted Book',
            'offeredBookImage': self.offered_book.image if self.offered_book else None,
            'targetBookId': self.target_book_id,
            'targetBookTitle': self.target_book.title if self.target_book else 'Deleted Book',
            'targetBookImage': self.target_book.image if self.target_book else None,
            'status': self.status,
            'createdAt': self.created_at.isoformat() if self.created_at else None
        }

