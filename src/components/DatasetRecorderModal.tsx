import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  Play,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  FileCode,
} from 'lucide-react';
import type { RecordedGestureSequence } from '../types/landmarks';
import { exportSequenceAsJSON, exportSequenceAsCSV } from '../utils/export';

interface DatasetRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  isTracking: boolean;
  onStartRecording: (label: string, frames: number, onComplete: (seq: RecordedGestureSequence) => void) => void;
  recordingProgress: { current: number; target: number } | null;
}

export const DatasetRecorderModal: React.FC<DatasetRecorderModalProps> = ({
  isOpen,
  onClose,
  isTracking,
  onStartRecording,
  recordingProgress,
}) => {
  const [label, setLabel] = useState('THANK_YOU');
  const [customLabel, setCustomLabel] = useState('');
  const [frameCount, setFrameCount] = useState(30);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [recordedSequence, setRecordedSequence] = useState<RecordedGestureSequence | null>(null);

  const presetLabels = [
    'HELLO',
    'THANK_YOU',
    'PLEASE',
    'YES',
    'NO',
    'I_LOVE_YOU',
    'HELP',
    'WATER',
    'GOOD',
    'STOP',
  ];

  // Countdown handler before recording triggers
  useEffect(() => {
    if (countdown === null) return;

    if (countdown > 0) {
      const timer = setTimeout(() => {
        if (countdown === 1) {
          setCountdown(null);
          const targetLabel = label === 'CUSTOM' ? customLabel.trim() || 'CUSTOM_SIGN' : label;
          onStartRecording(targetLabel, frameCount, (seq) => {
            setRecordedSequence(seq);
          });
        } else {
          setCountdown(countdown - 1);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown, label, customLabel, frameCount, onStartRecording]);

  if (!isOpen) return null;

  const handleStart = () => {
    setRecordedSequence(null);
    setCountdown(3); // 3-second countdown
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Gesture Dataset Recorder</h2>
            <p className="text-xs text-slate-400">
              Capture normalized 3D landmark sequences for training your custom sign model
            </p>
          </div>
        </div>

        {!isTracking ? (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-3 mb-4">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>Please start the webcam camera first to record gesture sequences.</span>
          </div>
        ) : null}

        {/* Form Controls */}
        <div className="space-y-4">
          {/* Label selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Sign Label
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 mb-2">
              {presetLabels.map((p) => (
                <button
                  key={p}
                  onClick={() => setLabel(p)}
                  className={`px-2 py-1.5 rounded-lg text-xs font-mono font-medium border transition-colors ${
                    label === p
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <input
                type="text"
                placeholder="Or enter custom label..."
                value={customLabel}
                onChange={(e) => {
                  setCustomLabel(e.target.value);
                  setLabel('CUSTOM');
                }}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Sequence Length */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Sequence Length (Frames)
            </label>
            <div className="flex items-center gap-2">
              {[15, 30, 45, 60].map((f) => (
                <button
                  key={f}
                  onClick={() => setFrameCount(f)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-medium border transition-colors ${
                    frameCount === f
                      ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {f} frames (~{(f / 30).toFixed(1)}s)
                </button>
              ))}
            </div>
          </div>

          {/* Countdown & Recording Indicator */}
          {countdown !== null && (
            <div className="py-8 flex flex-col items-center justify-center text-center animate-in zoom-in-95">
              <div className="text-5xl font-black text-amber-400 font-mono mb-2 animate-bounce">
                {countdown}
              </div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">
                Get ready to perform sign: <span className="text-white font-bold">{label}</span>
              </p>
            </div>
          )}

          {/* Recording Progress Bar */}
          {recordingProgress && (
            <div className="py-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-red-400 flex items-center gap-1.5 animate-pulse">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  RECORDING IN PROGRESS...
                </span>
                <span className="font-mono text-slate-300">
                  {recordingProgress.current} / {recordingProgress.target} frames
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-red-500 transition-all duration-75"
                  style={{
                    width: `${(recordingProgress.current / recordingProgress.target) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Action Trigger */}
          {countdown === null && !recordingProgress && (
            <button
              onClick={handleStart}
              disabled={!isTracking}
              className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                isTracking
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/25'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Record Sequence ({frameCount} Frames)</span>
            </button>
          )}

          {/* Success Download Card */}
          {recordedSequence && (
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/40 space-y-3 mt-3 animate-in fade-in">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
                <CheckCircle2 className="w-4 h-4" />
                <span>Captured {recordedSequence.frameCount} frames for "{recordedSequence.label}"!</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Features normalized to shoulder origin & ready for PyTorch / TensorFlow / Scikit-learn.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => exportSequenceAsJSON(recordedSequence)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-colors"
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>Download JSON</span>
                </button>
                <button
                  onClick={() => exportSequenceAsCSV(recordedSequence)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Download CSV</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
