import React from 'react';

interface MyFxLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  showBadge?: boolean;
  className?: string;
}

export const MyFxLogo: React.FC<MyFxLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  showBadge = true,
  className = ''
}) => {
  const iconSize = size === 'sm' ? 'w-7 h-7' : size === 'lg' ? 'w-11 h-11' : 'w-8.5 h-8.5';
  const titleSize = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-xl' : 'text-base';
  const subSize = size === 'sm' ? 'text-[8px]' : size === 'lg' ? 'text-[10px]' : 'text-[9px]';

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Dynamic Emblem / Mark */}
      <div className={`relative ${iconSize} shrink-0 group`}>
        {/* Ambient Glow */}
        <div className="absolute -inset-1 bg-gradient-to-tr from-emerald-500/30 via-teal-400/20 to-cyan-500/30 rounded-2xl blur-[6px] opacity-75 group-hover:opacity-100 transition-opacity" />
        
        {/* Main Vector Shield / Hexagon Container */}
        <div className="relative w-full h-full rounded-xl bg-[#090d16] border border-emerald-500/30 p-1 flex items-center justify-center shadow-lg shadow-emerald-950/50 overflow-hidden group-hover:border-emerald-400/50 transition-colors">
          {/* Subtle Radial Gradient Sheen */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-teal-500/15 via-transparent to-transparent pointer-events-none" />

          {/* SVG Vector Logo */}
          <svg
            viewBox="0 0 36 36"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            <defs>
              {/* Primary Emerald/Teal Gradient */}
              <linearGradient id="myfxGradPrimary" x1="2" y1="34" x2="32" y2="4" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#059669" />
                <stop offset="50%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#34d399" />
              </linearGradient>

              {/* Cyan Accent Gradient */}
              <linearGradient id="myfxGradCyan" x1="10" y1="10" x2="34" y2="28" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="60%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#67e8f9" />
              </linearGradient>

              {/* Glow Filter */}
              <filter id="myfxGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="0" stdDeviation="1" floodColor="#10b981" floodOpacity="0.6" />
              </filter>
            </defs>

            {/* Background Geometric Grid / Ticks */}
            <circle cx="18" cy="18" r="15" stroke="#1e293b" strokeWidth="0.8" strokeDasharray="1.5 2" />
            <line x1="18" y1="3" x2="18" y2="6" stroke="#334155" strokeWidth="0.8" strokeLinecap="round" />
            <line x1="18" y1="30" x2="18" y2="33" stroke="#334155" strokeWidth="0.8" strokeLinecap="round" />
            <line x1="3" y1="18" x2="6" y2="18" stroke="#334155" strokeWidth="0.8" strokeLinecap="round" />
            <line x1="30" y1="18" x2="33" y2="18" stroke="#334155" strokeWidth="0.8" strokeLinecap="round" />

            {/* Candlestick Wick (Alpha Vector) */}
            <line x1="9" y1="5" x2="9" y2="31" stroke="#34d399" strokeWidth="1.2" strokeLinecap="round" opacity="0.85" />
            
            {/* Bullish Candlestick Body ("M" left pillar) */}
            <rect
              x="6.5"
              y="12"
              width="5"
              height="13"
              rx="1.2"
              fill="url(#myfxGradPrimary)"
              filter="url(#myfxGlow)"
            />

            {/* Central "M" Valley to Ascending Peak Trendline */}
            <path
              d="M11.5 15L15.5 21L20 11"
              stroke="#e2e8f0"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* "FX" Forward Momentum Cross Vector (Breakout Arrow) */}
            <path
              d="M17 25L28 9"
              stroke="url(#myfxGradCyan)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M20 9L29 24"
              stroke="#38bdf8"
              strokeWidth="2.2"
              strokeLinecap="round"
              opacity="0.9"
            />

            {/* Delta Arrowhead at top-right peak */}
            <path
              d="M23 8.5H29V14.5"
              stroke="#67e8f9"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Pulse Intersection Node */}
            <circle cx="24" cy="15" r="2.2" fill="#38bdf8" />
            <circle cx="24" cy="15" r="1.1" fill="#ffffff" />
          </svg>
        </div>
      </div>

      {/* Brand Typography */}
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`font-black ${titleSize} tracking-tight text-white`}>
            my<span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent font-black">fx</span>
          </span>
          <span className={`font-semibold ${titleSize} tracking-tight text-slate-200 hidden sm:inline`}>
            journal
          </span>
          {showBadge && (
            <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 ml-0.5 shadow-[0_0_8px_rgba(16,185,129,0.12)] hidden sm:inline-block">
              PRO
            </span>
          )}
        </div>
        {showSubtitle && (
          <span className={`${subSize} tracking-[0.16em] uppercase font-mono font-medium text-slate-400 mt-0.5 hidden md:block`}>
            Trading Intelligence
          </span>
        )}
      </div>
    </div>
  );
};

export default MyFxLogo;
