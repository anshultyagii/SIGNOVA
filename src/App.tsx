import { useState, useRef, useEffect, useCallback } from 'react';
import { GestureSynthHelpModal } from './components/GestureSynthHelpModal';
import { DatasetRecorderModal } from './components/DatasetRecorderModal';

import { PipelineCoordinator } from './services/pipeline/PipelineCoordinator';
import { CanvasRenderer, type RenderOptions } from './services/vision/CanvasRenderer';
import type { TrackerMetrics } from './services/vision/HolisticTracker';
import type { KinematicsSummary, RecordedGestureSequence } from './types/landmarks';
import type { RecognitionPrediction, TranslationResult, PipelineConfig } from './types/models';
import { setAudioMuted, playChime, speakSentence } from './utils/audio';

const RENDER_OPTIONS: RenderOptions = {
  showFace: true,
  showPose: true,
  showHands: true,
  showAngles: true,
  showTrails: true,
  showBoxes: false,
  mirror: true,
};

export function App() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const coordinatorRef = useRef<PipelineCoordinator | null>(null);
  const rendererRef = useRef<CanvasRenderer>(new CanvasRenderer());

  // Metrics & Vision State
  const [metrics, setMetrics] = useState<TrackerMetrics>({
    fps: 0,
    latencyMs: 0,
    frameCount: 0,
    isTracking: false,
    cameraActive: false,
  });

  const [kinematics, setKinematics] = useState<KinematicsSummary | null>(null);
  const [latestPrediction, setLatestPrediction] = useState<RecognitionPrediction | null>(null);
  const [translation, setTranslation] = useState<TranslationResult | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // UI Panels Toggles
  const [showGuide, setShowGuide] = useState(true);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isRecorderOpen, setIsRecorderOpen] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState<{ current: number; target: number } | null>(null);

  // Configuration
  const [config, setConfig] = useState<PipelineConfig>({
    recognitionModelId: 'heuristic_rules',
    nlpModelId: 'rule_grammar',
    bufferSize: 30,
    minPredictionConfidence: 0.65,
    debounceIntervalMs: 1200,
    autoSpeak: true,
    smoothingFactor: 0.35,
  });

  const [vocabularyMode, setVocabularyMode] = useState('asl');

  // Fullscreen Canvas Auto-Resizing
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize PipelineCoordinator
  useEffect(() => {
    const coordinator = new PipelineCoordinator();
    coordinatorRef.current = coordinator;

    coordinator.setListeners({
      onFrame: (frame, rawResults) => {
        setKinematics(frame.kinematics);

        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
            rendererRef.current.render(
              ctx,
              canvasRef.current.width,
              canvasRef.current.height,
              rawResults,
              frame,
              RENDER_OPTIONS
            );
          }
        }
      },
      onPrediction: (pred) => {
        setLatestPrediction(pred);
        playChime(560, 0.1);
      },
      onTranslation: (trans) => {
        setTranslation(trans);
      },
      onMetricsUpdated: (m) => {
        setMetrics(m);
      },
      onRecordingProgress: (current, target) => {
        setRecordingProgress({ current, target });
        if (current >= target) {
          setRecordingProgress(null);
        }
      },
    });

    return () => {
      coordinator.stop();
    };
  }, []);

  // Start Camera
  const handleStartCamera = useCallback(async () => {
    if (!coordinatorRef.current || !videoRef.current) return;
    setIsLoading(true);
    try {
      await coordinatorRef.current.start(videoRef.current);
      setMetrics((prev) => ({ ...prev, cameraActive: true, isTracking: true }));
    } catch (err) {
      console.error('Failed to start camera:', err);
      alert('Camera access failed. Please ensure camera permissions are allowed in your browser.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Stop Camera
  const handleStopCamera = useCallback(() => {
    if (coordinatorRef.current) {
      coordinatorRef.current.stop();
      setMetrics((prev) => ({ ...prev, cameraActive: false, isTracking: false, fps: 0 }));
    }
  }, []);

  // Save Pipeline Config
  const handleSaveConfig = (newConfig: Partial<PipelineConfig>) => {
    if (coordinatorRef.current) {
      coordinatorRef.current.updateConfig(newConfig);
      setConfig(coordinatorRef.current.getConfig());
    }
  };

  // Toggle Mute
  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    setAudioMuted(next);
  };

  // Start dataset recording
  const handleStartRecording = (
    label: string,
    frames: number,
    onComplete: (seq: RecordedGestureSequence) => void
  ) => {
    if (coordinatorRef.current) {
      coordinatorRef.current.startRecording(label, frames, onComplete);
    }
  };

  // Replay speech audio
  const handleReplaySpeech = () => {
    if (translation?.translatedSentence) {
      speakSentence(translation.translatedSentence);
    }
  };

  // Calculate active segmented volume bars (0 to 8) based on confidence / tracking
  const activeBarsCount = !metrics.cameraActive
    ? 0
    : latestPrediction
    ? Math.min(8, Math.max(1, Math.round(latestPrediction.confidence * 8)))
    : kinematics?.rightHand.detected || kinematics?.leftHand.detected
    ? 4
    : 1;

  // Active gesture checks for Left Hand Panel
  const isLeftPoint = kinematics?.leftHand.shape === 'point';
  const isLeftPeace = kinematics?.leftHand.shape === 'victory';
  const isLeftLove = kinematics?.leftHand.shape === 'i_love_you';
  const isLeftOpen = kinematics?.leftHand.shape === 'open';
  const isLeftFist = kinematics?.leftHand.shape === 'fist';
  const isLeftCall = kinematics?.leftHand.shape === 'call_me';
  const isLeftPinch = kinematics?.leftHand.shape === 'pinch';
  const isLeftRaised = kinematics?.leftArm.isRaised ?? false;

  // Active sign checks for Right Hand Panel
  const currentSign = latestPrediction?.label ?? null;
  const isSignHello = currentSign === 'HELLO';
  const isSignThankYou = currentSign === 'THANK YOU';
  const isSignPlease = currentSign === 'PLEASE';
  const isSignGood = currentSign?.includes('GOOD') || currentSign?.includes('THUMBS UP');
  const isSignYes = currentSign === 'YES';
  const isSignNo = currentSign === 'NO';
  const isSignStop = currentSign === 'STOP';
  const isMouthOpen = (kinematics?.face.mouthOpenRatio ?? 0) > 0.32;

  return (
    <div id="stage">
      {/* Background Fullscreen Video */}
      <video
        ref={videoRef}
        id="webcam"
        autoPlay
        playsInline
        muted
      />

      {/* Fullscreen Canvas Overlay */}
      <canvas
        ref={canvasRef}
        id="overlay"
        className={metrics.cameraActive ? '' : 'dimmed'}
      />

      {/* Top Left Dropdowns */}
      <select
        id="keySelect"
        className="gs-select"
        style={{ position: 'absolute', top: 12, left: 12 }}
        value={vocabularyMode}
        onChange={(e) => setVocabularyMode(e.target.value)}
      >
        <option value="asl">ASL American Sign</option>
        <option value="isl">International Sign</option>
        <option value="basic">Greetings & Core</option>
        <option value="digits">Numbers & Alpha</option>
      </select>

      <select
        id="toneSelect"
        className="gs-select"
        style={{ position: 'absolute', top: 48, left: 12 }}
        value={config.recognitionModelId}
        onChange={(e) => handleSaveConfig({ recognitionModelId: e.target.value })}
      >
        <option value="heuristic_rules">⚡ Geometric Engine</option>
        <option value="onnx_runtime">🧠 ONNX Neural Net</option>
        <option value="tensorflow_js">🔥 TensorFlow.js</option>
        <option value="websocket_backend">🌐 Python Backend</option>
      </select>

      {/* Guide Toggle Button */}
      <button
        id="guideToggle"
        className={`gs-button ${showGuide ? 'active' : ''}`}
        style={{ position: 'absolute', top: 90, left: 12 }}
        onClick={() => setShowGuide(!showGuide)}
      >
        {showGuide ? 'Close Guide' : 'Open Guide'}
      </button>

      {/* Gesture Guide Panels (Left & Right) */}
      <div id="gestureGuide" className={showGuide ? '' : 'hidden'}>
        {/* Left Hand Panel */}
        <div
          className="gesture-guide-panel"
          style={{ position: 'absolute', top: 128, left: 12 }}
        >
          <div className="gesture-guide-title">LEFT HAND</div>

          <div className={`gesture-guide-row ${isLeftPoint ? 'active' : ''}`}>
            <span className="gesture-guide-note">I</span>
            <span className="gesture-guide-gesture">☝️</span>
            <span className="gesture-guide-label">POINT</span>
          </div>

          <div className={`gesture-guide-row ${isLeftPeace ? 'active' : ''}`}>
            <span className="gesture-guide-note">II</span>
            <span className="gesture-guide-gesture">✌️</span>
            <span className="gesture-guide-label">PEACE</span>
          </div>

          <div className={`gesture-guide-row ${isLeftLove ? 'active' : ''}`}>
            <span className="gesture-guide-note">III</span>
            <span className="gesture-guide-gesture">🤟</span>
            <span className="gesture-guide-label">LOVE</span>
          </div>

          <div className={`gesture-guide-row ${isLeftOpen ? 'active' : ''}`}>
            <span className="gesture-guide-note">IV</span>
            <span className="gesture-guide-gesture">✋</span>
            <span className="gesture-guide-label">OPEN</span>
          </div>

          <div className={`gesture-guide-row ${isLeftFist ? 'active' : ''}`}>
            <span className="gesture-guide-note">V</span>
            <span className="gesture-guide-gesture">✊</span>
            <span className="gesture-guide-label">FIST</span>
          </div>

          <div className={`gesture-guide-row ${isLeftCall ? 'active' : ''}`}>
            <span className="gesture-guide-note">VI</span>
            <span className="gesture-guide-gesture">🤙</span>
            <span className="gesture-guide-label">CALL</span>
          </div>

          <div className={`gesture-guide-row ${isLeftPinch ? 'active' : ''}`}>
            <span className="gesture-guide-note">VII</span>
            <span className="gesture-guide-gesture">🤏</span>
            <span className="gesture-guide-label">PINCH</span>
          </div>

          {/* Arm Elevation Tilt */}
          <div className="gesture-guide-tilt">
            <div className={`gesture-guide-tilt-item ${!isLeftRaised ? 'active' : ''}`}>
              LOWER
            </div>
            <div className={`gesture-guide-tilt-item ${isLeftRaised ? 'active' : ''}`}>
              RAISE
            </div>
          </div>
        </div>

        {/* Right Hand / Sign Panel */}
        <div
          className="gesture-guide-panel"
          style={{ position: 'fixed', top: 128, right: 12 }}
        >
          <div className="gesture-guide-title">RIGHT HAND</div>

          <div className={`gesture-guide-row ${isSignHello ? 'active' : ''}`}>
            <span className="gesture-guide-note">1</span>
            <span className="gesture-guide-gesture">👋</span>
            <span className="gesture-guide-label">HELLO</span>
          </div>

          <div className={`gesture-guide-row ${isSignThankYou ? 'active' : ''}`}>
            <span className="gesture-guide-note">2</span>
            <span className="gesture-guide-gesture">🙏</span>
            <span className="gesture-guide-label">THANKS</span>
          </div>

          <div className={`gesture-guide-row ${isSignPlease ? 'active' : ''}`}>
            <span className="gesture-guide-note">3</span>
            <span className="gesture-guide-gesture">🤲</span>
            <span className="gesture-guide-label">PLEASE</span>
          </div>

          <div className={`gesture-guide-row ${isSignGood ? 'active' : ''}`}>
            <span className="gesture-guide-note">4</span>
            <span className="gesture-guide-gesture">👍</span>
            <span className="gesture-guide-label">GOOD</span>
          </div>

          <div className={`gesture-guide-row ${isSignYes ? 'active' : ''}`}>
            <span className="gesture-guide-note">5</span>
            <span className="gesture-guide-gesture">✊</span>
            <span className="gesture-guide-label">YES</span>
          </div>

          <div className={`gesture-guide-row ${isSignNo ? 'active' : ''}`}>
            <span className="gesture-guide-note">6</span>
            <span className="gesture-guide-gesture">🤏</span>
            <span className="gesture-guide-label">NO</span>
          </div>

          <div className={`gesture-guide-row ${isSignStop ? 'active' : ''}`}>
            <span className="gesture-guide-note">7</span>
            <span className="gesture-guide-gesture">✋</span>
            <span className="gesture-guide-label">STOP</span>
          </div>

          {/* Facial Gesture Tilt */}
          <div className="gesture-guide-tilt">
            <div className={`gesture-guide-tilt-item ${!isMouthOpen ? 'active' : ''}`}>
              REST
            </div>
            <div className={`gesture-guide-tilt-item ${isMouthOpen ? 'active' : ''}`}>
              OPEN
            </div>
          </div>
        </div>
      </div>

      {/* Volume / Confidence Segmented Meter (Top Right) */}
      <div id="volumeMeter">
        <div id="volumeBars">
          {[7, 6, 5, 4, 3, 2, 1, 0].map((idx) => (
            <div
              key={idx}
              className={`vol-bar ${idx < activeBarsCount ? 'lit' : ''}`}
              data-index={idx}
            />
          ))}
        </div>
        <div className="meter-telemetry">
          <div>{metrics.cameraActive ? `${metrics.fps} FPS • ${metrics.latencyMs}ms` : 'IDLE'}</div>
          {latestPrediction && (
            <div>CONF: <span>{Math.round(latestPrediction.confidence * 100)}%</span></div>
          )}
        </div>
      </div>

      {/* Main Glowing Sign Display (Center Bottom) */}
      <div id="chordDisplay">
        {latestPrediction ? latestPrediction.label : '--'}
      </div>

      {/* Natural Language Translated Subtitle (Bottom Center) */}
      <div
        id="qualityDisplay"
        onClick={handleReplaySpeech}
        title="Click to replay speech synthesis"
      >
        {translation?.translatedSentence
          ? `“${translation.translatedSentence}”`
          : metrics.cameraActive
          ? 'Perform gestures to synthesize signs and sentences...'
          : '--'}
      </div>

      {/* Circular Help Button (Bottom Left) */}
      <button
        id="helpButton"
        onClick={() => setIsHelpOpen(true)}
        title="Open Guide & Model Architecture"
      >
        ?
      </button>

      {/* Creator Credits & Quick Actions (Bottom Right) */}
      <div className="creator-credit">
        <div>
          <span style={{ color: '#e8a13d' }}>SIGNOVA</span> AI Platform
        </div>
        <div>
          <button
            onClick={() => setIsRecorderOpen(true)}
            className="hover:underline text-[10px] text-[#aaa] hover:text-[#e8a13d] bg-transparent border-none p-0 cursor-pointer font-mono"
          >
            [Record Dataset]
          </button>
          {' • '}
          <button
            onClick={handleToggleMute}
            className="hover:underline text-[10px] text-[#aaa] hover:text-[#e8a13d] bg-transparent border-none p-0 cursor-pointer font-mono"
          >
            [Voice: {isMuted ? 'OFF' : 'ON'}]
          </button>
          {metrics.cameraActive && (
            <>
              {' • '}
              <button
                onClick={handleStopCamera}
                className="hover:underline text-[10px] text-red-400 hover:text-red-300 bg-transparent border-none p-0 cursor-pointer font-mono"
              >
                [Stop]
              </button>
            </>
          )}
        </div>
      </div>

      {/* Landing Start Screen Overlay */}
      {!metrics.cameraActive && (
        <div id="startOverlay">
          <div className="start-card">
            <div className="start-eyebrow">SIGNOVA — SIGN LANGUAGE AI</div>
            <h1>recognize sign language with your hands 🙌</h1>
            <p className="start-description">
              Real-time face gesture, upper body arm kinematics, and dual-hand tracking powered by MediaPipe Holistic.
              Plug-and-play architecture ready for custom sign detection and NLP models.
            </p>
            <div className="start-actions">
              <button
                className="start-button primary"
                onClick={() => setIsHelpOpen(true)}
              >
                📖 learn how to play
              </button>
              <button
                className="start-button secondary"
                onClick={handleStartCamera}
                disabled={isLoading}
              >
                {isLoading ? '⏳ starting camera...' : '🤘 play now'}
              </button>
            </div>
            <div className="start-note">
              Camera access is required to track gestures in real-time.
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      <GestureSynthHelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        config={config}
        onSaveConfig={handleSaveConfig}
        onOpenRecorder={() => setIsRecorderOpen(true)}
      />

      {/* Dataset Recorder Modal */}
      <DatasetRecorderModal
        isOpen={isRecorderOpen}
        onClose={() => setIsRecorderOpen(false)}
        isTracking={metrics.cameraActive}
        onStartRecording={handleStartRecording}
        recordingProgress={recordingProgress}
      />
    </div>
  );
}

export default App;
