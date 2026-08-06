import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth.jsx';
import { showToast } from '../lib/utils.jsx';
import Avatar from './Avatar.jsx';

export default function RightPanel() {
  const navigate = useNavigate();
  const { profile, refreshProfile } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [trending, setTrending] = useState([]);

  useEffect(() => {
    api.getSuggestions().then(setSuggestions).catch(() => {});
    api.getTrending().then(setTrending).catch(() => {});
  }, []);

  const runSearch = useCallback(async (q) => {
    setQuery(q);
    if (!q.trim()) { setResults(null); return; }
    try {
      const data = await api.search(q, 'users');
      setResults(data.users || []);
    } catch (e) { /* ignore */ }
  }, []);

  const handleFollow = async (uid) => {
    try {
      await api.followUser(uid);
      await refreshProfile();
      setSuggestions(prev => prev.filter(u => u.uid !== uid));
      showToast('Following');
    } catch (e) { showToast(e.message); }
  };

  return (
    <aside className="right-panel">
      <div className="search-wrap">
        <div className="search-inner">
          <span>🔍</span>
          <input
            type="text"
            placeholder="Search VibeSky"
            value={query}
            onChange={(e) => runSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && query.trim()) navigate(`/explore?q=${encodeURIComponent(query)}`); }}
          />
        </div>
      </div>

      {results !== null && (
        <div className="panel-box" style={{ marginBottom: 14 }}>
          {results.length === 0
            ? <div style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-3)' }}>No users found</div>
            : results.slice(0, 5).map(u => (
              <div key={u.uid} className="sug-item" onClick={() => { navigate(`/u/${u.handle}`); setQuery(''); setResults(null); }}>
                <Avatar user={u} size={34} />
                <div className="sug-info">
                  <div className="sug-name" style={{ fontSize: 13 }}>{u.name}</div>
                  <div className="sug-handle">@{u.handle}</div>
                </div>
              </div>
            ))}
        </div>
      )}

      <div className="panel-box">
        <div className="panel-box-title">Trending</div>
        {trending.length === 0 ? (
          <div style={{ padding: '0 16px 14px', fontSize: 13, color: 'var(--text-3)' }}>No trends yet — post with #hashtags to get started!</div>
        ) : trending.map(t => (
          <div key={t.tag} className="trend-item" onClick={() => navigate(`/hashtag/${t.tag.replace('#','')}`)}>
            <div className="trend-cat">{t.category}</div>
            <div className="trend-tag">{t.tag}</div>
            <div className="trend-count">{t.count} post{t.count !== 1 ? 's' : ''}</div>
          </div>
        ))}
      </div>

      <div className="panel-box">
        <div className="panel-box-title">Who to follow</div>
        {suggestions.length === 0
          ? <div style={{ padding: '0 16px 14px', fontSize: 13, color: 'var(--text-3)' }}>No suggestions right now</div>
          : suggestions.slice(0, 5).map(u => (
            <div key={u.uid} className="sug-item" onClick={() => navigate(`/u/${u.handle}`)}>
              <Avatar user={u} size={38} />
              <div className="sug-info">
                <div className="sug-name">{u.name}</div>
                <div className="sug-handle">@{u.handle}</div>
              </div>
              <button className="follow-btn" onClick={(e) => { e.stopPropagation(); handleFollow(u.uid); }}>Follow</button>
            </div>
          ))}
        <div className="panel-box-footer" onClick={() => navigate('/explore')}>Show more</div>
      </div>
    </aside>
  );
}
