"use client";

import { useRef, useState, useEffect } from "react";

export default function CivicLens() {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);
  const [showGlow, setShowGlow] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowGlow(true);
      setTimeout(() => setShowGlow(false), 6000);
    }, 12000);

    return () => clearInterval(interval);
  }, []);

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const magnifyingGlassSvg = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 70 70"><circle cx="30" cy="30" r="20" fill="none" stroke="%23374151" stroke-width="5"/><line x1="45" y1="45" x2="58" y2="58" stroke="%23374151" stroke-width="5" stroke-linecap="round"/></svg>') 50 50`;

  const glowAnimation = `
    @keyframes glowLeftToRight {
      0% {
        background-position: -48% center ;
      }
      100% {
        background-position: 235% center;
      }
    }
  `;

  return (
    <>
      <style>{glowAnimation}</style>
      <div
        ref={ref}
        onMouseMove={handleMove}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="relative inline-block select-none"
        style={{ 
          cursor: hovered ? magnifyingGlassSvg + ", pointer" : "pointer"
        }}
      >
        {/* Base text - always visible */}
        <span
          className={`block text-7xl md:text-9xl font-extrabold transition-all duration-300 ${
            hovered ? "blur-sm text-zinc-500" : "blur-0 text-zinc-900 dark:text-white"
          }`}
        >
          Civic Lens
        </span>

        {/* Gradient overlay - travels over text */}
        {showGlow && (
          <span
            className="pointer-events-none absolute inset-0 text-7xl md:text-9xl font-extrabold text-transparent"
            style={{
              animation: "glowLeftToRight 10s ease-in-out forwards",
              backgroundImage: "linear-gradient(90deg, transparent 0%, transparent 20%, #40ffaa 35%, #4079ff 50%, #40ffaa 65%, transparent 80%, transparent 100%)",
              backgroundSize: "200% 100%",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
            }}
          >
            Civic Lens
          </span>
        )}

        {/* Masked sharp text (only on hover) */}
        {hovered && (
          <span
            className="pointer-events-none absolute inset-0 text-7xl md:text-9xl font-extrabold text-zinc-900 dark:text-white"
            style={{
              WebkitMaskImage: `radial-gradient(
                circle 70px at ${pos.x}px ${pos.y}px,
                black 0%,
                black 40%,
                transparent 60%
              )`,
              maskImage: `radial-gradient(
                circle 70px at ${pos.x}px ${pos.y}px,
                black 0%,
                black 40%,
                transparent 60%
              )`,
            }}
          >
            Civic Lens
          </span>
        )}
      </div>
    </>
  );
}