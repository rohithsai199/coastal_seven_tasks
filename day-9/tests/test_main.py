import io
from PIL import Image
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def create_test_image_bytes(format_type="JPEG", size=(500, 500)) -> bytes:
    file_obj = io.BytesIO()
    img = Image.new("RGB", size, color="red")
    img.save(file_obj, format=format_type)
    return file_obj.getvalue()


def test_upload_valid_image():
    image_bytes = create_test_image_bytes()
    response = client.post(
        "/upload",
        files={"file": ("test.jpg", image_bytes, "image/jpeg")},
    )
    assert response.status_code == 200
    data = response.json()
    assert "url" in data
    assert data["status"] == "success"


def test_upload_invalid_file_extension():
    response = client.post(
        "/upload",
        files={"file": ("test.txt", b"text payload", "text/plain")},
    )
    assert response.status_code == 400
    assert "Invalid extension" in response.json()["detail"]


def test_upload_invalid_image_corrupted():
    response = client.post(
        "/upload",
        files={"file": ("test.png", b"not-an-image", "image/png")},
    )
    assert response.status_code == 400
    assert "not a valid image" in response.json()["detail"]


def test_websocket_connection_and_echo():
    with client.websocket_connect("/ws") as websocket:
        websocket.send_text("Hello WebSockets")
        data = websocket.receive_text()
        assert data == "Echo: Hello WebSockets"


def test_websocket_notification_on_upload():
    with client.websocket_connect("/ws") as websocket:
        image_bytes = create_test_image_bytes()
        response = client.post(
            "/upload",
            files={"file": ("photo.jpg", image_bytes, "image/jpeg")},
        )
        assert response.status_code == 200

        notification = websocket.receive_text()
        assert "NOTIFICATION: New image uploaded at" in notification