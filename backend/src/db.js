const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const booksSeed = require('./books.json');

// ===== DATABASE CONFIGURATION =====
const dataDir = path.join(__dirname, '..', 'data');
const dbFile = path.join(dataDir, 'bookswap.db');

// Database promise cache - ensures single database connection
let dbPromise;

/**
 * Get or initialize database connection (singleton pattern)
 * Creates data directory if it doesn't exist
 * @returns {Promise<Database>} SQLite database instance
 */
function getDb() {
  if (!dbPromise) {
    fs.mkdirSync(dataDir, { recursive: true });
    dbPromise = open({
      filename: dbFile,
      driver: sqlite3.Database
    });
  }

  return dbPromise;
}

/**
 * Initialize database with schema and seed data
 * Creates tables for books, users, and shopping carts
 * Loads initial book data from JSON seed files
 */
async function initDb() {
  const db = await getDb();

  await db.exec(`
    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      category TEXT,
      type TEXT,
      price REAL NOT NULL,
      original REAL,
      image TEXT,
      publisher TEXT,
      year INTEGER,
      edition TEXT,
      pages INTEGER,
      language TEXT,
      binding TEXT,
      synopsis TEXT
    );

    CREATE TABLE IF NOT EXISTS cart (
      book_id INTEGER PRIMARY KEY,
      quantity INTEGER NOT NULL DEFAULT 1,
      title TEXT NOT NULL,
      price REAL NOT NULL,
      original REAL,
      image TEXT
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      last_login_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS cart_items (
      user_id INTEGER NOT NULL,
      book_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      title TEXT NOT NULL,
      price REAL NOT NULL,
      original REAL,
      image TEXT,
      PRIMARY KEY (user_id, book_id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      address TEXT NOT NULL,
      city TEXT,
      state TEXT,
      zip TEXT,
      country TEXT NOT NULL DEFAULT 'India',
      total_amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending',
      payment_method TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      book_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      price REAL NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      image TEXT,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );
  `);

  const userCols = await db.all("PRAGMA table_info(users)");
  const hasLastLoginAt = userCols.some(col => col.name === 'last_login_at');
  if (!hasLastLoginAt) {
    await db.exec('ALTER TABLE users ADD COLUMN last_login_at TEXT');
  }

  const hasPhone = userCols.some(col => col.name === 'phone');
  if (!hasPhone) {
    await db.exec('ALTER TABLE users ADD COLUMN phone TEXT');
  }

  const hasAddress = userCols.some(col => col.name === 'address');
  if (!hasAddress) {
    await db.exec('ALTER TABLE users ADD COLUMN address TEXT');
  }

  const hasCity = userCols.some(col => col.name === 'city');
  if (!hasCity) {
    await db.exec('ALTER TABLE users ADD COLUMN city TEXT');
  }

  const hasState = userCols.some(col => col.name === 'state');
  if (!hasState) {
    await db.exec('ALTER TABLE users ADD COLUMN state TEXT');
  }

  const hasZip = userCols.some(col => col.name === 'zip');
  if (!hasZip) {
    await db.exec('ALTER TABLE users ADD COLUMN zip TEXT');
  }

  const hasCountry = userCols.some(col => col.name === 'country');
  if (!hasCountry) {
    await db.exec('ALTER TABLE users ADD COLUMN country TEXT DEFAULT "India"');
  }

  const row = await db.get('SELECT COUNT(*) AS count FROM books');
  if ((row?.count || 0) > 0) {
    return;
  }

  await db.exec('BEGIN TRANSACTION');
  try {
    const stmt = await db.prepare(`
      INSERT INTO books (
        id, title, author, category, type, price, original, image,
        publisher, year, edition, pages, language, binding, synopsis
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const book of booksSeed) {
      await stmt.run(
        Number(book.id),
        book.title || 'Untitled',
        book.author || 'Unknown',
        book.category || 'Other',
        book.type || 'new',
        Number(book.price || 0),
        Number(book.original ?? book.price ?? 0),
        book.image || '',
        book.publisher || null,
        book.year ? Number(book.year) : null,
        book.edition || null,
        book.pages ? Number(book.pages) : null,
        book.language || null,
        book.binding || null,
        book.synopsis || null
      );
    }

    await stmt.finalize();
    await db.exec('COMMIT');
  } catch (error) {
    await db.exec('ROLLBACK');
    throw error;
  }
}

module.exports = {
  getDb,
  initDb,
  dbFile
};
