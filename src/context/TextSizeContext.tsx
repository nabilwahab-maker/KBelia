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
  const [textSize, setTextSizeState] = useState<TextSizeMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'normal' || saved === 'large') {
        return saved;
      }
    } catch {
      // ignore storage errors
    }
    return 'normal';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.textSize = textSize;
    root.style.fontSize = textSize === 'large' ? '18px' : '16px';
    try {
      localStorage.setItem(STORAGE_KEY, textSize);
    } catch {
      // ignore storage errors
    }
  }, [textSize]);

  const setTextSize = (size: TextSizeMode) => {
    setTextSizeState(size);
  };

  const toggleTextSize = () => {
    setTextSizeState(prev => (prev === 'large' ? 'normal' : 'large'));
  };

  return (
    <TextSizeContext.Provider
      value={{
        textSize,
        isLargeText: textSize === 'large',
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
