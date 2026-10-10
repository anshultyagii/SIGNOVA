import React, { useState } from 'react';
import {
  MessageSquare,
  Sparkles,
  Volume2,
  Trash2,
  Copy,
  Check,
  Languages,
} from 'lucide-react';
import type { RecognitionPrediction, TranslationResult } from '../types/models';
import { speakSentence } from '../utils/audio';

interface SignRecognitionFeedProps {
  latestPrediction: RecognitionPrediction | null;
  recognizedTokens: string[];
  translation: TranslationResult | null;
  onClearTokens: () => void;
}

export const SignRecognitionFeed: React.FC<SignRecognitionFeedProps> = ({
  latestPrediction,
  recognizedTokens,
  translation,
  onClearTokens,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (translation?.translatedSentence) {
      navigator.clipboard.writeText(translation.translatedSentence);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSpeak = () => {
    if (translation?.translatedSentence) {
      speakSentence(translation.translatedSentence);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Languages className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-semibold tracking-wide text-white uppercase">
            Sign Recognition & NLP Interpretation
          </h2>
        </div>
        <span className="text-[11px] font-mono text-indigo-400/80 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
          Two-Stage AI Pipeline
        </span>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Stage 1: Sign Token Stream */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between gap-3">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Stage 1: Sign Language Tokenizer
              </span>
              {recognizedTokens.length > 0 && (
                <button
                  onClick={onClearTokens}
                  className="text-[11px] text-slate-500 hover:text-red-400 flex items-center gap-1 transition-colors"
                  title="Clear token history"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              )}
            </div>

            {/* Token Stream Chips */}
            <div className="min-h-[50px] flex flex-wrap items-center gap-1.5 p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
              {recognizedTokens.length === 0 ? (
                <span className="text-xs text-slate-500 italic">
                  Perform a sign (e.g., Hello, Thank You, I Love You, Peace, Call Me, Stop)...
                </span>
              ) : (
                recognizedTokens.map((token, index) => (
                  <span
                    key={`${token}-${index}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold font-mono bg-indigo-500/20 text-indigo-200 border border-indigo-500/30 animate-in fade-in zoom-in-95 duration-150"
                  >
                    <span>{token}</span>
                    {index < recognizedTokens.length - 1 && (
                      <span className="text-slate-500 font-normal ml-0.5">→</span>
                    )}
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Current Live Active Sign Badge */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/50 text-xs">
            <span className="text-slate-400">Current Sign:</span>
            {latestPrediction ? (
              <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                <span>{latestPrediction.label}</span>
                <span className="font-mono text-[11px] text-slate-400 font-normal">
                  ({Math.round(latestPrediction.confidence * 100)}%)
                </span>
              </span>
            ) : (
              <span className="text-slate-500">Waiting for gesture...</span>
            )}
          </div>
        </div>

        {/* Stage 2: Natural Language Output */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between gap-3">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                Stage 2: Translated English Sentence
              </span>
              <div className="flex items-center gap-1.5">
                {translation?.translatedSentence && (
                  <>
                    <button
                      onClick={handleSpeak}
                      className="p-1 rounded-md text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
                      title="Speak translated sentence"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handleCopy}
                      className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Copy sentence"
                    >
                      {copied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Translated Sentence Display */}
            <div className="min-h-[50px] flex items-center p-3 rounded-lg bg-indigo-950/20 border border-indigo-900/40">
              {translation?.translatedSentence ? (
                <p className="text-base font-semibold text-white tracking-wide">
                  "{translation.translatedSentence}"
                </p>
              ) : (
                <p className="text-xs text-slate-500 italic">
                  Grammar and NLP translations will appear here once signs are recognized.
                </p>
              )}
            </div>
          </div>

          {/* Alternatives or Confidence */}
          {translation?.alternatives && translation.alternatives.length > 0 && (
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800/50 overflow-x-auto text-[11px] text-slate-400">
              <span className="text-slate-500 whitespace-nowrap">Alt:</span>
              <span className="truncate italic text-slate-400">
                {translation.alternatives[0]}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
