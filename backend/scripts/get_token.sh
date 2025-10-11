#!/bin/bash

# Script to get Supabase JWT token for testing
# Usage: ./scripts/get_token.sh <email> <password>

if [ $# -ne 2 ]; then
    echo "Usage: $0 <email> <password>"
    echo "Example: $0 test@example.com mypassword"
    exit 1
fi

EMAIL="$1"
PASSWORD="$2"
SUPABASE_URL="https://bkibkpjtdokwvksdivbw.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJraWJrcGp0ZG9rd3Zrc2RpdmJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjgzMTYwMjUsImV4cCI6MjA0Mzg5MjAyNX0.QTrN4NKT1sB4NLz_Q6v0Q_FmGX8Fq4VY1HxXz3QJ-aA"

echo "🔐 Attempting to sign in to Supabase..."
echo ""

RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/auth/v1/token?grant_type=password" \
  -H "apikey: ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${EMAIL}\",
    \"password\": \"${PASSWORD}\"
  }")

# Check if the response contains an access_token
if echo "$RESPONSE" | grep -q "access_token"; then
    echo "✅ Successfully authenticated!"
    echo ""
    echo "Your JWT Token:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "$RESPONSE" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "User ID:"
    echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4
    echo ""
    echo "Export as environment variable:"
    echo "export JWT_TOKEN=\"\$(echo '$RESPONSE' | grep -o '\"access_token\":\"[^\"]*\"' | cut -d'\"' -f4)\""
    echo ""
    echo "Test with:"
    echo "curl http://localhost:8080/v1/profile -H \"Authorization: Bearer \$JWT_TOKEN\""
else
    echo "❌ Authentication failed!"
    echo ""
    echo "Response:"
    echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
    echo ""
    echo "Common issues:"
    echo "  - Wrong email or password"
    echo "  - User email not confirmed"
    echo "  - Incorrect Supabase URL or anon key"
    exit 1
fi
