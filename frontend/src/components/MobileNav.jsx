import { useNavigate, useLocation } from 'react-router-dom';

export default function MobileNav({ unreadNotifs = 0 }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <nav className="mobile-nav">
      <div className="mobile-nav-items">
        <button className={`mobile-nav-item ${isActive('/') ? 'active' : ''}`} onClick={() => navigate('/')}>
          <span className="mn-icon">🏠</span>Home
        </button>
        <button className={`mobile-nav-item ${isActive('/explore') ? 'active' : ''}`} onClick={() => navigate('/explore')}>
          <span className="mn-icon">🔍</span>Search
        </button>
        <button className={`mobile-nav-item ${isActive('/notifications') ? 'active' : ''}`} onClick={() => navigate('/notifications')}>
          <span className="mn-icon">🔔</span>Alerts
          {unreadNotifs > 0 && <div className="mn-badge" />}
        </button>
        <button className={`mobile-nav-item ${isActive('/messages') ? 'active' : ''}`} onClick={() => navigate('/messages')}>
          <span className="mn-icon">✉️</span>Chat
        </button>
      </div>
    </nav>
  );
}
