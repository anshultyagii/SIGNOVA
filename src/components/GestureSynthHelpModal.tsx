import React, { useState } from 'react';
import type { PipelineConfig } from '../types/models';

interface GestureSynthHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: PipelineConfig;
  onSaveConfig: (newConfig: Partial<PipelineConfig>) => void;
  onOpenRecorder: () => void;
}

export const GestureSynthHelpModal: React.FC<GestureSynthHelpModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onOpenRecorder,
}) => {
  const [activeTab, setActiveTab] = useState<'gestures' | 'architecture' | 'settings'>('gestures');
  const [handTab, setHandTab] = useState<'left' | 'right'>('left');

  if (!isOpen) return null;

  return (
    <div
      id="helpModal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="help-content">
        <button id="closeHelp" onClick={onClose}>
          ✕
        </button>

        <h2>SIGNOVA Guide & Architecture</h2>

        {/* Top Tab Bar */}
        <div className="flex gap-2 mb-4 border-b border-[#3a3428] pb-2 text-xs">
          <button
            onClick={() => setActiveTab('gestures')}
            className={`pb-1 px-2 font-mono transition-colors ${
              activeTab === 'gestures'
                ? 'text-[#e8a13d] border-b-2 border-[#e8a13d] font-bold'
                : 'text-[#888] hover:text-white'
            }`}
          >
            Gesture Guide
          </button>
          <button
            onClick={() => setActiveTab('architecture')}
            className={`pb-1 px-2 font-mono transition-colors ${
              activeTab === 'architecture'
                ? 'text-[#e8a13d] border-b-2 border-[#e8a13d] font-bold'
                : 'text-[#888] hover:text-white'
            }`}
          >
            Plugging In Models (AI / NLP)
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-1 px-2 font-mono transition-colors ${
              activeTab === 'settings'
                ? 'text-[#e8a13d] border-b-2 border-[#e8a13d] font-bold'
                : 'text-[#888] hover:text-white'
            }`}
          >
            Settings & Backend
          </button>
        </div>

        {/* Tab 1: Gestures */}
        {activeTab === 'gestures' && (
          <div>
            <div className="help-mode">
              <div className="help-mode-label">Hand Tracking Reference</div>
              <div className="mode-toggle mb-3">
                <button
                  onClick={() => setHandTab('left')}
                  className={`mode-button ${handTab === 'left' ? 'active' : ''}`}
                >
                  Left Hand / Arms
                </button>
                <button
                  onClick={() => setHandTab('right')}
                  className={`mode-button ${handTab === 'right' ? 'active' : ''}`}
                >
                  Right Hand / Face
                </button>
              </div>

              {handTab === 'left' ? (
                <div className="text-xs text-[#ccc] space-y-3 leading-relaxed">
                  <p>
                    <b className="text-[#e8a13d]">Left Hand Gestures:</b><br />
                    • <b>1 Finger (Index)</b> → POINT / I<br />
                    • <b>2 Fingers (Index + Middle)</b> → PEACE / V<br />
                    • <b>3 Fingers (Thumb + Index + Pinky)</b> → I LOVE YOU<br />
                    • <b>4 / 5 Fingers (Open Palm)</b> → OPEN PALM / STOP<br />
                    • <b>Fist</b> → YES (Nodding fist)<br />
                    • <b>Thumb + Pinky</b> → CALL ME<br />
                    • <b>Pinch</b> → NO
                  </p>
                  <p>
                    <b className="text-[#e8a13d]">Upper Body & Arm Kinematics:</b><br />
                    • <b>Elbow Angle:</b> Real-time calculated 0° to 180° displayed over elbow joints.<br />
                    • <b>Elevation:</b> Detected as Raised when wrist moves above shoulder level.
                  </p>
                </div>
              ) : (
                <div className="text-xs text-[#ccc] space-y-3 leading-relaxed">
                  <p>
                    <b className="text-[#e8a13d]">Right Hand Gestures:</b><br />
                    • <b>Hand at Chin moving down:</b> THANK YOU<br />
                    • <b>Hand waving near temple:</b> HELLO<br />
                    • <b>Flat hand over chest:</b> PLEASE<br />
                    • <b>Thumb Up:</b> GOOD / THUMBS UP
                  </p>
                  <p>
                    <b className="text-[#e8a13d]">Facial Expressions:</b><br />
                    • <b>Mouth Open Ratio:</b> Detects vocalizing / surprise expression.<br />
                    • <b>Lip Curvature:</b> Detects smile ratio and head pitch/yaw.
                  </p>
                </div>
              )}
            </div>

            <div className="p-3 border border-[#3a3428] rounded-lg bg-[#141414] text-xs">
              <span className="text-[#e8a13d] font-bold">Record Training Dataset:</span>
              <p className="text-[#888] mt-1 mb-2">
                Need to train your own PyTorch or TensorFlow model? Record 30-frame gesture sequences and download as JSON/CSV.
              </p>
              <button
                onClick={() => {
                  onClose();
                  onOpenRecorder();
                }}
                className="px-3 py-1.5 border border-[#e8a13d] rounded text-[#e8a13d] hover:bg-[#e8a13d] hover:text-[#111] transition-colors font-mono text-xs"
              >
                Open Dataset Recorder 📁
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Architecture */}
        {activeTab === 'architecture' && (
          <div className="text-xs text-[#ccc] space-y-4 leading-relaxed">
            <div className="p-3 border border-[#3a3428] rounded-lg bg-[#141414]">
              <h3 className="text-[#e8a13d] text-sm font-bold mb-1">
                How to Add Your Sign Language Detection Model
              </h3>
              <p className="text-[#999] mb-2">
                All models implement <code className="text-[#e8a13d]">ISignRecognitionModel</code> in{' '}
                <code className="text-[#ffbf5c]">src/services/models/sign/</code>.
              </p>
              <div className="bg-[#0c0c0c] p-2.5 rounded border border-[#2a241b] font-mono text-[11px] text-[#ffc977] overflow-x-auto">
                {`// 1. Export your PyTorch model to ONNX:
dummy_input = torch.randn(1, 30, 1662)
torch.onnx.export(model, dummy_input, "public/models/sign_model.onnx")

// 2. Put file in /public/models/sign_model.onnx
// 3. Uncomment in src/services/models/sign/ONNXSignModel.ts`}
              </div>
            </div>

            <div className="p-3 border border-[#3a3428] rounded-lg bg-[#141414]">
              <h3 className="text-[#e8a13d] text-sm font-bold mb-1">
                How to Add Your NLP Model
              </h3>
              <p className="text-[#999] mb-2">
                All NLP models implement <code className="text-[#e8a13d]">INLPTranslationModel</code> in{' '}
                <code className="text-[#ffbf5c]">src/services/models/nlp/</code>.
              </p>
              <div className="bg-[#0c0c0c] p-2.5 rounded border border-[#2a241b] font-mono text-[11px] text-[#ffc977] overflow-x-auto">
                {`// Translates sign gloss tokens: ["HELLO", "THANK YOU"]
// into natural conversational English:
// "Hello there, thank you very much!"
// Connect your local Ollama or Gemini API in LLMNLPModel.ts`}
              </div>
            </div>

            <div className="p-3 border border-[#3a3428] rounded-lg bg-[#141414]">
              <h3 className="text-[#e8a13d] text-sm font-bold mb-1">
                Python FastAPI Backend Ready
              </h3>
              <p className="text-[#999]">
                A full WebSocket streaming server is included in <code className="text-[#ffbf5c]">backend/main.py</code>.
                Run <code className="text-[#e8a13d]">cd backend && pip install -r requirements.txt && python main.py</code>.
              </p>
            </div>
          </div>
        )}

        {/* Tab 3: Settings */}
        {activeTab === 'settings' && (
          <div className="space-y-4 text-xs">
            <div className="help-mode">
              <div className="help-mode-label">Active Sign Recognition Model</div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'heuristic_rules', name: 'Baseline Rules' },
                  { id: 'onnx_runtime', name: 'ONNX Neural Net' },
                  { id: 'tensorflow_js', name: 'TensorFlow.js' },
                  { id: 'websocket_backend', name: 'Python Backend' },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => onSaveConfig({ recognitionModelId: m.id })}
                    className={`p-2 border rounded font-mono text-left transition-colors ${
                      config.recognitionModelId === m.id
                        ? 'border-[#e8a13d] bg-[rgba(232,161,61,0.18)] text-[#e8a13d] font-bold'
                        : 'border-[#3a3428] bg-[#111] text-[#888] hover:text-white'
                    }`}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="help-mode">
              <div className="help-mode-label">Active NLP Translation Model</div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'rule_grammar', name: 'Grammar Engine' },
                  { id: 'llm_transformer', name: 'LLM Translator' },
                  { id: 'passthrough', name: 'Raw Tokens' },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => onSaveConfig({ nlpModelId: m.id })}
                    className={`p-2 border rounded font-mono text-center transition-colors ${
                      config.nlpModelId === m.id
                        ? 'border-[#e8a13d] bg-[rgba(232,161,61,0.18)] text-[#e8a13d] font-bold'
                        : 'border-[#3a3428] bg-[#111] text-[#888] hover:text-white'
                    }`}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            </div>

            {config.recognitionModelId === 'websocket_backend' && (
              <div className="p-3 border border-[#3a3428] rounded bg-[#141414]">
                <label className="block text-[#e8a13d] font-bold mb-1">
                  FastAPI WebSocket URL:
                </label>
                <input
                  type="text"
                  value={config.wsServerUrl || 'ws://localhost:8000/ws/sign'}
                  onChange={(e) => onSaveConfig({ wsServerUrl: e.target.value })}
                  className="w-full bg-[#111] border border-[#3a3428] rounded px-2.5 py-1.5 text-xs text-[#ffc977] font-mono focus:border-[#e8a13d] outline-none"
                />
              </div>
            )}

            <div className="flex items-center justify-between p-3 border border-[#3a3428] rounded bg-[#141414]">
              <span className="text-[#ccc]">Speech Synthesis (Auto-Speak Sentence):</span>
              <input
                type="checkbox"
                checked={config.autoSpeak}
                onChange={(e) => onSaveConfig({ autoSpeak: e.target.checked })}
                className="w-4 h-4 accent-[#e8a13d] cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
