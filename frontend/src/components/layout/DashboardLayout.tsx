import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  X,
  Home,
  Users,
  BookOpen,
  Calendar,
  ClipboardCheck,
  GraduationCap,
  FileText,
  Settings,
  LogOut,
  Bell,
  Search,
  User,
  ChevronDown,
  Key,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import HamburgerMenu from '@/components/ui/HamburgerMenu';
import { cn, getInitials } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '', icon: Home, roles: ['superadmin', 'admin', 'teacher', 'student', 'parent', 'accountant'] },
  { name: 'Schools', href: '/schools', icon: GraduationCap, roles: ['superadmin'] },
  { name: 'Reports', href: '/reports', icon: FileText, roles: ['superadmin'] },
  { name: 'Orange SMS', href: '/orange-sms', icon: Key, roles: ['superadmin'] },
  { name: 'Students', href: '/students', icon: Users, roles: ['admin', 'teacher'] },
  { name: 'Teachers', href: '/teachers', icon: User, roles: ['admin'] },
  { name: 'Subjects', href: '/subjects', icon: BookOpen, roles: ['admin'] },
  { name: 'Schedule', href: '/schedule', icon: Calendar, roles: ['admin', 'teacher', 'student'] },
  { name: 'Attendance', href: '/attendance', icon: ClipboardCheck, roles: ['admin', 'teacher', 'student', 'parent'] },
  { name: 'Grades', href: '/grades', icon: FileText, roles: ['admin', 'teacher', 'student', 'parent'] },
  { name: 'My Children', href: '/children', icon: Users, roles: ['parent'] },
  { name: 'Fees', href: '/fees', icon: FileText, roles: ['accountant', 'admin'] },
];

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(user?.role || '')
  );

  const currentPath = location.pathname.split('/').slice(2).join('/'); // Remove role prefix

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Enhanced Mobile sidebar backdrop with sophisticated glassy effect */}
      <div className={cn(
        "fixed inset-0 z-40 lg:hidden transition-all duration-500 ease-out",
        sidebarOpen ? "opacity-100 visible" : "opacity-0 invisible"
      )}>
        {/* Main backdrop */}
        <div 
          className={cn(
            "absolute inset-0 transition-all duration-500",
            "bg-gradient-to-br from-black/70 via-gray-900/50 to-black/70",
            "backdrop-blur-md"
          )}
          onClick={() => setSidebarOpen(false)}
        />
        
        {/* Animated floating orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/6 w-40 h-40 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/3 right-1/5 w-32 h-32 bg-gradient-to-r from-purple-500/15 to-pink-500/15 rounded-full blur-2xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-full blur-xl animate-pulse delay-2000" />
        </div>
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent bg-repeat" 
               style={{
                 backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.1) 1px, transparent 0)',
                 backgroundSize: '20px 20px'
               }} />
        </div>
      </div>

      {/* Enhanced Sidebar with glassy effects */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
        "bg-gradient-to-b from-white/95 to-white/90 backdrop-blur-xl",
        "border-r border-white/20 shadow-xl lg:shadow-lg",
        "lg:bg-white lg:backdrop-blur-none", // Normal background on desktop
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Glassy overlay for mobile */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-purple-50/20 lg:hidden" />
        <div className="relative flex items-center justify-between h-16 px-6 border-b border-white/20 lg:border-gray-200">
          <div className="flex items-center relative z-10">
            <GraduationCap className="h-8 w-8 text-primary-600" />
            <span className="ml-2 text-xl font-semibold text-gray-900">SchoolMS</span>
          </div>
          
          {/* Enhanced close button */}
          <button
            className="lg:hidden relative group p-2 rounded-lg bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-md border border-white/20 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 active:scale-95"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation menu"
          >
            {/* Glassy background effect */}
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-red-50/50 to-pink-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Animated X icon */}
            <X className={cn(
              "h-5 w-5 relative z-10 text-gray-700 transition-all duration-300",
              "group-hover:text-red-600 group-hover:rotate-90"
            )} />
            
            {/* Hover ripple effect */}
            <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-red-400/20 to-pink-400/20 animate-pulse" />
            </div>
          </button>
        </div>

        <nav className="mt-6 px-3 relative z-10">
          <ul className="space-y-1">
            {filteredNavigation.map((item) => {
              const isActive = currentPath === item.href.slice(1); // Remove leading slash
              return (
                <li key={item.name}>
                  <Link
                    to={`/${user?.role}${item.href}`}
                    className={cn(
                      "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-300 relative group overflow-hidden",
                      isActive
                        ? "bg-gradient-to-r from-primary-100/90 to-primary-50/70 text-primary-700 border-r-2 border-primary-600 backdrop-blur-sm shadow-md transform scale-[1.02]"
                        : "text-gray-700 hover:bg-gradient-to-r hover:from-white/70 hover:to-gray-50/50 hover:text-gray-900 hover:backdrop-blur-sm hover:shadow-md hover:scale-[1.01] lg:hover:bg-gray-100 lg:hover:backdrop-blur-none lg:hover:scale-100"
                    )}
                    onClick={() => setSidebarOpen(false)}
                  >
                    {/* Background shimmer effect for active item */}
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
                    )}
                    
                    <item.icon className={cn(
                      "mr-3 h-5 w-5 transition-all duration-300 relative z-10",
                      isActive 
                        ? "text-primary-600 animate-bounce-subtle" 
                        : "group-hover:scale-110 group-hover:rotate-3 group-hover:text-primary-600"
                    )} />
                    
                    <span className={cn(
                      "relative z-10 transition-all duration-300",
                      "group-hover:translate-x-0.5"
                    )}>
                      {item.name}
                    </span>
                    
                    {/* Expanding border effect for hover */}
                    <div className={cn(
                      "absolute left-0 top-1/2 w-0 h-8 bg-gradient-to-r from-primary-500 to-blue-500 transition-all duration-300 -translate-y-1/2 rounded-r-full",
                      "group-hover:w-1 lg:hidden"
                    )} />
                    
                    {/* Subtle glow effect for active item */}
                    {isActive && (
                      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary-400/10 to-blue-400/10 animate-pulse" />
                    )}
                    
                    {/* Hover particle effect */}
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 lg:hidden">
                      <div className="w-1 h-1 bg-primary-400 rounded-full animate-pulse" />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Enhanced User profile section in sidebar */}
        <div className="absolute bottom-0 w-full p-4 border-t border-white/20 lg:border-gray-200 z-10">
          <div className="flex items-center p-3 rounded-xl bg-gradient-to-r from-white/60 to-white/40 backdrop-blur-md border border-white/20 shadow-lg lg:bg-transparent lg:backdrop-blur-none lg:border-none lg:shadow-none lg:p-0">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-500 rounded-full flex items-center justify-center shadow-md ring-2 ring-white/20 lg:w-8 lg:h-8 lg:shadow-none lg:ring-0">
                <span className="text-sm font-medium text-white lg:text-xs">
                  {user?.fullName ? getInitials(user.fullName) : 'U'}
                </span>
              </div>
            </div>
            <div className="ml-3 min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.fullName || user?.username}
              </p>
              <p className="text-xs text-gray-600 capitalize lg:text-gray-500">
                {user?.role}
              </p>
            </div>
            
            {/* Online indicator */}
            <div className="flex-shrink-0 lg:hidden">
              <div className="w-2 h-2 bg-green-400 rounded-full shadow-sm animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top navigation */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center">
              {/* Enhanced Mobile Menu Button */}
              <HamburgerMenu
                isOpen={sidebarOpen}
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden mr-2"
              />
              <h1 className="text-xl font-semibold text-gray-900 capitalize">
                {user?.role} Dashboard
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="hidden md:block relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* Notifications */}
              <Button variant="ghost" size="sm">
                <Bell className="h-5 w-5" />
              </Button>

              {/* Profile dropdown */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center space-x-2"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                >
                  <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-white">
                      {user?.fullName ? getInitials(user.fullName) : 'U'}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </Button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="py-2">
                      <div className="px-4 py-2 border-b border-gray-200">
                        <p className="text-sm font-medium text-gray-900">
                          {user?.fullName || user?.username}
                        </p>
                        <p className="text-xs text-gray-500">
                          {user?.email}
                        </p>
                      </div>
                      <Link
                        to={`/${user?.role}/profile`}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        <User className="mr-3 h-4 w-4" />
                        Profile
                      </Link>
                      <Link
                        to={`/${user?.role}/settings`}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        <Settings className="mr-3 h-4 w-4" />
                        Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="group flex w-full items-center px-4 py-3 text-sm font-semibold rounded-lg bg-gradient-to-r from-red-50 to-pink-50 hover:from-red-100 hover:to-pink-100 text-red-700 hover:text-red-800 border border-red-100 hover:border-red-200 transition-all duration-300 hover:scale-105 active:scale-95 relative overflow-hidden"
                      >
                        {/* Glassy overlay */}
                        <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        
                        {/* Content */}
                        <div className="relative flex items-center w-full">
                          <LogOut className="mr-3 h-4 w-4 group-hover:rotate-12 transition-transform duration-300" />
                          <span>Sign out</span>
                          
                          {/* Arrow indicator */}
                          <div className="ml-auto opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                        
                        {/* Bottom glow line */}
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 to-pink-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
          <div className="container mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
