import React, { useRef, useEffect } from 'react';
import {
  Video,
  VideoOff,
  User,
  Hand,
  Compass,
  Smile,
  Sparkles,
  FlipHorizontal,
  Flame,
} from 'lucide-react';
import type { RenderOptions } from '../services/vision/CanvasRenderer';
import type { RecognitionPrediction } from '../types/models';

interface ViewportProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  isCameraActive: boolean;
  onToggleCamera: () => void;
  renderOptions: RenderOptions;
  onUpdateRenderOptions: (options: Partial<RenderOptions>) => void;
  latestPrediction: RecognitionPrediction | null;
  isLoading: boolean;
}

export const Viewport: React.FC<ViewportProps> = ({
  videoRef,
  canvasRef,
  isCameraActive,
  onToggleCamera,
  renderOptions,
  onUpdateRenderOptions,
  latestPrediction,
  isLoading,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Synchronize canvas dimensions with video container
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        canvasRef.current.width = rect.width;
        canvasRef.current.height = rect.height;
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, [canvasRef]);

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl flex items-center justify-center group"
    >
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Hidden Video element for MediaPipe stream */}
      <video
        ref={videoRef}
        playsInline
        muted
        className={`absolute inset-0 w-full h-full object-cover ${
          renderOptions.mirror ? '-scale-x-100' : ''
        } ${isCameraActive ? 'opacity-80' : 'opacity-0'}`}
      />

      {/* High Performance Canvas Overlay */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10"
      />

      {/* Idle / Camera Start Prompt */}
      {!isCameraActive && (
        <div className="relative z-20 flex flex-col items-center text-center p-6 max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4 text-indigo-400">
            <Video className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            Real-Time Gesture & Sign Intelligence
          </h2>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            Tracks 468 face landmarks, upper body arm kinematics (shoulders, elbows, wrists),
            and dual 21-landmark hand gestures simultaneously using MediaPipe Holistic.
          </p>
          <button
            onClick={onToggleCamera}
            disabled={isLoading}
            className="flex items-center gap-2.5 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-semibold text-sm shadow-xl shadow-indigo-600/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Initializing MediaPipe...</span>
              </>
            ) : (
              <>
                <Video className="w-4 h-4" />
                <span>Start Camera & Vision Engine</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Live Recognized Sign Badge Overlay */}
      {isCameraActive && latestPrediction && (
        <div className="absolute top-4 left-4 z-20 pointer-events-none animate-in fade-in slide-in-from-top duration-200">
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-indigo-500/40 shadow-xl shadow-indigo-950/40">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 animate-pulse">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider font-semibold text-indigo-300">
                Sign Recognized
              </div>
              <div className="text-base font-bold text-white flex items-center gap-2">
                <span>{latestPrediction.label}</span>
                <span className="text-xs font-mono font-normal text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  {Math.round(latestPrediction.confidence * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Viewport Controls Toolbar */}
      {isCameraActive && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 p-1.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-800 shadow-xl">
          {/* Camera toggle */}
          <button
            onClick={onToggleCamera}
            className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 transition-colors"
            title="Stop Camera"
          >
            <VideoOff className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-slate-800 mx-1" />

          {/* Toggle Arm & Upper Body Skeleton */}
          <button
            onClick={() => onUpdateRenderOptions({ showPose: !renderOptions.showPose })}
            className={`p-2 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1.5 ${
              renderOptions.showPose
                ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Upper Body & Arms Skeleton"
          >
            <User className="w-4 h-4" />
            <span className="hidden md:inline">Arms</span>
          </button>

          {/* Toggle Hands */}
          <button
            onClick={() => onUpdateRenderOptions({ showHands: !renderOptions.showHands })}
            className={`p-2 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1.5 ${
              renderOptions.showHands
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Hand Landmarks"
          >
            <Hand className="w-4 h-4" />
            <span className="hidden md:inline">Hands</span>
          </button>

          {/* Toggle Face Mesh */}
          <button
            onClick={() => onUpdateRenderOptions({ showFace: !renderOptions.showFace })}
            className={`p-2 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1.5 ${
              renderOptions.showFace
                ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Face Mesh"
          >
            <Smile className="w-4 h-4" />
            <span className="hidden md:inline">Face</span>
          </button>

          {/* Toggle Joint Angles */}
          <button
            onClick={() => onUpdateRenderOptions({ showAngles: !renderOptions.showAngles })}
            className={`p-2 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1.5 ${
              renderOptions.showAngles
                ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Elbow Angles (°)"
          >
            <Compass className="w-4 h-4" />
            <span className="hidden md:inline">Angles</span>
          </button>

          {/* Toggle Motion Trails */}
          <button
            onClick={() => onUpdateRenderOptions({ showTrails: !renderOptions.showTrails })}
            className={`p-2 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1.5 ${
              renderOptions.showTrails
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Wrist Motion Trails"
          >
            <Flame className="w-4 h-4" />
            <span className="hidden md:inline">Trails</span>
          </button>

          {/* Mirror Flip */}
          <button
            onClick={() => onUpdateRenderOptions({ mirror: !renderOptions.mirror })}
            className={`p-2 rounded-lg border transition-colors ${
              renderOptions.mirror
                ? 'bg-slate-800 border-slate-700 text-slate-200'
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
            title="Mirror Viewport"
          >
            <FlipHorizontal className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
