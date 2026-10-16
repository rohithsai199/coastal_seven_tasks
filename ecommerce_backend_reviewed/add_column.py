from sqlalchemy import create_engine, text
from app.config import settings

engine = create_engine(settings.DATABASE_URL)
with engine.connect() as conn:
    try:
        conn.execute(text('ALTER TABLE chat_messages ADD COLUMN order_id INTEGER;'))
        conn.commit()
        print('Column added successfully!')
    except Exception as e:
        print('Error:', e)
