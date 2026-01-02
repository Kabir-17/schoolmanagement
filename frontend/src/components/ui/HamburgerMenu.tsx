import React from 'react';
import { cn } from '@/lib/utils';

interface HamburgerMenuProps {
  isOpen: boolean;
  onClick: () => void;
  className?: string;
}

const HamburgerMenu: React.FC<HamburgerMenuProps> = ({
  isOpen,
  onClick,
  className
}) => {
  return (
    <button
      className={cn(
        "relative group p-3 rounded-xl",
        "bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-lg",
        "border border-white/30 shadow-lg hover:shadow-xl",
        "transition-all duration-300 ease-out",
        "hover:scale-105 active:scale-95",
        "focus:outline-none focus:ring-2 focus:ring-primary-500/50",
        "ripple", // Add ripple effect class
        className
      )}
      onClick={onClick}
      aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
    >
      {/* Animated background gradient */}
      <div className={cn(
        "absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300",
        "bg-gradient-to-br from-blue-50/60 to-purple-50/40"
      )} />
      
      {/* Glowing border effect on hover */}
      <div className={cn(
        "absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300",
        "bg-gradient-to-r from-primary-400/20 to-purple-400/20 blur-sm -z-10 scale-110"
      )} />

      {/* Hamburger icon container */}
      <div className="relative w-6 h-6 flex flex-col justify-center items-center z-10">
        {/* Top line */}
        <div className={cn(
          "w-5 h-0.5 bg-gradient-to-r from-gray-700 to-gray-600 rounded-full",
          "transition-all duration-300 ease-in-out transform-gpu",
          "group-hover:bg-gradient-to-r group-hover:from-primary-600 group-hover:to-blue-600",
          "shadow-sm",
          isOpen ? "rotate-45 translate-y-1.5" : "translate-y-0"
        )} />
        
        {/* Middle line */}
        <div className={cn(
          "w-5 h-0.5 bg-gradient-to-r from-gray-700 to-gray-600 rounded-full",
          "transition-all duration-300 ease-in-out transform-gpu mt-1.5",
          "group-hover:bg-gradient-to-r group-hover:from-primary-600 group-hover:to-blue-600",
          "group-hover:w-4",
          "shadow-sm",
          isOpen ? "opacity-0 scale-0" : "opacity-100 scale-100"
        )} />
        
        {/* Bottom line */}
        <div className={cn(
          "w-5 h-0.5 bg-gradient-to-r from-gray-700 to-gray-600 rounded-full",
          "transition-all duration-300 ease-in-out transform-gpu mt-1.5",
          "group-hover:bg-gradient-to-r group-hover:from-primary-600 group-hover:to-blue-600",
          "group-hover:w-3",
          "shadow-sm",
          isOpen ? "-rotate-45 -translate-y-1.5" : "translate-y-0"
        )} />
      </div>

      {/* Pulsing dot indicator when menu is open */}
      {isOpen && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse opacity-75" />
        </div>
      )}

      {/* Micro-interaction sparkles */}
      <div className={cn(
        "absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      )}>
        <div className="absolute top-1 right-1 w-1 h-1 bg-blue-400 rounded-full animate-pulse delay-100" />
        <div className="absolute bottom-1 left-1 w-1 h-1 bg-purple-400 rounded-full animate-pulse delay-200" />
        <div className="absolute top-1 left-2 w-0.5 h-0.5 bg-pink-400 rounded-full animate-pulse delay-300" />
      </div>

      {/* Loading state animation (optional) */}
      <div className={cn(
        "absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300",
        "bg-gradient-to-r from-primary-400/10 to-blue-400/10",
        isOpen ? "opacity-100" : "opacity-0"
      )}>
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
      </div>
    </button>
  );
};

export default HamburgerMenu;