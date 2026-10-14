import React, { useState } from 'react';
import { 
  MessageSquare, Volume2, Copy, Trash2, RotateCcw, Sparkles, 
  ArrowRight, Check, Plus, BookOpen, Bot, Cpu, History, Download
} from 'lucide-react';

export default function SentenceBuilder({ 
  tokens, 
  onAddToken, 
  onRemoveToken, 
  onClearTokens, 
  sentence, 
  onReconstruct, 
  onSpeak,
  vocabulary,
  sentenceHistory,
  onClearHistory
}) {
  const [copied, setCopied] = useState(false);
  const [selectedWordToAdd, setSelectedWordToAdd] = useState("");
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const handleCopy = () => {
    if (!sentence) return;
    navigator.clipboard.writeText(sentence);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    if (!sentence) return;
    setIsPlayingAudio(true);
    onSpeak(sentence);
    setTimeout(() => setIsPlayingAudio(false), 2000);
  };

  const handleAddManual = (e) => {
    e.preventDefault();
    if (!selectedWordToAdd) return;
    onAddToken(selectedWordToAdd);
    setSelectedWordToAdd("");
  };

  // Preset demo sentences demonstrating ASL-to-English grammar
  const PRESETS = [
    { label: "Greeting & Welcome", tokens: ["HELLO", "WELCOME", "NICE TO MEET YOU"] },
    { label: "Request Food & Water", tokens: ["I", "WANT", "EAT", "2", "FOOD", "WATER", "PLEASE"] },
    { label: "Emergency Help", tokens: ["PLEASE", "HELP", "I", "SICK"] },
    { label: "Where is Restroom?", tokens: ["WHERE", "BATHROOM", "PLEASE"] },
    { label: "Affection & Thanks", tokens: ["I LOVE YOU", "THANK YOU", "FRIEND"] },
  ];

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="glass-card p-6 border border-slate-800/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Bot className="w-4 h-4" />
              </span>
              <h2 className="font-display font-bold text-2xl text-white">
                NLP Sentence Reconstructor
              </h2>
            </div>
            <p className="text-sm text-slate-400 max-w-2xl">
              Converts raw detected ASL gloss tokens (isolated words and numbers) into fluent, grammatically complete English sentences using contextual grammar synthesis.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onReconstruct(tokens)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold shadow-glow-blue transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Reconstruct Sentence</span>
            </button>
            <button
              onClick={onClearTokens}
              disabled={tokens.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-xs font-semibold transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Dual Conversion Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Input Gloss Stream (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-card p-6 border border-slate-800/80">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                Raw Detected Sign Stream
              </span>
              <span className="text-xs text-cyan-400 font-mono">
                {tokens.length} signs
              </span>
            </div>

            {/* Token Stream Container */}
            <div className="min-h-[140px] p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-wrap gap-2 items-start content-start">
              {tokens.length > 0 ? (
                tokens.map((token, idx) => (
                  <span
                    key={idx}
                    className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/80 border border-cyan-700/60 text-cyan-300 text-xs font-semibold font-mono"
                  >
                    <span>{token}</span>
                    <button
                      onClick={() => onRemoveToken(idx)}
                      className="text-cyan-500 hover:text-rose-400 text-xs transition-colors"
                      title="Remove token"
                    >
                      ×
                    </button>
                  </span>
                ))
              ) : (
                <div className="w-full h-full py-8 text-center text-slate-500 text-xs flex flex-col items-center justify-center">
                  <MessageSquare className="w-6 h-6 mb-2 opacity-40" />
                  <span>Signs detected by the webcam stream will appear here in chronological order.</span>
                </div>
              )}
            </div>

            {/* Manual Token Appender */}
            <form onSubmit={handleAddManual} className="mt-4 flex items-center gap-2">
              <select
                value={selectedWordToAdd}
                onChange={(e) => setSelectedWordToAdd(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="">+ Manually add word or number...</option>
                {vocabulary.map((v) => (
                  <option key={v.id} value={v.token}>
                    {v.token} ({v.type})
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={!selectedWordToAdd}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-cyan-400 transition-colors"
                title="Add token"
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>

            {/* Preset Test Scenarios */}
            <div className="mt-5 pt-4 border-t border-slate-800/80">
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-500 block mb-2.5">
                Load Example ASL Sequences:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PRESETS.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      p.tokens.forEach((tok) => onAddToken(tok));
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-white transition-colors"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Arrow Transition indicator */}
        <div className="hidden lg:flex lg:col-span-1 items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400">
            <ArrowRight className="w-5 h-5" />
          </div>
        </div>

        {/* NLP Synthesized English Output (6 Cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="glass-card p-6 border border-slate-800/80 relative overflow-hidden shadow-glass">
            <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-wider font-semibold text-indigo-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Synthesized Natural English</span>
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-950/70 border border-indigo-800 text-indigo-300">
                Grammar Complete
              </span>
            </div>

            {/* Generated Sentence Result */}
            <div className="min-h-[140px] p-6 rounded-2xl bg-gradient-to-br from-slate-950/90 to-indigo-950/40 border border-indigo-900/40 flex items-center justify-center text-center">
              {sentence ? (
                <p className="font-display font-bold text-xl sm:text-2xl text-white leading-relaxed animate-fade-in">
                  "{sentence}"
                </p>
              ) : (
                <div className="text-slate-500 text-xs italic">
                  Run reconstruction or add sign tokens to synthesize a natural spoken sentence.
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="mt-5 flex items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSpeak}
                  disabled={!sentence}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 disabled:opacity-40 text-white text-xs font-semibold shadow-glow-cyan transition-all"
                >
                  <Volume2 className={`w-4 h-4 ${isPlayingAudio ? 'animate-bounce' : ''}`} />
                  <span>Speak Aloud</span>
                </button>
                <button
                  onClick={handleCopy}
                  disabled={!sentence}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-semibold transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <span className="text-xs text-slate-500">
                Grammar rule engine active
              </span>
            </div>

          </div>

          {/* Grammar Explanation & Linguistic Insights */}
          <div className="glass-card p-5 border border-slate-800/80 text-xs text-slate-400 space-y-2">
            <h4 className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
              How the Sign-to-Sentence Engine Operates:
            </h4>
            <p>
              American Sign Language syntax uses distinct spatial and gloss grammatical markers without English auxiliary verbs or prepositions.
            </p>
            <ul className="list-disc pl-4 space-y-1 text-slate-400">
              <li><strong className="text-slate-200">Quantification:</strong> Auto-binds numbers like "3" + "WATER" into "three glasses of water".</li>
              <li><strong className="text-slate-200">Copula & Modals:</strong> Injects "is/are/would like" to transform gestures into conversational tone.</li>
              <li><strong className="text-slate-200">Interrogative Structuring:</strong> Detects WHAT, WHERE, HOW tokens and flips sentence order with proper punctuation.</li>
            </ul>
          </div>

        </div>

      </div>

      {/* Sentence History Shelf */}
      {sentenceHistory && sentenceHistory.length > 0 && (
        <div className="glass-card p-6 border border-slate-800/80">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-cyan-400" />
              <h3 className="font-display font-bold text-base text-white">
                Recent Sentence History
              </h3>
            </div>
            <button
              onClick={onClearHistory}
              className="text-xs text-slate-400 hover:text-rose-400 transition-colors"
            >
              Clear History
            </button>
          </div>

          <div className="space-y-2">
            {sentenceHistory.slice(-5).reverse().map((item, idx) => (
              <div 
                key={idx}
                className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between gap-4"
              >
                <div>
                  <p className="text-sm font-medium text-slate-200">
                    "{item.sentence}"
                  </p>
                  <p className="text-xs text-cyan-400 font-mono mt-0.5">
                    Gloss: [{item.gloss}]
                  </p>
                </div>
                <button
                  onClick={() => onSpeak(item.sentence)}
                  className="p-2 rounded-lg bg-slate-900 text-slate-400 hover:text-white"
                  title="Speak"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
