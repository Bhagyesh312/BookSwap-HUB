"""Quick script to make a user admin"""
import sys
sys.path.insert(0, '.')
from app import create_app
from models import db, User

app = create_app()
with app.app_context():
    user = User.query.filter_by(email='bhagyeshshah037@gmail.com').first()
    if user:
        user.role = 'admin'
        db.session.commit()
        print(f'SUCCESS: {user.name} ({user.email}) is now an admin!')
    else:
        print('User not found')
