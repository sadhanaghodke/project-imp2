#!/bin/bash

echo "🚀 Setting up MyCleanCity Application..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ and try again."
    exit 1
fi

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL and try again."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install
cd ..

echo "✅ All dependencies installed"

# Create upload directories
echo "📁 Creating upload directories..."
mkdir -p backend/uploads/complaints
mkdir -p backend/uploads/before-after
mkdir -p backend/uploads/temp

echo "✅ Upload directories created"

# Database setup instructions
echo ""
echo "🗄️  DATABASE SETUP REQUIRED:"
echo "1. Create PostgreSQL database:"
echo "   createdb mycleancity"
echo ""
echo "2. Enable PostGIS extension:"
echo "   psql mycleancity -c \"CREATE EXTENSION postgis;\""
echo ""
echo "3. Update database credentials in backend/.env file"
echo ""
echo "4. Run database migration:"
echo "   cd backend && npx prisma migrate dev"
echo ""
echo "5. Generate Prisma client:"
echo "   cd backend && npx prisma generate"
echo ""
echo "6. Seed database with sample data:"
echo "   cd backend && npm run seed"
echo ""
echo "🎉 Setup complete! Follow the database setup steps above, then run:"
echo "   npm run dev"
echo ""
echo "📱 Application will be available at:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:5000"
echo ""
echo "🔑 Default admin account:"
echo "   Email: admin@mycleancity.com"
echo "   Password: admin123"