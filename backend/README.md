
# BookSwap Hub Backend
> Flask REST API for BookSwap Hub

---

## 🛠️ Tech Stack

- Python 3.10+
- Flask
- SQLAlchemy (PostgreSQL)
- JWT Authentication
- Gmail SMTP (for password reset)

---

## 🚀 Quick Start

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Configure your database and email in `config.py`.
3. Run migrations in `data/complete_setup.sql` (and `add_password_reset.sql` if upgrading).
4. Start the backend:
   ```bash
   python app.py
   ```

---

## 🔗 Main API Endpoints

- `POST /api/auth/register` — Register new user
- `POST /api/auth/login` — Login
- `GET /api/auth/me` — Get user profile (JWT required)
- `PUT /api/auth/me` — Update profile
- `PUT /api/auth/change-password` — Change password
- `POST /api/auth/forgot-password` — Request password reset email
- `POST /api/auth/reset-password` — Reset password with token
- `POST /api/auth/verify-reset-token` — Validate reset token
- `DELETE /api/auth/delete-account` — Delete user account
- `GET /api/books` — List books
- `GET /api/books/<id>` — Book details
- `GET /api/cart` — Get cart (JWT required)
- `POST /api/cart` — Update cart
- `POST /api/orders` — Place order
- `GET /api/orders` — List user orders
- `GET /health` — Health check

---

## 📦 Notes

- Data is stored in PostgreSQL (see `data/complete_setup.sql`).
- Password reset uses Gmail SMTP (set credentials in `config.py`).
- Admin endpoints available for admin users only.

---

## 📝 License

© 2026 BookSwap Hub | Backend
