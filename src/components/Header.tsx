import React from 'react';
import {
  Activity,
  Layers,
  Settings,
  Database,
  Volume2,
  VolumeX,
  Code2,
  Sparkles,
} from 'lucide-react';
import type { TrackerMetrics } from '../services/vision/HolisticTracker';
import type { PipelineConfig } from '../types/models';

interface HeaderProps {
  metrics: TrackerMetrics;
  config: PipelineConfig;
  activeSignModelName: string;
  activeNLPModelName: string;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenSettings: () => void;
  onOpenRecorder: () => void;
  onOpenArchitecture: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  metrics,
  activeSignModelName,
  activeNLPModelName,
  isMuted,
  onToggleMute,
  onOpenSettings,
  onOpenRecorder,
  onOpenArchitecture,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-6 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
                SIGNOVA
              </h1>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                v1.0 Vision Core
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Sign Language Recognition & Multimodal Gesture Architecture
            </p>
          </div>
        </div>

        {/* Live Metrics & Model Indicators */}
        <div className="flex flex-wrap items-center gap-2">
          {/* FPS & Latency */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300 font-mono">
            <Activity
              className={`w-3.5 h-3.5 ${
                metrics.isTracking ? 'text-emerald-400 animate-pulse' : 'text-slate-500'
              }`}
            />
            <span className="font-semibold text-slate-100">{metrics.fps} FPS</span>
            <span className="text-slate-500">•</span>
            <span>{metrics.latencyMs}ms</span>
          </div>

          {/* Active Model Pill */}
          <div
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-950/40 border border-indigo-800/50 text-xs text-indigo-300 cursor-pointer hover:bg-indigo-900/40 transition-colors"
            title="Click to change model backend"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span className="truncate max-w-[130px] font-medium">{activeSignModelName}</span>
          </div>

          {/* Active NLP Pill */}
          <div
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-950/40 border border-purple-800/50 text-xs text-purple-300 cursor-pointer hover:bg-purple-900/40 transition-colors hidden sm:flex"
            title="Click to configure NLP model"
          >
            <span className="font-medium truncate max-w-[120px]">{activeNLPModelName}</span>
          </div>

          {/* Audio TTS toggle */}
          <button
            onClick={onToggleMute}
            className={`p-2 rounded-lg border transition-colors ${
              isMuted
                ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/40'
            }`}
            title={isMuted ? 'Unmute Speech Synthesis' : 'Mute Speech Synthesis'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Dataset Recorder */}
          <button
            onClick={onOpenRecorder}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors"
          >
            <Database className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Record Dataset</span>
          </button>

          {/* Architecture Blueprint Guide */}
          <button
            onClick={onOpenArchitecture}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-md shadow-indigo-600/20 transition-colors"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Architecture & Docs</span>
          </button>

          {/* Settings button */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            title="Open Pipeline Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
