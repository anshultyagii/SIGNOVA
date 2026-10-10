import type { HolisticResults } from '../../types/mediapipe';

export interface TrackerMetrics {
  fps: number;
  latencyMs: number;
  frameCount: number;
  isTracking: boolean;
  cameraActive: boolean;
}

export class HolisticTracker {
  private holistic: any = null;
  private videoElement: HTMLVideoElement | null = null;
  private animationFrameId: number | null = null;
  private isRunning = false;
  private isProcessing = false;

  // Performance metrics
  private lastFrameTimestamp = 0;
  private frameCount = 0;
  private fps = 0;
  private latencyMs = 0;
  private fpsCalculationInterval = 0;

  // Event handlers
  private onResultsCallback: ((results: HolisticResults, latencyMs: number) => void) | null = null;
  private onMetricsCallback: ((metrics: TrackerMetrics) => void) | null = null;
  private onErrorCallback: ((error: Error) => void) | null = null;

  constructor() {
    this.fpsCalculationInterval = performance.now();
  }

  public setOnResults(cb: (results: HolisticResults, latencyMs: number) => void) {
    this.onResultsCallback = cb;
  }

  public setOnMetrics(cb: (metrics: TrackerMetrics) => void) {
    this.onMetricsCallback = cb;
  }

  public setOnError(cb: (error: Error) => void) {
    this.onErrorCallback = cb;
  }

  /**
   * Initializes MediaPipe Holistic instance
   */
  public async initialize(): Promise<void> {
    try {
      // Ensure window.Holistic is available, or wait briefly if CDN script is still evaluating
      let retries = 0;
      while (!window.Holistic && retries < 20) {
        await new Promise((resolve) => setTimeout(resolve, 150));
        retries++;
      }

      if (!window.Holistic) {
        throw new Error('MediaPipe Holistic library could not be loaded from CDN.');
      }

      this.holistic = new window.Holistic({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`,
      });

      this.holistic.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: false,
        refineFaceLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      this.holistic.onResults((results: HolisticResults) => {
        const latency = performance.now() - this.lastFrameTimestamp;
        this.latencyMs = Math.round(latency);
        this.isProcessing = false;

        if (this.onResultsCallback) {
          this.onResultsCallback(results, this.latencyMs);
        }
      });
    } catch (err: any) {
      if (this.onErrorCallback) this.onErrorCallback(err);
      throw err;
    }
  }

  /**
   * Starts camera capture and real-time processing loop
   */
  public async start(videoElement: HTMLVideoElement): Promise<void> {
    this.videoElement = videoElement;

    if (!this.holistic) {
      await this.initialize();
    }

    // Request camera media stream
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280, max: 1920 },
        height: { ideal: 720, max: 1080 },
        facingMode: 'user',
        frameRate: { ideal: 30 },
      },
      audio: false,
    });

    this.videoElement.srcObject = stream;
    await this.videoElement.play();

    this.isRunning = true;
    this.processLoop();
  }

  /**
   * Continuous processing loop synchronized with display refresh rate
   */
  private processLoop = async () => {
    if (!this.isRunning) return;

    if (this.videoElement && this.videoElement.readyState >= 2 && !this.isProcessing && this.holistic) {
      this.isProcessing = true;
      this.lastFrameTimestamp = performance.now();
      this.frameCount++;

      // Update FPS calculation every 500ms
      const now = performance.now();
      if (now - this.fpsCalculationInterval >= 500) {
        this.fps = Math.round((this.frameCount * 1000) / (now - this.fpsCalculationInterval));
        this.frameCount = 0;
        this.fpsCalculationInterval = now;

        if (this.onMetricsCallback) {
          this.onMetricsCallback({
            fps: this.fps,
            latencyMs: this.latencyMs,
            frameCount: this.frameCount,
            isTracking: true,
            cameraActive: true,
          });
        }
      }

      try {
        await this.holistic.send({ image: this.videoElement });
      } catch (e: any) {
        console.warn('[HolisticTracker] Frame processing warning:', e);
        this.isProcessing = false;
      }
    }

    this.animationFrameId = requestAnimationFrame(this.processLoop);
  };

  /**
   * Stops video stream and tracking loop
   */
  public stop(): void {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.videoElement && this.videoElement.srcObject) {
      const stream = this.videoElement.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      this.videoElement.srcObject = null;
    }

    if (this.onMetricsCallback) {
      this.onMetricsCallback({
        fps: 0,
        latencyMs: 0,
        frameCount: 0,
        isTracking: false,
        cameraActive: false,
      });
    }
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }
}
