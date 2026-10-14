import React, { useState, useMemo, useRef, useCallback } from 'react';
import Navbar from './components/Navbar';
import CameraFeed from './components/CameraFeed';
import DetectedSignCard from './components/DetectedSignCard';
import WordBuilder from './components/WordBuilder';
import SignDictionary from './components/SignDictionary';
import { VOCABULARY } from './data/vocabulary';
import { HolisticDetectionEngine } from './services/holisticDetectionEngine';
import { NLPSentenceService } from './services/nlpSentenceService';
import { 
  Camera, ArrowRight, Zap, MessageSquare, BookOpen, Square
} from 'lucide-react';

export default function App() {
  const [isActive, setIsActive] = useState(false);
  const [detectedSign, setDetectedSign] = useState(null);
  const [confidence, setConfidence] = useState(0);
  const [isHandVisible, setIsHandVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Buffer of detected words & numbers
  const [currentTokens, setCurrentTokens] = useState([]);
  const [reconstructedSentence, setReconstructedSentence] = useState("");
  const [recentSigns, setRecentSigns] = useState([]);

  // Singletons
  const detectionEngine = useMemo(() => new HolisticDetectionEngine({
    confidenceThreshold: 0.65,
    smoothingFactor: 0.35
  }), []);

  const nlpService = useMemo(() => new NLPSentenceService(), []);

  const lastAddedTokenRef = useRef(null);
  const lastAddedTimeRef = useRef(0);
  const dictionaryRef = useRef(null);

  // Frame detection callback
  const handleDetection = useCallback((outcome) => {
    setIsHandVisible(outcome.isHandVisible);

    if (outcome.prediction) {
      setDetectedSign(outcome.prediction);
      setConfidence(outcome.confidence);

      // Add to recent signs
      setRecentSigns(prev => {
        if (prev.length > 0 && prev[prev.length - 1] === outcome.prediction) return prev;
        return [...prev.slice(-8), outcome.prediction];
      });

      // Auto-append to sentence buffer with debounce
      const now = Date.now();
      const cooldown = now - lastAddedTimeRef.current;
      if (lastAddedTokenRef.current !== outcome.prediction || cooldown > 2000) {
        lastAddedTokenRef.current = outcome.prediction;
        lastAddedTimeRef.current = now;
        setIsProcessing(true);

        setCurrentTokens(prev => {
          const updated = [...prev, outcome.prediction];
          // Reconstruct sentence with NLP model
          nlpService.reconstructSentence(updated).then(res => {
            if (res.sentence) setReconstructedSentence(res.sentence);
            setIsProcessing(false);
          });
          return updated;
        });
      }
    } else {
      if (!outcome.isHandVisible) {
        setDetectedSign(null);
        setConfidence(0);
      }
    }
  }, [nlpService]);

  const handleBackspace = () => {
    setCurrentTokens(prev => {
      const updated = prev.slice(0, -1);
      if (updated.length > 0) {
        nlpService.reconstructSentence(updated).then(res => setReconstructedSentence(res.sentence));
      } else {
        setReconstructedSentence("");
      }
      return updated;
    });
  };

  const handleClear = () => {
    setCurrentTokens([]);
    setReconstructedSentence("");
    lastAddedTokenRef.current = null;
  };

  const handleSpeak = (text) => {
    nlpService.speak(text);
  };

  const handlePracticeSign = (signItem) => {
    setIsActive(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToDictionary = () => {
    if (dictionaryRef.current) {
      dictionaryRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const signDetail = useMemo(() => {
    if (!detectedSign) return null;
    return VOCABULARY.find(v => v.token === detectedSign) || null;
  }, [detectedSign]);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300 flex flex-col">
      
      {/* Top Navbar */}
      <Navbar isSessionActive={isActive} />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 pb-20 pt-4 flex-1 w-full space-y-16">

        {/* Hero Section (When Camera Session is Inactive) */}
        {!isActive && (
          <div className="text-center py-16 animate-fade-in space-y-8 max-w-4xl mx-auto">
            
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent-foreground text-sm font-medium mb-4 animate-scale-in">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
              </span>
              <span>Now with AI-powered Real-time Detection</span>
            </div>

            {/* Giant Title */}
            <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight leading-[1.1]">
              Break Barriers with <br className="hidden md:block" />
              <span className="gradient-text">SignSpeak</span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Experience the future of communication. Translate American Sign Language words and numbers into text and speech instantly using just your camera and artificial intelligence.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <button
                onClick={() => {
                  setIsActive(true);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="h-14 px-8 text-lg rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 w-full sm:w-auto flex items-center justify-center gap-2 font-semibold"
              >
                <Camera className="w-5 h-5" />
                <span>Start Translating Now</span>
              </button>

              <button
                onClick={scrollToDictionary}
                className="h-14 px-8 text-lg rounded-full border-2 border-border/80 hover:bg-secondary/50 transition-all duration-300 w-full sm:w-auto flex items-center justify-center gap-2 font-semibold text-foreground"
              >
                <span>Learn More</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* 3 Feature Cards */}
            <div className="mt-24 grid md:grid-cols-3 gap-8 text-left">
              
              <div className="group p-8 rounded-3xl bg-card border border-border/50 hover:border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-amber-50 text-amber-500">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-xl mb-3">
                  Real-time Translation
                </h3>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  Instant recognition of sign words and numbers with high accuracy using multimodal hand, pose, and face tracking.
                </p>
              </div>

              <div className="group p-8 rounded-3xl bg-card border border-border/50 hover:border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-blue-50 text-blue-500">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-xl mb-3">
                  Smart Word Building
                </h3>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  Automatically assembles detected words and numbers into fluent, coherent sentences using an NLP grammar engine.
                </p>
              </div>

              <div className="group p-8 rounded-3xl bg-card border border-border/50 hover:border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-emerald-50 text-emerald-500">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-xl mb-3">
                  Interactive Learning
                </h3>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  Visual guides and instant feedback help you master sign language words, body anchors, and counting faster.
                </p>
              </div>

            </div>

            {/* How SignSpeak Works */}
            <div className="mt-32 pt-16 border-t border-border/50">
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-16">
                How SignSpeak Works
              </h2>
              <div className="grid md:grid-cols-3 gap-12 relative">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-border to-transparent -translate-y-1/2 hidden md:block" />

                {[
                  { step: "01", title: "Enable Camera", desc: "Allow access to your webcam to start the multimodal detection engine." },
                  { step: "02", title: "Sign Clearly", desc: "Position your hand, upper body, and face in the frame and sign words clearly." },
                  { step: "03", title: "See Translation", desc: "Watch as AI instantly converts your signs into fluent sentences and speech." }
                ].map((item, idx) => (
                  <div key={idx} className="relative z-10 bg-background p-4">
                    <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg mx-auto mb-6 shadow-lg shadow-primary/20">
                      {item.step}
                    </div>
                    <h3 className="font-bold text-xl mb-2">{item.title}</h3>
                    <p className="text-muted-foreground text-sm">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* Active Detection Session (When Camera is Active) */}
        {isActive && (
          <div className="animate-fade-in space-y-8">
            
            {/* Top Session Control Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-card border shadow-sm">
              <div className="flex items-center gap-4">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  detectedSign 
                    ? "bg-accent/10 text-accent-foreground border border-accent/20" 
                    : "bg-muted text-muted-foreground"
                }`}>
                  <div className={`w-2.5 h-2.5 rounded-full ${detectedSign ? "bg-accent animate-pulse" : "bg-muted-foreground/30"}`} />
                  <span>{detectedSign ? "Sign Detected" : "Ready for input"}</span>
                </div>

                <div className="h-6 w-px bg-border/60 hidden sm:block" />

                <span className="text-sm font-medium text-muted-foreground hidden sm:block">
                  Is hand visible? {isHandVisible ? "Yes" : "No"}
                </span>
              </div>

              {/* Stop Session Button */}
              <button
                onClick={() => {
                  setIsActive(false);
                  setDetectedSign(null);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 text-sm font-semibold shadow-sm transition-all"
              >
                <Square className="w-4 h-4" />
                <span>Stop Session</span>
              </button>
            </div>

            {/* 12-Column Grid: Left 7 Cols Video | Right 5 Cols Word Builder & Sign Card */}
            <div className="grid lg:grid-cols-12 gap-8">
              
              {/* Left Column: Video & Best Practices (7 Cols) */}
              <div className="lg:col-span-7 space-y-6">
                <CameraFeed
                  isActive={isActive}
                  onDetection={handleDetection}
                  detectionEngine={detectionEngine}
                  isHandVisible={isHandVisible}
                  isSignDetected={!!detectedSign}
                />
              </div>

              {/* Right Column: Word Builder & Detected Sign Card (5 Cols) */}
              <div className="lg:col-span-5 space-y-6 flex flex-col">
                <WordBuilder
                  currentTokens={currentTokens}
                  reconstructedSentence={reconstructedSentence}
                  onBackspace={handleBackspace}
                  onClear={handleClear}
                  onSpeak={handleSpeak}
                  isProcessing={isProcessing}
                />

                <DetectedSignCard
                  detectedSign={detectedSign}
                  confidence={confidence}
                  recentSigns={recentSigns}
                  signDetail={signDetail}
                />
              </div>

            </div>

          </div>
        )}

        {/* Sign Dictionary Section (Always Accessible) */}
        <div ref={dictionaryRef} className="pt-8">
          <SignDictionary
            vocabulary={VOCABULARY}
            highlightedSign={detectedSign}
            onSelectPractice={handlePracticeSign}
          />
        </div>

      </main>

      {/* Footer */}
      <footer className="py-8 bg-card border-t mt-auto">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-muted-foreground flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© 2024 SignSpeak AI. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Contact</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
