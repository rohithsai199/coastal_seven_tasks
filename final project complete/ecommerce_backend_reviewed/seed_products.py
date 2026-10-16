import os
import shutil
from app.database import SessionLocal
from app.models import Product, OrderItem
from app.utils.redis_client import get_redis

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")
FRONTEND_IMAGES = os.path.join(BASE_DIR, "..", "ecommerce_frontend", "public", "images")

os.makedirs(STATIC_DIR, exist_ok=True)

# Copy all images from frontend public/images to backend static folder
if os.path.exists(FRONTEND_IMAGES):
    for f in os.listdir(FRONTEND_IMAGES):
        src_path = os.path.join(FRONTEND_IMAGES, f)
        if os.path.isfile(src_path):
            shutil.copy2(src_path, os.path.join(STATIC_DIR, f))
    print("Synchronized all UI images to backend static folder.")

NEW_PRODUCTS = [
    # ==========================================
    # 1. BOYS COLLECTION
    # ==========================================
    {
        "name": "Noir Minimalist Utility Overshirt & Trousers",
        "description": "Clean architectural utility with matte black hardware and articulated sleeves. Crafted from Japanese Cotton-Nylon Twill with an architectural boxy fit and tapered leg.",
        "price": 165.00,
        "stock": 45,
        "image_url": "/static/boys_arch1.jpg",
    },
    {
        "name": "Earthy Olive Waffle Knit Vest & Oxford",
        "description": "Tactile moss-stitch waffle knit layered over crisp poplin tailored shirting. Crafted from Chunky Merino Wool & Organic Cotton in a relaxed sleeveless crewneck layer.",
        "price": 120.00,
        "stock": 38,
        "image_url": "/static/boys_arch2.jpg",
    },
    {
        "name": "Tailored Terracotta Clay Blazer & Turtleneck",
        "description": "Natural roll notched lapels draped in warm terracotta earth pigment dye. Italian Wool-Silk Blend with Cupro Lining in a deconstructed single-breasted modern blazer.",
        "price": 220.00,
        "stock": 25,
        "image_url": "/static/boys_arch3.jpg",
    },
    {
        "name": "Oatmeal Chunky Waffle Knit Pullover",
        "description": "Ultra-soft waffle knit with thermal warmth retention and raw edge hems. Heavyweight 480 GSM Organic Ribbed Cotton with drop-shoulder relaxed casual silhouette.",
        "price": 135.00,
        "stock": 50,
        "image_url": "/static/boys_arch4.jpg",
    },
    {
        "name": "Milanese Charcoal Double-Faced Overcoat",
        "description": "Elongated architectural drape with hand-stitched lapels and mockneck inner. Double-Faced Virgin Wool Blend in a structured knee-length tailored overcoat.",
        "price": 245.00,
        "stock": 20,
        "image_url": "/static/boys_arch5.jpg",
    },

    # ==========================================
    # 2. GIRLS COLLECTION
    # ==========================================
    {
        "name": "Noir Enchanté High-Neck Gown",
        "description": "Regal mock neckline with architectural side drape. Structured French Wool Crepe column gown with high slit and elegant runway silhouette.",
        "price": 180.00,
        "stock": 30,
        "image_url": "/static/girls_model1.jpg",
    },
    {
        "name": "Midnight Silk Voluminous Gown",
        "description": "Dramatic flowing sweep with cross-pleated bodice. Duchess Satin Silk in a flared halter silhouette for evening galas and formal events.",
        "price": 165.00,
        "stock": 28,
        "image_url": "/static/girls_model2.jpg",
    },
    {
        "name": "Siren Slit Velvet Runway Gown",
        "description": "Signature off-shoulder corset with cascading train. Crushed Silk Velvet with off-shoulder high slit design and handcrafted interior boning.",
        "price": 220.00,
        "stock": 22,
        "image_url": "/static/girls_model3.jpg",
    },
    {
        "name": "Architectural Strapless Mini Dress",
        "description": "Asymmetric neckline fold with tailored interior corset. Bonded Italian Satin in a sculptural origami mini silhouette.",
        "price": 140.00,
        "stock": 35,
        "image_url": "/static/girls_model4.jpg",
    },
    {
        "name": "Monochrome Geometric Cutout Gown",
        "description": "Precision waist cutout with elongated fluted hem. Heavy Stretch Crepe in a long-sleeve fishtail gown crafted for contemporary black-tie occasions.",
        "price": 195.00,
        "stock": 24,
        "image_url": "/static/girls_model5.jpg",
    },

    # ==========================================
    # 3. KIDS COLLECTION
    # ==========================================
    {
        "name": "Royal Highland Merino Cable-Knit Pullover & Chinos",
        "description": "Heirloom cable-stitch detailing knit from hypoallergenic non-itch merino fibers for tender skin. 100% Extrafine Australian Merino Wool & Pima Twill with reinforced elbow patches.",
        "price": 145.00,
        "stock": 40,
        "image_url": "/static/kids_arch1.jpg",
    },
    {
        "name": "Heritage Hunter Green Quilted Barn Jacket & Corduroys",
        "description": "Timeless country-estate barn jacket lined with brushed organic tartan cotton for thermal comfort. Water-Repellent Micro-Diamond Quilt with Corduroy Collar and antique brass snaps.",
        "price": 185.00,
        "stock": 32,
        "image_url": "/static/kids_arch2.jpg",
    },
    {
        "name": "Petit Prince Double-Breasted Velvet Tailored Blazer",
        "description": "Lustrous hunter green silk velvet adorned with handcrafted crested heraldic gold buttons. Italian Silk-Velvet with satin peaked lapels and pure silk lining.",
        "price": 230.00,
        "stock": 18,
        "image_url": "/static/kids_arch3.jpg",
    },
    {
        "name": "Organic Oatmeal Cashmere-Blend Cardigan & Linen Set",
        "description": "Whisper-soft breathable knit offering temperature-regulating luxury for play and formal celebrations. 70% Organic Pima Cotton, 30% Grade-A Mongolian Cashmere with mother-of-pearl buttons.",
        "price": 160.00,
        "stock": 36,
        "image_url": "/static/kids_arch4.jpg",
    },
    {
        "name": "Mayfair Classic Wool Duffle Coat with Horn Toggles",
        "description": "Authentic British heritage wool outerwear equipped with genuine polished buffalo horn toggles. Double-faced melton wool with windproof storm shield.",
        "price": 210.00,
        "stock": 25,
        "image_url": "/static/kids_arch5.jpg",
    },

    # ==========================================
    # 4. ACCESSORIES COLLECTION
    # ==========================================
    {
        "name": "AeroTitanium Polarized Navigator Sunglasses",
        "description": "Ultra-lightweight 18g titanium construction with custom flex hinges and distortion-free glaucous lenses. Grade-5 Aerospace Titanium & Nylon Polyamide Optics with matte DLC finish.",
        "price": 285.00,
        "stock": 50,
        "image_url": "/static/acc_arch1.jpg",
    },
    {
        "name": "Saffiano Leather Grand Weekender Duffel",
        "description": "Cross-hatch scratch-resistant saffiano calfskin in slate-blue with reinforced base and detachable shoulder strap. Full-Grain Italian Saffiano Calfskin with solid palladium hardware.",
        "price": 420.00,
        "stock": 22,
        "image_url": "/static/acc_arch2.jpg",
    },
    {
        "name": "Aura Chronometer Royal Edition Ice-Blue Timepiece",
        "description": "Iconic octagonal bezel with micro-tapisserie ice-blue sunburst dial and exhibition sapphire caseback. 316L Surgical Stainless Steel, Sapphire Crystal, and Swiss Automatic movement.",
        "price": 680.00,
        "stock": 15,
        "image_url": "/static/acc_arch3.jpg",
    },
    {
        "name": "CarbonShield RFID Titanium Money Clip & Bifold",
        "description": "Ultra-slim 8mm profile combining bulletproof carbon weave with buttery Italian leather linings. Aerospace 3K Carbon Fiber with spring titanium money clip and RFID anti-skimming shield.",
        "price": 165.00,
        "stock": 60,
        "image_url": "/static/acc_arch4.jpg",
    },
    {
        "name": "Reversible Full-Grain Calfskin & Palladium Belt",
        "description": "Twist-and-turn reversible buckle mechanism transitioning seamlessly from boardroom to evening. Dual-sided French calfskin in glaucous blue & deep charcoal with polished palladium buckle.",
        "price": 195.00,
        "stock": 45,
        "image_url": "/static/acc_arch5.jpg",
    },

    # ==========================================
    # 5. BEAUTY COLLECTION
    # ==========================================
    {
        "name": "Velvet Crimson Matte Lipstick 103",
        "description": "Signature velvet crimson lipstick in sculpted ribbed gold casing. Pure Velvet Pigment with Camellia Oil and Shea Butter for 16-hour hydrating comfort-matte wear.",
        "price": 58.00,
        "stock": 75,
        "image_url": "/static/beauty_prod1.jpg",
    },
    {
        "name": "Golden Radiance 24K Cellular Serum",
        "description": "Ultra-concentrated restorative youth fluid in fluted crystal with golden dropper. Colloidal 24K Gold, Damask Rose, and Hyaluronic Acid for luminous cellular radiance.",
        "price": 135.00,
        "stock": 40,
        "image_url": "/static/beauty_prod2.jpg",
    },
    {
        "name": "Amber Glow Luxury Crystal Perfume",
        "description": "Faceted octagonal crystal bottle crowned with hand-engraved filigree gold. Rare Bulgarian Rose, Golden Amber, and White Camellia in a bespoke long-lasting pure perfume extract.",
        "price": 240.00,
        "stock": 25,
        "image_url": "/static/beauty_prod3.jpg",
    },
    {
        "name": "Rose Petal Sculpted Illuminating Powder",
        "description": "Intricately embossed rose petal powder set in lacquered black and polished gold vanity compact. Micro-milled pearl pigment and organic rosehip oil for a soft-focus candlelight glow.",
        "price": 78.00,
        "stock": 55,
        "image_url": "/static/beauty_prod4.jpg",
    },
    {
        "name": "Restorative Botanical Night Repair Cream",
        "description": "Whipped regenerating restorative balm housed in heavy frosted glass with solid gold lid. Marine Peptides, Botanical Squalane, and Wild Lavender with a sculpting gold spatula.",
        "price": 155.00,
        "stock": 35,
        "image_url": "/static/beauty_prod5.jpg",
    },

]

def seed_db():
    db = SessionLocal()
    try:
        print("Cleaning up old order items...")
        db.query(OrderItem).delete()
        print("Removing all existing products from database...")
        db.query(Product).delete()
        db.commit()

        print(f"Adding {len(NEW_PRODUCTS)} new products (Boys, Girls, Kids, Accessories, Beauty)...")
        for item in NEW_PRODUCTS:
            prod = Product(
                name=item["name"],
                description=item["description"],
                price=item["price"],
                stock=item["stock"],
                image_url=item["image_url"],
            )
            db.add(prod)
        db.commit()
        print(f"Successfully added all {len(NEW_PRODUCTS)} products to relational database!")

        # Clear Redis cache
        try:
            r = get_redis()
            keys = r.keys("products:*")
            if keys:
                r.delete(*keys)
            r.delete("products:all")
            print("Successfully cleared Redis product cache.")
        except Exception as err:
            print(f"Redis cache clear notice: {err}")

        # Sync ChromaDB Vector Store
        try:
            from app.ai.rag_service import rag_service, COLLECTION_NAME
            try:
                rag_service.client.delete_collection(COLLECTION_NAME)
            except Exception:
                pass
            rag_service.collection = rag_service.client.get_or_create_collection(
                name=COLLECTION_NAME, metadata={"hnsw:space": "cosine"}
            )
            synced_count = rag_service.sync_all_products(db)
            print(f"Successfully indexed {synced_count} products into ChromaDB Vector Search!")
        except Exception as err:
            print(f"ChromaDB sync notice: {err}")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
