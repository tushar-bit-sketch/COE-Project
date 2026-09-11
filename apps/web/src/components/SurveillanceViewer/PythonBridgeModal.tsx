import React, { useState } from 'react';
import { Copy, Check, Terminal, X } from 'lucide-react';

interface PythonBridgeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PythonBridgeModal: React.FC<PythonBridgeModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [wsUrl, setWsUrl] = useState('ws://localhost:8765');

  if (!isOpen) return null;

  const pythonCode = `# sentinel_server.py  (optional — browser AI works without this)
# pip install ultralytics deep-sort-realtime websockets opencv-python

import asyncio, json, time, cv2, websockets
from ultralytics import YOLO
from deep_sort_realtime.deepsort_tracker import DeepSort

model = YOLO("yolov8n.pt")
tracker = DeepSort(max_age=30, n_init=3, embedder="mobilenet", half=False)
cap = cv2.VideoCapture(0)
CLIENTS = set()

async def broadcast(msg):
    if CLIENTS:
        await asyncio.gather(*[c.send(json.dumps(msg)) for c in CLIENTS])

async def detection_loop():
    while True:
        ret, frame = cap.read()
        if not ret:
            await asyncio.sleep(0.03)
            continue
        t0 = time.perf_counter()
        res = model.predict(frame, conf=0.45, classes=[0], verbose=False)[0]
        dets = [
            ([int(b[0]), int(b[1]), int(b[2]-b[0]), int(b[3]-b[1])], float(c), 'person')
            for b, c in zip(res.boxes.xyxy, res.boxes.conf)
        ]
        tracks = tracker.update_tracks(dets, frame=frame)
        lat = (time.perf_counter() - t0) * 1000
        tgts = [
            {
                "id": tr.track_id,
                "x1": int(tr.to_ltrb()[0]), "y1": int(tr.to_ltrb()[1]),
                "x2": int(tr.to_ltrb()[2]), "y2": int(tr.to_ltrb()[3]),
                "conf": 0.92, "occluded": False, "anomaly": False
            }
            for tr in tracks if tr.is_confirmed()
        ]
        await broadcast({"latency_ms": round(lat, 1), "targets": tgts})
        await asyncio.sleep(0.03)

async def handler(ws):
    CLIENTS.add(ws)
    await ws.wait_closed()
    CLIENTS.discard(ws)

async def main():
    async with websockets.serve(handler, "localhost", 8765):
        print("Sentinel-X Python Server active → ws://localhost:8765")
        await detection_loop()

asyncio.run(main())`;

  const handleCopy = () => {
    navigator.clipboard.writeText(pythonCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl p-6 rounded-2xl border border-cyan/30 bg-[#030810]/95 shadow-2xl overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-muted hover:text-white hover:bg-white/5 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <Terminal size={18} className="text-cyan" />
          <h2 className="font-display text-lg font-bold text-white tracking-tight">
            Python AI Inference Bridge (Optional)
          </h2>
        </div>
        <p className="text-xs font-mono text-dim mb-4">
          Browser camera mode uses in-browser TensorFlow.js. Optionally run the Python server below for
          hardware-accelerated YOLOv8 + DeepSORT.
        </p>

        <div className="relative mb-4">
          <pre className="font-mono text-[0.62rem] p-4 rounded-xl border border-white/10 bg-black/80 text-green overflow-x-auto max-h-72 leading-relaxed">
            {pythonCode}
          </pre>
          <button
            onClick={handleCopy}
            className="absolute top-3 right-3 font-mono text-xs px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center gap-1.5 transition-all"
          >
            {copied ? <Check size={12} className="text-green" /> : <Copy size={12} />}
            <span>{copied ? 'Copied' : 'Copy Code'}</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={wsUrl}
              onChange={(e) => setWsUrl(e.target.value)}
              className="font-mono text-xs p-2 rounded-lg border border-white/10 bg-white/[0.04] text-white w-48 focus:outline-none focus:border-cyan"
              placeholder="ws://localhost:8765"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="font-mono text-xs px-4 py-2 rounded-lg border border-white/10 hover:bg-white/[0.04] text-muted transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
