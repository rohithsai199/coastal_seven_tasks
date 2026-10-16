import io
import os
import uuid
from typing import Tuple
from PIL import Image, UnidentifiedImageError
from fastapi import HTTPException, UploadFile, status

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
UPLOAD_DIR = os.path.join("app", "static", "uploads")


def validate_image(file: UploadFile) -> None:
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Filename missing."
        )

    ext = file.filename.split(".")[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid extension. Allowed: {ALLOWED_EXTENSIONS}",
        )


async def process_and_save_image(
    file: UploadFile, size: Tuple[int, int] = (300, 300)
) -> str:
    validate_image(file)
    contents = await file.read()

    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds 5MB limit.",
        )

    try:
        image = Image.open(io.BytesIO(contents))
        image.verify()
        image = Image.open(io.BytesIO(contents))
    except UnidentifiedImageError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is not a valid image.",
        )

    image.thumbnail(size)

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    filename = f"{uuid.uuid4().hex}.jpg"
    file_path = os.path.join(UPLOAD_DIR, filename)

    if image.mode in ("RGBA", "P"):
        image = image.convert("RGB")

    image.save(file_path, "JPEG", quality=85)
    return f"/static/uploads/{filename}"
