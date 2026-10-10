import type { ISignRecognitionModel, RecognitionPrediction } from '../../../types/models';
import type { ProcessedFrame } from '../../../types/landmarks';

export abstract class BaseSignModel implements ISignRecognitionModel {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly type: 'heuristic' | 'onnx' | 'tfjs' | 'websocket' | 'rest';
  abstract readonly requiredFrames: number;

  protected _isReady = false;

  get isReady(): boolean {
    return this._isReady;
  }

  abstract initialize(): Promise<void>;
  abstract predict(frames: ProcessedFrame[]): Promise<RecognitionPrediction | null>;

  dispose(): void {
    this._isReady = false;
  }
}
