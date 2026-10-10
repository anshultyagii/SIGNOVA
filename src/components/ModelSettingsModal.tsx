import React, { useState } from 'react';
import {
  X,
  Settings,
  Layers,
  Languages,
  Sliders,
  Check,
  Radio,
  Server,
} from 'lucide-react';
import type { PipelineConfig } from '../types/models';
import { ModelRegistry } from '../services/models/ModelRegistry';

interface ModelSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: PipelineConfig;
  onSaveConfig: (newConfig: Partial<PipelineConfig>) => void;
}

export const ModelSettingsModal: React.FC<ModelSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [currentConfig, setCurrentConfig] = useState<PipelineConfig>({ ...config });
  const signModels = ModelRegistry.getAllSignModels();
  const nlpModels = ModelRegistry.getAllNLPModels();

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveConfig(currentConfig);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Pipeline & Model Configuration</h2>
            <p className="text-xs text-slate-400">
              Configure vision buffer, switch sign classifiers, and select NLP models
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Section 1: Sign Recognition Model Selector */}
          <div>
            <label className="flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2.5">
              <Layers className="w-4 h-4" />
              Sign Recognition Model
            </label>
            <div className="space-y-2">
              {signModels.map((model) => (
                <div
                  key={model.id}
                  onClick={() =>
                    setCurrentConfig({ ...currentConfig, recognitionModelId: model.id })
                  }
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                    currentConfig.recognitionModelId === model.id
                      ? 'bg-indigo-950/30 border-indigo-500/50 shadow-md shadow-indigo-950/30'
                      : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="mt-0.5">
                    {currentConfig.recognitionModelId === model.id ? (
                      <div className="w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center text-white">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                    ) : (
                      <Radio className="w-4 h-4 text-slate-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{model.name}</span>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                        {model.type}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      {model.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Optional WebSocket URL input if websocket backend selected */}
          {currentConfig.recognitionModelId === 'websocket_backend' && (
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 animate-in fade-in">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-cyan-400" />
                Backend WebSocket Endpoint
              </label>
              <input
                type="text"
                value={currentConfig.wsServerUrl || 'ws://localhost:8000/ws/sign'}
                onChange={(e) =>
                  setCurrentConfig({ ...currentConfig, wsServerUrl: e.target.value })
                }
                placeholder="ws://localhost:8000/ws/sign"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
              />
              <p className="text-[10px] text-slate-500">
                Run the FastAPI server provided in <code className="text-slate-400 font-mono">backend/main.py</code>.
              </p>
            </div>
          )}

          {/* Section 2: NLP Model Selector */}
          <div>
            <label className="flex items-center gap-2 text-xs font-bold text-purple-300 uppercase tracking-wider mb-2.5">
              <Languages className="w-4 h-4" />
              NLP Translation Model
            </label>
            <div className="space-y-2">
              {nlpModels.map((model) => (
                <div
                  key={model.id}
                  onClick={() => setCurrentConfig({ ...currentConfig, nlpModelId: model.id })}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                    currentConfig.nlpModelId === model.id
                      ? 'bg-purple-950/30 border-purple-500/50 shadow-md shadow-purple-950/30'
                      : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="mt-0.5">
                    {currentConfig.nlpModelId === model.id ? (
                      <div className="w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center text-white">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                    ) : (
                      <Radio className="w-4 h-4 text-slate-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{model.name}</span>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                        {model.type}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      {model.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Fine-Tuning Hyperparameters */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
              <Sliders className="w-3.5 h-3.5 text-slate-400" />
              Inference Hyperparameters
            </label>

            {/* Sliding Buffer Size */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-400">Frame Sequence Window:</span>
                <span className="font-mono font-bold text-white">
                  {currentConfig.bufferSize} frames (~{(currentConfig.bufferSize / 30).toFixed(1)}s)
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={60}
                step={5}
                value={currentConfig.bufferSize}
                onChange={(e) =>
                  setCurrentConfig({ ...currentConfig, bufferSize: Number(e.target.value) })
                }
                className="w-full accent-indigo-500"
              />
            </div>

            {/* Confidence Threshold */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-400">Min Prediction Confidence:</span>
                <span className="font-mono font-bold text-white">
                  {Math.round(currentConfig.minPredictionConfidence * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0.4}
                max={0.95}
                step={0.05}
                value={currentConfig.minPredictionConfidence}
                onChange={(e) =>
                  setCurrentConfig({
                    ...currentConfig,
                    minPredictionConfidence: Number(e.target.value),
                  })
                }
                className="w-full accent-indigo-500"
              />
            </div>

            {/* Gesture Debounce */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-400">Gesture Debounce Cooldown:</span>
                <span className="font-mono font-bold text-white">
                  {currentConfig.debounceIntervalMs} ms
                </span>
              </div>
              <input
                type="range"
                min={500}
                max={2500}
                step={100}
                value={currentConfig.debounceIntervalMs}
                onChange={(e) =>
                  setCurrentConfig({
                    ...currentConfig,
                    debounceIntervalMs: Number(e.target.value),
                  })
                }
                className="w-full accent-indigo-500"
              />
            </div>

            {/* Auto speak toggle */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
              <span className="text-xs text-slate-300">
                Text-to-Speech (Auto-Speak Recognized Sentences)
              </span>
              <input
                type="checkbox"
                checked={currentConfig.autoSpeak}
                onChange={(e) =>
                  setCurrentConfig({ ...currentConfig, autoSpeak: e.target.checked })
                }
                className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-colors"
          >
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
};
