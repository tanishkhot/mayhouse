#!/usr/bin/env python3
"""
Script to run the Buenos Aires seed data SQL file
"""
import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

# Get Supabase credentials from env
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env")
    exit(1)

# Create Supabase client
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Read SQL file
with open("database/seed_buenos_aires_experiences.sql", "r") as f:
    sql = f.read()

print("🚀 Executing Buenos Aires seed script...")
print("📍 Creating 10 experiences with 35 event runs...")

try:
    # Execute SQL via Supabase
    result = supabase.rpc("exec_sql", {"sql_query": sql}).execute()
    print("✅ Success! Buenos Aires experiences loaded!")
    print("")
    print("📊 Summary:")
    print("   - 10 Experiences created")
    print("   - 35 Event runs scheduled (Nov 5-20, 2025)")
    print("   - 1 Host user: María González (BuenosAiresGuide247)")
    print("")
    print("🎉 Refresh your frontend to see Buenos Aires experiences!")

except Exception as e:
    print(f"❌ Error: {e}")
    print("")
    print("💡 Alternative: Run this SQL manually in Supabase SQL Editor:")
    print("   1. Go to your Supabase dashboard")
    print("   2. Open SQL Editor")
    print("   3. Paste contents of database/seed_buenos_aires_experiences.sql")
    print("   4. Click Run")

