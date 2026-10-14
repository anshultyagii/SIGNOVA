import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, Search, Sparkles, X, Volume2, Target } from 'lucide-react';
import { CATEGORIES } from '../data/vocabulary';

export default function SignDictionary({ vocabulary, highlightedSign, onSelectPractice }) {
  const [isOpen, setIsOpen] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedItem, setSelectedItem] = useState(null);

  const filtered = vocabulary.filter((item) => {
    const matchCat = activeCategory === "All" || item.category === activeCategory;
    const matchSearch =
      item.label.toLowerCase().includes(search.toLowerCase()) ||
      item.token.toLowerCase().includes(search.toLowerCase()) ||
      item.summary.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="glass-card overflow-hidden transition-all duration-300">
      
      {/* Header Bar */}
      <div className="p-6 border-b border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold gradient-text">
              Sign Dictionary (Words & Numbers)
            </h2>
            <p className="text-sm text-muted-foreground">
              Click any sign to view handshape, upper body position, and facial expression
            </p>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search signs..."
            className="w-full bg-secondary/80 border border-border/60 rounded-xl pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="px-6 py-3 bg-secondary/30 border-b border-border/40 flex items-center gap-2 overflow-x-auto no-scrollbar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              activeCategory === cat
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-card text-muted-foreground hover:text-foreground hover:bg-secondary border border-border/50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Cards Grid */}
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filtered.map((item) => {
            const isHighlighted = highlightedSign === item.token;
            const isSelected = selectedItem?.id === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className={`group relative p-4 rounded-2xl transition-all duration-200 border-2 flex flex-col items-center gap-2.5 text-center hover:scale-[1.02] active:scale-95 shadow-sm hover:shadow-md ${
                  isHighlighted
                    ? 'border-accent bg-accent/10 glow-accent scale-[1.03]'
                    : isSelected
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : 'border-border/50 bg-card hover:border-primary/50 hover:bg-secondary/30'
                }`}
              >
                {/* Visual Icon Badge */}
                <div className="w-full aspect-square rounded-xl bg-gradient-to-br from-secondary/80 to-secondary/30 border border-border/40 flex flex-col items-center justify-center p-2 relative overflow-hidden group-hover:bg-primary/5 transition-colors">
                  <span className="font-display font-bold text-2xl text-primary mb-1">
                    {item.type === 'number' ? item.token : item.token.charAt(0)}
                  </span>
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-card border border-border/60 text-muted-foreground">
                    {item.category}
                  </span>
                </div>

                {/* Sign Label & Summary */}
                <div className="w-full">
                  <h4 className="font-display font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                    {item.label}
                  </h4>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-tight">
                    {item.summary}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="py-12 text-center text-muted-foreground text-sm">
            No signs found matching "{search}".
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-card max-w-lg w-full p-6 rounded-3xl border border-border shadow-2xl relative space-y-4">
            
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-display font-bold text-xl">
                {selectedItem.token}
              </div>
              <div>
                <span className="text-xs uppercase font-semibold text-primary">
                  {selectedItem.category} • {selectedItem.type}
                </span>
                <h3 className="font-display font-bold text-2xl text-foreground">
                  {selectedItem.label}
                </h3>
              </div>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
              {selectedItem.summary}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
              <div className="p-3 rounded-xl bg-secondary/50 border border-border/50">
                <strong className="text-foreground block mb-1">✋ Hand Shape:</strong>
                <span className="text-muted-foreground">{selectedItem.handshape}</span>
              </div>
              <div className="p-3 rounded-xl bg-secondary/50 border border-border/50">
                <strong className="text-foreground block mb-1">🧍 Body Position:</strong>
                <span className="text-muted-foreground">{selectedItem.bodyPosition}</span>
              </div>
              <div className="p-3 rounded-xl bg-secondary/50 border border-border/50">
                <strong className="text-foreground block mb-1">😊 Facial Cue:</strong>
                <span className="text-muted-foreground">{selectedItem.facialCue || "Neutral expression"}</span>
              </div>
              <div className="p-3 rounded-xl bg-secondary/50 border border-border/50">
                <strong className="text-foreground block mb-1">🔄 Movement:</strong>
                <span className="text-muted-foreground">{selectedItem.movement}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  if (onSelectPractice) onSelectPractice(selectedItem);
                  setSelectedItem(null);
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm shadow-md transition-all"
              >
                <Target className="w-4 h-4" />
                <span>Practice this Sign</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
