import React from 'react';

export default function DetectedSignCard({ detectedSign, confidence, recentSigns, signDetail }) {
  const confPercent = Math.round(confidence * 100);

  return (
    <div className="glass-card p-6 space-y-6">
      
      {/* Detected Sign Header & Display */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-3">
          Detected Sign
        </p>

        {/* Big Square Indicator */}
        <div 
          className={`w-28 h-28 mx-auto rounded-2xl flex items-center justify-center transition-all duration-200 ${
            detectedSign
              ? "bg-gradient-to-br from-primary to-primary/50 glow-primary shadow-lg"
              : "bg-secondary/50 border-2 border-dashed border-border"
          }`}
        >
          {detectedSign ? (
            <span className="font-display text-3xl sm:text-4xl font-bold text-primary-foreground animate-scale-in text-center px-2">
              {detectedSign}
            </span>
          ) : (
            <span className="text-muted-foreground text-sm">
              Show a sign
            </span>
          )}
        </div>

        {signDetail && (
          <p className="mt-2.5 text-xs text-muted-foreground animate-fade-in font-medium">
            {signDetail.summary}
          </p>
        )}

        {/* Confidence Percentage Bar */}
        {detectedSign && (
          <div className="mt-4 space-y-2 animate-fade-in">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Confidence</span>
              <span className={`font-medium ${confPercent >= 75 ? "text-success" : "text-accent"}`}>
                {confPercent}%
              </span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-200 bg-gradient-to-r from-accent to-accent/70"
                style={{ width: `${confPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Recent Signs Shelf */}
      <div>
        <p className="text-sm text-muted-foreground mb-3">
          Recent Signs
        </p>
        <div className="flex flex-wrap gap-2 min-h-[40px]">
          {recentSigns && recentSigns.length > 0 ? (
            recentSigns.map((sign, idx) => (
              <span
                key={idx}
                className="px-3 h-9 rounded-lg flex items-center justify-center font-display font-bold text-xs bg-secondary text-foreground animate-fade-in"
              >
                {sign}
              </span>
            ))
          ) : (
            <span className="text-xs text-muted-foreground italic">
              Signs will appear here as they are detected.
            </span>
          )}
        </div>
      </div>

    </div>
  );
}
