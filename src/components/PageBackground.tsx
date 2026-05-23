import React from 'react';

interface PageBackgroundProps {
  children: React.ReactNode;
  className?: string;
}

const PageBackground: React.FC<PageBackgroundProps> = ({ children, className = '' }) => {
  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#E0F7FA_0%,#FFFFFF_50%,#E3F2FD_100%)]">
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${className}`}>
        {children}
      </div>
    </div>
  );
};

export default PageBackground;
