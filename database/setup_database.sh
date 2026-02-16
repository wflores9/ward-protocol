#!/bin/bash
# Ward Protocol Database Setup Script

set -e

echo "🔧 Setting up Ward Protocol PostgreSQL database..."

# Database configuration
DB_NAME="ward_protocol"
DB_USER="ward"
DB_PASSWORD="ward_secure_password_change_me"

# Create database user
sudo -u postgres psql <<EOF
-- Create user if doesn't exist
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_user WHERE usename = '${DB_USER}') THEN
        CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';
    END IF;
END
\$\$;

-- Create database if doesn't exist
SELECT 'CREATE DATABASE ${DB_NAME} OWNER ${DB_USER}'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${DB_NAME}')\gexec

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
EOF

echo "✅ Database and user created"

# Run schema
echo "📊 Creating tables..."
sudo -u postgres psql -d ${DB_NAME} -f database/schema.sql

echo "✅ Tables created successfully"

# Show connection string
echo ""
echo "📝 Database connection string:"
echo "postgresql://${DB_USER}:${DB_PASSWORD}@localhost/${DB_NAME}"
echo ""
echo "💾 Add to your .env file:"
echo "DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@localhost/${DB_NAME}"
echo ""
echo "🎉 Database setup complete!"
