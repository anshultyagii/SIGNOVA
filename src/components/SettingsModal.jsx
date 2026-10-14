import React, { useState, useEffect } from 'react';
import { Settings, Volume2, Sliders, Key, Cpu, RotateCcw, X, Check } from 'lucide-react';

export default function SettingsModal({ 
  isOpen, 
  onClose, 
  confidenceThreshold, 
  setConfidenceThreshold,
  smoothingFactor,
  setSmoothingFactor,
  speechRate,
  setSpeechRate,
  nlpService
}) {
  const [apiKey, setApiKey] = useState(nlpService?.apiKey || "");
  const [useAi, setUseAi] = useState(nlpService?.useAiMode || false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const loadVoices = () => {
        const v = window.speechSynthesis.getVoices();
        setVoices(v.filter(x => x.lang.startsWith("en")));
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  if (!isOpen) return null;

  const handleSave = () => {
    if (nlpService) {
      nlpService.setApiKey(apiKey);
      nlpService.setAiMode(useAi);
      if (selectedVoiceName && voices.length > 0) {
        const found = voices.find(v => v.name === selectedVoiceName);
        if (found) nlpService.selectedVoice = found;
      }
    }
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const handleReset = () => {
    setConfidenceThreshold(0.65);
    setSmoothingFactor(0.35);
    setSpeechRate(1.0);
    setUseAi(false);
    setApiKey("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="glass-card max-w-lg w-full p-6 border border-slate-700 shadow-2xl relative">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-cyan-400" />
            <h3 className="font-display font-bold text-xl text-white">
              Engine & Audio Settings
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6 py-5 max-h-[70vh] overflow-y-auto pr-1">

          {/* 1. Detection Sensitivity & Accuracy */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>Detection Sensitivity</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-300">Confidence Threshold</span>
                  <span className="text-cyan-400 font-mono font-bold">
                    {Math.round(confidenceThreshold * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.30"
                  max="0.95"
                  step="0.05"
                  value={confidenceThreshold}
                  onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <span className="text-[10px] text-slate-500 block mt-1">
                  Higher threshold ensures higher precision; lower threshold recognizes faster.
                </span>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-300">Temporal Smoothing Factor</span>
                  <span className="text-cyan-400 font-mono font-bold">
                    {Math.round(smoothingFactor * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.10"
                  max="0.80"
                  step="0.05"
                  value={smoothingFactor}
                  onChange={(e) => setSmoothingFactor(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <span className="text-[10px] text-slate-500 block mt-1">
                  Stabilizes prediction transitions and filters camera noise.
                </span>
              </div>
            </div>
          </div>

          {/* 2. Text-to-Speech Audio */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Voice & Text-to-Speech</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1">Voice Selection:</label>
                <select
                  value={selectedVoiceName}
                  onChange={(e) => setSelectedVoiceName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="">Default System English Voice</option>
                  {voices.map((v, i) => (
                    <option key={i} value={v.name}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Speech Rate</span>
                  <span className="text-emerald-400 font-mono font-bold">{speechRate}x</span>
                </div>
                <input
                  type="range"
                  min="0.6"
                  max="1.6"
                  step="0.1"
                  value={speechRate}
                  onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* 3. AI / LLM Sentence Synthesis */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
              <Key className="w-3.5 h-3.5 text-indigo-400" />
              <span>Optional LLM AI Sentence Synthesis</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={useAi}
                  onChange={(e) => setUseAi(e.target.checked)}
                  className="rounded border-slate-700 text-indigo-500 focus:ring-indigo-400"
                />
                <span className="font-medium">Enable Cloud Generative AI Reconstructor (Gemini)</span>
              </label>

              {useAi && (
                <div className="space-y-1.5 animate-fade-in">
                  <label className="text-[11px] text-slate-400 block">
                    Google Gemini API Key:
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-500">
                    If empty, the built-in offline linguistic rule engine operates with zero latency.
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-white text-xs font-semibold shadow-glow-cyan transition-all"
            >
              {savedSuccess ? <Check className="w-4 h-4 text-emerald-400" /> : null}
              <span>{savedSuccess ? 'Saved!' : 'Save Changes'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
