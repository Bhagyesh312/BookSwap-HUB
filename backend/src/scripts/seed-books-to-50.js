const { initDb, getDb } = require('../db');
const extraBooks = require('../extra-books.json');

async function seedBooksToCount(targetCount = 50) {
  await initDb();
  const db = await getDb();

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

    for (const book of extraBooks) {
      await stmt.run(
        book.id,
        book.title,
        book.author,
        book.category,
        book.type,
        book.price,
        book.original,
        book.image,
        book.publisher,
        book.year,
        book.edition,
        book.pages,
        book.language,
        book.binding,
        book.synopsis
      );
    }

    await stmt.finalize();
    await db.exec('COMMIT');

    const current = await db.get('SELECT COUNT(*) AS count FROM books');
    const existingCount = Number(current?.count || 0);

    if (existingCount < targetCount) {
      throw new Error(`Database has ${existingCount} books. Expected at least ${targetCount}.`);
    }

    const latest = await db.get('SELECT COUNT(*) AS count FROM books');
    return { inserted: extraBooks.length, total: Number(latest?.count || 0) };
  } catch (error) {
    await db.exec('ROLLBACK');
    throw error;
  }
}

seedBooksToCount(50)
  .then(({ inserted, total }) => {
    console.log(`Upserted ${inserted} real books. Total books in DB: ${total}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to seed books:', error);
    process.exit(1);
  });
