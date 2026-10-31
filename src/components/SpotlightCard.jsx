import { useState, useRef } from 'react';
import { sounds } from '../utils/soundEffects';

export default function SpotlightCard({
  children,
  className = '',
  style = {},
  spotlightColor = 'var(--theme-accent-bg, rgba(99, 102, 241, 0.15))',
  borderColor = 'var(--theme-accent-border, rgba(129, 140, 248, 0.4))',
  interactive = true,
  onClick,
  ...props
}) {
  const divRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e) => {
    if (!divRef.current || !interactive) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseEnter = () => {
    if (interactive) setOpacity(1);
  };

  const handleMouseLeave = () => {
    if (interactive) setOpacity(0);
  };

  const handleClick = (e) => {
    if (interactive) sounds.playClick();
    if (onClick) onClick(e);
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      className={`spotlight-card ${className}`}
      style={{
        position: 'relative',
        borderRadius: 'var(--radius-xl)',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        overflow: 'hidden',
        transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease, border-color 0.25s ease',
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
      {...props}
    >
      {/* Dynamic Cursor Spotlight Layer */}
      {interactive && (
        <div
          style={{
            pointerEvents: 'none',
            position: 'absolute',
            inset: -1,
            borderRadius: 'inherit',
            opacity,
            transition: 'opacity 0.3s ease',
            background: `radial-gradient(450px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 70%)`,
            zIndex: 1,
          }}
        />
      )}

      {/* Dynamic Glowing Border Highlight */}
      {interactive && (
        <div
          style={{
            pointerEvents: 'none',
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            opacity,
            transition: 'opacity 0.3s ease',
            border: `1px solid ${borderColor}`,
            maskImage: `radial-gradient(180px circle at ${position.x}px ${position.y}px, black 30%, transparent 100%)`,
            WebkitMaskImage: `radial-gradient(180px circle at ${position.x}px ${position.y}px, black 30%, transparent 100%)`,
            zIndex: 2,
          }}
        />
      )}

      {/* Card Content */}
      <div style={{ position: 'relative', zIndex: 3 }}>
        {children}
      </div>
    </div>
  );
}

