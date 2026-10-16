from seed_products import seed_db, NEW_PRODUCTS

PRODUCTS = NEW_PRODUCTS

def seed():
    seed_db()

if __name__ == "__main__":
    seed()
