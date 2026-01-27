#!/bin/bash
# Setup script for 5Cine Backend

echo "🎬 5Cine Backend Setup"
echo "===================="

# Check if .env exists
if [ ! -f .env ]; then
    echo "📋 Creating .env file from .env.example..."
    cp .env.example .env
    echo "✅ .env created. Please update it with your credentials."
else
    echo "✅ .env file already exists."
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed."
else
    echo "✅ Dependencies already installed."
fi

echo ""
echo "🚀 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env with your MongoDB URI and other credentials"
echo "2. Run: npm run dev  (development mode with auto reload)"
echo "3. Or run: npm start (production mode)"
echo ""
echo "📚 For deployment guide, see DEPLOYMENT.md"
