import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import { Detection } from '@sentinel/shared';

export class BrowserVisionProvider {
  private model: cocoSsd.ObjectDetection | null = null;
  private isLoading = false;
  private isReady = false;
  private lastLatencyMs = 0;

  public async load(): Promise<boolean> {
    if (this.isReady && this.model) return true;
    if (this.isLoading) return false;

    this.isLoading = true;
    try {
      // Try WebGPU first, then WebGL, then CPU
      try {
        await tf.setBackend('webgpu');
        console.log('[Vision] WebGPU backend initialized');
      } catch {
        try {
          await tf.setBackend('webgl');
          console.log('[Vision] WebGL backend initialized');
        } catch {
          await tf.setBackend('cpu');
          console.log('[Vision] CPU backend fallback initialized');
        }
      }

      await tf.ready();
      this.model = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
      this.isReady = true;
      this.isLoading = false;
      console.log('[Vision] COCO-SSD lite_mobilenet_v2 model loaded successfully');
      return true;
    } catch (e) {
      console.error('[Vision] Failed to load COCO-SSD model:', e);
      this.isLoading = false;
      return false;
    }
  }

  public async detect(
    imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
    canvasWidth: number,
    canvasHeight: number,
    confidenceThreshold = 0.35
  ): Promise<{ detections: Detection[]; latencyMs: number }> {
    if (!this.model || !this.isReady) {
      return { detections: [], latencyMs: 0 };
    }

    const t0 = performance.now();

    try {
      const vW =
        (imageElement as HTMLVideoElement).videoWidth ||
        (imageElement as HTMLImageElement).naturalWidth ||
        imageElement.width;
      const vH =
        (imageElement as HTMLVideoElement).videoHeight ||
        (imageElement as HTMLImageElement).naturalHeight ||
        imageElement.height;

      if (!vW || !vH) {
        return { detections: [], latencyMs: 0 };
      }

      // Aspect ratio scaling calculation
      const vr = vW / vH;
      const cr = canvasWidth / canvasHeight;
      let sw: number, sh: number, sx: number, sy: number;

      if (vr > cr) {
        sh = vH;
        sw = sh * cr;
        sx = (vW - sw) / 2;
        sy = 0;
      } else {
        sw = vW;
        sh = sw / cr;
        sx = 0;
        sy = (vH - sh) / 2;
      }

      const scaleX = canvasWidth / sw;
      const scaleY = canvasHeight / sh;

      const predictions = await this.model.detect(imageElement, 10, confidenceThreshold);

      const detections: Detection[] = predictions
        .filter((p) => p.class === 'person' && p.score >= confidenceThreshold)
        .map((p) => {
          const [bx, by, bw, bh] = p.bbox;
          return {
            cx: (bx + bw / 2 - sx) * scaleX,
            cy: (by + bh / 2 - sy) * scaleY,
            w: bw * scaleX,
            h: bh * scaleY,
            conf: p.score,
            label: 'person',
          };
        })
        .filter(
          (d) => d.cx > 0 && d.cy > 0 && d.cx < canvasWidth && d.cy < canvasHeight
        );

      this.lastLatencyMs = performance.now() - t0;
      return { detections, latencyMs: this.lastLatencyMs };
    } catch (e) {
      console.warn('[Vision] Detection cycle error:', e);
      return { detections: [], latencyMs: performance.now() - t0 };
    }
  }

  public getIsReady(): boolean {
    return this.isReady;
  }

  public getIsLoading(): boolean {
    return this.isLoading;
  }

  public getLastLatency(): number {
    return this.lastLatencyMs;
  }
}

export const browserVisionProvider = new BrowserVisionProvider();
