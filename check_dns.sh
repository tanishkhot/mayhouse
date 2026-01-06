#!/bin/bash
# DNS Check Script - Run this to verify DNS is working

echo "🔍 Checking DNS for api.mayhouse.in..."
echo "======================================"
echo ""

# Check with nslookup
echo "📡 Using nslookup:"
nslookup api.mayhouse.in | grep -A2 "Name:"
echo ""

# Check with dig
echo "📡 Using dig:"
dig api.mayhouse.in +short
echo ""

# Expected result
echo "✅ Expected IP: 18.223.166.226"
echo ""

# Get actual result
ACTUAL_IP=$(dig api.mayhouse.in +short | tail -1)

if [ "$ACTUAL_IP" = "18.223.166.226" ]; then
    echo "🎉 SUCCESS! DNS is configured correctly!"
    echo "You can proceed with SSL setup on EC2."
else
    echo "⚠️  DNS not ready yet. Current result: $ACTUAL_IP"
    echo "Wait a few more minutes and try again."
    echo ""
    echo "Run this script again: ./check_dns.sh"
fi

