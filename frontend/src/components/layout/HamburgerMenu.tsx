import React, { useState, useRef, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';

interface HamburgerMenuProps {
  isOpen: boolean;
  onClick: () => void;
  className?: string;
}

const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ isOpen, onClick, className }) => {
  const [isClicked, setIsClicked] = useState(false);
  const [sparkles, setSparkles] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const sparkleIdRef = useRef(0);

  const handleClick = () => {
    setIsClicked(true);
    onClick();
    
    // Create ripple effect
    if (buttonRef.current) {
      const ripple = document.createElement('div');
      ripple.className = 'absolute rounded-full bg-white/30 animate-pulse';
      ripple.style.left = '50%';
      ripple.style.top = '50%';
      ripple.style.width = '4px';
      ripple.style.height = '4px';
      ripple.style.transform = 'translate(-50%, -50%)';
      ripple.style.pointerEvents = 'none';
      buttonRef.current.appendChild(ripple);
      
      setTimeout(() => {
        if (buttonRef.current && ripple.parentNode === buttonRef.current) {
          buttonRef.current.removeChild(ripple);
        }
      }, 600);
    }

    // Create sparkle effect
    const newSparkles = Array.from({ length: 3 }, () => ({
      id: sparkleIdRef.current++,
      x: Math.random() * 40 - 20, // Random position around button
      y: Math.random() * 40 - 20,
    }));
    
    setSparkles(prev => [...prev, ...newSparkles]);
    
    // Remove sparkles after animation
    setTimeout(() => {
      setSparkles(prev => prev.filter(sparkle => 
        !newSparkles.some(newSparkle => newSparkle.id === sparkle.id)
      ));
    }, 1000);

    setTimeout(() => setIsClicked(false), 150);
  };

  useEffect(() => {
    // Clear sparkles when component unmounts
    return () => setSparkles([]);
  }, []);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={handleClick}
        className={cn(
          "relative group glass-button rounded-xl transition-all duration-300 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:ring-offset-2 active:scale-95",
          "bg-gradient-to-br from-white/90 via-white/80 to-gray-50/90 backdrop-blur-md border border-white/30",
          "hover:from-white/95 hover:via-white/85 hover:to-gray-50/95 hover:border-white/40",
          "shadow-lg hover:shadow-xl",
          isClicked && "scale-95",
          className
        )}
        aria-label={isOpen ? "Close menu" : "Open menu"}
        aria-expanded={isOpen}
      >
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary-400/20 to-blue-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
        
        {/* Button content */}
        <div className="relative flex flex-col items-center justify-center w-12 h-12 space-y-1.5">
          {/* Hamburger lines */}
          <div 
            className={cn(
              "hamburger-line hamburger-line-1 w-5 h-0.5 bg-gradient-to-r from-gray-600 to-gray-700 rounded-full transition-all duration-300",
              isOpen 
                ? "rotate-45 translate-y-2 bg-gradient-to-r from-primary-600 to-blue-600" 
                : "group-hover:bg-gradient-to-r group-hover:from-primary-600 group-hover:to-blue-600"
            )}
          />
          <div 
            className={cn(
              "hamburger-line hamburger-line-2 w-5 h-0.5 bg-gradient-to-r from-gray-600 to-gray-700 rounded-full transition-all duration-300",
              isOpen 
                ? "opacity-0 scale-0" 
                : "group-hover:bg-gradient-to-r group-hover:from-primary-600 group-hover:to-blue-600 group-hover:w-6"
            )}
          />
          <div 
            className={cn(
              "hamburger-line hamburger-line-3 w-5 h-0.5 bg-gradient-to-r from-gray-600 to-gray-700 rounded-full transition-all duration-300",
              isOpen 
                ? "-rotate-45 -translate-y-2 bg-gradient-to-r from-primary-600 to-blue-600" 
                : "group-hover:bg-gradient-to-r group-hover:from-primary-600 group-hover:to-blue-600"
            )}
          />
        </div>

        {/* Hover pulse effect */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 animate-pulse transition-opacity duration-300" />
      </button>

      {/* Sparkles */}
      {sparkles.map((sparkle) => (
        <div
          key={sparkle.id}
          className="absolute pointer-events-none"
          style={{
            left: `calc(50% + ${sparkle.x}px)`,
            top: `calc(50% + ${sparkle.y}px)`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <Sparkles 
            className="w-3 h-3 text-primary-500 animate-sparkle opacity-80" 
            style={{ animationDelay: `${Math.random() * 500}ms` }}
          />
        </div>
      ))}
    </div>
  );
};

export default HamburgerMenu;