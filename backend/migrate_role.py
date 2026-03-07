"""
Migration script to add role column to users table
Run this from the backend folder: python migrate_role.py
"""
import sys
sys.path.insert(0, '.')

from app import create_app
from models import db, User
from sqlalchemy import text

app = create_app()

with app.app_context():
    print("Running migration: Add role column to users...")
    
    try:
        # Check if column exists
        result = db.session.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role'"))
        if result.fetchone():
            print("Role column already exists")
        else:
            db.session.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user'"))
            db.session.commit()
            print("Role column added successfully!")
    except Exception as e:
        print(f"Migration note: {e}")
    
    # Show users using ORM
    print("\nCurrent users in database:")
    users = User.query.all()
    if users:
        for user in users:
            role = getattr(user, 'role', None) or 'user'
            print(f"  ID {user.id}: {user.name} <{user.email}> - role: {role}")
        
        # Prompt to make admin
        print("\nTo make a user admin, run:")
        print("  UPDATE users SET role = 'admin' WHERE email = 'user@email.com';")
    else:
        print("  No users found. Register a user first, then run this script again.")
    
    print("\nMigration complete!")
