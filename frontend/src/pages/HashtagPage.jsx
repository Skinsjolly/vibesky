import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import PostCard from '../components/PostCard.jsx';

export default function HashtagPage() {
  const { tag } = useParams();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getHashtagPosts(tag).then(setPosts).finally(() => setLoading(false));
    window.scrollTo(0, 0);
  }, [tag]);

  return (
    <main className="main">
      <div className="feed-header">
        <div className="feed-header-top">
          <button className="back-btn" onClick={() => navigate(-1)}>←</button>
          <h1>#{tag}</h1>
        </div>
      </div>
      {loading ? <div className="spinner" /> : posts.length === 0 ? (
        <div className="empty-state"><div className="ei">#️⃣</div><h3>No posts yet</h3><p>Be the first to post with #{tag}</p></div>
      ) : posts.map(p => <PostCard key={p.id} post={p} />)}
    </main>
  );
}
