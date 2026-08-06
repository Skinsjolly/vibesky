import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import Avatar from './Avatar.jsx';

const NAV_ITEMS = [
  { path: '/', icon: '🏠', label: 'Home' },
  { path: '/explore', icon: '🔍', label: 'Search' },
  { path: '/notifications', icon: '🔔', label: 'Notifications', badgeKey: 'notif' },
  { path: '/messages', icon: '✉️', label: 'Messages', badgeKey: 'msg' },
  { path: '/bookmarks', icon: '🔖', label: 'Bookmarks' },
];

export default function Sidebar({ unreadNotifs = 0, unreadMsgs = 0, onCompose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, user, logout } = useAuth();

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo" onClick={() => navigate('/')}>
        <svg width="30" height="30" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="36" height="36" rx="10" fill="#0085ff"/>
          <path d="M18 8C13.0 8 9 12.5 9 18c0 3.5 1.7 6.6 4.3 8.5C14.6 27.4 16.2 28 18 28s3.4-.6 4.7-1.5C25.3 24.6 27 21.5 27 18c0-5.5-4-10-9-10z" fill="white" opacity=".9"/>
          <circle cx="18" cy="18" r="4" fill="#0085ff"/>
        </svg>
        <span>VibeSky</span>
      </div>

      {NAV_ITEMS.map(item => (
        <button
          key={item.path}
          className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
          onClick={() => navigate(item.path)}
        >
          <span className="ni">{item.icon}</span>
          <span>{item.label}</span>
          {item.badgeKey === 'notif' && unreadNotifs > 0 && <span className="nav-badge">{unreadNotifs}</span>}
          {item.badgeKey === 'msg' && unreadMsgs > 0 && <span className="nav-badge">{unreadMsgs}</span>}
        </button>
      ))}

      <button
        className={`nav-item ${isActive('/profile') || (user && location.pathname === `/u/${profile?.handle}`) ? 'active' : ''}`}
        onClick={() => navigate(`/u/${profile?.handle || user?.uid}`)}
      >
        <span className="ni">👤</span><span>Profile</span>
      </button>

      <button className="compose-nav-btn" onClick={onCompose}>
        <span style={{ fontSize: 18 }}>✏️</span><span>New post</span>
      </button>

      <div className="sidebar-bottom">
        <div className="user-pill" onClick={() => navigate(`/u/${profile?.handle || user?.uid}`)}>
          <Avatar user={profile} size={38} />
          <div className="up-info">
            <div className="up-name">{profile?.name || 'Loading…'}</div>
            <div className="up-handle">@{profile?.handle || '…'}</div>
          </div>
          <span className="up-more" title="Sign out" onClick={(e) => { e.stopPropagation(); logout(); }}>↩</span>
        </div>
      </div>
    </aside>
  );
}
