"""Add sell-listing columns to the books table if missing."""
from app import app
from models import db

NEW_COLUMNS = {
    'condition': 'VARCHAR(50)',
    'quantity': 'INTEGER DEFAULT 1',
    'delivery_option': 'VARCHAR(50)',
    'seller_name': 'VARCHAR(255)',
    'seller_contact': 'VARCHAR(50)',
    'seller_city': 'VARCHAR(100)',
    'payment_mode': 'VARCHAR(50)',
    'description': 'TEXT',
    'listed_by': 'INTEGER',
    'listed_at': 'TIMESTAMP DEFAULT NOW()',
}

with app.app_context():
    with db.engine.connect() as conn:
        rows = conn.execute(
            db.text("SELECT column_name FROM information_schema.columns WHERE table_name='books'")
        ).fetchall()
        existing = [r[0] for r in rows]
        print('Existing columns:', existing)

        for col, dtype in NEW_COLUMNS.items():
            if col not in existing:
                conn.execute(db.text(f'ALTER TABLE books ADD COLUMN {col} {dtype}'))
                conn.commit()
                print(f'  Added: {col}')
            else:
                print(f'  Exists: {col}')

    print('Done!')
