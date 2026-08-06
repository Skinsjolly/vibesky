import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth.jsx';
import { showToast } from '../lib/utils.jsx';
import Avatar from '../components/Avatar.jsx';

export default function FollowList({ mode }) { // mode: 'followers' | 'following'
  const { handle } = useParams();
  const navigate = useNavigate();
  const { profile: myProfile, refreshProfile } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const u = await api.getUserByHandle(handle);
        setTitle(`@${u.handle}`);
        const list = mode === 'followers' ? await api.getFollowers(u.uid) : await api.getFollowing(u.uid);
        setUsers(list);
      } catch (e) { showToast('Not found'); }
      setLoading(false);
    })();
  }, [handle, mode]);

  const toggleFollow = async (uid) => {
    try { await api.followUser(uid); await refreshProfile(); } catch (e) { showToast(e.message); }
  };

  return (
    <main className="main">
      <div className="feed-header">
        <div className="feed-header-top">
          <button className="back-btn" onClick={() => navigate(-1)}>←</button>
          <div>
            <h1 style={{ fontSize: 16 }}>{mode === 'followers' ? 'Followers' : 'Following'}</h1>
            <div style={{ fontSize: 13, color: 'var(--text-3)' }}>{title}</div>
          </div>
        </div>
      </div>
      {loading ? <div className="spinner" /> : users.length === 0 ? (
        <div className="empty-state"><div className="ei">👥</div><h3>Nobody here yet</h3></div>
      ) : users.map(u => {
        const isFollowing = myProfile?.following?.includes(u.uid);
        return (
          <div key={u.uid} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
            onClick={() => navigate(`/u/${u.handle}`)}>
            <Avatar user={u} size={44} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{u.name}</div>
              <div style={{ fontSize: 13, color: 'var(--text-3)' }}>@{u.handle}</div>
              {u.bio && <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 2 }}>{u.bio.slice(0, 80)}</div>}
            </div>
            <button className={`follow-btn ${isFollowing ? 'following' : ''}`} onClick={(e) => { e.stopPropagation(); toggleFollow(u.uid); }}>
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          </div>
        );
      })}
    </main>
  );
}
