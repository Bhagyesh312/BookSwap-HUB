const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const booksSeed = require('./books.json');

const dataDir = path.join(__dirname, '..', 'data');
const dbFile = path.join(dataDir, 'bookswap.db');

let dbPromise;

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
  `);

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
