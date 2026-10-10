import { BaseSignModel } from './BaseSignModel';
import type { ProcessedFrame } from '../../../types/landmarks';
import type { RecognitionPrediction } from '../../../types/models';

/**
 * WebSocket Remote Sign Model Provider
 * 
 * Streams normalized landmark frames or sequence buffers to a Python FastAPI backend
 * running PyTorch, PyTorch Lightning, TensorFlow, or Scikit-learn.
 */
export class WebSocketSignModel extends BaseSignModel {
  readonly id = 'websocket_backend';
  readonly name = 'Python FastAPI / PyTorch Backend';
  readonly description = 'Streams landmark tensors over WebSocket to a remote Python backend running your trained PyTorch / Transformer model.';
  readonly type = 'websocket' as const;
  readonly requiredFrames = 30;

  private socket: WebSocket | null = null;
  private serverUrl = 'ws://localhost:8000/ws/sign';
  private latestPrediction: RecognitionPrediction | null = null;
  private lastPingTime = 0;
  private latencyMs = 0;
  private isConnected = false;

  constructor(serverUrl = 'ws://localhost:8000/ws/sign') {
    super();
    this.serverUrl = serverUrl;
  }

  public setServerUrl(url: string) {
    this.serverUrl = url;
    if (this.socket) {
      this.socket.close();
      this.connect();
    }
  }

  public getLatency(): number {
    return this.latencyMs;
  }

  public getConnected(): boolean {
    return this.isConnected;
  }

  private connect(): void {
    try {
      this.socket = new WebSocket(this.serverUrl);

      this.socket.onopen = () => {
        this.isConnected = true;
        this._isReady = true;
        console.log('[WebSocketSignModel] Connected to backend:', this.serverUrl);
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'prediction') {
            this.latestPrediction = {
              label: data.label,
              confidence: data.confidence,
              timestamp: Date.now(),
              category: data.category || 'core',
            };
          }
          if (this.lastPingTime > 0) {
            this.latencyMs = Math.round(performance.now() - this.lastPingTime);
          }
        } catch (e) {
          console.error('[WebSocketSignModel] Failed to parse message', e);
        }
      };

      this.socket.onclose = () => {
        this.isConnected = false;
        console.log('[WebSocketSignModel] Disconnected from backend');
      };

      this.socket.onerror = () => {
        this.isConnected = false;
      };
    } catch {
      this.isConnected = false;
    }
  }

  async initialize(): Promise<void> {
    this.connect();
    this._isReady = true;
  }

  async predict(frames: ProcessedFrame[]): Promise<RecognitionPrediction | null> {
    if (!this._isReady || frames.length === 0) return null;

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.lastPingTime = performance.now();
      const latest = frames[frames.length - 1];

      // Send payload to backend
      const payload = {
        timestamp: latest.timestamp,
        frameCount: frames.length,
        kinematics: latest.kinematics,
        // Send flat feature vector (or slice of keypoints)
        featureVector: Array.from(latest.featureVector),
      };

      this.socket.send(JSON.stringify(payload));
      const pred = this.latestPrediction;
      this.latestPrediction = null; // consume
      return pred;
    }

    return null;
  }

  dispose(): void {
    super.dispose();
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.isConnected = false;
  }
}
