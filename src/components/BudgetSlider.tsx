import React, { useState } from 'react';

interface BudgetSliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (val: number) => void;
  label?: string;
}

export const BudgetSlider: React.FC<BudgetSliderProps> = ({
  value,
  min = 100,
  max = 500,
  step = 25,
  onChange,
  label = 'Had Bajet Sewa'
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  const knobDiameter = 18; // 18px diameter

  return (
    <div className="relative pt-6 pb-1.5 w-full max-w-xs select-none">
      {/* Header Label and Current Value */}
      <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
        <span>{label}:</span>
        <span className="font-extrabold text-red-700 dark:text-amber-400 font-mono">
          RM {value} /bln
        </span>
      </div>

      {/* Slider Track and Knob Container */}
      <div className="relative flex items-center h-6 w-full">
        {/* Floating Bubble Value Indicator */}
        <div
          className={`absolute -top-7 transition-all duration-150 pointer-events-none z-30 ${
            isDragging ? 'scale-110' : 'scale-100'
          }`}
          style={{
            left: `calc(${percentage}% - ${(percentage / 100) * knobDiameter}px + ${knobDiameter / 2}px)`,
            transform: 'translateX(-50%)'
          }}
        >
          <div className="relative px-2 py-0.5 rounded-lg bg-red-700 text-white text-[10px] font-black font-mono shadow-md whitespace-nowrap">
            RM {value}
            {/* Bubble arrow tip */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-red-700" />
          </div>
        </div>

        {/* Track Bar (Divider Line) */}
        <div className="relative w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-red-600 via-red-500 to-amber-500 rounded-full transition-all duration-75"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Real Range Input Overlaid */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
        />

        {/* Custom Visible Knob - Strictly bounded within divider track (never extends past edges) */}
        <div
          className="absolute top-1/2 -translate-y-1/2 rounded-full bg-white dark:bg-slate-100 border-2 border-red-700 shadow-md pointer-events-none transition-all duration-75 z-10"
          style={{
            width: `${knobDiameter}px`,
            height: `${knobDiameter}px`,
            left: `calc(${percentage}% - ${(percentage / 100) * knobDiameter}px)`
          }}
        />
      </div>

      {/* Min/Max Labels perfectly aligned with track edges */}
      <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-medium">
        <span>RM {min}</span>
        <span>RM {max}</span>
      </div>
    </div>
  );
};
