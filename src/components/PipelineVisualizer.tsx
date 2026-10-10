import React from 'react';
import {
  Camera,
  Eye,
  Cpu,
  Boxes,
  Languages,
  Volume2,
  ArrowRight,
} from 'lucide-react';

interface PipelineVisualizerProps {
  isTracking: boolean;
  activeSignModelName: string;
  activeNLPModelName: string;
}

export const PipelineVisualizer: React.FC<PipelineVisualizerProps> = ({
  isTracking,
  activeSignModelName,
  activeNLPModelName,
}) => {
  const stages = [
    {
      id: 'camera',
      icon: Camera,
      title: 'Webcam Stream',
      sub: 'RGB 720p @ 30 FPS',
      status: isTracking ? 'active' : 'idle',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10 border-blue-500/20',
    },
    {
      id: 'vision',
      icon: Eye,
      title: 'MediaPipe Holistic',
      sub: 'Face (468), Arms (33), Hands (42)',
      status: isTracking ? 'active' : 'idle',
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10 border-cyan-500/20',
    },
    {
      id: 'processor',
      icon: Cpu,
      title: 'Normalizer & Buffer',
      sub: 'Centered, Scale-Invariant [1662]',
      status: isTracking ? 'active' : 'idle',
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10 border-amber-500/20',
    },
    {
      id: 'sign_model',
      icon: Boxes,
      title: 'Sign Classifier',
      sub: activeSignModelName,
      badge: 'Pluggable AI',
      status: isTracking ? 'active' : 'idle',
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10 border-indigo-500/30',
    },
    {
      id: 'nlp_model',
      icon: Languages,
      title: 'NLP Interpreter',
      sub: activeNLPModelName,
      badge: 'Pluggable NLP',
      status: isTracking ? 'active' : 'idle',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10 border-purple-500/30',
    },
    {
      id: 'output',
      icon: Volume2,
      title: 'Voice & Text',
      sub: 'SpeechSynthesis & UI',
      status: isTracking ? 'active' : 'idle',
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/20',
    },
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-white uppercase">
            End-to-End Processing Architecture
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Modular pipeline allowing plug-and-play swapping of vision, gesture classification, and NLP models.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 relative">
        {stages.map((stage, idx) => {
          const Icon = stage.icon;
          return (
            <div key={stage.id} className="relative flex flex-col">
              <div
                className={`flex-1 rounded-xl p-3 border ${stage.bgColor} flex flex-col justify-between transition-all ${
                  stage.status === 'active' ? 'shadow-md shadow-indigo-950/20' : 'opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className={`w-7 h-7 rounded-lg bg-slate-950 flex items-center justify-center ${stage.color}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    {stage.badge && (
                      <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {stage.badge}
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-bold text-white tracking-tight">{stage.title}</div>
                </div>
                <div className="text-[11px] text-slate-400 mt-1 truncate" title={stage.sub}>
                  {stage.sub}
                </div>
              </div>

              {/* Arrow Connector on desktop */}
              {idx < stages.length - 1 && (
                <div className="hidden lg:flex absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-slate-600">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
