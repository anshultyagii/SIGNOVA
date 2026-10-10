import type { ProcessedFrame } from './landmarks';

export interface RecognitionPrediction {
  label: string;
  confidence: number;
  timestamp: number;
  category?: 'greeting' | 'polite' | 'response' | 'emotion' | 'core' | 'basic';
  allProbabilities?: Record<string, number>;
}

export interface ISignRecognitionModel {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly type: 'heuristic' | 'onnx' | 'tfjs' | 'websocket' | 'rest';
  readonly isReady: boolean;
  readonly requiredFrames: number;

  initialize(): Promise<void>;
  predict(frames: ProcessedFrame[]): Promise<RecognitionPrediction | null>;
  dispose?(): void;
}

export interface TranslationResult {
  originalTokens: string[];
  translatedSentence: string;
  confidence: number;
  timestamp: number;
  alternatives?: string[];
}

export interface INLPTranslationModel {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly type: 'rule' | 'llm' | 'huggingface' | 'passthrough';
  readonly isReady: boolean;

  initialize(): Promise<void>;
  translate(tokens: string[]): Promise<TranslationResult>;
  dispose?(): void;
}

export interface PipelineConfig {
  recognitionModelId: string;
  nlpModelId: string;
  bufferSize: number; // e.g., 30 frames
  minPredictionConfidence: number; // e.g., 0.65
  debounceIntervalMs: number; // e.g., 1000ms
  autoSpeak: boolean; // text-to-speech
  smoothingFactor: number; // 0 to 1
  wsServerUrl?: string; // WebSocket endpoint for backend model
}
