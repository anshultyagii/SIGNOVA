import React from 'react';
import { Hand } from 'lucide-react';

export default function Navbar({ isSessionActive }) {
  return (
    <header className="w-full py-6 px-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-primary">
            <Hand className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold gradient-text">
              SignSpeak
            </h1>
            <p className="text-sm text-muted-foreground">
              ASL Recognition
            </p>
          </div>
        </div>

        {/* Real-time Detection Status Badge */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-full bg-success/20 border border-success/30">
            <span className="text-xs font-medium text-success flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              {isSessionActive ? "Camera Active" : "Real-time Detection"}
            </span>
          </div>
        </div>

      </div>
    </header>
  );
}
