"""
fix_covers.py — Fix broken/placeholder cover images for existing books in DB
=============================================================================
Usage:
    cd backend
    python fix_covers.py

This script:
  1. Finds all books whose cover URL returns a placeholder or is missing
  2. Tries Open Library (by title search) to find a real cover
  3. Updates the DB — or sets image=NULL if no real cover found
  4. Books with NULL image get the styled placeholder in the UI (not broken)
"""

import os
import sys
import time
import requests
from dotenv import load_dotenv

load_dotenv()
sys.path.insert(0, os.path.dirname(__file__))

from app import create_app
from models import db, Book

DELAY = 0.3   # seconds between requests


def is_real_image(url, min_size=10000):
    """Returns True only if URL serves a real image > min_size bytes."""
    if not url:
        return False
    try:
        r = requests.head(url, timeout=6, allow_redirects=True)
        if r.status_code != 200:
            return False
        return int(r.headers.get('content-length', 0)) > min_size
    except Exception:
        return False


def find_cover_openlibrary(title, author):
    """Search Open Library for a real cover by title+author."""
    try:
        query = title
        if author and author.lower() != 'unknown':
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
    return None


def run():
    app = create_app()
    with app.app_context():
        books = Book.query.all()
        total = len(books)
        print(f"Checking {total} books for broken covers...\n")

        fixed   = 0
        nulled  = 0
        ok      = 0

        for i, book in enumerate(books, 1):
            # Check if current image is real
            if book.image and is_real_image(book.image, min_size=10000):
                ok += 1
                if i % 20 == 0:
                    print(f"  [{i}/{total}] {ok} ok, {fixed} fixed, {nulled} cleared...")
                continue

            # Try to find a real cover
            print(f"  [{i}/{total}] Fixing: {book.title[:50]}")
            new_cover = find_cover_openlibrary(book.title, book.author or '')

            if new_cover:
                book.image = new_cover
                fixed += 1
                print(f"    ✓ Found cover via Open Library")
            else:
                book.image = None   # UI will show styled placeholder
                nulled += 1
                print(f"    ✗ No cover found — cleared")

            # Commit every 10 changes
            if (fixed + nulled) % 10 == 0:
                db.session.commit()

            time.sleep(DELAY)

        db.session.commit()

        print(f"\n{'='*50}")
        print(f"Done!")
        print(f"  Already OK  : {ok}")
        print(f"  Fixed       : {fixed}")
        print(f"  Cleared     : {nulled} (will show styled placeholder in UI)")
        print(f"{'='*50}")


if __name__ == '__main__':
    run()
