# BookSwap Hub

A full-stack book marketplace where users can buy, sell, and swap books. Built with vanilla HTML/CSS/JS on the frontend and Flask + PostgreSQL on the backend.

---

## Tech Stack

**Frontend**
- Vanilla HTML, CSS, JavaScript
- Font Awesome 6 icons
- Chart.js (admin dashboard)
- Cropper.js (image cropping)

**Backend**
- Python 3.10+ / Flask
- SQLAlchemy + PostgreSQL
- JWT authentication
- Flask-Limiter (rate limiting)
- Gmail SMTP (transactional emails)

---

## Features

### Buyer
- Browse new and old books with category filters, price range, and sort options
- Search books by title, author, or category
- Book detail page with full specs and synopsis
- Add to cart, update quantities, apply coupon codes
- Checkout with address and payment method
- Order tracking timeline (Pending → Confirmed → Shipped → Delivered)
- Wishlist (persisted to DB when logged in, localStorage fallback for guests)

### Seller
- Sell form with image/video upload
- Seller dashboard to view and manage own listings
- Listing approval flow (admin must approve before going live)

### Auth
- Register / Login with JWT
- Forgot password via email (SHA-256 hashed reset tokens)
- Change password, update profile, delete account

### Admin Panel
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

### UX / UI
- Skeleton loading cards while fetching
- Toast notification system (success, error, info, cart)
- Notification bell with SSE real-time updates
- Live chat support widget with bot responses
- Back-to-top button with circular scroll progress
- Animated page transitions
- Standardized Indian Location Selection (State/City dropdowns)
- Responsive design

---

## Project Structure

```
BookSwap Hub/
├── backend/
│   ├── app.py                  # Flask app factory, blueprint registration
│   ├── config.py               # Config loaded from .env
│   ├── models.py               # SQLAlchemy models
│   ├── extensions.py           # Shared Flask extensions (limiter, etc.)
│   ├── middleware.py           # JWT middleware
│   ├── sanitize.py             # Input sanitization helpers
│   ├── import_books.py         # Google Books API bulk import script
│   ├── fix_covers.py           # Script to repair broken cover URLs in DB
│   ├── requirements.txt
│   ├── .env                    # Secrets (not committed)
│   ├── .env.example            # Template for .env
│   ├── data/                   # SQL migration files
│   ├── routes/
│   │   ├── auth.py
│   │   ├── books.py
│   │   ├── orders.py
│   │   ├── cart.py
│   │   ├── admin.py
│   │   ├── wishlist.py
│   │   └── notifications.py
│   ├── uploads/
│   │   ├── images/
│   │   └── videos/
│   └── utils/
│       └── email.py            # Gmail SMTP helpers
├── home.html / buy.html / sell.html / book.html
├── checkout.html / orders.html / profile.html
├── admin.html / seller-dashboard.html
├── about.html / contact.html / login.html
├── *.css / *.js
└── start.bat                   # Windows dev server launcher
```

---

## Quick Start

### Option 1: Run with Docker (Recommended)

The easiest way to run the full application (PostgreSQL + Flask Backend + Frontend) is using Docker.

1. Ensure [Docker Desktop](https://www.docker.com/products/docker-desktop/) is installed and running.
2. Clone the repo and navigate to the project directory:
   ```bash
   git clone https://github.com/Bhagyesh312/BookSwap-HUB.git
   cd BookSwap-HUB
   ```
3. Run the containers:
   ```bash
   docker-compose up --build
   ```
4. *That's it!* Docker will build the Flask app, configure the PostgreSQL database, and run all required SQL migrations automatically.
5. Once started, open **`http://localhost:5000`** in your browser to view the application.

> Note: To log in as an Admin, use `Bhagyesh312@gmail.com` (password: `test@123`) which is seeded in the default database, or run `docker exec -it bookswap_web python backend/make_admin.py your@email.com`.

---

### Option 2: Manual Setup

```bash
cd backend
pip install -r requirements.txt
```

### 3. Configure environment

Copy `.env.example` to `.env` and fill in your values:

```env
SECRET_KEY=your-strong-secret-key
JWT_SECRET_KEY=your-jwt-secret-key
DATABASE_URL=postgresql://user:password@localhost:5432/bookswap
MAIL_USERNAME=your-gmail@gmail.com
MAIL_PASSWORD=your-gmail-app-password
```

> Gmail requires an **App Password** (not your account password). Generate one at Google Account → Security → 2-Step Verification → App Passwords.

### 4. Run database migrations

Open pgAdmin4 and run these SQL files in order:

```
backend/data/complete_setup.sql
backend/data/add_role_column.sql
backend/data/add_is_approved.sql
backend/data/add_password_reset.sql
backend/data/add_wishlist_table.sql
backend/data/add_activity_logs.sql
```

### 5. Create an admin user

```bash
python make_admin.py your@email.com
```

### 6. Start the server

```bash
# Windows
start.bat

# or directly
python app.py
```

Open `home.html` in your browser (or serve the root folder with Live Server).

---

## Google Books API — Bulk Import

`backend/import_books.py` populates your database with real books from the Google Books API, with Open Library as a cover image fallback.

### How it works

1. Searches Google Books across 40+ queries (fiction, non-fiction, Indian authors, popular series, academic, etc.)
2. Skips duplicate titles already in the database
3. Verifies every cover image is real (>10KB) — rejects Google's grey placeholder images (~8KB)
4. 4-source cover fallback chain:
   - Google Books thumbnail (zoom=5, verified)
   - Open Library by ISBN
   - Open Library by title+author search
   - Google Books direct cover by ISBN
5. Skips books with no verified cover (they look bad in the UI)
6. Generates realistic INR prices based on page count
7. Marks all imported books as `is_approved=True` (live immediately)
8. Commits every 10 books to avoid data loss on interruption

### Setup

Get a free API key from [Google Cloud Console](https://console.cloud.google.com/):
- Enable the **Books API**
- Create an API key (no billing required for Books API)

Edit the CONFIG section at the top of `import_books.py`:

```python
TOTAL_TARGET   = 300        # how many books to import
NEW_RATIO      = 0.6        # 60% new books, 40% old books
GOOGLE_API_KEY = 'your-api-key-here'
DELAY_SECONDS  = 0.25       # polite delay between requests
```

### Run

```bash
cd backend
python import_books.py
```

Sample output:
```
Existing books in DB: 12
Target: 300 new books

Searching: 'subject:fiction bestseller'
  ✓ 10 imported so far (new=6, old=4, skipped=3)
  ✓ 20 imported so far (new=12, old=8, skipped=7)
  ...
==================================================
Done! Imported 300 books.
  New books : 180
  Old books : 120
  Skipped   : 94 (duplicates or no cover)
  Total in DB now: 312
==================================================
```

### Fix broken covers (optional)

If you have existing books with broken or placeholder cover URLs, run:

```bash
cd backend
python fix_covers.py
```

This re-fetches covers for all books that have missing or invalid image URLs.

### Remove duplicates (pgAdmin4)

```sql
DELETE FROM books
WHERE id NOT IN (
    SELECT MIN(id)
    FROM books
    GROUP BY LOWER(TRIM(title))
);
```

---

## API Endpoints

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

## Environment Variables

| Variable | Description |
|----------|-------------|
| `SECRET_KEY` | Flask secret key |
| `JWT_SECRET_KEY` | JWT signing key |
| `DATABASE_URL` | PostgreSQL connection string |
| `MAIL_USERNAME` | Gmail address for sending emails |
| `MAIL_PASSWORD` | Gmail App Password |

---

## License

© 2026 BookSwap Hub | Just for Practice
