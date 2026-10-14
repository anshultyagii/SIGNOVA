import React, { useEffect, useRef } from 'react';
import { Info } from 'lucide-react';

export default function CameraFeed({ 
  isActive, 
  onDetection, 
  detectionEngine,
  isHandVisible,
  isSignDetected 
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const holisticRef = useRef(null);
  const cameraHelperRef = useRef(null);

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

  // Handle active stream
  useEffect(() => {
    if (isActive) {
      startCamera();
    } else {
      stopCamera();
    }
  }, [isActive]);

  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        if (window.Camera && videoRef.current) {
          const camera = new window.Camera(videoRef.current, {
            onFrame: async () => {
              if (holisticRef.current && videoRef.current) {
                await holisticRef.current.send({ image: videoRef.current });
              }
            },
            width: 640,
            height: 480
          });
          camera.start();
          cameraHelperRef.current = camera;
        }
      }
    } catch (err) {
      console.error("Failed to start camera feed:", err);
    }
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
  };

  const handleHolisticResults = (results) => {
    // Draw landmarks
    drawLandmarks(results);

    // Run classification engine
    if (detectionEngine && onDetection) {
      const outcome = detectionEngine.processFrame(results);
      const handPresent = !!(
        (results.leftHandLandmarks && results.leftHandLandmarks.length > 0) ||
        (results.rightHandLandmarks && results.rightHandLandmarks.length > 0)
      );

      onDetection({
        prediction: outcome.prediction,
        confidence: outcome.confidence,
        isHandVisible: handPresent,
        status: outcome.status,
        candidates: outcome.candidates
      });
    }
  };

  const drawLandmarks = (results) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Mirror horizontally
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);

    const dw = window.drawConnectors;
    const dl = window.drawLandmarks;
    const mp = window;

    // 1. Draw Upper Body Pose
    if (results.poseLandmarks && dw && dl) {
      dw(ctx, results.poseLandmarks, mp.POSE_CONNECTIONS, {
        color: 'rgba(37, 99, 235, 0.75)',
        lineWidth: 2.5
      });
      dl(ctx, results.poseLandmarks, {
        color: '#2563eb',
        fillColor: '#93c5fd',
        lineWidth: 1.5,
        radius: 3
      });
    }

    // 2. Draw Face Mesh
    if (results.faceLandmarks && dw) {
      dw(ctx, results.faceLandmarks, mp.FACEMESH_TESSELATION, {
        color: 'rgba(99, 102, 241, 0.15)',
        lineWidth: 0.8
      });
    }

    // 3. Draw Left Hand
    if (results.leftHandLandmarks && dw && dl) {
      dw(ctx, results.leftHandLandmarks, mp.HAND_CONNECTIONS, {
        color: '#2563eb',
        lineWidth: 2.5
      });
      dl(ctx, results.leftHandLandmarks, {
        color: '#1d4ed8',
        fillColor: '#60a5fa',
        lineWidth: 1.5,
        radius: 3.5
      });
    }

    // 4. Draw Right Hand
    if (results.rightHandLandmarks && dw && dl) {
      dw(ctx, results.rightHandLandmarks, mp.HAND_CONNECTIONS, {
        color: '#f59e0b',
        lineWidth: 2.5
      });
      dl(ctx, results.rightHandLandmarks, {
        color: '#d97706',
        fillColor: '#fde68a',
        lineWidth: 1.5,
        radius: 3.5
      });
    }

    ctx.restore();
  };

  return (
    <div className="space-y-6">
      
      {/* Video Viewport Container */}
      <div 
        className={`relative rounded-3xl overflow-hidden shadow-2xl transition-all duration-500 ring-1 ring-black/5 bg-slate-900 aspect-[4/3] ${
          isSignDetected ? "ring-4 ring-accent/30 scale-[1.01]" : ""
        }`}
      >
        <video
          ref={videoRef}
          className="w-full h-full object-cover scale-x-[-1]"
          playsInline
          muted
          autoPlay
        />

        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
        />

        {/* Floating Help Banner when hand is not visible */}
        {!isHandVisible && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-medium pointer-events-none animate-bounce z-20">
            Raise your hand to start
          </div>
        )}
      </div>

      {/* Best Practices Info Card */}
      <div className="bg-card rounded-2xl p-6 border shadow-sm flex items-start gap-4">
        <div className="p-2.5 rounded-full bg-blue-50 text-blue-600 shrink-0">
          <Info className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h4 className="font-semibold text-sm">Best Practices</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Ensure good lighting on your hands and upper body
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Keep hand steady for accurate word and number detection
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Face the camera directly so facial expressions are tracked
            </li>
          </ul>
        </div>
      </div>

    </div>
  );
}
