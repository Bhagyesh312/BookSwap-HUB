import os
import sys
from dotenv import load_dotenv

# Add current directory and backend to path
sys.path.append(os.getcwd())
sys.path.append(os.path.join(os.getcwd(), 'backend'))

load_dotenv('backend/.env')

from models import db, Book
from flask import Flask

app = Flask(__name__)
db_url = os.getenv('DATABASE_URL')
if not db_url:
    db_url = f"postgresql://{os.getenv('DB_USER', 'postgres')}:{os.getenv('DB_PASSWORD', '')}@{os.getenv('DB_HOST', 'localhost')}:{os.getenv('DB_PORT', '5432')}/{os.getenv('DB_NAME', 'bookswap')}"

app.config['SQLALCHEMY_DATABASE_URI'] = db_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

with app.app_context():
    try:
        updated = Book.query.filter_by(is_approved=False).update({'is_approved': True})
        db.session.commit()
        print(f"Successfully approved {updated} books.")
    except Exception as e:
        print(f"Error approving books: {e}")
        db.session.rollback()
