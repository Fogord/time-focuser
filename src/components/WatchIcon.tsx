import React from 'react';

interface WatchIconProps {
  className?: string;
  size?: number;
}

export const WatchIcon: React.FC<WatchIconProps> = ({ className = 'w-10 h-10', size }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      className={className}
      width={size}
      height={size}
    >
      <defs>
        <radialGradient id="watchDialGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#111827" />
          <stop offset="85%" stopColor="#0b0f17" />
          <stop offset="100%" stopColor="#030712" />
        </radialGradient>

        <linearGradient id="watchRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#475569" />
          <stop offset="50%" stopColor="#334155" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>

        <linearGradient id="watchExclGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ff5757" />
          <stop offset="100%" stopColor="#dc2626" />
        </linearGradient>

        <filter id="watchRedGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="8" floodColor="#ef4444" floodOpacity="0.8" />
          <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#000000" floodOpacity="0.6" />
        </filter>
      </defs>

      {/* Clean Circular Base (No Watch Frame/Lugs/Crown) */}
      <circle cx="256" cy="256" r="236" fill="url(#watchRingGrad)" stroke="#475569" strokeWidth="4" />
      <circle cx="256" cy="256" r="222" fill="url(#watchDialGrad)" stroke="#1e293b" strokeWidth="3" />

      {/* 9:00 to 18:00 (6:00 PM) Sector Highlight with Red Opacity 0.5 */}
      <path d="M 256 256 L 56 256 A 200 200 0 1 1 256 456 Z" fill="#ef4444" fillOpacity="0.5" />

      {/* 9:00 and 18:00 Sector Boundary Lines */}
      <line x1="256" y1="256" x2="56" y2="256" stroke="#f87171" strokeWidth="3.5" strokeLinecap="round" strokeOpacity="0.9" />
      <line x1="256" y1="256" x2="256" y2="456" stroke="#f87171" strokeWidth="3.5" strokeLinecap="round" strokeOpacity="0.9" />

      {/* Minimalist Ticks at 9:00, 12:00, 15:00 (3:00), 18:00 (6:00) */}
      <line x1="256" y1="58" x2="256" y2="80" stroke="#fca5a5" strokeWidth="5" strokeLinecap="round" />
      <line x1="454" y1="256" x2="432" y2="256" stroke="#fca5a5" strokeWidth="5" strokeLinecap="round" />
      <line x1="256" y1="454" x2="256" y2="432" stroke="#fca5a5" strokeWidth="5" strokeLinecap="round" />
      <line x1="58" y1="256" x2="80" y2="256" stroke="#fca5a5" strokeWidth="5" strokeLinecap="round" />

      {/* Subtle Minute Track Ring */}
      <circle cx="256" cy="256" r="200" fill="none" stroke="#334155" strokeDasharray="3 17" strokeWidth="2" opacity="0.5" />

      {/* Central '!' Exclamation Mark in Red (No Clock Arrows) */}
      <g filter="url(#watchRedGlow)">
        <path d="M 238 130 C 238 118, 274 118, 274 130 L 268 268 C 268 276, 244 276, 244 268 Z"
              fill="url(#watchExclGrad)" stroke="#fff1f2" strokeWidth="2" strokeLinejoin="round" />
        <circle cx="256" cy="336" r="18" fill="url(#watchExclGrad)" stroke="#fff1f2" strokeWidth="2" />
      </g>
    </svg>
  );
};
