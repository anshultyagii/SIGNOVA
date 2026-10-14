import React, { useState } from 'react';
import { Search, BookOpen, Sparkles, Target, Hash, MessageSquare, Play, HelpCircle, UserCheck } from 'lucide-react';
import { CATEGORIES } from '../data/vocabulary';

export default function VocabularyGuide({ vocabulary, onSelectPracticeSign }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSignDetail, setSelectedSignDetail] = useState(null);

  const filteredVocabulary = vocabulary.filter((item) => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = 
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.token.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.tags && item.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-8">
      
      {/* Header and Search */}
      <div className="glass-card p-6 border border-slate-800/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <BookOpen className="w-4 h-4" />
              </span>
              <h2 className="font-display font-bold text-2xl text-white">
                Word & Number Dictionary
              </h2>
            </div>
            <p className="text-sm text-slate-400 max-w-2xl">
              Multimodal ASL vocabulary encyclopedia covering words and numbers with handshape, upper body posture, movement, and facial cues.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search words, numbers, tags..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pt-5 border-t border-slate-800/80 mt-5 no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Signs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredVocabulary.map((item) => (
          <div
            key={item.id}
            className="glass-card glass-card-hover p-5 border border-slate-800/80 flex flex-col justify-between group"
          >
            <div>
              {/* Header Badges */}
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[11px] font-semibold uppercase px-2.5 py-0.5 rounded-full border ${
                  item.type === 'number' 
                    ? 'bg-purple-950/70 border-purple-800 text-purple-300' 
                    : 'bg-cyan-950/70 border-cyan-800 text-cyan-300'
                }`}>
                  {item.type}
                </span>

                <span className="text-[11px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800">
                  {item.category}
                </span>
              </div>

              {/* Title & Token */}
              <div className="mb-2">
                <h3 className="font-display font-bold text-xl text-white group-hover:text-cyan-400 transition-colors">
                  {item.label}
                </h3>
                <span className="text-xs font-mono text-cyan-400">
                  Token: [{item.token}]
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                {item.summary}
              </p>

              {/* Multimodal Cue Snapshot */}
              <div className="space-y-2 p-3 rounded-xl bg-slate-950/70 border border-slate-800/60 text-[11px] text-slate-400">
                <div>
                  <strong className="text-slate-300">Handshape:</strong> {item.handshape}
                </div>
                <div>
                  <strong className="text-slate-300">Body Anchor:</strong> {item.bodyPosition}
                </div>
                {item.facialCue && (
                  <div>
                    <strong className="text-slate-300">Face Cue:</strong> {item.facialCue}
                  </div>
                )}
              </div>
            </div>

            {/* Action footer */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <button
                onClick={() => setSelectedSignDetail(item)}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Full Guide</span>
              </button>

              <button
                onClick={() => onSelectPracticeSign(item)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800/80 text-cyan-300 text-xs font-semibold transition-all hover:scale-105"
              >
                <Target className="w-3.5 h-3.5" />
                <span>Practice</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredVocabulary.length === 0 && (
        <div className="glass-card p-12 text-center text-slate-400 border border-slate-800">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40 text-cyan-400" />
          <h4 className="font-display font-bold text-lg text-white mb-1">No Matching Signs Found</h4>
          <p className="text-xs">Try searching with a different word, number, or category.</p>
        </div>
      )}

      {/* Detail Modal */}
      {selectedSignDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="glass-card max-w-lg w-full p-6 border border-slate-700 shadow-2xl relative">
            <button
              onClick={() => setSelectedSignDetail(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg font-bold"
            >
              ✕
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs uppercase px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-800 font-semibold">
                {selectedSignDetail.category}
              </span>
              <span className="text-xs text-slate-400">
                Difficulty: {selectedSignDetail.difficulty}
              </span>
            </div>

            <h3 className="font-display font-extrabold text-2xl text-white mb-1">
              {selectedSignDetail.label}
            </h3>
            <p className="text-xs text-cyan-400 font-mono mb-4">
              GLOSS TOKEN: [{selectedSignDetail.token}]
            </p>

            <div className="space-y-3.5 text-xs text-slate-300">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="font-bold text-cyan-400 block mb-1">How to Sign:</span>
                <p className="leading-relaxed">{selectedSignDetail.summary}</p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="font-semibold text-slate-200 block mb-1">✋ Hand Shape</span>
                  <p className="text-[11px] text-slate-400">{selectedSignDetail.handshape}</p>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="font-semibold text-slate-200 block mb-1">🧍 Body Position</span>
                  <p className="text-[11px] text-slate-400">{selectedSignDetail.bodyPosition}</p>
                </div>
              </div>

              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <span className="font-semibold text-slate-200 block mb-1">😊 Facial Expression & Grammatical Cue</span>
                <p className="text-[11px] text-slate-400">{selectedSignDetail.facialCue}</p>
              </div>

              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <span className="font-semibold text-slate-200 block mb-1">🔄 Motion Trajectory</span>
                <p className="text-[11px] text-slate-400">{selectedSignDetail.movement}</p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  onSelectPracticeSign(selectedSignDetail);
                  setSelectedSignDetail(null);
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-white font-semibold text-xs shadow-glow-cyan"
              >
                Practice in Live Studio
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
