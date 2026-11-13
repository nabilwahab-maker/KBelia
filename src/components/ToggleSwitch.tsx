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
            ? 'bg-sky-50/70 dark:bg-sky-950/20 border-sky-200 dark:border-sky-900/60'
            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-sky-300 dark:hover:border-slate-600'
      }`}
    >
      {(label || description) && (
        <div className="flex-1 pr-2">
          {label && (
            <label
              htmlFor={switchId}
              className="text-xs font-bold text-slate-900 dark:text-white block cursor-pointer"
            >
              {label}
            </label>
          )}
          {description && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
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
            checked ? 'bg-sky-600' : 'bg-slate-300 dark:bg-slate-700'
          }`}
        >
          <div
            className={`w-5.5 h-5.5 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out flex items-center justify-center ${
              checked ? 'translate-x-5.5' : 'translate-x-0'
            }`}
          >
            {checked ? (
              <span className="text-[8px] font-black text-sky-700">ON</span>
            ) : (
              <span className="text-[8px] font-bold text-slate-400">OFF</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
