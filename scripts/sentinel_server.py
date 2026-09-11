#!/usr/bin/env python3
"""
SENTINEL-X V2 · External Python Computer Vision & Inference Bridge
Runs YOLOv8 person detection + DeepSORT tracking with GPU acceleration
and streams structured target detections to the SENTINEL-X WebSocket interface.

Prerequisites:
  pip install ultralytics deep-sort-realtime websockets opencv-python

Usage:
  python scripts/sentinel_server.py --port 8765 --source 0 --conf 0.45
"""

import argparse
import asyncio
import json
import time
import sys
import cv2
import websockets

try:
    from ultralytics import YOLO
    from deep_sort_realtime.deepsort_tracker import DeepSort
except ImportError:
    print("Warning: ultralytics and deep_sort_realtime are required for GPU inference.")
    print("Run: pip install ultralytics deep-sort-realtime websockets opencv-python")

CLIENTS = set()

async def broadcast(msg):
    if CLIENTS:
        payload = json.dumps(msg)
        await asyncio.gather(*[client.send(payload) for client in CLIENTS], return_exceptions=True)

async def detection_loop(source, conf_threshold):
    print(f"[SENTINEL-X Python] Opening optical capture stream: {source}...")
    cap = cv2.VideoCapture(int(source) if str(source).isdigit() else source)

    if not cap.isOpened():
        print(f"[SENTINEL-X Python] Error: Unable to open capture stream: {source}")
        return

    print("[SENTINEL-X Python] Loading YOLOv8 nano model (yolov8n.pt)...")
    model = YOLO("yolov8n.pt")

    print("[SENTINEL-X Python] Initializing DeepSORT real-time tracker...")
    tracker = DeepSort(max_age=30, n_init=3, embedder="mobilenet", half=False)

    print("[SENTINEL-X Python] Neural inference loop online.")

    while True:
        ret, frame = cap.read()
        if not ret:
            await asyncio.sleep(0.03)
            continue

        t0 = time.perf_counter()

        # Run inference specifically for person class (class 0 in COCO)
        results = model.predict(frame, conf=conf_threshold, classes=[0], verbose=False)[0]

        detections = []
        for box in results.boxes:
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            score = float(box.conf[0])
            w = x2 - x1
            h = y2 - y1
            detections.append(([int(x1), int(y1), int(w), int(h)], score, "person"))

        # DeepSORT identity association
        tracks = tracker.update_tracks(detections, frame=frame)
        latency_ms = (time.perf_counter() - t0) * 1000

        targets = []
        for tr in tracks:
            if not tr.is_confirmed():
                continue
            ltrb = tr.to_ltrb()
            targets.append({
                "id": int(tr.track_id),
                "x1": int(ltrb[0]),
                "y1": int(ltrb[1]),
                "x2": int(ltrb[2]),
                "y2": int(ltrb[3]),
                "conf": 0.92,
                "occluded": False,
                "anomaly": False,
            })

        message = {
            "type": "telemetry:stream",
            "latency_ms": round(latency_ms, 1),
            "targets": targets,
            "timestamp": time.time(),
        }

        await broadcast(message)
        await asyncio.sleep(0.033) # ~30 FPS

async def ws_handler(ws):
    CLIENTS.add(ws)
    print(f"[SENTINEL-X Python] Operator connected. Active subscribers: {len(CLIENTS)}")
    try:
        await ws.wait_closed()
    finally:
        CLIENTS.discard(ws)
        print(f"[SENTINEL-X Python] Operator disconnected. Active subscribers: {len(CLIENTS)}")

async def main():
    parser = argparse.ArgumentParser(description="SENTINEL-X Python Inference Bridge")
    parser.add_argument("--port", type=int, default=8765, help="WebSocket port (default: 8765)")
    parser.add_argument("--source", default="0", help="Camera index or stream URL (default: 0)")
    parser.add_argument("--conf", type=float, default=0.45, help="Confidence threshold (default: 0.45)")
    args = parser.parse_args()

    print("═════════════════════════════════════════════════════════════════")
    print("  SENTINEL-X · Python YOLOv8 + DeepSORT Hardware Bridge v5.0")
    print(f"  WebSocket Listening: ws://localhost:{args.port}")
    print(f"  Capture Device: {args.source} | Confidence Gate: {args.conf}")
    print("═════════════════════════════════════════════════════════════════")

    async with websockets.serve(ws_handler, "localhost", args.port):
        await detection_loop(args.source, args.conf)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n[SENTINEL-X Python] Bridge shutdown requested. Exiting.")
