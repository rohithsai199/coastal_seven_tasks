import os
import shutil
import ssl
import urllib.request
from app.database import SessionLocal
from app.models import Product, OrderItem
from app.utils.redis_client import get_redis

BACKEND_STATIC = r"c:\Users\SANJAY\Downloads\ecommerce_backend_real_world_ui\ecommerce_backend_reviewed\static"
FRONTEND_PUBLIC = r"c:\Users\SANJAY\Downloads\ecommerce_backend_real_world_ui\ecommerce_frontend\public\images"

os.makedirs(BACKEND_STATIC, exist_ok=True)
os.makedirs(FRONTEND_PUBLIC, exist_ok=True)

IMAGE_DOWNLOADS = {
    "keyboard.jpg": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80",
    "earbuds.jpg": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80",
    "mouse.jpg": "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&auto=format&fit=crop&q=80",
    "camera.jpg": "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=80",
    "waterbottle.jpg": "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&auto=format&fit=crop&q=80",
    "deskmat.jpg": "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800&auto=format&fit=crop&q=80",
    "desklamp.jpg": "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=80",
    "hoodie.jpg": "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80",
    "wallet.jpg": "https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&auto=format&fit=crop&q=80",
    "powerbank.jpg": "https://images.unsplash.com/photo-1609592424368-e56598c17b5f?w=800&auto=format&fit=crop&q=80",
    "smartring.jpg": "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&auto=format&fit=crop&q=80",
    "drone.jpg": "https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=800&auto=format&fit=crop&q=80",
    "mug.jpg": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80",
    "controller.jpg": "https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?w=800&auto=format&fit=crop&q=80",
}

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

for filename, url in IMAGE_DOWNLOADS.items():
    backend_path = os.path.join(BACKEND_STATIC, filename)
    frontend_path = os.path.join(FRONTEND_PUBLIC, filename)
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, context=ctx) as resp:
            data = resp.read()
            with open(backend_path, "wb") as f:
                f.write(data)
            with open(frontend_path, "wb") as f:
                f.write(data)
            print(f"Downloaded & saved {filename} ({len(data)} bytes)")
    except Exception as e:
        print(f"Failed downloading {filename}: {e}")

PRODUCTS = [
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
    },
    {
        "name": "Keychron Q1 Pro Custom Mechanical Keyboard",
        "description": "CNC machined aluminum body, gasket mount design, hot-swappable switches, PBT keycaps, and customizable open-source QMK/VIA keymapping with Bluetooth 5.1.",
        "price": 199.99,
        "stock": 25,
        "image_url": "/static/keyboard.jpg"
    },
    {
        "name": "SoundPulse Pro ANC True Wireless Earbuds",
        "description": "Precision balanced armature drivers, adaptive noise cancellation, transparency audio mode, Qi wireless fast-charging case, and IPX5 sweat resistance.",
        "price": 129.99,
        "stock": 45,
        "image_url": "/static/earbuds.jpg"
    },
    {
        "name": "MX Master Precision Ergonomic Mouse",
        "description": "Sculpted ergonomic silhouette with MagSpeed electromagnetic scrolling wheel, 8000 DPI Darkfield sensor tracking on glass, and multi-device cross-computer flow.",
        "price": 99.99,
        "stock": 38,
        "image_url": "/static/mouse.jpg"
    },
    {
        "name": "Lumix Compact 4K Mirrorless Street Camera",
        "description": "24.2 MP full-frame sensor, 5-axis in-body dual image stabilization, 4K 60fps uncropped cinema recording, OLED electronic viewfinder, and vintage retro dial design.",
        "price": 699.99,
        "stock": 15,
        "image_url": "/static/camera.jpg"
    },
    {
        "name": "HydroShield Insulated Stainless Steel Bottle",
        "description": "Double-wall vacuum insulation keeps beverages iced for 24 hours or piping hot for 12 hours. 18/8 food-grade stainless steel with leak-proof sport lid.",
        "price": 34.99,
        "stock": 80,
        "image_url": "/static/waterbottle.jpg"
    },
    {
        "name": "Minimalist Merino Felt & Leather Desk Mat",
        "description": "Premium non-slip natural wool felt with full-grain vegetable-tanned leather organizer dock. Protects surfaces while creating a clean, organized workspace.",
        "price": 45.99,
        "stock": 55,
        "image_url": "/static/deskmat.jpg"
    },
    {
        "name": "LumiBar Smart LED Minimalist Desk Lamp",
        "description": "Asymmetric optical design illuminates workspace without screen glare. Touch dimmer, adjustable color temperature (2700K-6500K), and ambient backlight mode.",
        "price": 79.99,
        "stock": 32,
        "image_url": "/static/desklamp.jpg"
    },
    {
        "name": "UrbanTech Heavyweight Organic Cotton Hoodie",
        "description": "480 GSM ultra-heavyweight combed organic cotton fleece, pre-shrunk with double-layered thermal hood, concealed media pockets, and structured modern drape.",
        "price": 89.99,
        "stock": 40,
        "image_url": "/static/hoodie.jpg"
    },
    {
        "name": "Ridge Slim RFID-Blocking Carbon Fiber Wallet",
        "description": "Aerospace grade 3k weave carbon fiber plates with expandable elastic track holding 1-12 cards securely. Blocks RFID theft and includes integrated money clip.",
        "price": 65.00,
        "stock": 70,
        "image_url": "/static/wallet.jpg"
    },
    {
        "name": "MagCharge 20,000mAh Ultra-Fast Power Bank",
        "description": "65W USB-C Power Delivery charges laptops and smartphones simultaneously. Magnetic wireless fast charging pad with real-time digital battery status display.",
        "price": 59.99,
        "stock": 48,
        "image_url": "/static/powerbank.jpg"
    },
    {
        "name": "Oura Biometric Sleep & Fitness Smart Ring",
        "description": "Medical-grade titanium shell with optical heart rate sensor, HRV tracking, body temperature deviation sensors, 7-day battery life, and 100m water resistance.",
        "price": 299.00,
        "stock": 20,
        "image_url": "/static/smartring.jpg"
    },
    {
        "name": "AeroFly 4K Compact Foldable Drone",
        "description": "Under 249g ultra-lightweight design with 3-axis mechanical gimbal, 4K HDR camera, 34-minute flight time per battery, and omnidirectional obstacle avoidance.",
        "price": 449.99,
        "stock": 18,
        "image_url": "/static/drone.jpg"
    },
    {
        "name": "Ember Temperature Control Smart Ceramic Mug",
        "description": "Maintains your preferred coffee temperature (120°F - 145°F) for up to 80 minutes on battery or all day on the charging coaster. Smart companion app control.",
        "price": 129.95,
        "stock": 26,
        "image_url": "/static/mug.jpg"
    },
    {
        "name": "ProGrip Wireless Hall-Effect Gaming Controller",
        "description": "Zero-drift magnetic hall effect analog sticks and triggers, mechanical tactile switches, remappable back paddles, and cross-platform compatibility (PC, Switch, iOS, Android).",
        "price": 69.99,
        "stock": 50,
        "image_url": "/static/controller.jpg"
    }
]

def seed():
    db = SessionLocal()
    try:
        print("Cleaning up old order items...")
        db.query(OrderItem).delete()
        print("Cleaning up old products...")
        db.query(Product).delete()
        db.commit()

        print("Inserting 20 diverse products with studio photography...")
        for item in PRODUCTS:
            p = Product(
                name=item["name"],
                description=item["description"],
                price=item["price"],
                stock=item["stock"],
                image_url=item["image_url"]
            )
            db.add(p)
        db.commit()
        print(f"Successfully seeded {len(PRODUCTS)} products!")

        # Clear Redis cache
        try:
            r = get_redis()
            r.delete("products:all")
            print("Cleared products:all Redis cache.")
        except Exception as e:
            print("Redis clear note:", e)

    except Exception as e:
        db.rollback()
        print("Seeding error:", e)
    finally:
        db.close()

if __name__ == "__main__":
    seed()
