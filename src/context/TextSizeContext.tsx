import React, { createContext, useContext, useEffect, useState } from 'react';

export type TextSizeMode = 'normal' | 'large';

interface TextSizeContextType {
  textSize: TextSizeMode;
  isLargeText: boolean;
  setTextSize: (size: TextSizeMode) => void;
  toggleTextSize: () => void;
}

const STORAGE_KEY = 'kbelia_text_size';

const TextSizeContext = createContext<TextSizeContextType | undefined>(undefined);

export const TextSizeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [textSize] = useState<TextSizeMode>('normal');

  useEffect(() => {
    const root = document.documentElement;
    delete root.dataset.textSize;
    root.style.fontSize = '16px';
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore storage errors
    }
  }, []);

  const setTextSize = (_size: TextSizeMode) => {
    // Locked to standard 16px across all pages
  };

  const toggleTextSize = () => {
    // Locked to standard 16px across all pages
  };

  return (
    <TextSizeContext.Provider
      value={{
        textSize,
        isLargeText: false,
        setTextSize,
        toggleTextSize
      }}
    >
      {children}
    </TextSizeContext.Provider>
  );
};

export const useTextSize = (): TextSizeContextType => {
  const context = useContext(TextSizeContext);
  if (!context) {
    throw new Error('useTextSize must be used within a TextSizeProvider');
  }
  return context;
};
