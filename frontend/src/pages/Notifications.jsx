import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { fmtTime } from '../lib/utils.jsx';

const ICONS = { like: '❤️', repost: '🔁', comment: '💬', follow: '👤' };

export default function Notifications({ onRead }) {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getNotifications().then(data => {
      setNotifs(data.notifications);
      setLoading(false);
      api.markNotificationsRead().then(() => onRead?.());
    }).catch(() => setLoading(false));
  }, []);

  return (
    <main className="main">
      <div className="feed-header">
        <div className="feed-header-top"><h1>Notifications</h1></div>
      </div>
      {loading ? <div className="spinner" /> : notifs.length === 0 ? (
        <div className="empty-state"><div className="ei">🔔</div><h3>No notifications</h3><p>When people interact with your posts, you'll see it here.</p></div>
      ) : notifs.map(n => (
        <div key={n.id} className={`notif-item ${n.read ? '' : 'unread'}`}>
          <div className={`n-icon ${n.type}`}>{ICONS[n.type] || '👤'}</div>
          <div>
            <div className="n-text" dangerouslySetInnerHTML={{ __html: n.text }} />
            {n.createdAt && <div className="n-time">{fmtTime(n.createdAt)}</div>}
          </div>
        </div>
      ))}
    </main>
  );
}
