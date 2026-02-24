# BookSwap Hub Backend

Minimal Express backend starter for BookSwap Hub.

## Quick start

1. Copy env file:
   - Windows PowerShell: `Copy-Item .env.example .env`
2. Install dependencies (already done once if scaffolded):
   - `npm install`
3. Start server:
   - Dev: `npm run dev`
   - Prod: `npm start`

Server runs on `http://localhost:5000` by default.

## API endpoints

- `GET /health`
- `GET /api/books`
- `GET /api/books/:id`
- `GET /api/cart`
- `POST /api/cart` with JSON body: `{ "bookId": 1, "quantity": 1 }`
- `POST /api/auth/login` with JSON body: `{ "email": "you@example.com", "password": "123456" }`

## Notes

- Data is in-memory only (no database yet).
- Cart resets when server restarts.
