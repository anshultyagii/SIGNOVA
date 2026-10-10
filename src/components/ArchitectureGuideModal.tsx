import React, { useState } from 'react';
import {
  X,
  Code2,
  Cpu,
  Layers,
  Terminal,
  FileCode,
  Copy,
  Check,
  CheckCircle2,
} from 'lucide-react';

interface ArchitectureGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureGuideModal: React.FC<ArchitectureGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'sign_model' | 'nlp_model' | 'tensors' | 'backend'>('sign_model');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const pytorchExportCode = `# 1. Train your PyTorch Sign Detection Model (LSTM / GRU / Transformer)
import torch
import torch.nn as nn

class SignLanguageClassifier(nn.Module):
    def __init__(self, num_classes=30):
        super().__init__()
        # Input: (Batch, Sequence=30 frames, Features=1662 landmarks)
        self.lstm = nn.LSTM(input_size=1662, hidden_size=128, num_layers=2, batch_first=True)
        self.fc = nn.Linear(128, num_classes)
        
    def forward(self, x):
        out, _ = self.lstm(x)
        logits = self.fc(out[:, -1, :])
        return torch.softmax(logits, dim=-1)

model = SignLanguageClassifier()
model.eval()

# 2. Export directly to ONNX format:
dummy_input = torch.randn(1, 30, 1662)
torch.onnx.export(
    model,
    dummy_input,
    "public/models/sign_model.onnx",
    input_names=["landmarks_sequence"],
    output_names=["probabilities"],
    dynamic_axes={"landmarks_sequence": {0: "batch_size"}}
)`;

  const onnxInferenceCode = `// In: src/services/models/sign/ONNXSignModel.ts
import * as ort from 'onnxruntime-web';

export class CustomONNXSignModel extends BaseSignModel {
  private session: ort.InferenceSession | null = null;
  private labels = ["HELLO", "THANK_YOU", "YES", "NO", "PLEASE", ...];

  async initialize(): Promise<void> {
    // Loads model from public folder with WebGL / WASM acceleration
    this.session = await ort.InferenceSession.create('/models/sign_model.onnx', {
      executionProviders: ['webgl', 'wasm']
    });
    this._isReady = true;
  }

  async predict(frames: ProcessedFrame[]): Promise<RecognitionPrediction | null> {
    // 1. Flatten normalized buffer into Float32Array: shape [1, 30, 1662]
    const tensorData = new Float32Array(30 * 1662);
    frames.forEach((f, i) => tensorData.set(f.featureVector, i * 1662));
    
    const inputTensor = new ort.Tensor('float32', tensorData, [1, 30, 1662]);
    const feeds = { [this.session.inputNames[0]]: inputTensor };
    
    // 2. Run inference
    const output = await this.session.run(feeds);
    const probs = output[this.session.outputNames[0]].data;
    
    // 3. ArgMax prediction
    const bestIdx = probs.indexOf(Math.max(...probs));
    return {
      label: this.labels[bestIdx],
      confidence: probs[bestIdx],
      timestamp: Date.now()
    };
  }
}`;

  const nlpIntegrationCode = `// In: src/services/models/nlp/LLMNLPModel.ts
export class MyCustomNLPModel extends BaseNLPModel {
  async translate(tokens: string[]): Promise<TranslationResult> {
    // Example: Call Hugging Face Inference API / Local Ollama / Gemini API
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      body: JSON.stringify({
        model: "llama3",
        prompt: \`Translate these sign language glosses into a grammatically fluent English sentence: [\${tokens.join(", ")}]. Output only the sentence.\`,
        stream: false
      })
    });
    
    const data = await response.json();
    return {
      originalTokens: tokens,
      translatedSentence: data.response.trim(),
      confidence: 0.95,
      timestamp: Date.now()
    };
  }
}`;

  const pythonBackendCode = `# In: backend/main.py
from fastapi import FastAPI, WebSocket
import uvicorn
import torch
import numpy as np

app = FastAPI(title="SIGNOVA AI Backend")

# Load your custom PyTorch / ONNX model
model = torch.load("sign_model.pt", map_location="cpu")
model.eval()

@app.websocket("/ws/sign")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    while True:
        data = await websocket.receive_json()
        feature_vector = np.array(data["featureVector"], dtype=np.float32)
        
        # Run your ML model
        with torch.no_grad():
            tensor = torch.from_numpy(feature_vector).unsqueeze(0).unsqueeze(0)
            logits = model(tensor)
            pred_idx = torch.argmax(logits, dim=-1).item()
            
        await websocket.send_json({
            "type": "prediction",
            "label": LABELS[pred_idx],
            "confidence": 0.94
        })`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">
              Model Integration & Architectural Blueprint
            </h2>
            <p className="text-xs text-slate-400">
              Step-by-step developer guide for adding your Sign Language Classifier & NLP Model
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 border-b border-slate-800 pb-3 mb-5 overflow-x-auto">
          {[
            { id: 'sign_model', label: '1. Add Sign Model', icon: Layers },
            { id: 'nlp_model', label: '2. Add NLP Model', icon: Cpu },
            { id: 'backend', label: '3. Python Backend (FastAPI)', icon: Terminal },
            { id: 'tensors', label: '4. Tensor Specifications', icon: FileCode },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Adding Sign Model */}
        {activeTab === 'sign_model' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-900/40 text-xs text-slate-300 space-y-2">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Pluggable Sign Model Interface: <code className="text-indigo-300">ISignRecognitionModel</code>
              </h3>
              <p>
                The app is designed with a pluggable provider system located in{' '}
                <code className="text-cyan-300 font-mono">src/services/models/sign/</code>.
                You can run your model client-side (ONNX Runtime / TensorFlow.js) or connect over WebSocket.
              </p>
            </div>

            {/* PyTorch Export */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Step 1: Export your PyTorch model to ONNX
                </span>
                <button
                  onClick={() => handleCopy(pytorchExportCode, 'pytorch')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  {copiedKey === 'pytorch' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'pytorch' ? 'Copied' : 'Copy Python'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto leading-relaxed">
                {pytorchExportCode}
              </pre>
            </div>

            {/* In-Browser Inference */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Step 2: Load and run in browser (ONNX Runtime Web)
                </span>
                <button
                  onClick={() => handleCopy(onnxInferenceCode, 'onnx')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  {copiedKey === 'onnx' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'onnx' ? 'Copied' : 'Copy TypeScript'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-cyan-300 overflow-x-auto leading-relaxed">
                {onnxInferenceCode}
              </pre>
            </div>
          </div>
        )}

        {/* Tab 2: Adding NLP Model */}
        {activeTab === 'nlp_model' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-900/40 text-xs text-slate-300 space-y-2">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Pluggable NLP Model Interface: <code className="text-purple-300">INLPTranslationModel</code>
              </h3>
              <p>
                Sign language uses a topic-comment structure (gloss sequence). The NLP layer takes an array of
                recognized sign tokens <code className="text-amber-300 font-mono">["HELLO", "THANK YOU"]</code> and transforms them into
                grammatically natural, conversational sentences.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Custom LLM / HuggingFace Provider Implementation
                </span>
                <button
                  onClick={() => handleCopy(nlpIntegrationCode, 'nlp')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  {copiedKey === 'nlp' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'nlp' ? 'Copied' : 'Copy Code'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-purple-300 overflow-x-auto leading-relaxed">
                {nlpIntegrationCode}
              </pre>
            </div>
          </div>
        )}

        {/* Tab 3: Python FastAPI Backend */}
        {activeTab === 'backend' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                Ready-to-Use Python FastAPI Server Template
              </h3>
              <p>
                A complete FastAPI WebSocket server is already provided in the repository under{' '}
                <code className="text-cyan-300 font-mono">backend/main.py</code>.
              </p>
              <div className="p-2 rounded bg-slate-900 font-mono text-[11px] text-cyan-400">
                cd backend && pip install -r requirements.txt && python main.py
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  backend/main.py WebSocket Endpoint
                </span>
                <button
                  onClick={() => handleCopy(pythonBackendCode, 'py_server')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  {copiedKey === 'py_server' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'py_server' ? 'Copied' : 'Copy Python'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-300 overflow-x-auto leading-relaxed">
                {pythonBackendCode}
              </pre>
            </div>
          </div>
        )}

        {/* Tab 4: Tensor Specifications */}
        {activeTab === 'tensors' && (
          <div className="space-y-4 text-xs text-slate-300">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <h3 className="font-bold text-white text-sm">Feature Tensor Architecture (Standard 1662 features/frame)</h3>
              <p>
                Each video frame is normalized by <code className="text-indigo-300 font-mono">LandmarkNormalizer.ts</code> to center
                coordinates at the midpoint of shoulders and scale by inter-shoulder width. This ensures your model works regardless
                of distance to camera or user height.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="font-bold text-cyan-300 mb-1">1. Upper Body Pose (33 Landmarks)</div>
                  <div className="text-slate-400">Indices 0 to 131: [x, y, z, visibility] × 33</div>
                  <div className="text-[11px] text-slate-500 mt-1">11/12 Shoulders, 13/14 Elbows, 15/16 Wrists</div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="font-bold text-indigo-300 mb-1">2. Face Mesh (468 Landmarks)</div>
                  <div className="text-slate-400">Indices 132 to 1535: [x, y, z] × 468</div>
                  <div className="text-[11px] text-slate-500 mt-1">Lips, Eyebrows, Eye corners, Facial contours</div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="font-bold text-emerald-300 mb-1">3. Left Hand (21 Landmarks)</div>
                  <div className="text-slate-400">Indices 1536 to 1598: [x, y, z] × 21</div>
                  <div className="text-[11px] text-slate-500 mt-1">Wrist, 5 Fingers (Thumb, Index, Middle, Ring, Pinky)</div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="font-bold text-amber-300 mb-1">4. Right Hand (21 Landmarks)</div>
                  <div className="text-slate-400">Indices 1599 to 1661: [x, y, z] × 21</div>
                  <div className="text-[11px] text-slate-500 mt-1">Wrist, 5 Fingers (Thumb, Index, Middle, Ring, Pinky)</div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 mt-3 font-mono text-[11px]">
                <span className="text-slate-400">Expected Tensor Shape: </span>
                <span className="text-emerald-400">[batch_size, 30 frames, 1662 features]</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
