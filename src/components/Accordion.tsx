import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface AccordionItem {
  id: string;
  title: string;
  subtitle?: string;
  content: React.ReactNode;
  icon?: React.ReactNode;
  badge?: string;
}

interface AccordionProps {
  items: AccordionItem[];
  allowMultiple?: boolean;
  defaultOpenIds?: string[];
  className?: string;
}

export const Accordion: React.FC<AccordionProps> = ({
  items,
  allowMultiple = false,
  defaultOpenIds = [],
  className = ''
}) => {
  const [openIds, setOpenIds] = useState<string[]>(defaultOpenIds);

  const toggleItem = (id: string) => {
    setOpenIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      } else {
        return allowMultiple ? [...prev, id] : [id];
      }
    });
  };

  return (
    <div className={`space-y-2.5 ${className}`}>
      {items.map((item) => {
        const isOpen = openIds.includes(item.id);

        return (
          <div
            key={item.id}
            className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
              isOpen
                ? 'border-amber-400 dark:border-amber-400/60 bg-white dark:bg-slate-800 shadow-xs'
                : 'border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/60 hover:border-amber-300 dark:hover:border-slate-600'
            }`}
          >
            {/* Header Button with min 44px tap target */}
            <button
              type="button"
              onClick={() => toggleItem(item.id)}
              aria-expanded={isOpen}
              className="w-full min-h-[48px] px-4 py-3.5 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                {item.icon && (
                  <div className={`p-1.5 rounded-xl shrink-0 ${
                    isOpen 
                      ? 'bg-amber-50 text-black dark:bg-amber-950/60 dark:text-white/75' 
                      : 'bg-slate-100 text-black/70 dark:bg-slate-800 dark:text-white/75'
                  }`}>
                    {item.icon}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs sm:text-sm font-bold text-black dark:text-white leading-snug">
                      {item.title}
                    </span>
                    {item.badge && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-50 text-black border border-amber-200 dark:bg-amber-950/60 dark:text-white dark:border-amber-800/70">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  {item.subtitle && (
                    <p className="text-[11px] text-black/70 dark:text-white/75 mt-0.5 truncate">
                      {item.subtitle}
                    </p>
                  )}
                </div>
              </div>

              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-black/70 dark:text-white/75 transition-transform duration-200 ${
                  isOpen ? 'rotate-180 text-black dark:text-white/75' : ''
                }`}
              >
                <ChevronDown className="w-4 h-4" />
              </div>
            </button>

            {/* Collapsible Content */}
            {isOpen && (
              <div className="px-4 pb-4 pt-1 text-xs text-black dark:text-white leading-relaxed border-t border-slate-200/80 dark:border-slate-700/80 animate-in fade-in duration-150">
                {item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
