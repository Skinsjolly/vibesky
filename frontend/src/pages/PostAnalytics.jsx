import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { showToast } from '../lib/utils.jsx';

export default function PostAnalytics() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPostAnalytics(postId).then(setStats).catch(e => showToast(e.message)).finally(() => setLoading(false));
  }, [postId]);

  return (
    <main className="main">
      <div className="feed-header">
        <div className="feed-header-top">
          <button className="back-btn" onClick={() => navigate(-1)}>←</button>
          <h1>Post analytics</h1>
        </div>
      </div>
      {loading ? <div className="spinner" /> : !stats ? (
        <div className="empty-state"><div className="ei">📊</div><h3>Not available</h3></div>
      ) : (
        <div style={{ padding: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {[
            { label: 'Views', value: stats.views },
            { label: 'Likes', value: stats.likes },
            { label: 'Reposts', value: stats.reposts },
            { label: 'Replies', value: stats.comments },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 26, fontWeight: 800 }}>{s.value}</div>
              <div style={{ fontSize: 13, color: 'var(--text-3)' }}>{s.label}</div>
            </div>
          ))}
          <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, gridColumn: '1 / -1' }}>
            <div style={{ fontSize: 26, fontWeight: 800 }}>{stats.engagementRate}%</div>
            <div style={{ fontSize: 13, color: 'var(--text-3)' }}>Engagement rate</div>
          </div>
        </div>
      )}
    </main>
  );
}
