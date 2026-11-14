import React, { useLayoutEffect, useRef, useState } from 'react';

interface PageSkeletonProps {
  active: boolean;
  transitionKey: string;
  children: React.ReactNode;
}

interface SkeletonBox {
  key: string;
  kind: 'frame' | 'bone';
  top: number;
  left: number;
  width: number;
  height: number;
  borderRadius: string;
}

const INTERACTIVE_TAGS = new Set(['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA']);
const MEDIA_TAGS = new Set(['IMG', 'VIDEO', 'CANVAS', 'IFRAME']);
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'BR', 'HR', 'OPTION', 'DATALIST']);

function isZeroOrHidden(style: CSSStyleDeclaration, rect: DOMRect): boolean {
  if (
    style.display === 'none' ||
    style.visibility === 'hidden' ||
    parseFloat(style.opacity || '1') <= 0.01
  ) {
    return true;
  }
  if (rect.width < 2 || rect.height < 2) {
    return true;
  }
  // Ignore sr-only clipped elements
  if (style.position === 'absolute' && rect.width <= 2 && rect.height <= 2) {
    return true;
  }
  return false;
}

function hasVisibleBackground(style: CSSStyleDeclaration): boolean {
  const bg = style.backgroundColor;
  if (!bg || bg === 'transparent' || bg === 'rgba(0, 0, 0, 0)') {
    return Boolean(style.backgroundImage && style.backgroundImage !== 'none');
  }
  return true;
}

function hasVisibleBorder(style: CSSStyleDeclaration): boolean {
  return (
    parseFloat(style.borderTopWidth || '0') > 0 ||
    parseFloat(style.borderRightWidth || '0') > 0 ||
    parseFloat(style.borderBottomWidth || '0') > 0 ||
    parseFloat(style.borderLeftWidth || '0') > 0
  );
}

function isStandaloneIconBox(el: HTMLElement, rect: DOMRect): boolean {
  if (rect.width > 72 || rect.height > 72 || rect.width < 20 || rect.height < 20) {
    return false;
  }
  const hasSvg = el.querySelector('svg') !== null;
  if (!hasSvg) return false;
  // Must have no non-empty text nodes inside
  const text = (el.textContent || '').trim();
  if (text.length > 0) return false;
  return true;
}

function isLeafChipOrBadge(el: HTMLElement, style: CSSStyleDeclaration, rect: DOMRect): boolean {
  if (rect.height > 44 || rect.width > 320) return false;
  if (el.children.length > 1) return false;
  if (el.children.length === 1) {
    const childTag = el.children[0].tagName.toUpperCase();
    if (childTag !== 'SVG' && childTag !== 'SPAN') {
      return false;
    }
  }
  return hasVisibleBorder(style) || hasVisibleBackground(style);
}

function scanDomSilhouettes(host: HTMLElement): { height: number; boxes: SkeletonBox[] } {
  const hostRect = host.getBoundingClientRect();
  if (hostRect.width <= 0 || hostRect.height <= 0) {
    return { height: 0, boxes: [] };
  }

  const frames: SkeletonBox[] = [];
  const bones: SkeletonBox[] = [];
  let idCounter = 0;

  const pushBox = (
    kind: 'frame' | 'bone',
    rect: { left: number; top: number; right: number; bottom: number },
    borderRadius: string
  ) => {
    const clampedLeft = Math.max(0, rect.left - hostRect.left);
    const clampedTop = Math.max(0, rect.top - hostRect.top);
    const clampedRight = Math.min(hostRect.width, rect.right - hostRect.left);
    const clampedBottom = Math.min(hostRect.height, rect.bottom - hostRect.top);
    const width = clampedRight - clampedLeft;
    const height = clampedBottom - clampedTop;

    if (width < 4 || height < 4) return;

    const target = kind === 'frame' ? frames : bones;
    target.push({
      key: `${kind}-${idCounter++}`,
      kind,
      top: Math.round(clampedTop),
      left: Math.round(clampedLeft),
      width: Math.round(width),
      height: Math.round(height),
      borderRadius
    });
  };

  const scanTextNode = (textNode: Text, parentEl: HTMLElement, parentStyle: CSSStyleDeclaration, clipRect: DOMRect) => {
    const raw = textNode.textContent;
    if (!raw || !raw.trim()) return;

    const range = document.createRange();
    range.selectNodeContents(textNode);
    const clientRects = Array.from(range.getClientRects()).filter((r) => r.width >= 3 && r.height >= 4);
    if (clientRects.length === 0) return;

    // Merge rects belonging to the same visual line
    const lines: { left: number; top: number; right: number; bottom: number }[] = [];
    for (const r of clientRects) {
      const last = lines[lines.length - 1];
      if (last && Math.abs(r.top - last.top) <= 5) {
        last.left = Math.min(last.left, r.left);
        last.right = Math.max(last.right, r.right);
        last.top = Math.min(last.top, r.top);
        last.bottom = Math.max(last.bottom, r.bottom);
      } else {
        lines.push({ left: r.left, top: r.top, right: r.right, bottom: r.bottom });
      }
    }

    const fontSize = parseFloat(parentStyle.fontSize || '14') || 14;
    const targetBoneHeight = Math.max(8, Math.min(26, Math.round(fontSize * 0.88)));

    for (const line of lines) {
      const clippedLeft = Math.max(line.left, clipRect.left);
      const clippedRight = Math.min(line.right, clipRect.right);
      const clippedTop = Math.max(line.top, clipRect.top);
      const clippedBottom = Math.min(line.bottom, clipRect.bottom);
      const lineW = clippedRight - clippedLeft;
      const lineH = clippedBottom - clippedTop;
      if (lineW < 8 || lineH < 4) continue;

      const finalH = Math.min(lineH, targetBoneHeight);
      const centeredTop = clippedTop + Math.max(0, (lineH - finalH) / 2);

      pushBox(
        'bone',
        {
          left: clippedLeft,
          top: centeredTop,
          right: clippedRight,
          bottom: centeredTop + finalH
        },
        '6px'
      );
    }
    void parentEl;
  };

  const walk = (node: Node, parentEl: HTMLElement | null, parentStyle: CSSStyleDeclaration | null, clipRect: DOMRect, depth: number) => {
    if (node.nodeType === Node.TEXT_NODE) {
      if (parentEl && parentStyle) {
        scanTextNode(node as Text, parentEl, parentStyle, clipRect);
      }
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as HTMLElement;
    const tag = el.tagName.toUpperCase();

    if (SKIP_TAGS.has(tag)) return;
    if (el.getAttribute('aria-hidden') === 'true') return;

    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    if (isZeroOrHidden(style, rect)) return;

    // Intersect clipping container if overflow hides horizontally/vertically
    const clippedLeft = Math.max(rect.left, clipRect.left);
    const clippedTop = Math.max(rect.top, clipRect.top);
    const clippedRight = Math.min(rect.right, clipRect.right);
    const clippedBottom = Math.min(rect.bottom, clipRect.bottom);
    if (clippedRight - clippedLeft < 2 || clippedBottom - clippedTop < 2) return;

    const effectiveRadius =
      style.borderRadius && style.borderRadius !== '0px' ? style.borderRadius : '10px';

    // 1. Recharts chart surface -> single chart skeleton block
    if (
      el.classList.contains('recharts-responsive-container') ||
      el.classList.contains('recharts-wrapper')
    ) {
      pushBox(
        'bone',
        { left: clippedLeft, top: clippedTop, right: clippedRight, bottom: clippedBottom },
        '12px'
      );
      return;
    }

    // 2. Interactive controls (buttons, inputs, selects, textareas, button-like links)
    const isButtonLink =
      tag === 'A' && (hasVisibleBackground(style) || hasVisibleBorder(style));
    if (
      INTERACTIVE_TAGS.has(tag) ||
      el.getAttribute('role') === 'button' ||
      isButtonLink
    ) {
      pushBox(
        'bone',
        { left: clippedLeft, top: clippedTop, right: clippedRight, bottom: clippedBottom },
        effectiveRadius
      );
      return;
    }

    // 3. Media elements
    if (MEDIA_TAGS.has(tag)) {
      pushBox(
        'bone',
        { left: clippedLeft, top: clippedTop, right: clippedRight, bottom: clippedBottom },
        style.borderRadius && style.borderRadius !== '0px' ? style.borderRadius : '8px'
      );
      return;
    }

    // 4. Standalone SVGs (outside buttons/charts)
    if (tag === 'SVG' || tag === 'svg') {
      pushBox(
        'bone',
        { left: clippedLeft, top: clippedTop, right: clippedRight, bottom: clippedBottom },
        '8px'
      );
      return;
    }

    // 5. Small icon box holding only an SVG (e.g. w-10 h-10 rounded-xl)
    if (isStandaloneIconBox(el, rect)) {
      pushBox(
        'bone',
        { left: clippedLeft, top: clippedTop, right: clippedRight, bottom: clippedBottom },
        effectiveRadius
      );
      return;
    }

    // 6. Progress bar track (short rounded pill track with 0-1 child bar)
    if (
      rect.height <= 16 &&
      rect.width >= 60 &&
      el.children.length <= 1 &&
      (hasVisibleBackground(style) || hasVisibleBorder(style))
    ) {
      pushBox(
        'bone',
        { left: clippedLeft, top: clippedTop, right: clippedRight, bottom: clippedBottom },
        '9999px'
      );
      return;
    }

    // 7. Small leaf pill/badge (status badge, price chip, etc.)
    if (isLeafChipOrBadge(el, style, rect)) {
      pushBox(
        'bone',
        { left: clippedLeft, top: clippedTop, right: clippedRight, bottom: clippedBottom },
        effectiveRadius
      );
      return;
    }

    // 8. Structural card/panel/row frame (skip depth 0 outer wrapper itself)
    if (
      depth > 0 &&
      (hasVisibleBorder(style) ||
        (hasVisibleBackground(style) && rect.width >= 60 && rect.height >= 36))
    ) {
      pushBox(
        'frame',
        { left: clippedLeft, top: clippedTop, right: clippedRight, bottom: clippedBottom },
        style.borderRadius && style.borderRadius !== '0px' ? style.borderRadius : '12px'
      );
    }

    const nextClip =
      style.overflowX === 'hidden' || style.overflowY === 'hidden' || style.overflow === 'hidden'
        ? new DOMRect(clippedLeft, clippedTop, clippedRight - clippedLeft, clippedBottom - clippedTop)
        : clipRect;

    const children = el.childNodes;
    for (let i = 0; i < children.length; i++) {
      walk(children[i], el, style, nextClip, depth + 1);
    }
  };

  const rootClip = new DOMRect(hostRect.left, hostRect.top, hostRect.width, hostRect.height);
  const rootChildren = host.childNodes;
  for (let i = 0; i < rootChildren.length; i++) {
    walk(rootChildren[i], host, window.getComputedStyle(host), rootClip, 0);
  }

  return {
    height: Math.round(hostRect.height),
    boxes: [...frames, ...bones]
  };
}

export const PageSkeleton: React.FC<PageSkeletonProps> = ({
  active,
  transitionKey,
  children
}) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const [snapshot, setSnapshot] = useState<{ height: number; boxes: SkeletonBox[] }>({
    height: 0,
    boxes: []
  });

  useLayoutEffect(() => {
    if (!active || !hostRef.current) {
      return;
    }

    const hostEl = hostRef.current;
    let rafId = 0;

    const measure = () => {
      if (!hostRef.current) return;
      setSnapshot(scanDomSilhouettes(hostRef.current));
    };

    // Synchronous layout scan before browser paints
    measure();

    // Follow-up frame scan for Recharts / async nested layouts
    rafId = window.requestAnimationFrame(measure);

    const observer = new ResizeObserver(() => {
      window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(measure);
    });
    observer.observe(hostEl);

    return () => {
      window.cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [active, transitionKey]);

  return (
    <div className="relative w-full">
      {/* Real rendered page tree (invisible while skeleton is active so exact structure is measured) */}
      <div
        ref={hostRef}
        aria-hidden={active ? 'true' : undefined}
        className={
          active
            ? 'opacity-0 pointer-events-none select-none'
            : 'opacity-100 transition-opacity duration-200 ease-out'
        }
      >
        {children}
      </div>

      {/* Auto-generated live DOM silhouette overlay */}
      {active && (
        <div
          role="status"
          aria-live="polite"
          aria-label="Memuatkan halaman..."
          style={snapshot.height > 0 ? { minHeight: `${snapshot.height}px` } : undefined}
          className="absolute inset-0 z-20 pointer-events-none overflow-hidden rounded-b-2xl rounded-t-none bg-white dark:bg-zinc-900 border border-t-0 border-slate-300 dark:border-zinc-700 shadow-sm"
        >
          {snapshot.boxes.map((box) => (
            <div
              key={box.key}
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: `${box.top}px`,
                left: `${box.left}px`,
                width: `${box.width}px`,
                height: `${box.height}px`,
                borderRadius: box.borderRadius
              }}
              className={
                box.kind === 'frame'
                  ? 'kbelia-skeleton-frame'
                  : 'kbelia-skeleton-box'
              }
            />
          ))}
        </div>
      )}
    </div>
  );
};
