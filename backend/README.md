# SIGNOVA — Python AI Backend

This microservice provides high-speed WebSocket and REST endpoints for your trained Sign Language Recognition and NLP translation models.

## Quick Start

1. Create a virtual environment and install requirements:
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

2. Run the development server:
```bash
python main.py
```
The server will start at `http://localhost:8000` with interactive Swagger docs at `http://localhost:8000/docs`.

3. Connecting from the SIGNOVA Frontend:
- Open the frontend website.
- Click **Settings** (top right gear icon).
- Under **Sign Recognition Model**, select **Python FastAPI / PyTorch Backend**.
- Verify the WebSocket endpoint is set to `ws://localhost:8000/ws/sign`.
- Click **Apply Changes**.

## Data Specifications
- Each WebSocket payload sends normalized `[1662]` Float32Array coordinates:
  - 33 Pose landmarks (Upper Body, Arms, Shoulders): `132` values
  - 468 Face landmarks: `1404` values
  - 21 Left Hand landmarks: `63` values
  - 21 Right Hand landmarks: `63` values
- Coordinates are centered at the chest and normalized to shoulder span.
