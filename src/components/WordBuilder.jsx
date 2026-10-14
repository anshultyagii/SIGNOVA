import React, { useState } from 'react';
import { Volume2, Copy, Delete, Trash2, Check, Sparkles } from 'lucide-react';

export default function WordBuilder({ 
  currentTokens, 
  reconstructedSentence, 
  onBackspace, 
  onClear, 
  onSpeak,
  isProcessing 
}) {
  const [copied, setCopied] = useState(false);

  const fullText = reconstructedSentence || currentTokens.join(" ");

  const handleCopy = () => {
    if (!fullText) return;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    if (!fullText) return;
    onSpeak(fullText);
  };

  return (
    <div className="glass-card p-6 space-y-4">
      
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-bold gradient-text">
          Word & Sentence Builder
        </h3>
        <div className="flex items-center gap-1.5">
          <div 
            className={`w-2 h-2 rounded-full transition-colors ${
              isProcessing ? "bg-accent animate-pulse" : "bg-success"
            }`} 
          />
          <span className="text-xs text-muted-foreground">
            {isProcessing ? "Processing..." : "Ready"}
          </span>
        </div>
      </div>

      {/* Main Output Box */}
      <div className="min-h-[100px] p-4 rounded-xl bg-secondary/70 border-2 border-dashed border-border/50 flex flex-col justify-between">
        {currentTokens.length > 0 || reconstructedSentence ? (
          <div className="space-y-3">
            {/* Tokens stream */}
            <div className="flex flex-wrap gap-1.5">
              {currentTokens.map((t, idx) => (
                <span 
                  key={idx}
                  className="px-2.5 py-1 rounded-md bg-card border border-border/60 text-foreground font-semibold text-xs shadow-xs"
                >
                  {t}
                </span>
              ))}
            </div>

            {/* Synthesized NLP Sentence */}
            {reconstructedSentence && (
              <div className="pt-2 border-t border-border/40">
                <span className="text-[10px] uppercase font-bold text-primary block mb-0.5">
                  Natural English (NLP):
                </span>
                <p className="font-display font-medium text-base text-foreground">
                  "{reconstructedSentence}"
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-full py-4 text-center text-muted-foreground text-xs italic flex items-center justify-center">
            Signs and reconstructed sentences will appear here...
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-2">
          <button
            onClick={handleSpeak}
            disabled={!fullText}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 disabled:opacity-40 text-foreground text-xs font-medium transition-colors"
          >
            <Volume2 className="w-4 h-4 text-primary" />
            <span>Speak</span>
          </button>

          <button
            onClick={handleCopy}
            disabled={!fullText}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 disabled:opacity-40 text-foreground text-xs font-medium transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? "Copied!" : "Copy"}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onBackspace}
            disabled={currentTokens.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 disabled:opacity-40 text-foreground text-xs font-medium transition-colors"
            title="Delete last sign"
          >
            <Delete className="w-4 h-4" />
            <span>Undo</span>
          </button>

          <button
            onClick={onClear}
            disabled={currentTokens.length === 0 && !reconstructedSentence}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 disabled:opacity-40 text-foreground text-xs font-medium transition-colors"
            title="Clear all"
          >
            <Trash2 className="w-4 h-4 text-destructive" />
            <span>Clear</span>
          </button>
        </div>
      </div>

    </div>
  );
}
