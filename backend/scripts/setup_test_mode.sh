#!/bin/bash
# Setup script for test mode
# This script helps set up .env file with test mode configuration

echo "=========================================="
echo "Test Mode Setup"
echo "=========================================="
echo ""

# Check if .env file exists
ENV_FILE=".env"
if [ ! -f "$ENV_FILE" ]; then
    echo "📝 Creating .env file..."
    touch "$ENV_FILE"
    echo "# Test Mode Configuration" >> "$ENV_FILE"
    echo "DEBUG=true" >> "$ENV_FILE"
    echo "" >> "$ENV_FILE"
    echo "✅ Created .env file"
else
    echo "✅ .env file already exists"
fi

# Check if DEBUG is set
if grep -q "^DEBUG=" "$ENV_FILE"; then
    echo "✅ DEBUG setting found in .env"
    # Update to true if not already
    sed -i.bak 's/^DEBUG=.*/DEBUG=true/' "$ENV_FILE"
else
    echo "📝 Adding DEBUG=true to .env"
    echo "DEBUG=true" >> "$ENV_FILE"
fi

# Check if TEST_USER_ID is set
if grep -q "^TEST_USER_ID=" "$ENV_FILE"; then
    echo "✅ TEST_USER_ID already set in .env"
    TEST_USER_ID=$(grep "^TEST_USER_ID=" "$ENV_FILE" | cut -d '=' -f2)
    echo "   Current value: $TEST_USER_ID"
else
    echo ""
    echo "⚠️  TEST_USER_ID not set yet"
    echo ""
    echo "To set it up, run:"
    echo "  python scripts/create_test_user.py"
    echo ""
    echo "Or manually add to .env:"
    echo "  TEST_USER_ID=your-user-id-here"
fi

echo ""
echo "=========================================="
echo "Test Mode Configuration"
echo "=========================================="
echo ""
echo "Current .env settings:"
grep -E "^(DEBUG|TEST_USER_ID)=" "$ENV_FILE" 2>/dev/null || echo "  (not found)"
echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Run: python scripts/create_test_user.py"
echo "2. Copy the TEST_USER_ID from output"
echo "3. Add it to .env: TEST_USER_ID=<id>"
echo "4. Restart your backend server"
echo ""

