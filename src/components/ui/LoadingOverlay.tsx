// src/components/ui/LoadingOverlay.tsx
import React from 'react';
import LoadingSpinner from './LoadingSpinner';

interface LoadingOverlayProps {
  isLoading: boolean;
  text?: string;
  children?: React.ReactNode; // Made optional
  className?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  text = 'Loading...',
  children,
  className = ''
}) => {
  // If no children are provided and we're loading, render just the loading indicator
  if (!children && isLoading) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-screen ${className}`}>
        <LoadingSpinner size="large" color="primary" />
        {text && <p className="mt-4 text-gray-700 font-medium">{text}</p>}
      </div>
    );
  }
  
  // If we have children, use the overlay approach
  return (
    <div className={`relative ${className}`}>
      {children}
      
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white bg-opacity-75 z-10">
          <LoadingSpinner size="large" color="primary" />
          {text && <p className="mt-4 text-gray-700 font-medium">{text}</p>}
        </div>
      )}
    </div>
  );
};

export default LoadingOverlay;