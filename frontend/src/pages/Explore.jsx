import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import Avatar from '../components/Avatar.jsx';
import PostCard from '../components/PostCard.jsx';

export default function Explore() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [type, setType] = useState('all');
  const [mediaOnly, setMediaOnly] = useState(false);
  const [date, setDate] = useState('');
  const [results, setResults] = useState(null);
  const [recentPosts, setRecentPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (query.trim()) runSearch();
    else loadRecent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadRecent = async () => {
    setLoading(true);
    try {
      const data = await api.getGlobalFeed();
      setRecentPosts(data.posts);
    } catch (e) { /* ignore */ }
    setLoading(false);
  };

  const runSearch = async () => {
    if (!query.trim()) { setResults(null); loadRecent(); return; }
    setLoading(true);
    try {
      const params = new URLSearchParams({ q: query, type });
      if (date) params.set('date', date);
      if (mediaOnly) params.set('mediaOnly', 'true');
      const data = await api.search(query, type);
      // client-side apply media/date filters if backend already handled type=all
      let posts = data.posts || [];
      if (mediaOnly) posts = posts.filter(p => p.imageUrl);
      if (date) posts = posts.filter(p => p.createdAt && new Date(p.createdAt).toISOString().slice(0,10) === date);
      setResults({ users: data.users || [], posts });
    } catch (e) { /* ignore */ }
    setLoading(false);
  };

  return (
    <main className="main">
      <div className="feed-header">
        <div className="feed-header-top"><h1>Search</h1></div>
      </div>

      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
        <div className="search-inner" style={{ background: 'var(--bg)' }}>
          <span>🔍</span>
          <input
            type="text" placeholder="Search posts and people" value={query} autoFocus
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && runSearch()}
            style={{ fontSize: 15 }}
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{ marginTop: 10, fontSize: 13, color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
          {showFilters ? 'Hide filters' : 'Advanced filters'} {showFilters ? '▲' : '▼'}
        </button>
        {showFilters && (
          <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <select value={type} onChange={e => setType(e.target.value)} style={{ padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 }}>
              <option value="all">All</option>
              <option value="users">People</option>
              <option value="posts">Posts</option>
              <option value="hashtags">Hashtags</option>
            </select>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 }} />
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
              <input type="checkbox" checked={mediaOnly} onChange={e => setMediaOnly(e.target.checked)} /> Media only
            </label>
            <button className="post-btn" style={{ padding: '7px 16px' }} onClick={runSearch}>Apply</button>
          </div>
        )}
      </div>

      {loading ? <div className="spinner" /> : results ? (
        <div>
          {results.users?.length > 0 && (
            <>
              <div style={{ padding: '14px 16px 6px', fontSize: 13, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: .5 }}>People</div>
              {results.users.map(u => (
                <div key={u.uid} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                  onClick={() => navigate(`/u/${u.handle}`)}>
                  <Avatar user={u} size={42} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{u.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-3)' }}>@{u.handle}</div>
                    {u.bio && <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 2 }}>{u.bio.slice(0, 80)}</div>}
                  </div>
                </div>
              ))}
            </>
          )}
          {results.posts?.length > 0 && (
            <>
              <div style={{ padding: '14px 16px 6px', fontSize: 13, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: .5 }}>Posts</div>
              {results.posts.map(p => <PostCard key={p.id} post={p} />)}
            </>
          )}
          {!results.users?.length && !results.posts?.length && (
            <div className="empty-state"><div className="ei">🔍</div><h3>No results</h3><p>Try different keywords.</p></div>
          )}
        </div>
      ) : (
        <div>
          <div style={{ padding: '14px 16px 6px', fontSize: 13, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: .5 }}>Recent posts</div>
          {recentPosts.length === 0
            ? <div className="empty-state"><div className="ei">🔭</div><h3>No posts yet</h3><p>Be the first to post!</p></div>
            : recentPosts.map(p => <PostCard key={p.id} post={p} />)}
        </div>
      )}
    </main>
  );
}
