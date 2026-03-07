
# 📚 BookSwap Hub
> The smart way to buy, sell, and swap books online.

BookSwap Hub is a modern web app for book lovers to buy, sell, and exchange books. Enjoy a seamless, mobile-friendly experience with real-time features and secure authentication.

---

## ✨ Key Features

- **Buy Books**: Browse a wide catalog of new and used books with real discounts and coupon codes.
- **Sell Books**: List your own books for sale with easy verification.
- **Book Matchmaker Quiz**: Find your perfect book with a fun, interactive quiz.
- **Shopping Cart**: Persistent cart with quantity management and coupon support.
- **Order Tracking**: View your order history and status.
- **User Profiles**: Edit your info, change password, and view account stats.
- **Forgot Password**: Secure password reset via email (Gmail SMTP integration).
- **Admin Dashboard**: Manage users, books, and orders (admin only).
- **Chatbot**: Get instant help with 40+ smart responses.
- **Mobile Responsive**: Fully optimized for all devices.

---

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/Bhagyesh312/BookSwap-HUB.git
   cd BookSwap-HUB
   ```
2. **Backend Setup**
   - Install Python 3.10+
   - Install dependencies:
     ```bash
     cd backend
     pip install -r requirements.txt
     ```
   - Configure your database and email in `backend/config.py`
   - Run migrations in `backend/data/complete_setup.sql` (and `add_password_reset.sql` if upgrading)
   - Start the backend:
     ```bash
     python app.py
     ```
3. **Frontend**
   - Open `home.html` in your browser, or deploy to a web server.

---

## 🛠️ Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Python Flask, SQLAlchemy, PostgreSQL
- **Email**: Gmail SMTP (App Password)
- **Authentication**: JWT (localStorage)
- **Styling**: Google Fonts (Poppins), Font Awesome 6

---

## 📂 Main Project Structure

- `home.html` — Landing page
- `buy.html` — Book catalog
- `sell.html` — Sell your book
- `quiz.html` — Book Matchmaker
- `cart-ui.js` — Cart logic
- `login.html` — Login/Register/Forgot Password
- `reset-password.html` — Password reset page
- `profile.html` — User profile
- `orders.html` — Order history
- `admin.html` — Admin dashboard
- `backend/` — Flask backend (API, models, routes)

---

## ❌ Removed/Deprecated Features

- No longer uses Express/Node or SQLite (now Python Flask + PostgreSQL)
- No guest checkout (login required for all purchases)
- No direct Open Library API integration (covers are static or uploaded)

---

## 🤝 Contributing

Pull requests and suggestions are welcome!

---

## 📝 License

© 2026 BookSwap Hub | Created for Practice.
