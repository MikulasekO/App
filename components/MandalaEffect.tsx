
import React, { useState, useCallback } from 'react';

type RippleVariant = 'simple' | 'complex';
type RippleColor = 'green' | 'purple';

interface Ripple {
  x: number;
  y: number;
  id: number;
  variant: RippleVariant;
  color: RippleColor;
}

export const useMandalaFeedback = () => {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const createRipple = useCallback((e: React.MouseEvent<HTMLElement>, variant: RippleVariant = 'simple', color: RippleColor = 'green') => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now() + Math.random();
    
    setRipples(prev => [...prev, { x, y, id, variant, color }]);
    
    // Cleanup based on duration (1s for complex, 600ms for simple)
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== id));
    }, variant === 'complex' ? 1000 : 600);
  }, []);

  return { ripples, createRipple };
};

const Gradients: React.FC = () => (
  <defs>
    <linearGradient id="grad-green" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#34d399" /> {/* Emerald 400 */}
      <stop offset="100%" stopColor="#059669" /> {/* Emerald 600 */}
    </linearGradient>
    <linearGradient id="grad-purple" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#a78bfa" /> {/* Violet 400 */}
      <stop offset="100%" stopColor="#7c3aed" /> {/* Violet 600 */}
    </linearGradient>
    <linearGradient id="grad-complex-purple" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#d8b4fe" /> 
      <stop offset="50%" stopColor="#818cf8" />
      <stop offset="100%" stopColor="#c084fc" />
    </linearGradient>
    <linearGradient id="grad-complex-green" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#6ee7b7" /> 
      <stop offset="50%" stopColor="#2dd4bf" />
      <stop offset="100%" stopColor="#34d399" />
    </linearGradient>
  </defs>
);

export const MandalaContainer: React.FC<{ ripples: Ripple[] }> = ({ ripples }) => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[inherit] z-50">
      <svg className="absolute w-0 h-0"><Gradients /></svg>
      {ripples.map(r => (
        <React.Fragment key={r.id}>
          {r.variant === 'simple' ? (
            // SIMPLE RIPPLE (Toggle Switch)
            <div 
              className="absolute mandala-simple"
              style={{ left: r.x, top: r.y, width: '100px', height: '100px', marginLeft: '-50px', marginTop: '-50px' }}
            >
              <svg viewBox="0 0 100 100" fill="none" className="w-full h-full opacity-60">
                <circle cx="50" cy="50" r="45" fill={`url(#grad-${r.color})`} />
              </svg>
            </div>
          ) : (
            // COMPLEX MANDALA (Analyze Button)
            <div 
              className="absolute"
              style={{ left: r.x, top: r.y, width: '0px', height: '0px' }} // Center anchor
            >
              {/* Layer 1: Clockwise */}
              <div className="absolute mandala-complex-cw" style={{ width: '200px', height: '200px', left: '-100px', top: '-100px' }}>
                <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
                  <path 
                    d="M50 0 L60 40 L100 50 L60 60 L50 100 L40 60 L0 50 L40 40 Z" 
                    stroke={`url(#grad-complex-${r.color})`} 
                    strokeWidth="1.5" 
                    fill="none" 
                    opacity="0.8" 
                  />
                  <circle cx="50" cy="50" r="30" stroke={`url(#grad-complex-${r.color})`} strokeWidth="1" strokeDasharray="4 2" />
                </svg>
              </div>

              {/* Layer 2: Counter-Clockwise */}
              <div className="absolute mandala-complex-ccw" style={{ width: '160px', height: '160px', left: '-80px', top: '-80px' }}>
                <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
                  <circle cx="50" cy="50" r="45" stroke={`url(#grad-complex-${r.color})`} strokeWidth="2" opacity="0.6" strokeDasharray="2 4" />
                  <rect x="25" y="25" width="50" height="50" transform="rotate(45 50 50)" stroke={`url(#grad-complex-${r.color})`} strokeWidth="1" opacity="0.5" />
                </svg>
              </div>
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
