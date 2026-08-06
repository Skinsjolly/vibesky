import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import PostCard from '../components/PostCard.jsx';

export default function Bookmarks() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getBookmarks().then(setPosts).finally(() => setLoading(false));
  }, []);

  return (
    <main className="main">
      <div className="feed-header"><div className="feed-header-top"><h1>Bookmarks</h1></div></div>
      {loading ? <div className="spinner" /> : posts.length === 0 ? (
        <div className="empty-state"><div className="ei">🔖</div><h3>No bookmarks yet</h3><p>Save posts to read later by tapping the bookmark icon.</p></div>
      ) : posts.map(p => <PostCard key={p.id} post={p} />)}
    </main>
  );
}
