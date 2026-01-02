import React, { useState } from 'react';
import HamburgerMenu from '../ui/HamburgerMenu';

interface NavItem {
  href: string;
  label: string;
  icon?: React.ReactNode;
}

interface MobileNavigationProps {
  title: string;
  subtitle?: string;
  navItems: NavItem[];
  onLogout: () => void;
  primaryColor?: string;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({
  title,
  subtitle,
  navItems,
  onLogout,
  primaryColor = 'green'
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Dynamic color based on primaryColor prop
  const getGradientClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return 'from-blue-600/95 via-blue-700/90 to-indigo-600/95';
      case 'green':
        return 'from-green-600/95 via-green-700/90 to-emerald-600/95';
      case 'purple':
        return 'from-purple-600/95 via-purple-700/90 to-violet-600/95';
      case 'red':
        return 'from-red-600/95 via-red-700/90 to-pink-600/95';
      default:
        return 'from-primary-600/95 via-primary-700/90 to-blue-600/95';
    }
  };

  const gradientClass = getGradientClasses(primaryColor || 'blue');

  return (
    <header className="bg-white shadow-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4 sm:py-6 lg:py-8">
          <div className="flex items-center">
            <div className="lg:hidden mr-3">
              <HamburgerMenu
                isOpen={isMobileMenuOpen}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2"
              />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900">{title}</h1>
              {subtitle && <p className="text-sm sm:text-base lg:text-lg text-gray-600 hidden sm:block">{subtitle}</p>}
            </div>
          </div>
          <button
            onClick={onLogout}
            className="group relative bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white px-4 py-2 sm:px-6 sm:py-3 lg:px-8 lg:py-4 rounded-2xl text-sm sm:text-base lg:text-lg font-bold transition-all duration-300 shadow-lg hover:shadow-2xl active:scale-95 hover:scale-105 overflow-hidden backdrop-blur-sm border border-red-400/20"
          >
            {/* Glassy overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
            
            {/* Button content */}
            <span className="relative flex items-center gap-2">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </span>
            
            {/* Bottom glow */}
            <div className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-gradient-to-r from-transparent via-white to-transparent group-hover:w-full group-hover:left-0 transition-all duration-300" />
          </button>
        </div>
      </div>

      {/* Desktop Navigation with Enhanced Glassy Effects */}
      <nav className="hidden lg:block relative overflow-hidden">
        {/* Glassy background with gradient */}
        <div className={`absolute inset-0 bg-gradient-to-r ${gradientClass} backdrop-blur-md`} />
        
        {/* Floating orbs background for desktop */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-2 left-1/4 w-16 h-16 bg-white/10 rounded-full blur-xl animate-float" />
          <div className="absolute -bottom-2 right-1/3 w-20 h-20 bg-white/5 rounded-full blur-xl animate-float" style={{ animationDelay: '1.5s' }} />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 shadow-2xl">
          <div className="flex flex-wrap justify-center gap-2 py-4">
            {navItems.map((item, index) => (
              <a
                key={index}
                href={item.href}
                className="group relative text-white px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 flex items-center hover:scale-105 active:scale-95 overflow-hidden"
              >
                {/* Background hover effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/20 to-white/10 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-lg" />
                
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
                
                {/* Content */}
                <div className="relative flex items-center">
                  {item.icon && (
                    <span className="mr-2 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                      {item.icon}
                    </span>
                  )}
                  <span className="group-hover:translate-x-0.5 transition-transform duration-300">
                    {item.label}
                  </span>
                </div>
                
                {/* Bottom glow line */}
                <div className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-gradient-to-r from-transparent via-white to-transparent group-hover:w-full group-hover:left-0 transition-all duration-300" />
                
                {/* Corner sparkle */}
                <div className="absolute top-1 right-1 w-1 h-1 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 animate-pulse" />
              </a>
            ))}
          </div>
        </div>
        
        {/* Bottom border gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      </nav>

      {/* Mobile Navigation with Glassy Effects */}
      <div className={`lg:hidden transition-all duration-300 ease-in-out ${
        isMobileMenuOpen 
          ? 'opacity-100 max-h-screen translate-y-0' 
          : 'opacity-0 max-h-0 -translate-y-4 overflow-hidden'
      }`}>
        {/* Glassy backdrop */}
        <div className="relative backdrop-blur-md bg-gradient-to-br from-white/90 via-white/80 to-gray-50/90 shadow-2xl border-t border-white/20">
          {/* Floating orbs background */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-4 -left-4 w-24 h-24 bg-gradient-to-br from-primary-400/20 to-blue-400/20 rounded-full blur-xl animate-float" />
            <div className="absolute top-1/2 -right-6 w-32 h-32 bg-gradient-to-br from-purple-400/15 to-pink-400/15 rounded-full blur-xl animate-float" style={{ animationDelay: '1s' }} />
            <div className="absolute -bottom-2 left-1/3 w-20 h-20 bg-gradient-to-br from-green-400/20 to-teal-400/20 rounded-full blur-xl animate-float" style={{ animationDelay: '2s' }} />
          </div>

          {/* Grid pattern overlay */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `
                linear-gradient(90deg, rgba(99, 102, 241, 0.1) 1px, transparent 1px),
                linear-gradient(180deg, rgba(99, 102, 241, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px'
            }} />
          </div>

          <div className="relative px-2 pt-4 pb-6 space-y-2">
            {navItems.map((item, index) => (
              <a
                key={index}
                href={item.href}
                className="group relative block px-4 py-3 rounded-xl text-gray-700 font-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
                onClick={() => setIsMobileMenuOpen(false)}
                style={{
                  animationDelay: `${index * 100}ms`
                }}
              >
                {/* Background gradient on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary-50/60 via-white/40 to-blue-50/60 opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm rounded-xl" />
                
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
                
                {/* Content */}
                <div className="relative flex items-center">
                  {item.icon && (
                    <span className="mr-3 text-primary-600 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                      {item.icon}
                    </span>
                  )}
                  <span className="group-hover:translate-x-1 transition-transform duration-300">
                    {item.label}
                  </span>
                  
                  {/* Arrow indicator */}
                  <div className="ml-auto opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                    <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>

                {/* Bottom border effect */}
                <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-gradient-to-r from-primary-500 to-blue-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                
                {/* Particle effect */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <div className="w-1 h-1 bg-primary-400 rounded-full animate-pulse" />
                </div>
              </a>
            ))}
          </div>

          {/* Bottom gradient fade */}
          <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-white/60 to-transparent" />
        </div>
      </div>
    </header>
  );
};

export default MobileNavigation;