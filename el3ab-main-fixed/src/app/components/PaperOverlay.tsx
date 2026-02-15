import React from 'react';

export const PaperOverlay = () => {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 h-full w-full opacity-40 mix-blend-multiply">
      {/* Noise/Grain Texture */}
      <svg className="h-full w-full opacity-20">
        <filter id="noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noise)" />
      </svg>
    </div>
  );
};
