import os
import random
from datetime import datetime, timedelta
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def seed_data():
    print("Seeding hospital telemetry...")
    
    # 1. Get Departments
    res = supabase.table("departments").select("id").execute()
    if not res.data:
        print("No departments found. Please run schema.sql first.")
        return
    
    dept_id = res.data[0]["id"] # Emergency Care or first one
    
    # 2. Generate 7 days of history
    now = datetime.now()
    history = []
    base_beds = 140
    
    for i in range(24 * 7): # Hourly for 7 days
        time = now - timedelta(hours=i)
        # Add some randomness and a slight upward trend
        noise = random.randint(-5, 5)
        trend = (24 * 7 - i) / 10
        occupied = int(base_beds + trend + noise)
        
        history.append({
            "department_id": dept_id,
            "total_beds": 200,
            "occupied_beds": max(0, min(200, occupied)),
            "recorded_at": time.isoformat()
        })
    
    # Batch insert
    print(f"Inserting {len(history)} telemetry points...")
    # Supabase batch size limit is usually high, but we'll do chunks of 50
    for i in range(0, len(history), 50):
        supabase.table("bed_status").insert(history[i:i+50]).execute()
    
    print("Data uplink complete.")

if __name__ == "__main__":
    seed_data()
