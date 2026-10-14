import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, CameraOff, Volume2, Sparkles, RefreshCw, CheckCircle2, 
  Layers, Eye, UserCheck, Check, Plus, AlertCircle, Play, Pause,
  ChevronRight, Info, HelpCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function DetectionStudio({ 
  onTokenDetected, 
  onAddToSentence,
  onSpeak, 
  currentTokens, 
  reconstructedSentence,
  vocabulary,
  detectionEngine,
  activePracticeSign,
  setActivePracticeSign
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Studio states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [fps, setFps] = useState(0);
  const [mirrored, setMirrored] = useState(true);

  // Overlay toggles
  const [showHands, setShowHands] = useState(true);
  const [showPose, setShowPose] = useState(true);
  const [showFace, setShowFace] = useState(true);

  // Detection states
  const [currentDetection, setCurrentDetection] = useState(null);
  const [detectionConfidence, setDetectionConfidence] = useState(0);
  const [candidates, setCandidates] = useState([]);
  const [engineStatus, setEngineStatus] = useState("idle");
  const [telemetry, setTelemetry] = useState({});
  const [autoAppend, setAutoAppend] = useState(true);

  // Practice feedback
  const [practiceSuccess, setPracticeSuccess] = useState(false);

  // Internal refs
  const holisticRef = useRef(null);
  const cameraHelperRef = useRef(null);
  const frameCountRef = useRef(0);
  const lastFpsTimeRef = useRef(Date.now());
  const lastEmittedTokenRef = useRef(null);
  const lastEmittedTimeRef = useRef(0);

  // Initialize MediaPipe Holistic
  useEffect(() => {
    let isMounted = true;

    async function initHolistic() {
      try {
        if (typeof window !== "undefined" && window.Holistic) {
          const holistic = new window.Holistic({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`
          });

          holistic.setOptions({
            modelComplexity: 1,
            smoothLandmarks: true,
            enableSegmentation: false,
            smoothSegmentation: false,
            refineFaceLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
          });

          holistic.onResults((results) => {
            if (!isMounted) return;
            handleHolisticResults(results);
          });

          holisticRef.current = holistic;
        } else {
          console.warn("MediaPipe Holistic script loading...");
        }
      } catch (err) {
        console.error("Error setting up MediaPipe Holistic:", err);
      }
    }

    initHolistic();

    return () => {
      isMounted = false;
      stopCamera();
    };
  }, []);

  // Handle camera start/stop
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Webcam access not supported in this browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCameraActive(true);

        // Start MediaPipe Camera helper or custom loop
        if (window.Camera && videoRef.current) {
          const camera = new window.Camera(videoRef.current, {
            onFrame: async () => {
              if (holisticRef.current && videoRef.current) {
                await holisticRef.current.send({ image: videoRef.current });
              }
            },
            width: 1280,
            height: 720
          });
          camera.start();
          cameraHelperRef.current = camera;
        } else {
          // Fallback requestAnimationFrame loop
          startCustomFrameLoop();
        }
      }
    } catch (err) {
      console.error("Failed to start camera:", err);
      setCameraError(err.message || "Could not access webcam. Please verify permissions.");
      setIsCameraActive(false);
    }
  };

  const startCustomFrameLoop = () => {
    let animId;
    const process = async () => {
      if (videoRef.current && videoRef.current.readyState >= 2 && holisticRef.current) {
        try {
          await holisticRef.current.send({ image: videoRef.current });
        } catch (e) {
          console.warn("Frame send error:", e);
        }
      }
      animId = requestAnimationFrame(process);
    };
    animId = requestAnimationFrame(process);
    cameraHelperRef.current = { stop: () => cancelAnimationFrame(animId) };
  };

  const stopCamera = () => {
    if (cameraHelperRef.current) {
      try { cameraHelperRef.current.stop(); } catch (e) {}
      cameraHelperRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setFps(0);
  };

  // Process Holistic Results on each video frame
  const handleHolisticResults = (results) => {
    // 1. Calculate real-time FPS
    frameCountRef.current++;
    const now = Date.now();
    if (now - lastFpsTimeRef.current >= 1000) {
      setFps(frameCountRef.current);
      frameCountRef.current = 0;
      lastFpsTimeRef.current = now;
    }

    // 2. Render overlays onto canvas
    drawLandmarksOnCanvas(results);

    // 3. Process with detection engine
    if (detectionEngine) {
      const outcome = detectionEngine.processFrame(results);
      setEngineStatus(outcome.status);
      setCandidates(outcome.candidates || []);
      setTelemetry(outcome.telemetry || {});

      if (outcome.prediction) {
        setCurrentDetection(outcome.prediction);
        setDetectionConfidence(Math.round(outcome.confidence * 100));

        // Check Practice Mode match
        if (activePracticeSign && activePracticeSign.token === outcome.prediction) {
          if (!practiceSuccess) {
            setPracticeSuccess(true);
            confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
            setTimeout(() => setPracticeSuccess(false), 2500);
          }
        }

        // Auto append logic with debounce
        const cooldown = now - lastEmittedTimeRef.current;
        if (autoAppend && (lastEmittedTokenRef.current !== outcome.prediction || cooldown > 2200)) {
          lastEmittedTokenRef.current = outcome.prediction;
          lastEmittedTimeRef.current = now;
          if (onTokenDetected) {
            onTokenDetected(outcome.prediction);
          }
        }
      } else if (outcome.candidate) {
        // Holding intermediate candidate
        setCurrentDetection(outcome.candidate);
        setDetectionConfidence(Math.round(outcome.candidateConfidence * 100));
      } else {
        if (outcome.status === "idle" || outcome.status === "resting") {
          setCurrentDetection(null);
          setDetectionConfidence(0);
        }
      }
    }
  };

  // Canvas drawing for hands, upper body, and face
  const drawLandmarksOnCanvas = (results) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (mirrored) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    const dw = window.drawConnectors;
    const dl = window.drawLandmarks;
    const mp = window;

    // 1. Draw Pose / Upper Body (shoulders, arms, chest)
    if (showPose && results.poseLandmarks && dw && dl) {
      // Connectors in vibrant electric blue
      dw(ctx, results.poseLandmarks, mp.POSE_CONNECTIONS, {
        color: 'rgba(59, 130, 246, 0.75)',
        lineWidth: 3
      });
      dl(ctx, results.poseLandmarks, {
        color: '#60a5fa',
        fillColor: '#1d4ed8',
        lineWidth: 2,
        radius: 4
      });
    }

    // 2. Draw Face Mesh contour
    if (showFace && results.faceLandmarks && dw && dl) {
      dw(ctx, results.faceLandmarks, mp.FACEMESH_TESSELATION, {
        color: 'rgba(99, 102, 241, 0.18)',
        lineWidth: 1
      });
      // Facial markers for lips and eyebrows
      if (mp.FACEMESH_LIPS) {
        dw(ctx, results.faceLandmarks, mp.FACEMESH_LIPS, {
          color: 'rgba(236, 72, 153, 0.65)',
          lineWidth: 2
        });
      }
    }

    // 3. Draw Left Hand (cyan neon)
    if (showHands && results.leftHandLandmarks && dw && dl) {
      dw(ctx, results.leftHandLandmarks, mp.HAND_CONNECTIONS, {
        color: '#06b6d4',
        lineWidth: 3
      });
      dl(ctx, results.leftHandLandmarks, {
        color: '#22d3ee',
        fillColor: '#0891b2',
        lineWidth: 2,
        radius: 4
      });
    }

    // 4. Draw Right Hand (emerald neon)
    if (showHands && results.rightHandLandmarks && dw && dl) {
      dw(ctx, results.rightHandLandmarks, mp.HAND_CONNECTIONS, {
        color: '#10b981',
        lineWidth: 3
      });
      dl(ctx, results.rightHandLandmarks, {
        color: '#34d399',
        fillColor: '#059669',
        lineWidth: 2,
        radius: 4
      });
    }

    ctx.restore();
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Practice Indicator */}
      {activePracticeSign && (
        <div className={`p-4 rounded-2xl border transition-all ${
          practiceSuccess 
            ? 'bg-emerald-950/70 border-emerald-500 shadow-glow-cyan text-emerald-200' 
            : 'bg-cyan-950/50 border-cyan-800 text-cyan-200'
        } flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-900/60 flex items-center justify-center font-bold text-lg">
              🎯
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-cyan-400 font-semibold">
                Practice Mode Active
              </p>
              <h4 className="text-lg font-bold text-white">
                Sign: "{activePracticeSign.label}" ({activePracticeSign.type})
              </h4>
              <p className="text-xs text-slate-300">
                {activePracticeSign.summary}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {practiceSuccess ? (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500 text-white rounded-lg text-sm font-bold animate-bounce">
                <Check className="w-4 h-4" /> Perfect Match!
              </span>
            ) : (
              <span className="text-xs bg-cyan-900/80 px-2.5 py-1 rounded-lg text-cyan-300 border border-cyan-700">
                Show sign to webcam
              </span>
            )}
            <button
              onClick={() => setActivePracticeSign(null)}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded"
            >
              Exit
            </button>
          </div>
        </div>
      )}

      {/* Main Studio Grid: Video Stream + Prediction HUD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Video & Canvas Viewport (7 Cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="relative aspect-[16/9] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl group">
            
            {/* Live Video Element */}
            <video
              ref={videoRef}
              className={`w-full h-full object-cover ${mirrored ? 'scale-x-[-1]' : ''}`}
              playsInline
              muted
              autoPlay
            />

            {/* Holistic Tracking Canvas */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none z-10"
            />

            {/* Placeholder when camera is inactive */}
            {!isCameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0d1a]/90 z-20 p-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-cyan-950/80 border border-cyan-800/80 flex items-center justify-center mb-4 text-cyan-400 shadow-glow-cyan">
                  <Camera className="w-8 h-8" />
                </div>
                <h3 className="font-display font-bold text-xl text-white mb-2">
                  Camera is Standing By
                </h3>
                <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
                  Enable your webcam to start real-time MediaPipe Holistic detection. We track your hands, upper body, and facial expressions securely in your browser.
                </p>
                <button
                  onClick={startCamera}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-sm shadow-glow-blue transition-all transform hover:scale-105 active:scale-95"
                >
                  <Camera className="w-4 h-4" />
                  <span>Start Camera & Detection</span>
                </button>

                {cameraError && (
                  <div className="mt-4 p-3 bg-rose-950/80 border border-rose-800 text-rose-300 rounded-xl text-xs max-w-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{cameraError}</span>
                  </div>
                )}
              </div>
            )}

            {/* Over-video HUD badges */}
            {isCameraActive && (
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-20 pointer-events-none">
                
                {/* Tracking Telemetry Pill */}
                <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-semibold text-white">{fps} FPS</span>
                  <span className="text-slate-600">|</span>
                  <span className="text-slate-300">
                    Hands: {telemetry.hasRightHand && telemetry.hasLeftHand ? 'Both' : (telemetry.dominantHand || 'None')}
                  </span>
                  <span className="text-slate-600">|</span>
                  <span className="text-slate-300">
                    Pose: {telemetry.hasPose ? 'Locked' : 'Off'}
                  </span>
                </div>

                {/* Status Indicator */}
                <div className={`px-3 py-1.5 rounded-xl text-xs font-semibold backdrop-blur-md border ${
                  engineStatus === 'detected'
                    ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-glow-cyan'
                    : engineStatus === 'tracking'
                    ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300'
                    : 'bg-slate-950/80 border-slate-800 text-slate-400'
                }`}>
                  {engineStatus === 'detected' ? '● Sign Recognized' : (engineStatus === 'tracking' ? '○ Holding...' : 'Waiting for gesture')}
                </div>
              </div>
            )}

            {/* Bottom In-Frame Overlay Controls */}
            {isCameraActive && (
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between z-20">
                <div className="flex items-center gap-1.5 bg-slate-950/80 backdrop-blur-md p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setShowHands(!showHands)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      showHands ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
                    }`}
                    title="Toggle Hand Skeletons"
                  >
                    Hands
                  </button>
                  <button
                    onClick={() => setShowPose(!showPose)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      showPose ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'text-slate-400 hover:text-white'
                    }`}
                    title="Toggle Upper Body Pose"
                  >
                    Body
                  </button>
                  <button
                    onClick={() => setShowFace(!showFace)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      showFace ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-white'
                    }`}
                    title="Toggle Face Mesh"
                  >
                    Face
                  </button>
                  <button
                    onClick={() => setMirrored(!mirrored)}
                    className="p-1 text-slate-400 hover:text-white"
                    title="Flip Mirror"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={stopCamera}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-semibold transition-colors"
                >
                  <CameraOff className="w-3.5 h-3.5" />
                  <span>Stop Camera</span>
                </button>
              </div>
            )}

          </div>

          {/* Tips under viewport */}
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-cyan-400" />
              Tip: Position upper body and face clearly with good lighting.
            </span>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={autoAppend}
                  onChange={(e) => setAutoAppend(e.target.checked)}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-400"
                />
                <span>Auto-append confirmed signs</span>
              </label>
            </div>
          </div>
        </div>

        {/* Real-time Recognition HUD (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Main Detected Sign Card */}
          <div className="glass-card p-6 relative overflow-hidden border border-slate-800/80 shadow-glass">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-wider font-semibold text-cyan-400">
                Live Sign Output
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700/60">
                Word & Number Mode
              </span>
            </div>

            {/* Giant Recognition Typography */}
            <div className="py-4 text-center">
              {currentDetection ? (
                <div className="space-y-1">
                  <h2 className="font-display font-extrabold text-4xl sm:text-5xl gradient-text tracking-tight animate-fade-in">
                    {currentDetection}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Multimodal Gesture Identified
                  </p>
                </div>
              ) : (
                <div className="py-6 text-slate-500 flex flex-col items-center">
                  <Sparkles className="w-8 h-8 mb-2 opacity-40 animate-pulse" />
                  <p className="text-base font-medium">Ready for Input</p>
                  <p className="text-xs">Raise hands and perform any sign</p>
                </div>
              )}
            </div>

            {/* Confidence Bar */}
            <div className="space-y-2 pt-2 border-t border-slate-800/60">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Detection Confidence</span>
                <span className="font-bold text-cyan-300">{detectionConfidence}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-400 rounded-full transition-all duration-200"
                  style={{ width: `${detectionConfidence}%` }}
                />
              </div>
            </div>

            {/* Action Buttons for Current Detection */}
            {currentDetection && (
              <div className="mt-5 flex items-center gap-2">
                <button
                  onClick={() => onAddToSentence && onAddToSentence(currentDetection)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs shadow-glow-cyan transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add to Sentence</span>
                </button>
                <button
                  onClick={() => onSpeak && onSpeak(currentDetection)}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                  title="Speak sign aloud"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Top-3 Candidate Probabilities */}
          <div className="glass-card p-5 border border-slate-800/80">
            <h4 className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-3">
              Candidate Gesture Ranking
            </h4>
            <div className="space-y-2.5">
              {candidates.length > 0 ? (
                candidates.map((cand, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-300">{cand.token}</span>
                      <span className="text-cyan-400 font-mono">{Math.round(cand.score * 100)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-cyan-500/80 rounded-full transition-all duration-150"
                        style={{ width: `${Math.round(cand.score * 100)}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-500 py-2 text-center">
                  Sign candidates will appear here during motion...
                </div>
              )}
            </div>
          </div>

          {/* Live Detected Tokens Stream Preview */}
          <div className="glass-card p-5 border border-slate-800/80">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                Detected Gloss Stream
              </h4>
              <span className="text-[11px] text-slate-500">
                {currentTokens.length} tokens
              </span>
            </div>

            <div className="min-h-[50px] p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/60 flex flex-wrap gap-1.5 items-center">
              {currentTokens.length > 0 ? (
                currentTokens.map((token, i) => (
                  <span 
                    key={i}
                    className="px-2.5 py-1 rounded-lg bg-cyan-950/70 border border-cyan-800/60 text-cyan-300 font-mono text-xs font-semibold animate-fade-in"
                  >
                    {token}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-600 italic">
                  No signs in buffer yet. Confirmed signs flow here.
                </span>
              )}
            </div>

            {/* Quick Sentence Output */}
            {reconstructedSentence && (
              <div className="mt-3 p-3 rounded-xl bg-indigo-950/40 border border-indigo-900/60">
                <span className="text-[10px] uppercase font-bold text-indigo-400 block mb-1">
                  Reconstructed English
                </span>
                <p className="text-sm font-medium text-white">
                  "{reconstructedSentence}"
                </p>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
