/**
 * Accessibility hook: ARIA announcements, reduced motion detection, high contrast.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

/** Announce a message to screen readers via an ARIA live region. */
export function useAnnouncer() {
  const regionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Create an off-screen ARIA live region
    const region = document.createElement('div');
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-atomic', 'true');
    region.style.position = 'absolute';
    region.style.width = '1px';
    region.style.height = '1px';
    region.style.overflow = 'hidden';
    region.style.clip = 'rect(0,0,0,0)';
    region.style.whiteSpace = 'nowrap';
    document.body.appendChild(region);
    regionRef.current = region;

    return () => {
      document.body.removeChild(region);
    };
  }, []);

  const announce = useCallback((message: string) => {
    if (regionRef.current) {
      // Clear then set to trigger re-announcement
      regionRef.current.textContent = '';
      requestAnimationFrame(() => {
        if (regionRef.current) {
          regionRef.current.textContent = message;
        }
      });
    }
  }, []);

  return announce;
}

/** Detect prefers-reduced-motion. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return reduced;
}

/** Detect prefers-color-scheme. */
export function useDarkMode(): boolean {
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return dark;
}
