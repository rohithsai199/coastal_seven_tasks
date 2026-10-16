import csv
import io
import time
from decimal import Decimal

from app.tasks.celery_app import celery_app
from app.database import SessionLocal
from app.models import Product


@celery_app.task(bind=True, name="import_products_csv")
def import_products_csv(self, csv_data_str: str):
    """
    Celery task that processes bulk product CSV imports with real-time
    progress updates stored in Celery result backend.
    """
    self.update_state(
        state="PROGRESS",
        meta={
            "current": 0,
            "total": 100,
            "percent": 0,
            "status": "Reading and parsing uploaded CSV file...",
            "imported": 0,
            "skipped": 0,
        },
    )

    f = io.StringIO(csv_data_str.strip())
    reader = csv.DictReader(f)
    rows = list(reader)
    total_rows = len(rows)

    if total_rows == 0:
        return {
            "status": "COMPLETED",
            "total_rows": 0,
            "imported_count": 0,
            "skipped_count": 0,
            "errors": ["CSV file was empty or had no data rows."],
        }

    db = SessionLocal()
    imported_count = 0
    skipped_count = 0
    errors = []

    try:
        for idx, row in enumerate(rows, start=1):
            # Normalize keys to lowercase stripped
            norm_row = {
                (k.strip().lower() if k else ""): (v.strip() if v else "")
                for k, v in row.items()
            }

            name = norm_row.get("name") or norm_row.get("product_name") or norm_row.get("title")
            price_str = norm_row.get("price") or norm_row.get("cost")
            stock_str = norm_row.get("stock") or norm_row.get("quantity") or "0"
            description = norm_row.get("description") or norm_row.get("desc") or ""
            image_url = norm_row.get("image_url") or norm_row.get("image") or None

            # Progress percentage
            percent = int((idx / total_rows) * 100)
            self.update_state(
                state="PROGRESS",
                meta={
                    "current": idx,
                    "total": total_rows,
                    "percent": percent,
                    "status": f"Processing item {idx}/{total_rows}: {name or 'Unnamed'}...",
                    "imported": imported_count,
                    "skipped": skipped_count,
                },
            )

            # Small simulated pause if tiny file so UI progress bar is visible and smooth
            if total_rows < 20:
                time.sleep(0.15)

            if not name:
                skipped_count += 1
                errors.append(f"Row {idx}: Name is missing.")
                continue

            try:
                price = float(price_str)
                if price < 0:
                    raise ValueError("Price cannot be negative.")
            except (TypeError, ValueError) as ex:
                skipped_count += 1
                errors.append(f"Row {idx} ('{name}'): Invalid price '{price_str}'. {ex}")
                continue

            try:
                stock = int(stock_str)
                if stock < 0:
                    stock = 0
            except (TypeError, ValueError):
                stock = 0

            # Create or update product
            # Check if product with identical name already exists
            existing = db.query(Product).filter(Product.name == name).first()
            if existing:
                existing.price = Decimal(str(price))
                existing.stock += stock
                if description and not existing.description:
                    existing.description = description
                if image_url and not existing.image_url:
                    existing.image_url = image_url
            else:
                new_prod = Product(
                    name=name,
                    description=description,
                    price=Decimal(str(price)),
                    stock=stock,
                    image_url=image_url,
                )
                db.add(new_prod)

            imported_count += 1

            # Batch commit every 25 rows
            if idx % 25 == 0:
                db.commit()

        db.commit()

        # Invalidate Redis cache
        try:
            from app.utils.redis_client import get_redis

            r = get_redis()
            r.delete("products:all")
        except Exception:
            pass

        self.update_state(
            state="PROGRESS",
            meta={
                "current": total_rows,
                "total": total_rows,
                "percent": 100,
                "status": f"Finished importing {imported_count} products!",
                "imported": imported_count,
                "skipped": skipped_count,
            },
        )

        return {
            "status": "COMPLETED",
            "total_rows": total_rows,
            "imported_count": imported_count,
            "skipped_count": skipped_count,
            "errors": errors[:20],  # Return up to 20 errors
        }

    except Exception as e:
        db.rollback()
        self.update_state(
            state="FAILURE",
            meta={
                "current": idx,
                "total": total_rows,
                "percent": int((idx / total_rows) * 100) if total_rows else 0,
                "status": f"Import failed: {str(e)}",
                "error": str(e),
                "imported": imported_count,
                "skipped": skipped_count,
            },
        )
        raise e
    finally:
        db.close()
