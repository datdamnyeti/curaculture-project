// src/components/ui/AppNavigation.tsx
import React from 'react';

interface AppNavigationProps {
  user: { email?: string } | null;
  currentPage: string;
  onNavigateDashboard: () => void;
  onNavigateResults: () => void;
  onLogout: () => void;
}

const AppNavigation: React.FC<AppNavigationProps> = ({
  user,
  currentPage,
  onNavigateDashboard,
  onNavigateResults,
  onLogout
}) => {
  return (
    <nav className="bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between h-16 items-center">
          {/* Left side - Logo and current page */}
          <div className="flex items-center space-x-6">
            <h1 
              className="text-xl font-bold text-blue-900 cursor-pointer"
              onClick={onNavigateDashboard}
            >
              CuraCulture
            </h1>
            <div className="hidden md:block">
              <span className="text-sm text-gray-500">
                {currentPage}
              </span>
            </div>
          </div>
          
          {/* Right side - Navigation and user info */}
          <div className="flex items-center space-x-4">
            <button
              onClick={onNavigateDashboard}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentPage === 'Dashboard' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              Dashboard
            </button>
            
            <button
              onClick={onNavigateResults}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentPage === 'Results' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              Results
            </button>
            
            <div className="border-l border-gray-200 pl-4 ml-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
            </div>
            
            <button 
              onClick={onLogout}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AppNavigation;