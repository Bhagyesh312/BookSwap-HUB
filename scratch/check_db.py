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
# Construct DB URI manually to ensure it uses the credentials from .env
db_url = os.getenv('DATABASE_URL')
if not db_url:
    db_url = f"postgresql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"

app.config['SQLALCHEMY_DATABASE_URI'] = db_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

with app.app_context():
    try:
        total_books = Book.query.count()
        approved_books = Book.query.filter_by(is_approved=True).count()
        pending_books = Book.query.filter_by(is_approved=False).count()
        none_approved = Book.query.filter(Book.is_approved == None).count()
        
        print(f"Total books: {total_books}")
        print(f"Approved books (True): {approved_books}")
        print(f"Pending books (False): {pending_books}")
        print(f"Books with is_approved=None: {none_approved}")
        
        if total_books > 0:
            print("\nFirst 10 books samples:")
            books = Book.query.limit(10).all()
            for b in books:
                print(f"ID: {b.id}, Title: {b.title}, Approved: {b.is_approved}, Type: {b.type}")
    except Exception as e:
        print(f"Error querying database: {e}")
