# 📚 BookSwap Hub

A full-stack book marketplace where users can **buy, sell, swap, and trade** books. Built with vanilla HTML/CSS/JS on the frontend and Flask + PostgreSQL on the backend.

![BookSwap Hub](https://img.shields.io/badge/Platform-BookSwap%20Hub-orange?style=for-the-badge)
![Flask](https://img.shields.io/badge/Backend-Flask-blue?style=for-the-badge)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791?style=for-the-badge)
![License](https://img.shields.io/badge/License-Practice%20Project-green?style=for-the-badge)

---

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | Vanilla HTML5, CSS3, JavaScript (ES6+) |
| **Backend** | Python 3.10+ / Flask |
| **Database** | PostgreSQL + SQLAlchemy ORM |
| **Auth** | JWT (JSON Web Tokens) |
| **Email** | Gmail SMTP (transactional emails) |
| **Icons** | Font Awesome 6 |
| **Charts** | Chart.js (admin dashboard) |
| **Image Crop** | Cropper.js (profile photos) |
| **Rate Limiting** | Flask-Limiter |
| **Real-time** | Server-Sent Events (SSE) |

---

## ✨ Features

### 🛒 Buyer
- Browse new and old books with category filters, price range, and sort options
- Search books by title, author, or category
- Book detail page with full specs and synopsis
- Add to cart, update quantities, apply coupon codes
- Checkout with address and payment method
- Standardized State/City location selection (Indian states & cities)
- Order tracking timeline (Pending → Confirmed → Shipped → Delivered)
- Wishlist (persisted to DB when logged in, localStorage fallback for guests)

### 📦 Seller
- Sell form with image/video upload and State/City location dropdowns
- Seller dashboard to view and manage own listings
- Listing approval flow (admin must approve before going live)

### 🔄 Peer-to-Peer Trading
- Propose book trades directly with other sellers
- Select from your own listings to offer in exchange
- Trade proposal management (accept / decline)

### 🔐 Auth
- Register / Login with JWT
- Forgot password via email (SHA-256 hashed reset tokens)
- Change password, update profile, delete account
- Profile photo upload with crop support

### ⭐ Reviews
- Rate and review books you've purchased
- Star rating system with written feedback

### 🎮 Book Quiz
- Interactive book knowledge quiz
- Multiple categories and difficulty levels

### 🛡️ Admin Panel
- Dashboard with stats: total users, books, orders, revenue
- Order status breakdown bar + doughnut chart
- Revenue overview chart (last 7 days, real data)
- User management: promote/demote, delete, bulk delete
- Book management: add, edit, approve/reject, update stock, bulk actions
- Order management: update status (triggers email to customer), bulk status update
- Pending seller listings queue with approve/reject
- Server-side search and pagination across all tables
- Activity log (every admin action recorded)
- Export any table to CSV

### 🎨 UX / UI
- Premium glassmorphism design with orange gradient theme
- Skeleton loading cards while fetching
- Toast notification system (success, error, info, cart)
- Notification bell with SSE real-time updates
- Live chat support widget with bot responses
- Back-to-top button with circular scroll progress
- Animated page transitions
- Fly-to-cart animation
- Responsive design across all devices

---

## 📁 Project Structure

```
BookSwap Hub/
├── backend/
│   ├── app.py                  # Flask app factory, blueprint registration
│   ├── config.py               # Config loaded from .env
│   ├── models.py               # SQLAlchemy models (User, Book, Order, etc.)
│   ├── extensions.py           # Shared Flask extensions (limiter, etc.)
│   ├── middleware.py           # JWT middleware
│   ├── sanitize.py             # Input sanitization helpers
│   ├── import_books.py         # Google Books API bulk import script
│   ├── fix_covers.py           # Script to repair broken cover URLs in DB
│   ├── make_admin.py           # Promote user to admin role
│   ├── requirements.txt
│   ├── .env.example            # Template for .env
│   ├── data/                   # SQL migration files
│   ├── routes/
│   │   ├── auth.py             # Registration, login, profile, password reset
│   │   ├── books.py            # Book listing, detail, sell
│   │   ├── orders.py           # Order placement and tracking
│   │   ├── cart.py             # Shopping cart CRUD
│   │   ├── admin.py            # Admin dashboard & management
│   │   ├── wishlist.py         # Wishlist management
│   │   ├── notifications.py   # SSE real-time notifications
│   │   ├── reviews.py          # Book reviews and ratings
│   │   └── trades.py           # Peer-to-peer trade proposals
│   ├── uploads/                # User-uploaded images & videos
│   └── utils/
│       └── email.py            # Gmail SMTP helpers
├── devops/
│   ├── Dockerfile              # Container image for the app
│   ├── docker-compose.yml      # Full-stack orchestration
│   └── init-db.sh              # Database initialization script
├── home.html                   # Landing page
├── buy.html                    # Book browsing & search
├── sell.html                   # Book listing form
├── book.html                   # Book detail page
├── checkout.html               # Checkout flow
├── orders.html                 # Order history & tracking
├── profile.html                # User profile management
├── admin.html                  # Admin dashboard
├── seller-dashboard.html       # Seller listings management
├── quiz.html                   # Book knowledge quiz
├── about.html / contact.html   # Info pages
├── login.html / reset-password.html
├── locations.js                # Indian State/City data & dropdown logic
├── trade.js                    # Peer-to-peer trade system
├── enhancements.js             # Toast, skeleton, pagination, coupon system
├── notifications.js            # SSE notification bell
├── chat-support.js             # Live chat widget
├── *.css                       # Page-specific stylesheets
└── start.bat                   # Windows dev server launcher
```

---

## 🚀 Quick Start

### Option 1: Run with Docker (Recommended)

1. Ensure [Docker Desktop](https://www.docker.com/products/docker-desktop/) is installed and running.
2. Clone the repo:
   ```bash
   git clone https://github.com/Bhagyesh312/BookSwap-HUB.git
   cd BookSwap-HUB
   ```
3. Run the containers:
   ```bash
   docker-compose up --build
   ```
4. Open **`http://localhost:5000`** in your browser.

> **Admin Login:** `Bhagyesh312@gmail.com` / `test@123` (seeded by default), or run:
> ```bash
> docker exec -it bookswap_web python backend/make_admin.py your@email.com
> ```

---

### Option 2: Manual Setup

#### 1. Install dependencies
```bash
cd backend
pip install -r requirements.txt
```

#### 2. Configure environment
Copy `.env.example` to `.env` and fill in your values:

```env
SECRET_KEY=your-strong-secret-key
JWT_SECRET=your-jwt-secret-key
DATABASE_URL=postgresql://user:password@localhost:5432/bookswap
MAIL_USERNAME=your-gmail@gmail.com
MAIL_PASSWORD=your-gmail-app-password
GOOGLE_BOOKS_API_KEY=your-google-books-api-key
```

> Gmail requires an **App Password** (not your account password). Generate one at Google Account → Security → 2-Step Verification → App Passwords.

#### 3. Run database migrations
Open pgAdmin4 and run these SQL files in order:

```
backend/data/complete_setup.sql
backend/data/add_role_column.sql
backend/data/add_is_approved.sql
backend/data/add_password_reset.sql
backend/data/add_wishlist_table.sql
backend/data/add_activity_logs.sql
```

#### 4. Create an admin user
```bash
python make_admin.py your@email.com
```

#### 5. Start the server
```bash
# Windows
start.bat

# or directly
python app.py
```

Open `http://127.0.0.1:5000` in your browser.

---

## 📖 Google Books API — Bulk Import

`backend/import_books.py` populates your database with real books from the Google Books API.

### How it works

1. Searches Google Books across 40+ queries (fiction, non-fiction, Indian authors, etc.)
2. Skips duplicate titles already in the database
3. Verifies every cover image is real (>10KB) — rejects placeholder images
4. 4-source cover fallback chain: Google Books → Open Library by ISBN → Open Library by title → Google Books direct
5. Generates realistic INR prices based on page count
6. Marks all imported books as `is_approved=True`
7. Commits every 10 books to avoid data loss on interruption

### Setup & Run

```bash
cd backend
# Set GOOGLE_BOOKS_API_KEY in your .env file
python import_books.py
```

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Get profile (JWT required) |
| PUT | `/api/auth/me` | Update profile |
| PUT | `/api/auth/change-password` | Change password |
| POST | `/api/auth/forgot-password` | Send reset email |
| POST | `/api/auth/reset-password` | Reset with token |
| DELETE | `/api/auth/delete-account` | Delete account |

### Books
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/books/` | List books (paginated, filterable) |
| GET | `/api/books/<id>` | Book detail |
| POST | `/api/books/sell` | Submit book for sale (JWT required) |

### Cart & Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cart` | Get cart |
| POST | `/api/cart` | Add item |
| PATCH | `/api/cart/<id>` | Update quantity |
| DELETE | `/api/cart/<id>` | Remove item |
| DELETE | `/api/cart` | Clear cart |
| POST | `/api/orders` | Place order |
| GET | `/api/orders` | List user orders |

### Wishlist
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/wishlist` | Get wishlist |
| POST | `/api/wishlist` | Add to wishlist |
| DELETE | `/api/wishlist/<book_id>` | Remove from wishlist |

### Reviews
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reviews/<book_id>` | Get reviews for a book |
| POST | `/api/reviews` | Submit a review (JWT required) |

### Trades
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/trades` | Propose a trade (JWT required) |
| GET | `/api/trades` | List your trade proposals |
| PATCH | `/api/trades/<id>` | Accept or decline a trade |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications/stream` | SSE stream (JWT via query param) |
| GET | `/api/notifications` | List notifications |
| PATCH | `/api/notifications/<id>/read` | Mark as read |

### Admin (admin role required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Dashboard stats |
| GET | `/api/admin/stats/daily` | 7-day revenue chart data |
| GET | `/api/admin/users` | List users (paginated) |
| PATCH | `/api/admin/users/<id>/role` | Promote/demote user |
| DELETE | `/api/admin/users/<id>` | Delete user |
| GET | `/api/admin/books` | List books (paginated) |
| POST | `/api/admin/books` | Add book |
| PUT | `/api/admin/books/<id>` | Edit book |
| DELETE | `/api/admin/books/<id>` | Delete book |
| PATCH | `/api/admin/books/<id>/approve` | Approve/reject listing |
| PATCH | `/api/admin/books/<id>/stock` | Update stock |
| GET | `/api/admin/orders` | List orders (paginated) |
| PATCH | `/api/admin/orders/<id>/status` | Update order status |
| POST | `/api/admin/bulk` | Bulk action (approve/reject/delete/status) |
| GET | `/api/admin/logs` | Activity log |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server health check |

---

## 🔐 Environment Variables

| Variable | Description |
|----------|-------------|
| `SECRET_KEY` | Flask secret key |
| `JWT_SECRET` | JWT signing key |
| `DB_HOST` | PostgreSQL host |
| `DB_PORT` | PostgreSQL port (default: 5432) |
| `DB_NAME` | Database name |
| `DB_USER` | Database user |
| `DB_PASSWORD` | Database password |
| `MAIL_USERNAME` | Gmail address for sending emails |
| `MAIL_PASSWORD` | Gmail App Password |
| `GOOGLE_BOOKS_API_KEY` | Google Books API key for bulk import |
| `FRONTEND_ORIGIN` | Frontend URL for CORS |

---

## 📜 License

© 2026 BookSwap Hub | Made for Practice & Learning
