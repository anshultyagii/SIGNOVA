# SIGNOVA — Sign Language AI & Gesture Intelligence Platform

**SIGNOVA** is a modular web application that tracks **Face Gestures (468 landmarks)**, **Upper Body & All Arm Kinematics (Shoulders, Elbows, Wrists)**, and **Dual Hand Gestures (21 landmarks per hand)** using **MediaPipe Holistic**.

The platform is designed with a pluggable architecture so you can easily drop in your trained **Sign Language Detection Model** (PyTorch / ONNX / TensorFlow.js / FastAPI backend) and **NLP Model** (LLM / HuggingFace Seq2Seq / Grammar translator).

---

## 🚀 Key Features

1. **Simultaneous Multimodal Tracking (MediaPipe Holistic)**:
   - **Face Mesh**: 468 landmarks, mouth openness ratio, smile ratio, head pitch/yaw/roll.
   - **Upper Body & Arm Kinematics**: 33 pose landmarks, left and right elbow angle calculation in real time (0°–180°), arm elevation, shoulder abduction, inter-wrist span.
   - **Dual Hand Gestures**: 21 landmarks per hand, finger extension counts, pinch detection, and hand shape classification.

2. **Immediate Gesture Engine Out-of-the-Box**:
   - Includes a built-in Geometric Gesture Engine recognizing signs immediately with live video:
     - `HELLO` (Wave near temple)
     - `THANK YOU` (Hand from chin forward & down)
     - `I LOVE YOU` (Thumb, index, pinky extended)
     - `PEACE / V` (Index & middle finger in V)
     - `CALL ME` (Thumb & pinky to ear)
     - `THUMBS UP / GOOD` (Upright thumb)
     - `PLEASE` (Flat hand circling over chest)
     - `YES` (Fist nodding up and down)
     - `NO` (Index, middle & thumb pinch)
     - `STOP` (Open palm extended forward)

3. **Pluggable Sign Language Recognition Architecture**:
   - Clean `ISignRecognitionModel` interface.
   - Ready-to-use providers:
     - `HeuristicSignModel`: Baseline geometric classifier.
     - `ONNXSignModel`: In-browser hardware-accelerated ONNX Runtime Web.
     - `TFJSSignModel`: In-browser TensorFlow.js.
     - `WebSocketSignModel`: Streams landmark frames to a Python FastAPI backend over WebSocket.

4. **Pluggable NLP Translation Architecture**:
   - Clean `INLPTranslationModel` interface.
   - Ready-to-use providers:
     - `RuleGrammarNLPModel`: Translates sign gloss sequences into natural English sentences.
     - `LLMNLPModel`: Connects to Gemini, OpenAI, or local Ollama.
     - `PassthroughNLPModel`: Direct token output.
   - Speech Synthesis (Web Speech API) speaks translated sentences aloud.

5. **Dataset Recorder & Export Tool**:
   - Record 15–60 frame gesture sequences directly in the browser with a 3-second countdown.
   - Exports normalized landmark datasets as **JSON** or **CSV** formatted for PyTorch `Dataset` or Pandas.

---

## 🛠️ Project Structure

```
SIGNOVA/
├── index.html                           # MediaPipe Holistic CDN tags & viewport
├── vite.config.ts                       # Vite + Tailwind CSS configuration
├── package.json
├── backend/                             # Python FastAPI AI Server Template
│   ├── main.py                          # WebSocket & REST streaming endpoint
│   ├── requirements.txt                 # Backend dependencies
│   └── README.md
├── src/
│   ├── App.tsx                          # Master app layout & state orchestration
│   ├── types/
│   │   ├── mediapipe.d.ts               # Global window typings for MediaPipe
│   │   ├── landmarks.ts                 # LandmarkPoints, Kinematics & ProcessedFrame
│   │   └── models.ts                    # ISignRecognitionModel & INLPTranslationModel
│   ├── services/
│   │   ├── vision/
│   │   │   ├── HolisticTracker.ts       # Video stream loop & MediaPipe coordinator
│   │   │   ├── CanvasRenderer.ts        # Cyber neon skeleton, joint angles & trails drawer
│   │   │   └── KinematicsEngine.ts      # 3D angle & distance vector mathematics
│   │   ├── processor/
│   │   │   ├── LandmarkNormalizer.ts    # Scales & centers coordinates relative to chest
│   │   │   └── SequenceBuffer.ts        # Sliding window buffer (30 frames)
│   │   ├── models/
│   │   │   ├── sign/
│   │   │   │   ├── BaseSignModel.ts     # Abstract sign model base class
│   │   │   │   ├── HeuristicSignModel.ts# Live geometric gesture detector
│   │   │   │   ├── ONNXSignModel.ts     # In-browser ONNX model loader
│   │   │   │   ├── TFJSSignModel.ts     # In-browser TensorFlow.js loader
│   │   │   │   └── WebSocketSignModel.ts# Remote Python backend bridge
│   │   │   ├── nlp/
│   │   │   │   ├── BaseNLPModel.ts      # Abstract NLP model base class
│   │   │   │   ├── RuleGrammarNLPModel.ts# Sign-to-English grammar builder
│   │   │   │   ├── LLMNLPModel.ts       # LLM (Gemini / GPT / Ollama) translator
│   │   │   │   └── PassthroughNLPModel.ts
│   │   │   └── ModelRegistry.ts         # Central registry for model switching
│   │   └── pipeline/
│   │       └── PipelineCoordinator.ts   # Vision -> Normalizer -> Sign AI -> NLP AI
│   ├── components/
│   │   ├── Header.tsx                   # Status badges, FPS, mute & modal buttons
│   │   ├── Viewport.tsx                 # Video & canvas overlay with toggles
│   │   ├── KinematicsHUD.tsx            # Live telemetry for arms, hands & face
│   │   ├── SignRecognitionFeed.tsx      # Live token stream & translated English output
│   │   ├── PipelineVisualizer.tsx       # Live architectural flowchart
│   │   ├── DatasetRecorderModal.tsx     # Dataset capture and JSON/CSV export tool
│   │   ├── ModelSettingsModal.tsx       # Model selection & hyperparameter tuning
│   │   └── ArchitectureGuideModal.tsx   # Interactive code & integration guide
│   └── utils/
│       ├── audio.ts                     # Text-to-speech audio synthesis & chimes
│       └── export.ts                    # JSON/CSV file download helper
```

---

## 🏃 Running the Frontend

```bash
# Install dependencies
npm install

# Start Vite dev server
npm run dev
```

Open `http://localhost:5173` in your browser and allow camera access.

---

## 🧠 How to Plug In Your Models

### 1. Adding an In-Browser ONNX Model
1. Export your trained PyTorch model:
   ```python
   dummy_input = torch.randn(1, 30, 1662)
   torch.onnx.export(model, dummy_input, "public/models/sign_model.onnx")
   ```
2. Place the file at `public/models/sign_model.onnx`.
3. Open `src/services/models/sign/ONNXSignModel.ts` and uncomment the `ort.InferenceSession` runner.

### 2. Adding a Python Backend Model (FastAPI + PyTorch)
1. Start the server:
   ```bash
   cd backend
   pip install -r requirements.txt
   python main.py
   ```
2. In the SIGNOVA web UI, click **Settings** (gear icon) -> select **Python FastAPI / PyTorch Backend** -> set URL to `ws://localhost:8000/ws/sign`.

### 3. Adding an NLP Model
1. Open `src/services/models/nlp/LLMNLPModel.ts`.
2. Connect your API key or local Ollama URL (`http://localhost:11434/api/generate`).

---

## 📐 Data Normalization & Feature Vectors

Each frame produces a **1662-dimensional float array**:
- **Pose / Upper Body (33 landmarks × 4: x, y, z, visibility)**: Indices `0` – `131`
- **Face Mesh (468 landmarks × 3: x, y, z)**: Indices `132` – `1535`
- **Left Hand (21 landmarks × 3: x, y, z)**: Indices `1536` – `1598`
- **Right Hand (21 landmarks × 3: x, y, z)**: Indices `1599` – `1661`

Coordinates are centered at the chest (midpoint of left & right shoulders) and divided by the shoulder distance, guaranteeing scale and translation invariance.
