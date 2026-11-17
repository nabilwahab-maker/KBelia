import { useEffect, useRef, useState } from 'react';

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(media.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  return reduced;
}

interface UseScrollRevealOptions {
  threshold?: number;
  rootMargin?: string;
}

export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  options: UseScrollRevealOptions = {}
) {
  const { threshold = 0.12, rootMargin = '0px 0px -36px 0px' } = options;
  const prefersReducedMotion = usePrefersReducedMotion();
  const ref = useRef<T | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(prefersReducedMotion);

  useEffect(() => {
    if (prefersReducedMotion) {
      setIsVisible(true);
      return;
    }

    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [prefersReducedMotion, threshold, rootMargin]);

  return { ref, isVisible };
}

export function useCountUp(
  target: number,
  isActive: boolean,
  durationMs = 900
): number {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [value, setValue] = useState<number>(() => (prefersReducedMotion ? target : 0));

  useEffect(() => {
    if (prefersReducedMotion || target <= 0) {
      setValue(target);
      return;
    }
    if (!isActive) return;

    let frameId = 0;
    let startTime: number | null = null;

    const tick = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));

      if (progress < 1) {
        frameId = window.requestAnimationFrame(tick);
      } else {
        setValue(target);
      }
    };

    frameId = window.requestAnimationFrame(tick);
    return () => {
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, [target, isActive, durationMs, prefersReducedMotion]);

  return value;
}

const METRIC_PATTERN = /^(RM\s*)?(-?[\d,]+(?:\.\d+)?)(%)?$/i;

export function useAnimatedMetric(
  rawValue: string | number,
  durationMs = 680
): string | number {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [displayValue, setDisplayValue] = useState<string | number>(rawValue);

  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayValue(rawValue);
      return;
    }

    if (typeof rawValue === 'number') {
      if (!Number.isFinite(rawValue) || rawValue === 0) {
        setDisplayValue(rawValue);
        return;
      }
      const hasDecimals = !Number.isInteger(rawValue);
      let frameId = 0;
      let startTime: number | null = null;

      const tick = (timestamp: number) => {
        if (startTime === null) startTime = timestamp;
        const progress = Math.min(1, (timestamp - startTime) / durationMs);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = eased * rawValue;
        setDisplayValue(hasDecimals ? Number(current.toFixed(2)) : Math.round(current));

        if (progress < 1) {
          frameId = window.requestAnimationFrame(tick);
        } else {
          setDisplayValue(rawValue);
        }
      };

      frameId = window.requestAnimationFrame(tick);
      return () => {
        if (frameId) window.cancelAnimationFrame(frameId);
      };
    }

    const trimmed = String(rawValue ?? '').trim();
    const match = trimmed.match(METRIC_PATTERN);
    if (!match) {
      setDisplayValue(rawValue);
      return;
    }

    const prefix = match[1] ?? '';
    const numStr = match[2];
    const suffix = match[3] ?? '';
    const cleanNumStr = numStr.replace(/,/g, '');
    const target = parseFloat(cleanNumStr);

    if (!Number.isFinite(target) || target === 0) {
      setDisplayValue(rawValue);
      return;
    }

    const decimalMatch = cleanNumStr.split('.')[1];
    const decimalPlaces = decimalMatch ? decimalMatch.length : 0;
    const useCommas = numStr.includes(',');

    let frameId = 0;
    let startTime: number | null = null;

    const formatNumber = (val: number) => {
      const fixed = val.toFixed(decimalPlaces);
      if (!useCommas) return fixed;
      const [intPart, decPart] = fixed.split('.');
      const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      return decPart !== undefined ? `${formattedInt}.${decPart}` : formattedInt;
    };

    const tick = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const progress = Math.min(1, (timestamp - startTime) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * target;

      if (progress < 1) {
        setDisplayValue(`${prefix}${formatNumber(current)}${suffix}`);
        frameId = window.requestAnimationFrame(tick);
      } else {
        setDisplayValue(rawValue);
      }
    };

    frameId = window.requestAnimationFrame(tick);
    return () => {
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, [rawValue, durationMs, prefersReducedMotion]);

  return prefersReducedMotion ? rawValue : displayValue;
}

