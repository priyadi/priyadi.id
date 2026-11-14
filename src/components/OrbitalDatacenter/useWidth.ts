import {type RefObject, useEffect, useState} from 'react';

/**
 * The rendered width of an element; `fallback` until it has been measured
 * (on the server, and for the first render in the browser).
 */
export function useWidth(
  ref: RefObject<HTMLElement | null>,
  fallback: number,
): number {
  const [width, setWidth] = useState(fallback);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return undefined;
    }
    const observer = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return width;
}
