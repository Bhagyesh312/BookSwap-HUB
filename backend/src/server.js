require('dotenv').config();
const app = require('./app');
const { initDb, dbFile } = require('./db');

const PORT = process.env.PORT || 5000;

async function start() {
  await initDb();

  app.listen(PORT, () => {
    console.log(`BookSwap backend running on http://localhost:${PORT}`);
    console.log(`SQLite database: ${dbFile}`);
  });
}

start().catch((error) => {
  console.error('Failed to start backend:', error);
  process.exit(1);
});
