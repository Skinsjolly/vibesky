import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from './hooks/useAuth.jsx';
import { api } from './lib/api';
import AuthScreen from './pages/AuthScreen.jsx';
import CompleteProfile from './pages/CompleteProfile.jsx';
import Feed from './pages/Feed.jsx';
import PostDetail from './pages/PostDetail.jsx';
import Explore from './pages/Explore.jsx';
import Notifications from './pages/Notifications.jsx';
import Profile from './pages/Profile.jsx';
import FollowList from './pages/FollowList.jsx';
import HashtagPage from './pages/HashtagPage.jsx';
import Bookmarks from './pages/Bookmarks.jsx';
import PostAnalytics from './pages/PostAnalytics.jsx';
import { ConversationList, MessageThread } from './pages/Messages.jsx';
import Sidebar from './components/Sidebar.jsx';
import RightPanel from './components/RightPanel.jsx';
import MobileNav from './components/MobileNav.jsx';
import ComposeModal from './components/ComposeModal.jsx';
import Toast from './components/Toast.jsx';

export default function App() {
  const { user, profile, loading } = useAuth();
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [composeOpen, setComposeOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const poll = () => api.getUnreadCount().then(d => setUnreadNotifs(d.count)).catch(() => {});
    poll();
    const interval = setInterval(poll, 30000);
    return () => clearInterval(interval);
  }, [user]);

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" /></div>;
  }

  if (!user) return <AuthScreen />;
  if (!profile) return <CompleteProfile />;

  return (
    <>
      <div className="layout">
        <Sidebar unreadNotifs={unreadNotifs} onCompose={() => setComposeOpen(true)} />
        <Routes>
          <Route path="/" element={<Feed />} />
          <Route path="/post/:postId" element={<PostDetail />} />
          <Route path="/post/:postId/analytics" element={<PostAnalytics />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/notifications" element={<Notifications onRead={() => setUnreadNotifs(0)} />} />
          <Route path="/bookmarks" element={<Bookmarks />} />
          <Route path="/messages" element={<ConversationList />} />
          <Route path="/messages/:otherUid" element={<MessageThread />} />
          <Route path="/hashtag/:tag" element={<HashtagPage />} />
          <Route path="/u/:handle" element={<Profile />} />
          <Route path="/u/:handle/followers" element={<FollowList mode="followers" />} />
          <Route path="/u/:handle/following" element={<FollowList mode="following" />} />
        </Routes>
        <RightPanel />
      </div>
      <MobileNav unreadNotifs={unreadNotifs} />
      <button className="fab" onClick={() => setComposeOpen(true)}>✏️</button>
      <ComposeModal open={composeOpen} onClose={() => setComposeOpen(false)} onPosted={() => window.location.pathname === '/' && window.location.reload()} />
      <Toast />
    </>
  );
}
