#!/usr/bin/env python3
"""
Simple script to get Supabase JWT token for testing
Usage: python3 get_token.py <email> <password>
"""

import sys
import json
import urllib.request
import urllib.error

def get_token(email, password):
    """Get JWT token from Supabase"""

    # Your Supabase project URL
    supabase_url = "https://bkibkpjtdokwvksdivbw.supabase.co"

    # The anon key (public key, safe to include)
    # You can find this in your Supabase Dashboard > Settings > API
    # For now, we'll try to authenticate with the URL from your .env

    url = f"{supabase_url}/auth/v1/token?grant_type=password"

    data = json.dumps({
        "email": email,
        "password": password
    }).encode('utf-8')

    headers = {
        'Content-Type': 'application/json',
        'apikey': 'YOUR_ANON_KEY_HERE'  # This needs to be replaced
    }

    try:
        req = urllib.request.Request(url, data=data, headers=headers)
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))

            if 'access_token' in result:
                print("✅ Successfully authenticated!\n")
                print("Your JWT Token:")
                print("━" * 80)
                print(result['access_token'])
                print("━" * 80)
                print()
                print(f"User ID: {result.get('user', {}).get('id', 'N/A')}")
                print(f"Email: {result.get('user', {}).get('email', 'N/A')}")
                print()
                print("Export as environment variable:")
                print(f"export JWT_TOKEN='{result['access_token']}'")
                print()
                print("Test with:")
                print("curl http://localhost:8080/v1/profile -H \"Authorization: Bearer $JWT_TOKEN\"")
                return result['access_token']
            else:
                print("❌ No access token in response")
                print(json.dumps(result, indent=2))
                return None

    except urllib.error.HTTPError as e:
        print(f"❌ Authentication failed! (HTTP {e.code})")
        print()
        error_body = e.read().decode('utf-8')
        try:
            error_json = json.loads(error_body)
            print("Error:", error_json.get('error_description', error_json.get('msg', error_body)))
        except:
            print("Error:", error_body)
        print()
        print("Common issues:")
        print("  - Wrong email or password")
        print("  - User email not confirmed")
        print("  - Need to get anon key from Supabase dashboard")
        return None
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python3 get_token.py <email> <password>")
        print("Example: python3 get_token.py test@example.com mypassword")
        sys.exit(1)

    email = sys.argv[1]
    password = sys.argv[2]

    print("🔐 Attempting to sign in to Supabase...")
    print()

    get_token(email, password)
