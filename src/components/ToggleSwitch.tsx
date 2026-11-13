import React from 'react';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  id?: string;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  id
}) => {
  const switchId = id || `toggle-${Math.random().toString(36).substring(2, 8)}`;

  return (
    <div
      onClick={() => !disabled && onChange(!checked)}
      className={`min-h-[44px] flex items-center justify-between gap-3 p-3 rounded-2xl border transition-all cursor-pointer select-none ${
        disabled 
          ? 'opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800' 
          : checked
            ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800/70'
            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-400/70 dark:hover:border-blue-400/70'
      }`}
    >
      {(label || description) && (
        <div className="flex-1 pr-2">
          {label && (
            <label
              htmlFor={switchId}
              className="text-xs font-bold text-black dark:text-white block cursor-pointer"
            >
              {label}
            </label>
          )}
          {description && (
            <p className="text-[11px] text-black/70 dark:text-white/75 mt-0.5 leading-snug">
              {description}
            </p>
          )}
        </div>
      )}

      {/* Toggle Track & Handle */}
      <div className="relative inline-flex items-center shrink-0">
        <input
          type="checkbox"
          id={switchId}
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div
          className={`w-12 h-6.5 rounded-full transition-colors duration-200 ease-in-out relative p-0.5 shadow-inner ${
            checked ? 'bg-blue-600 dark:bg-amber-400' : 'bg-slate-300 dark:bg-slate-700'
          }`}
        >
          <div
            className={`w-5.5 h-5.5 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out flex items-center justify-center ${
              checked ? 'translate-x-5.5' : 'translate-x-0'
            }`}
          >
            {checked ? (
              <span className="text-[8px] font-black text-black dark:text-white">ON</span>
            ) : (
              <span className="text-[8px] font-bold text-black/60 dark:text-white/60">OFF</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
