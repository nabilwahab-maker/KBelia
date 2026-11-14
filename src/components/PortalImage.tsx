import React, { useEffect, useState } from 'react';
import { Building2, Calendar, Award, Store } from 'lucide-react';

interface PortalImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackType?: 'kiosk' | 'program' | 'event' | 'business';
  fallbackLabel?: string;
}

export const PortalImage: React.FC<PortalImageProps> = ({
  src,
  alt,
  className = 'w-full h-full object-cover',
  fallbackType = 'kiosk',
  fallbackLabel
}) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (!src || hasError) {
    const Icon =
      fallbackType === 'program'
        ? Award
        : fallbackType === 'event'
          ? Calendar
          : fallbackType === 'business'
            ? Store
            : Building2;

    return (
      <div
        className={`bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 p-3 text-center select-none ${className}`}
        role="img"
        aria-label={alt}
      >
        <Icon className="w-6 h-6 opacity-70 mb-1 shrink-0" />
        {fallbackLabel && (
          <span className="text-[10px] font-semibold leading-tight line-clamp-2 opacity-80">
            {fallbackLabel}
          </span>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
};
