// src/components/ui/InfoTooltip.tsx
import React from 'react';
import { Info } from 'lucide-react';

interface InfoTooltipProps {
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

const InfoTooltip: React.FC<InfoTooltipProps> = ({ 
  content, 
  position = 'top',
  className = '' 
}) => {
  const positionClasses = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
    left: 'right-full mr-2',
    right: 'left-full ml-2'
  };

  return (
    <div className={`relative inline-block group ${className}`}>
      <Info className="h-4 w-4 text-gray-400 cursor-help" />
      <div className={`absolute z-10 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white border border-gray-200 shadow-lg rounded-lg p-3 w-64 text-sm text-gray-600 ${positionClasses[position]}`}>
        {content}
      </div>
    </div>
  );
};

export default InfoTooltip;