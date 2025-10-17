import React from 'react';
import './InfoBanner.css';

interface InfoBannerProps {
  children: React.ReactNode;
  compact?: boolean;
  className?: string;
}

const InfoBanner: React.FC<InfoBannerProps> = ({ children, compact = false, className }) => {
  return (
    <div className={`info-banner ${compact ? 'info-banner-compact' : ''} ${className || ''}`.trim()}>
      <div className="info-banner-content">{children}</div>
    </div>
  );
};

export default InfoBanner;


