const { initDb, getDb } = require('../db');
const booksSeed = require('../books.json');
const extraBooks = require('../extra-books-51-100.json');
const extraBooks101To110 = require('../extra-books-101-110.json');

async function seedBooksToCount(targetCount = 110) {
  await initDb();
  const db = await getDb();

  const allBooks = [...booksSeed, ...extraBooks, ...extraBooks101To110];

  await db.exec('BEGIN TRANSACTION');
  try {
    const stmt = await db.prepare(`
      INSERT INTO books (
        id, title, author, category, type, price, original, image,
        publisher, year, edition, pages, language, binding, synopsis
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        author = excluded.author,
        category = excluded.category,
        type = excluded.type,
        price = excluded.price,
        original = excluded.original,
        image = excluded.image,
        publisher = excluded.publisher,
        year = excluded.year,
        edition = excluded.edition,
        pages = excluded.pages,
        language = excluded.language,
        binding = excluded.binding,
        synopsis = excluded.synopsis
    `);

    for (const book of allBooks) {
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

    const total = await db.get('SELECT COUNT(*) AS count FROM books');
    const count = Number(total?.count || 0);

    if (count < targetCount) {
      throw new Error(`Database has ${count} books. Expected at least ${targetCount}.`);
    }

    return { total: count, addedRange: '51-110' };
  } catch (error) {
    await db.exec('ROLLBACK');
    throw error;
  }
}

seedBooksToCount(110)
  .then(({ total, addedRange }) => {
    console.log(`Seeded books successfully. Added/updated IDs ${addedRange}. Total books in DB: ${total}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to seed books to 100:', error);
    process.exit(1);
  });
