import os
import shutil
import glob
from app.database import SessionLocal
from app.models import Product, OrderItem

BRAIN_DIR = r"C:\Users\SANJAY\.gemini\antigravity-ide\brain\1a10b263-5699-4336-9e03-d88a2230f464"
BACKEND_STATIC = r"c:\Users\SANJAY\Downloads\ecommerce_backend_real_world_ui\ecommerce_backend_reviewed\static"
FRONTEND_PUBLIC = r"c:\Users\SANJAY\Downloads\ecommerce_backend_real_world_ui\ecommerce_frontend\public\images"

os.makedirs(BACKEND_STATIC, exist_ok=True)
os.makedirs(FRONTEND_PUBLIC, exist_ok=True)

image_mappings = {
    "headphones.jpg": "headphones_product*.jpg",
    "smartwatch.jpg": "smartwatch_product*.jpg",
    "sneakers.jpg": "sneakers_product*.jpg",
    "backpack.jpg": "backpack_product*.jpg",
    "speaker.jpg": "speaker_product*.jpg",
    "sunglasses.jpg": "sunglasses_product*.jpg",
}

for dest_name, pattern in image_mappings.items():
    matches = glob.glob(os.path.join(BRAIN_DIR, pattern))
    if matches:
        src = matches[-1]
        shutil.copy2(src, os.path.join(BACKEND_STATIC, dest_name))
        shutil.copy2(src, os.path.join(FRONTEND_PUBLIC, dest_name))
        print(f"Copied {src} -> {dest_name}")
    else:
        print(f"Warning: pattern {pattern} not found in {BRAIN_DIR}")

NEW_PRODUCTS = [
    {
        "name": "Apex Pro ANC Wireless Headphones",
        "description": "Engineered with custom 40mm beryllium drivers, hybrid active noise cancellation, ambient awareness mode, and up to 45 hours of ultra-crisp audio playback on a single charge.",
        "price": 249.99,
        "stock": 35,
        "image_url": "/static/headphones.jpg"
    },
    {
        "name": "Chronos Horizon Titanium Smartwatch",
        "description": "Ultra-bright 1.43\" AMOLED display, aerospace-grade titanium bezel, comprehensive health & biometric tracking, dual-band GPS, 5ATM water resistance, and 14-day battery life.",
        "price": 329.99,
        "stock": 28,
        "image_url": "/static/smartwatch.jpg"
    },
    {
        "name": "Strata Velocity Performance Sneakers",
        "description": "Engineered with breathable knit mesh, energy-return responsive foam soles, and dynamic arch support tailored for both urban commutes and high-intensity running.",
        "price": 149.99,
        "stock": 50,
        "image_url": "/static/sneakers.jpg"
    },
    {
        "name": "AeroShield Urban Commuter Backpack",
        "description": "Constructed from 100% recycled ballistic weather-resistant nylon with padded 16\" laptop protection compartment, ergonomic ventilated back panel, and magnetic quick-access buckles.",
        "price": 119.99,
        "stock": 42,
        "image_url": "/static/backpack.jpg"
    },
    {
        "name": "PulseWave 360° Studio Bluetooth Speaker",
        "description": "Room-filling 360-degree acoustic fidelity with dual passive radiators, vibrant ambient LED aura ring, IPX7 waterproof rating, and 24 hours of non-stop playtime.",
        "price": 179.99,
        "stock": 30,
        "image_url": "/static/speaker.jpg"
    },
    {
        "name": "Veloce Polarized Designer Sunglasses",
        "description": "Handcrafted matte acetate frames featuring Category 3 polarized UV400 gradient lenses, anti-reflective interior coating, and durable reinforced German 5-barrel hinges.",
        "price": 139.99,
        "stock": 60,
        "image_url": "/static/sunglasses.jpg"
    }
]

def seed_db():
    db = SessionLocal()
    try:
        print("Cleaning up old order items associated with existing products...")
        # Clean up order items if any reference old products, or set up safely
        # Note: if products are deleted, cascading might be needed
        db.query(OrderItem).delete()
        db.query(Product).delete()
        db.commit()
        print("Deleted old products successfully.")

        print("Seeding new premium products...")
        for item in NEW_PRODUCTS:
            prod = Product(
                name=item["name"],
                description=item["description"],
                price=item["price"],
                stock=item["stock"],
                image_url=item["image_url"]
            )
            db.add(prod)
        db.commit()
        print(f"Successfully added {len(NEW_PRODUCTS)} new products!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
