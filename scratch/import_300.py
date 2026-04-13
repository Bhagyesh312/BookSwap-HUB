import os
import sys
import time
import random
import requests
from dotenv import load_dotenv

sys.path.append(os.getcwd())
sys.path.append(os.path.join(os.getcwd(), 'backend'))
load_dotenv(os.path.join(os.getcwd(), 'backend', '.env'))

from app import create_app
from models import db, Book

TOTAL_TARGET   = 300
GOOGLE_API_KEY = os.getenv('GOOGLE_BOOKS_API_KEY', '')
DELAY_SECONDS  = 0.01

SEARCH_QUERIES = [
    'bestsellers', 'novels', 'biographies', 'business books', 'science books',
    'philosophy books', 'poetry books', 'art books', 'history books',
    'computer science', 'programming', 'software engineering',
    'modern fiction', 'contemporary literature', 'thrillers',
    'manga', 'graphic novels', 'comics', 'cookbooks', 'photography',
    'the', 'and', 'world', 'life', 'story'
]

def map_category(google_categories):
    if not google_categories: return 'education'
    c = ' '.join(google_categories).lower()
    if 'fiction' in c: return 'fiction'
    if 'romance' in c: return 'romance'
    if 'business' in c: return 'business'
    if 'self-help' in c: return 'self-help'
    if 'mystery' in c or 'thriller' in c: return 'thriller'
    if 'fantasy' in c: return 'fantasy'
    return 'education'

def is_real_image(url, min_size=3000): # Lowered to 3KB to ensure we hit 300
    try:
        r = requests.head(url, timeout=3, allow_redirects=True)
        if r.status_code != 200: return False
        size = int(r.headers.get('content-length', 0))
        return size > min_size
    except: return False

def get_cover(info):
    img_links = info.get('imageLinks', {})
    url = img_links.get('thumbnail') or img_links.get('smallThumbnail')
    if url:
        url = url.replace('http://', 'https://')
        if is_real_image(url): return url
    return None

def fetch_google_books(query, start_index=0):
    params = {'q': query, 'startIndex': start_index, 'maxResults': 40, 'printType': 'books', 'langRestrict': 'en'}
    if GOOGLE_API_KEY: params['key'] = GOOGLE_API_KEY
    try:
        r = requests.get('https://www.googleapis.com/books/v1/volumes', params=params, timeout=10)
        return r.json().get('items', [])
    except: return []

def parse_volume(item, book_type):
    info = item.get('volumeInfo', {})
    title = (info.get('title') or '').strip()
    author = ', '.join(info.get('authors') or []) or 'Unknown'
    if not title or len(title) < 2: return None
    
    cover = get_cover(info)
    if not cover: return None

    pages = info.get('pageCount') or 0
    base = random.randint(399, 1200)
    if book_type == 'new':
        price = int(base * random.uniform(0.85, 0.95))
        original = base
    else:
        price = int(base * random.uniform(0.20, 0.55))
        original = base
        
    synopsis = (info.get('description') or '').strip()
    if len(synopsis) > 1000: synopsis = synopsis[:997] + '...'

    return {
        'title': title, 'author': author, 'category': map_category(info.get('categories')),
        'type': book_type, 'price': price, 'original': original, 'image': cover,
        'publisher': (info.get('publisher') or '')[:255], 
        'year': info.get('publishedDate', '')[:4],
        'pages': pages, 'synopsis': synopsis, 'quantity': random.randint(5, 50),
        'condition': 'New' if book_type == 'new' else 'Used'
    }

def run_import():
    app = create_app()
    with app.app_context():
        count = Book.query.count()
        if count >= TOTAL_TARGET: return

        needed = TOTAL_TARGET - count
        print(f"Need {needed} more books.")
        
        imported = 0
        existing_titles = set(b.title.lower() for b in Book.query.all())
        
        random.shuffle(SEARCH_QUERIES)
        for q in SEARCH_QUERIES:
            if imported >= needed: break
            print(f"Searching: {q}")
            
            for start in range(0, 240, 40):
                if imported >= needed: break
                items = fetch_google_books(q, start)
                if not items: break
                
                for item in items:
                    if imported >= needed: break
                    bt = 'new' if random.random() < 0.5 else 'old'
                    data = parse_volume(item, bt)
                    if not data: continue
                    if data['title'].lower() in existing_titles: continue

                    book = Book(
                        title=data['title'], author=data['author'], category=data['category'],
                        type=data['type'], price=data['price'], original=data['original'],
                        image=data['image'], publisher=data['publisher'], 
                        year=int(data['year']) if data['year'] and data['year'].isdigit() else None,
                        pages=data['pages'], language='English', binding='Paperback',
                        synopsis=data['synopsis'], quantity=data['quantity'],
                        condition=data['condition'], is_approved=True
                    )
                    db.session.add(book)
                    existing_titles.add(data['title'].lower())
                    imported += 1
                db.session.commit()
                time.sleep(DELAY_SECONDS)
        
        db.session.commit()
        print(f"Final Total: {Book.query.count()}")

if __name__ == '__main__':
    run_import()
