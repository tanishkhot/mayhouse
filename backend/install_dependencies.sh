#!/bin/bash

# Install backend dependencies for Mayhouse ETH
# Run this script from the backend directory

echo "🚀 Installing Mayhouse ETH Backend Dependencies..."

# Check if pip is installed
if ! command -v pip &> /dev/null; then
    echo "❌ pip is not installed. Please install Python and pip first."
    exit 1
fi

# Install dependencies
echo "📦 Installing Python packages..."
pip install -r requirements.txt

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Copy .env.example to .env:  cp .env.example .env"
    echo "2. Edit .env with your Supabase credentials"
    echo "3. Run the server:  python main.py"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

