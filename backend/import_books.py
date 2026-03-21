"""
import_books.py — Bulk import books from Google Books API into BookSwap DB
==========================================================================
Usage:
    cd backend
    python import_books.py

Options (edit the CONFIG section below):
    TOTAL_TARGET   — how many books to import in total
    NEW_RATIO      — fraction to mark as type='new' (rest = 'old')
    GOOGLE_API_KEY — optional, increases quota from 100 to 1000 req/day
                     leave empty string to use without key (100 req/day is fine)

The script:
  1. Searches Google Books across many categories/queries
  2. Skips duplicates (same title + author already in DB)
  3. Falls back to Open Library for cover if Google has none
  4. Marks all imported books as is_approved=True (live immediately)
  5. Prints a summary at the end
"""

import os
import sys
import time
import random
import requests
from dotenv import load_dotenv

# ── Load .env so DB creds are available ──────────────────────────────────────
load_dotenv()

# ── Add backend dir to path so we can import app/models ──────────────────────
sys.path.insert(0, os.path.dirname(__file__))

from app import create_app
from models import db, Book

# ═══════════════════════════════════════════════════════════════════════════════
#  CONFIG — edit these as needed
# ═══════════════════════════════════════════════════════════════════════════════
TOTAL_TARGET   = 300        # total books to import (higher since we skip no-cover books)
NEW_RATIO      = 0.6        # 60% new, 40% old
GOOGLE_API_KEY = 'AIzaSyCwDWARz6BEmDH3EIHHlGCAFwOb_VRuLq4'
DELAY_SECONDS  = 0.25       # polite delay between API calls
# ═══════════════════════════════════════════════════════════════════════════════

# Wide variety of search queries to get diverse books
SEARCH_QUERIES = [
    # Fiction / Classics
    'subject:fiction bestseller', 'subject:classic literature', 'subject:mystery thriller',
    'subject:science fiction', 'subject:fantasy adventure', 'subject:historical fiction',
    'subject:romance novel', 'subject:horror', 'subject:crime detective',
    # Non-fiction
    'subject:self help productivity', 'subject:business entrepreneurship',
    'subject:psychology behavior', 'subject:biography memoir',
    'subject:history world', 'subject:science popular', 'subject:philosophy',
    'subject:economics finance', 'subject:health wellness',
    # Indian / Regional
    'indian authors fiction', 'chetan bhagat', 'amish tripathi', 'ruskin bond',
    'r.k. narayan', 'arundhati roy', 'vikram seth', 'devdutt pattanaik',
    # Popular series / authors
    'harry potter rowling', 'game of thrones martin', 'sherlock holmes doyle',
    'agatha christie mystery', 'stephen king horror', 'dan brown thriller',
    'paulo coelho', 'haruki murakami', 'gabriel garcia marquez',
    # Academic / Education
    'subject:mathematics textbook', 'subject:computer science programming',
    'subject:engineering', 'subject:medical', 'subject:law',
    # Young Adult
    'subject:young adult dystopia', 'hunger games', 'divergent', 'percy jackson',
    # More popular
    'atomic habits clear', 'sapiens harari', 'thinking fast slow kahneman',
    'rich dad poor dad', 'zero to one thiel', 'lean startup ries',
    'man search for meaning frankl', 'power of now tolle',
    'brief history of time hawking', 'cosmos sagan',
]

# Category mapping from Google Books subjects → our categories
CATEGORY_MAP = {
    'fiction': 'Fiction', 'novel': 'Fiction', 'literature': 'Fiction',
    'mystery': 'Fiction', 'thriller': 'Fiction', 'crime': 'Fiction',
    'horror': 'Fiction', 'detective': 'Fiction',
    'science fiction': 'Fiction', 'fantasy': 'Fiction',
    'romance': 'Romance', 'love': 'Romance',
    'self-help': 'Non-Fiction', 'self help': 'Non-Fiction',
    'business': 'Non-Fiction', 'economics': 'Non-Fiction',
    'psychology': 'Non-Fiction', 'biography': 'Non-Fiction',
    'history': 'Non-Fiction', 'science': 'Non-Fiction',
    'philosophy': 'Non-Fiction', 'health': 'Non-Fiction',
    'memoir': 'Non-Fiction', 'true crime': 'Non-Fiction',
    'young adult': 'Fiction', 'children': 'Fiction',
    'education': 'Non-Fiction', 'mathematics': 'Non-Fiction',
    'computer': 'Non-Fiction', 'engineering': 'Non-Fiction',
    'medical': 'Non-Fiction', 'law': 'Non-Fiction',
}

def map_category(google_categories):
    """Map Google Books categories list to our category string."""
    if not google_categories:
        return 'Fiction'
    combined = ' '.join(google_categories).lower()
    for key, val in CATEGORY_MAP.items():
        if key in combined:
            return val
    return 'Fiction'


def is_real_image(url, min_size=10000):
    """
    Verify a URL actually serves a real book cover, not a placeholder.
    Google's grey 'no cover' placeholder is ~8-9KB. Real covers are >10KB.
    """
    try:
        r = requests.head(url, timeout=5, allow_redirects=True)
        if r.status_code != 200:
            return False
        size = int(r.headers.get('content-length', 0))
        return size > min_size
    except Exception:
        return False


def get_cover(isbn_list, google_thumbnail, title=None, author=None):
    """
    Return best available cover URL using multiple sources.
    Verifies every URL is a real image, not a placeholder.
    """
    # 1. Google thumbnail — strip curl, bump zoom, then VERIFY it's real
    if google_thumbnail:
        import re
        url = google_thumbnail.replace('&edge=curl', '').replace('edge=curl&', '')
        url = re.sub(r'zoom=\d', 'zoom=5', url)
        if 'fife=' not in url and 'books.google.com' in url:
            url += '&fife=w400-h600'
        # Google placeholder grey images are ~8KB — real covers are larger
        if is_real_image(url, min_size=10000):
            return url

    # 2. Open Library by ISBN
    for isbn in (isbn_list or []):
        url = f"https://covers.openlibrary.org/b/isbn/{isbn}-L.jpg"
        if is_real_image(url, min_size=5000):
            return url

    # 3. Open Library by title+author search → cover ID
    if title:
        try:
            query = title
            if author and author != 'Unknown':
                query += f" {author.split(',')[0]}"
            r = requests.get(
                'https://openlibrary.org/search.json',
                params={'q': query, 'limit': 5},
                timeout=8
            )
            if r.status_code == 200:
                for doc in r.json().get('docs', []):
                    cover_i = doc.get('cover_i')
                    if cover_i:
                        url = f"https://covers.openlibrary.org/b/id/{cover_i}-L.jpg"
                        if is_real_image(url, min_size=5000):
                            return url
        except Exception:
            pass

    # 4. Google Books direct cover by ISBN
    for isbn in (isbn_list or []):
        url = (f"https://books.google.com/books/content"
               f"?vid=ISBN{isbn}&printsec=frontcover&img=1&zoom=5&source=gbs_api")
        if is_real_image(url, min_size=10000):
            return url

    return None


def fetch_google_books(query, start_index=0, max_results=40):
    """Call Google Books API and return list of volume items."""
    params = {
        'q': query,
        'startIndex': start_index,
        'maxResults': max_results,
        'printType': 'books',
        'langRestrict': 'en',
    }
    if GOOGLE_API_KEY:
        params['key'] = GOOGLE_API_KEY
    try:
        r = requests.get('https://www.googleapis.com/books/v1/volumes', params=params, timeout=10)
        r.raise_for_status()
        return r.json().get('items', [])
    except Exception as e:
        print(f"  [API error] {query}: {e}")
        return []


def parse_volume(item, book_type):
    """Extract clean book data from a Google Books volume item."""
    info = item.get('volumeInfo', {})

    title  = (info.get('title') or '').strip()
    author = ', '.join(info.get('authors') or []) or 'Unknown'

    if not title or len(title) < 2:
        return None

    # Price: Google Books doesn't give INR prices — generate realistic ones
    pages = info.get('pageCount') or 0
    base  = random.randint(299, 899)
    if pages > 500:
        base = random.randint(599, 1099)
    elif pages > 300:
        base = random.randint(399, 799)

    if book_type == 'old':
        price    = round(base * random.uniform(0.35, 0.65))   # 35–65% of MRP
        original = base
    else:
        price    = round(base * random.uniform(0.75, 0.92))   # 75–92% of MRP
        original = base

    # Cover image
    image_links = info.get('imageLinks', {})
    thumbnail   = image_links.get('thumbnail') or image_links.get('smallThumbnail')
    isbns       = [x['identifier'] for x in info.get('industryIdentifiers', [])
                   if x.get('type') in ('ISBN_13', 'ISBN_10')]
    cover = get_cover(isbns, thumbnail, title, author)

    # Synopsis
    synopsis = (info.get('description') or '').strip()
    if len(synopsis) > 1000:
        synopsis = synopsis[:997] + '...'

    return {
        'title':     title,
        'author':    author,
        'category':  map_category(info.get('categories')),
        'type':      book_type,
        'price':     price,
        'original':  original,
        'image':     cover,
        'publisher': (info.get('publisher') or '').strip()[:255] or None,
        'year':      info.get('publishedDate', '')[:4] or None,
        'pages':     pages or None,
        'language':  'English',
        'binding':   'Paperback',
        'synopsis':  synopsis or None,
        'quantity':  random.randint(1, 10),
        'condition': 'Good' if book_type == 'old' else 'New',
    }


def run_import():
    app = create_app()
    with app.app_context():
        # Load existing titles+authors to skip duplicates
        existing = set(
            (b.title.lower().strip(), b.author.lower().strip())
            for b in Book.query.with_entities(Book.title, Book.author).all()
        )
        print(f"Existing books in DB: {len(existing)}")
        print(f"Target: {TOTAL_TARGET} new books\n")

        imported   = 0
        skipped    = 0
        new_target = int(TOTAL_TARGET * NEW_RATIO)
        old_target = TOTAL_TARGET - new_target
        new_count  = 0
        old_count  = 0

        random.shuffle(SEARCH_QUERIES)

        for query in SEARCH_QUERIES:
            if imported >= TOTAL_TARGET:
                break

            print(f"Searching: '{query}'")

            for start in range(0, 80, 40):   # up to 80 results per query
                if imported >= TOTAL_TARGET:
                    break

                items = fetch_google_books(query, start_index=start)
                if not items:
                    break

                for item in items:
                    if imported >= TOTAL_TARGET:
                        break

                    # Decide type based on remaining quota
                    if new_count < new_target and old_count < old_target:
                        book_type = 'new' if random.random() < NEW_RATIO else 'old'
                    elif new_count < new_target:
                        book_type = 'new'
                    elif old_count < old_target:
                        book_type = 'old'
                    else:
                        break

                    data = parse_volume(item, book_type)
                    if not data:
                        continue

                    # Skip books with no cover image — they look bad in the UI
                    if not data['image']:
                        skipped += 1
                        continue

                    key = (data['title'].lower().strip(), data['author'].lower().strip())
                    if key in existing:
                        skipped += 1
                        continue

                    # Insert into DB
                    year_val = None
                    if data['year']:
                        try:
                            year_val = int(str(data['year'])[:4])
                        except ValueError:
                            pass

                    book = Book(
                        title=data['title'],
                        author=data['author'],
                        category=data['category'],
                        type=data['type'],
                        price=data['price'],
                        original=data['original'],
                        image=data['image'],
                        publisher=data['publisher'],
                        year=year_val,
                        pages=data['pages'],
                        language=data['language'],
                        binding=data['binding'],
                        synopsis=data['synopsis'],
                        quantity=data['quantity'],
                        condition=data['condition'],
                        is_approved=True,   # live immediately
                    )
                    db.session.add(book)
                    existing.add(key)

                    if book_type == 'new':
                        new_count += 1
                    else:
                        old_count += 1
                    imported += 1

                    if imported % 10 == 0:
                        db.session.commit()
                        print(f"  ✓ {imported} imported so far (new={new_count}, old={old_count}, skipped={skipped})")

                time.sleep(DELAY_SECONDS)

        db.session.commit()
        print(f"\n{'='*50}")
        print(f"Done! Imported {imported} books.")
        print(f"  New books : {new_count}")
        print(f"  Old books : {old_count}")
        print(f"  Skipped   : {skipped} (duplicates)")
        total = Book.query.count()
        print(f"  Total in DB now: {total}")
        print(f"{'='*50}")


if __name__ == '__main__':
    run_import()
