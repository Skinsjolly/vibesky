import { useState, useCallback, useRef } from 'react';
import { api } from '../lib/api';

// This hook is the fix for the "Global tab keeps loading continuously" bug.
// Root cause in the old version: the loader kept calling the same query with
// no cursor, so it re-fetched the same first page forever and the UI never
// learned there was nothing new to load.
//
// Fix: track `nextCursor` + `hasMore` from the API response. Once `hasMore`
// is false, `loadMore` becomes a no-op — it does NOT keep firing requests.
export function useFeed(kind = 'global') {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const cursorRef = useRef(null);
  const loadingRef = useRef(false); // guards against double-fire from fast scroll events

  const fetchPage = kind === 'global' ? api.getGlobalFeed : api.getFollowingFeed;

  const reset = useCallback(() => {
    setPosts([]);
    cursorRef.current = null;
    setHasMore(true);
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) return; // hard stop — this is the key guard
    loadingRef.current = true;
    setLoading(true);
    try {
      const data = await fetchPage(cursorRef.current);
      setPosts(prev => {
        // De-dupe in case of overlapping pages
        const seen = new Set(prev.map(p => p.id));
        const fresh = data.posts.filter(p => !seen.has(p.id));
        return [...prev, ...fresh];
      });
      cursorRef.current = data.nextCursor;
      setHasMore(data.hasMore);
    } catch (e) {
      console.error('Feed load error:', e);
      setHasMore(false); // stop retry loops on error too
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [hasMore, fetchPage]);

  const updatePost = useCallback((id, updates) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  const removePost = useCallback((id) => {
    setPosts(prev => prev.filter(p => p.id !== id));
  }, []);

  return { posts, loading, hasMore, loadMore, reset, updatePost, removePost };
}
