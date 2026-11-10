import React, { useEffect, useState, useRef } from 'react';

interface TopProgressBarProps {
  isNavigating?: boolean;
}

export const TopProgressBar: React.FC<TopProgressBarProps> = ({ isNavigating }) => {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startProgress = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setVisible(true);
    setProgress(15);

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev < 40) return prev + Math.floor(Math.random() * 15 + 10);
        if (prev < 75) return prev + Math.floor(Math.random() * 8 + 5);
        if (prev < 90) return prev + Math.floor(Math.random() * 3 + 1);
        return prev;
      });
    }, 120);
  };

  const finishProgress = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setProgress(100);
    setTimeout(() => {
      setVisible(false);
      setTimeout(() => setProgress(0), 200);
    }, 280);
  };

  // Trigger when isNavigating changes
  useEffect(() => {
    if (isNavigating) {
      startProgress();
    } else if (visible && progress > 0) {
      finishProgress();
    }
  }, [isNavigating]);

  // Support global custom events for seamless button triggers
  useEffect(() => {
    const handleStart = () => startProgress();
    const handleFinish = () => finishProgress();

    window.addEventListener('kbelia_navigation_start', handleStart);
    window.addEventListener('kbelia_navigation_finish', handleFinish);

    return () => {
      window.removeEventListener('kbelia_navigation_start', handleStart);
      window.removeEventListener('kbelia_navigation_finish', handleFinish);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  if (!visible && progress === 0) return null;

  return (
    <div 
      className="fixed top-0 left-0 right-0 z-[99999] pointer-events-none transition-opacity duration-300"
      style={{ opacity: visible ? 1 : 0 }}
      aria-hidden="true"
    >
      <div
        className="h-[3px] bg-gradient-to-r from-emerald-600 via-teal-400 to-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.85),0_0_6px_rgba(45,212,191,0.6)] transition-all ease-out"
        style={{
          width: `${progress}%`,
          transitionDuration: progress === 100 ? '200ms' : '300ms',
        }}
      >
        {/* YouTube-like leading tip glow */}
        <div className="absolute right-0 top-0 bottom-0 w-24 h-[3px] bg-white/40 shadow-[0_0_10px_#fff,0_0_5px_#34d399] -translate-y-[0.5px]" />
      </div>
    </div>
  );
};

// Helper function to trigger the top loading bar from any button or handler
export const triggerTopNavigationProgress = (durationMs = 450) => {
  window.dispatchEvent(new CustomEvent('kbelia_navigation_start'));
  setTimeout(() => {
    window.dispatchEvent(new CustomEvent('kbelia_navigation_finish'));
  }, durationMs);
};
