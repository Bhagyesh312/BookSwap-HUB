#!/bin/bash
set -e

echo "============================================================"
echo "    Initializing BookSwap Hub Database Schema & Seeds       "
echo "============================================================"

# Wait for the DB to be ready
until psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c '\q'; do
  >&2 echo "Postgres is unavailable - sleeping"
  sleep 1
done

>&2 echo "Postgres is up - executing scripts"

# Define the sequence of files to execute based on README & schema structure
SCRIPTS=(
    "complete_setup.sql"
    "add_role_column.sql"
    "add_is_approved.sql"
    "add_password_reset.sql"
    "add_wishlist_table.sql"
    "add_activity_logs.sql"
    
    # Extra files that exist in the directory ensuring migrations are fully caught up
    "fix_users_columns.sql" 
    "add_reviews_table.sql"
    "add_suspend_columns.sql"
    "approve_seeded_books.sql"
)

for script in "${SCRIPTS[@]}"; do
    if [ -f "/docker-seed-data/$script" ]; then
        echo "Running -> $script"
        # We use ON_ERROR_STOP=0 and wrap with true to prevent one failed migration step from halting everything if the schema was already partly executed
        psql -v ON_ERROR_STOP=0 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "/docker-seed-data/$script" || true
    else
        echo "[WARNING] Migration script not found: $script"
    fi
done

echo "============================================================"
echo "    Database Initialization Completed Successfully!         "
echo "============================================================"
