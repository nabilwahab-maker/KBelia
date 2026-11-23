import React from 'react';

interface KBeliaLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showWordmark?: boolean;
  subtitle?: string;
  tone?: 'auto' | 'onDark' | 'onLight';
  className?: string;
}

const SIZE_MAP = {
  sm: { box: 'w-8 h-8', text: 'text-base', gap: 'gap-2' },
  md: { box: 'w-9 h-9', text: 'text-lg', gap: 'gap-2.5' },
  lg: { box: 'w-12 h-12', text: 'text-2xl', gap: 'gap-3' },
  xl: { box: 'w-14 h-14', text: 'text-3xl', gap: 'gap-3.5' },
};

/**
 * Official KBelia Brand Emblem:
 * Sculpted K+B organic monogram fusing a modular kiosk roofline (K)
 * with flowing Kelantan batik & wau canting curves (B) and a Songket gold diamond spark.
 */
export const KBeliaLogo: React.FC<KBeliaLogoProps> = ({
  size = 'md',
  showWordmark = true,
  subtitle,
  tone = 'auto',
  className = '',
}) => {
  const dims = SIZE_MAP[size];
  const gradId = React.useId().replace(/:/g, '');

  const wordmarkColor =
    tone === 'onDark'
      ? 'text-[#F4F1EA]'
      : tone === 'onLight'
        ? 'text-[#13261F]'
        : 'text-slate-900 dark:text-[#F4F1EA]';

  const subtitleColor =
    tone === 'onDark'
      ? 'text-[#C2BDB2]'
      : tone === 'onLight'
        ? 'text-[#4F5A55]'
        : 'text-slate-600 dark:text-[#C2BDB2]';

  return (
    <div className={`inline-flex items-center ${dims.gap} shrink-0 select-none ${className}`}>
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${dims.box} shrink-0`}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`kb-roof-${gradId}`} x1="8" y1="8" x2="36" y2="24" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id={`kb-body-${gradId}`} x1="12" y1="16" x2="54" y2="54" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="55%" stopColor="#0B7A5C" />
            <stop offset="100%" stopColor="#065F46" />
          </linearGradient>
          <linearGradient id={`kb-gold-${gradId}`} x1="28" y1="28" x2="38" y2="42" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F3CE7A" />
            <stop offset="100%" stopColor="#C98D26" />
          </linearGradient>
        </defs>

        {/* Modular Kiosk Canopy Roofline above K */}
        <path
          d="M7 22.5L26.5 11.5L36.5 19.2L32.8 22.3L25.8 17L12.5 24.4C10.1 25.1 7.9 24.3 7 22.5Z"
          fill={`url(#kb-roof-${gradId})`}
        />

        {/* Integrated Organic K Pillar + Flowing Batik/Wau B Loops */}
        <path
          d="M14.5 26.2C14.5 24.7 15.7 23.5 17.2 23.5H19.4C20.9 23.5 22.1 24.7 22.1 26.2V34.1C24.7 31.3 28.4 26.7 32.1 23.4C35.8 20.1 40.3 18.6 44.6 19.3C50.4 20.2 54.4 24.7 54.4 30.1C54.4 33.4 52.8 36.2 50.1 38C53.6 39.8 55.6 43.1 55.6 47.1C55.6 53.3 50.2 57.6 43.1 57.6C37.1 57.6 32.2 54.5 27.6 49.4C25.5 47.1 23.7 44.8 22.1 43.3V53.3C22.1 54.8 20.9 56 19.4 56H17.2C15.7 56 14.5 54.8 14.5 53.3V26.2ZM24.2 38.4C26.4 40.3 29.1 43.5 32.1 46.7C35.5 50.3 39.1 52.2 43.1 52.2C46.9 52.2 49.4 49.9 49.4 46.8C49.4 43.6 46.8 41.3 42.6 41.3H40.3C38.9 41.3 37.8 40.2 37.8 38.8C37.8 37.5 38.8 36.4 40.1 36.4H42.1C45.9 36.4 48.2 34.4 48.2 31.3C48.2 28.1 45.7 25.8 42.3 25.8C38.6 25.8 35.4 27.8 31.4 31.7C28.8 34.2 26.2 36.7 24.2 38.4Z"
          fill={`url(#kb-body-${gradId})`}
        />

        {/* Delicate Batik Curl Counter-Accent */}
        <path
          d="M42.8 28.7C40.1 28.7 38.2 30.6 38.2 32.9C38.2 34.3 39.1 35.4 40.3 35.7C39.6 34.8 39.4 33.7 39.7 32.6C40.2 31 41.7 30 43.4 30.2C44.1 30.3 44.7 30.5 45.1 30.8C44.7 29.5 43.9 28.7 42.8 28.7Z"
          fill="#34D399"
          fillOpacity="0.85"
        />
        <path
          d="M43.4 49.7C40.7 49.7 38.7 47.8 38.7 45.4C38.7 44 39.6 42.9 40.8 42.6C40.1 43.5 39.9 44.6 40.2 45.7C40.7 47.3 42.2 48.3 43.9 48.1C44.6 48 45.2 47.8 45.6 47.5C45.2 48.8 44.5 49.7 43.4 49.7Z"
          fill="#34D399"
          fillOpacity="0.7"
        />

        {/* Songket Gold Diamond Spark */}
        <path
          d="M32.3 33.4L36.2 38.9L32.3 44.4L28.4 38.9L32.3 33.4Z"
          fill={`url(#kb-gold-${gradId})`}
        />
      </svg>

      {showWordmark && (
        <div className="leading-tight">
          <span
            className={`font-display font-bold tracking-tight whitespace-nowrap ${dims.text} ${wordmarkColor}`}
          >
            KBelia
          </span>
          {subtitle && (
            <p className={`text-xs font-medium whitespace-nowrap ${subtitleColor}`}>{subtitle}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default KBeliaLogo;
