import React, { useCallback, useEffect, useRef, useState } from 'react';

interface UseLongPressSelectionOptions<TId extends string = string> {
  /** Unique attribute value applied to [data-selection-scope] containers that should NOT trigger outside-click dismissal */
  scopeId: string;
  /** Valid item IDs currently in the list; removes stale selections when items are deleted */
  validIds: readonly TId[];
  /** Hold duration in milliseconds before entering selection mode (default: 450ms) */
  delayMs?: number;
  /** Pointer movement tolerance in pixels before cancelling long press so scrolling stays smooth (default: 8px) */
  moveTolerancePx?: number;
}

export interface LongPressRowHandlers {
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: () => void;
  onPointerCancel: () => void;
  onPointerLeave: (e: React.PointerEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onClick: (e: React.MouseEvent) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

export function useLongPressSelection<TId extends string = string>({
  scopeId,
  validIds,
  delayMs = 450,
  moveTolerancePx = 8
}: UseLongPressSelectionOptions<TId>) {
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<TId[]>([]);

  const isSelectionModeRef = useRef(isSelectionMode);
  isSelectionModeRef.current = isSelectionMode;

  const timerRef = useRef<number | null>(null);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);
  const suppressNextClickRef = useRef(false);
  const suppressResetTimerRef = useRef<number | null>(null);

  const clearHoldTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    startPointRef.current = null;
  }, []);

  const clearSuppressResetTimer = useCallback(() => {
    if (suppressResetTimerRef.current !== null) {
      window.clearTimeout(suppressResetTimerRef.current);
      suppressResetTimerRef.current = null;
    }
  }, []);

  const exitSelectionMode = useCallback(() => {
    clearHoldTimer();
    clearSuppressResetTimer();
    suppressNextClickRef.current = false;
    setIsSelectionMode(false);
    setSelectedIds([]);
  }, [clearHoldTimer, clearSuppressResetTimer]);

  const enterSelectionModeWith = useCallback((id: TId) => {
    setIsSelectionMode(true);
    setSelectedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate(12);
      }
    } catch {
      // Ignore vibration failures on restricted browsers
    }
  }, []);

  const toggleRow = useCallback((id: TId) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  const removeId = useCallback((id: TId) => {
    setSelectedIds((prev) => prev.filter((item) => item !== id));
  }, []);

  const togglePage = useCallback((pageIds: readonly TId[]) => {
    if (pageIds.length === 0) return;
    setSelectedIds((prev) => {
      const allSelected = pageIds.every((id) => prev.includes(id));
      if (allSelected) {
        return prev.filter((id) => !pageIds.includes(id));
      }
      return Array.from(new Set([...prev, ...pageIds]));
    });
  }, []);

  // Keep selectedIds synchronized with valid items and exit cleanly if list empties
  useEffect(() => {
    const validSet = new Set(validIds);
    setSelectedIds((prev) => {
      const next = prev.filter((id) => validSet.has(id));
      return next.length === prev.length ? prev : next;
    });
    if (validIds.length === 0 && isSelectionModeRef.current) {
      setIsSelectionMode(false);
    }
  }, [validIds]);

  // Dismiss selection mode when clicking/tapping outside the selection scope or pressing Escape
  useEffect(() => {
    if (!isSelectionMode) return;

    const handleOutsidePointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.closest(`[data-selection-scope="${scopeId}"]`)) return;
      if (target.closest('[role="dialog"]')) return;
      exitSelectionMode();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        exitSelectionMode();
      }
    };

    document.addEventListener('pointerdown', handleOutsidePointerDown, true);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handleOutsidePointerDown, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSelectionMode, scopeId, exitSelectionMode]);

  // Clean up pending timers on unmount
  useEffect(() => {
    return () => {
      clearHoldTimer();
      clearSuppressResetTimer();
    };
  }, [clearHoldTimer, clearSuppressResetTimer]);

  const getRowHandlers = useCallback(
    (id: TId, onNormalOpen: () => void): LongPressRowHandlers => ({
      onPointerDown: (e: React.PointerEvent) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        if (isSelectionModeRef.current) return;

        // Ignore hold if originating directly from a nested interactive control
        const target = e.target as HTMLElement | null;
        if (target?.closest('button, a, input, select, textarea')) return;

        clearHoldTimer();
        clearSuppressResetTimer();
        startPointRef.current = { x: e.clientX, y: e.clientY };

        timerRef.current = window.setTimeout(() => {
          timerRef.current = null;
          startPointRef.current = null;
          suppressNextClickRef.current = true;
          enterSelectionModeWith(id);
        }, delayMs);
      },

      onPointerMove: (e: React.PointerEvent) => {
        if (timerRef.current === null || !startPointRef.current) return;
        const dx = e.clientX - startPointRef.current.x;
        const dy = e.clientY - startPointRef.current.y;
        if (Math.hypot(dx, dy) > moveTolerancePx) {
          clearHoldTimer();
        }
      },

      onPointerUp: () => {
        clearHoldTimer();
        if (suppressNextClickRef.current) {
          clearSuppressResetTimer();
          suppressResetTimerRef.current = window.setTimeout(() => {
            suppressNextClickRef.current = false;
            suppressResetTimerRef.current = null;
          }, 180);
        }
      },

      onPointerCancel: () => {
        clearHoldTimer();
        suppressNextClickRef.current = false;
      },

      onPointerLeave: (e: React.PointerEvent) => {
        if (e.pointerType === 'mouse') {
          clearHoldTimer();
        }
      },

      onContextMenu: (e: React.MouseEvent) => {
        if (timerRef.current !== null || suppressNextClickRef.current || isSelectionModeRef.current) {
          e.preventDefault();
        }
      },

      onClick: (e: React.MouseEvent) => {
        if (suppressNextClickRef.current) {
          suppressNextClickRef.current = false;
          clearSuppressResetTimer();
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        if (isSelectionModeRef.current) {
          toggleRow(id);
        } else {
          onNormalOpen();
        }
      },

      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (e.shiftKey && !isSelectionModeRef.current) {
            enterSelectionModeWith(id);
          } else if (isSelectionModeRef.current) {
            toggleRow(id);
          } else {
            onNormalOpen();
          }
        }
      }
    }),
    [clearHoldTimer, clearSuppressResetTimer, delayMs, enterSelectionModeWith, moveTolerancePx, toggleRow]
  );

  return {
    isSelectionMode,
    selectedIds,
    selectedCount: selectedIds.length,
    isItemSelected: (id: TId) => selectedIds.includes(id),
    enterSelectionModeWith,
    exitSelectionMode,
    toggleRow,
    removeId,
    togglePage,
    getRowHandlers
  };
}
