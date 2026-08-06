import { useEffect, useRef } from 'react';

// Observes a sentinel element; calls onIntersect when it scrolls into view.
// Used for infinite scroll — pairs with useFeed's hasMore/loadMore.
export function useInfiniteScroll(onIntersect, { enabled = true } = {}) {
  const sentinelRef = useRef(null);

  useEffect(() => {
    if (!enabled || !sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) onIntersect();
      },
      { rootMargin: '400px' } // trigger a bit before it's actually visible
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [onIntersect, enabled]);

  return sentinelRef;
}
