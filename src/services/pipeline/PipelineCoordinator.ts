import type { HolisticResults } from '../../types/mediapipe';
import type { ProcessedFrame, RecordedGestureSequence } from '../../types/landmarks';
import type {
  ISignRecognitionModel,
  INLPTranslationModel,
  RecognitionPrediction,
  TranslationResult,
  PipelineConfig,
} from '../../types/models';
import { LandmarkNormalizer } from '../processor/LandmarkNormalizer';
import { SequenceBuffer } from '../processor/SequenceBuffer';
import { ModelRegistry } from '../models/ModelRegistry';
import { HolisticTracker, type TrackerMetrics } from '../vision/HolisticTracker';
import { speakSentence } from '../../utils/audio';

export interface PipelineEventListener {
  onFrame?: (frame: ProcessedFrame, rawResults: HolisticResults) => void;
  onPrediction?: (pred: RecognitionPrediction) => void;
  onTranslation?: (trans: TranslationResult) => void;
  onTokensUpdated?: (tokens: string[]) => void;
  onMetricsUpdated?: (metrics: TrackerMetrics) => void;
  onRecordingProgress?: (current: number, target: number) => void;
}

export class PipelineCoordinator {
  private tracker: HolisticTracker;
  private sequenceBuffer: SequenceBuffer;
  private activeSignModel: ISignRecognitionModel;
  private activeNLPModel: INLPTranslationModel;

  private config: PipelineConfig = {
    recognitionModelId: 'heuristic_rules',
    nlpModelId: 'rule_grammar',
    bufferSize: 30,
    minPredictionConfidence: 0.65,
    debounceIntervalMs: 1200,
    autoSpeak: true,
    smoothingFactor: 0.35,
  };

  private recognizedTokens: string[] = [];
  private lastPredictionTime = 0;
  private lastPredictedLabel: string | null = null;
  private isProcessingModel = false;

  // Dataset Recording State
  private isRecording = false;
  private recordingLabel = '';
  private recordingTargetFrames = 30;
  private recordedBuffer: ProcessedFrame[] = [];
  private onRecordingCompleteCallback: ((sequence: RecordedGestureSequence) => void) | null = null;

  private listeners: PipelineEventListener = {};

  constructor() {
    this.tracker = new HolisticTracker();
    this.sequenceBuffer = new SequenceBuffer(this.config.bufferSize);

    ModelRegistry.initialize();
    this.activeSignModel = ModelRegistry.getSignModel(this.config.recognitionModelId);
    this.activeNLPModel = ModelRegistry.getNLPModel(this.config.nlpModelId);

    // Setup tracker callbacks
    this.tracker.setOnResults((results) => this.handleRawResults(results));
    this.tracker.setOnMetrics((metrics) => {
      if (this.listeners.onMetricsUpdated) {
        this.listeners.onMetricsUpdated(metrics);
      }
    });
  }

  public setListeners(listeners: PipelineEventListener) {
    this.listeners = listeners;
  }

  public updateConfig(newConfig: Partial<PipelineConfig>) {
    this.config = { ...this.config, ...newConfig };

    if (newConfig.recognitionModelId) {
      this.activeSignModel = ModelRegistry.getSignModel(newConfig.recognitionModelId);
      this.activeSignModel.initialize();
    }
    if (newConfig.nlpModelId) {
      this.activeNLPModel = ModelRegistry.getNLPModel(newConfig.nlpModelId);
      this.activeNLPModel.initialize();
    }
    if (newConfig.bufferSize) {
      this.sequenceBuffer.setCapacity(newConfig.bufferSize);
    }
    if (newConfig.smoothingFactor !== undefined) {
      LandmarkNormalizer.setSmoothing(newConfig.smoothingFactor);
    }
  }

  public getConfig(): PipelineConfig {
    return { ...this.config };
  }

  public getActiveSignModel(): ISignRecognitionModel {
    return this.activeSignModel;
  }

  public getActiveNLPModel(): INLPTranslationModel {
    return this.activeNLPModel;
  }

  public async start(videoElement: HTMLVideoElement): Promise<void> {
    await this.activeSignModel.initialize();
    await this.activeNLPModel.initialize();
    await this.tracker.start(videoElement);
  }

  public stop(): void {
    this.tracker.stop();
  }

  public isTracking(): boolean {
    return this.tracker.getIsRunning();
  }

  /**
   * Core frame processing pipeline:
   * Vision Raw Results -> Landmark Normalizer -> Buffer -> Sign Model -> NLP Model
   */
  private async handleRawResults(rawResults: HolisticResults) {
    // 1. Normalize landmarks & extract kinematics
    const frame = LandmarkNormalizer.processFrame(rawResults);

    // 2. Add to sliding sequence window
    this.sequenceBuffer.push(frame);

    // 3. Emit frame event for UI canvas and HUD
    if (this.listeners.onFrame) {
      this.listeners.onFrame(frame, rawResults);
    }

    // 4. Handle Dataset Recording if active
    if (this.isRecording) {
      this.recordedBuffer.push(frame);
      if (this.listeners.onRecordingProgress) {
        this.listeners.onRecordingProgress(this.recordedBuffer.length, this.recordingTargetFrames);
      }

      if (this.recordedBuffer.length >= this.recordingTargetFrames) {
        this.finishRecording();
      }
    }

    // 5. Run Sign Recognition Model
    if (!this.isProcessingModel && this.sequenceBuffer.size() >= 5) {
      this.isProcessingModel = true;
      try {
        const prediction = await this.activeSignModel.predict(this.sequenceBuffer.getFrames());

        if (prediction && prediction.confidence >= this.config.minPredictionConfidence) {
          const now = Date.now();
          const isDebounced =
            prediction.label === this.lastPredictedLabel &&
            now - this.lastPredictionTime < this.config.debounceIntervalMs;

          if (!isDebounced) {
            this.lastPredictionTime = now;
            this.lastPredictedLabel = prediction.label;

            if (this.listeners.onPrediction) {
              this.listeners.onPrediction(prediction);
            }

            // Append to recognized sign tokens
            this.recognizedTokens.push(prediction.label);
            if (this.recognizedTokens.length > 8) {
              this.recognizedTokens.shift(); // keep last 8 tokens
            }

            if (this.listeners.onTokensUpdated) {
              this.listeners.onTokensUpdated([...this.recognizedTokens]);
            }

            // 6. Translate tokens through NLP Model
            const translation = await this.activeNLPModel.translate(this.recognizedTokens);
            if (this.listeners.onTranslation) {
              this.listeners.onTranslation(translation);
            }

            // 7. Text-to-Speech (optional)
            if (this.config.autoSpeak && translation.translatedSentence) {
              speakSentence(translation.translatedSentence);
            }
          }
        }
      } catch (err) {
        console.error('[PipelineCoordinator] Error during model prediction:', err);
      } finally {
        this.isProcessingModel = false;
      }
    }
  }

  public clearTokens(): void {
    this.recognizedTokens = [];
    this.lastPredictedLabel = null;
    if (this.listeners.onTokensUpdated) {
      this.listeners.onTokensUpdated([]);
    }
    if (this.listeners.onTranslation) {
      this.listeners.onTranslation({
        originalTokens: [],
        translatedSentence: '',
        confidence: 1.0,
        timestamp: Date.now(),
      });
    }
  }

  public startRecording(
    label: string,
    targetFrames = 30,
    onComplete?: (sequence: RecordedGestureSequence) => void
  ): void {
    this.isRecording = true;
    this.recordingLabel = label;
    this.recordingTargetFrames = targetFrames;
    this.recordedBuffer = [];
    this.onCompleteCallback = onComplete || null;
  }

  private set onCompleteCallback(cb: ((seq: RecordedGestureSequence) => void) | null) {
    this.onRecordingCompleteCallback = cb;
  }

  private finishRecording(): void {
    this.isRecording = false;
    const tempBuffer = new SequenceBuffer(this.recordedBuffer.length);
    for (const f of this.recordedBuffer) {
      tempBuffer.push(f);
    }
    const sequence = tempBuffer.toDatasetRecording(this.recordingLabel, 30);
    this.recordedBuffer = [];

    if (this.onRecordingCompleteCallback) {
      this.onRecordingCompleteCallback(sequence);
    }
  }

  public cancelRecording(): void {
    this.isRecording = false;
    this.recordedBuffer = [];
  }
}
