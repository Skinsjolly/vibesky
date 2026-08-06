import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth.jsx';
import { showToast } from '../lib/utils.jsx';
import Avatar from '../components/Avatar.jsx';
import PostCard from '../components/PostCard.jsx';
import EditProfileModal from '../components/EditProfileModal.jsx';
import ComposeModal from '../components/ComposeModal.jsx';

export default function Profile() {
  const { handle } = useParams();
  const navigate = useNavigate();
  const { user, profile: myProfile, refreshProfile } = useAuth();
  const [profileUser, setProfileUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [quoteTarget, setQuoteTarget] = useState(null);
  const [followBusy, setFollowBusy] = useState(false);

  const isMe = profileUser?.uid === user?.uid;
  const isFollowing = myProfile?.following?.includes(profileUser?.uid);

  const load = async () => {
    setLoading(true);
    try {
      const u = await api.getUserByHandle(handle);
      setProfileUser(u);
      const postsData = await api.getUserPosts(u.uid);
      setPosts(postsData.posts);
    } catch (e) { showToast('User not found'); }
    setLoading(false);
  };

  useEffect(() => { load(); window.scrollTo(0, 0); }, [handle]);

  const toggleFollow = async () => {
    if (followBusy) return;
    setFollowBusy(true);
    try {
      const res = await api.followUser(profileUser.uid);
      await refreshProfile();
      showToast(res.following ? 'Following' : 'Unfollowed');
    } catch (e) { showToast(e.message); }
    setFollowBusy(false);
  };

  const toggleMute = async () => {
    try { const r = await api.muteUser(profileUser.uid); showToast(r.muted ? 'Muted' : 'Unmuted'); } catch (e) { showToast(e.message); }
    setMenuOpen(false);
  };
  const toggleBlock = async () => {
    try { const r = await api.blockUser(profileUser.uid); showToast(r.blocked ? 'Blocked' : 'Unblocked'); await refreshProfile(); } catch (e) { showToast(e.message); }
    setMenuOpen(false);
  };

  if (loading) return <main className="main"><div className="spinner" /></main>;
  if (!profileUser) return (
    <main className="main"><div className="empty-state"><div className="ei">👤</div><h3>User not found</h3></div></main>
  );

  const pinnedPost = posts.find(p => p.id === profileUser.pinnedPostId);
  const otherPosts = posts.filter(p => p.id !== profileUser.pinnedPostId);

  return (
    <main className="main">
      <div className="feed-header">
        <div className="feed-header-top">
          <button className="back-btn" onClick={() => navigate(-1)}>←</button>
          <h1>{profileUser.name}</h1>
        </div>
      </div>

      <div className="profile-banner" />
      <div className="profile-av-section">
        <div className="avatar profile-big-av">
          {profileUser.avatar ? <img src={profileUser.avatar} alt="" /> : (profileUser.name || '?')[0].toUpperCase()}
        </div>
        <div className="profile-actions">
          {isMe ? (
            <button className="btn-follow-outline" onClick={() => setEditOpen(true)}>Edit profile</button>
          ) : (
            <>
              <div style={{ position: 'relative' }}>
                <button className="icon-btn" onClick={() => setMenuOpen(!menuOpen)}>⋯</button>
                {menuOpen && (
                  <div style={{ position: 'absolute', right: 0, top: 42, background: '#fff', border: '1px solid var(--border)', borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,.15)', zIndex: 20, minWidth: 160 }}>
                    <div style={{ padding: '10px 14px', fontSize: 13, cursor: 'pointer' }} onClick={() => { navigate(`/messages/${profileUser.uid}`); setMenuOpen(false); }}>✉️ Message</div>
                    <div style={{ padding: '10px 14px', fontSize: 13, cursor: 'pointer' }} onClick={toggleMute}>🔇 Mute</div>
                    <div style={{ padding: '10px 14px', fontSize: 13, cursor: 'pointer', color: 'var(--red)' }} onClick={toggleBlock}>🚫 Block</div>
                  </div>
                )}
              </div>
              <button className={isFollowing ? 'btn-follow-outline' : 'btn-follow-solid'} onClick={toggleFollow} disabled={followBusy}>
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="profile-info">
        <div className="profile-name">{profileUser.name} {profileUser.verified && <span className="verified-badge">✓</span>}</div>
        <div className="profile-handle">@{profileUser.handle}</div>
        {profileUser.bio && <div className="profile-bio">{profileUser.bio}</div>}
        <div className="profile-stats">
          <span className="pstat"><strong>{posts.length}</strong> Posts</span>
          <span className="pstat" onClick={() => navigate(`/u/${handle}/followers`)}><strong>{profileUser.followers?.length || 0}</strong> Followers</span>
          <span className="pstat" onClick={() => navigate(`/u/${handle}/following`)}><strong>{profileUser.following?.length || 0}</strong> Following</span>
        </div>
      </div>

      {pinnedPost && (
        <div style={{ borderBottom: '2px solid var(--border)' }}>
          <PostCard post={{ ...pinnedPost, pinned: true }} onQuote={setQuoteTarget} />
        </div>
      )}

      {otherPosts.length === 0 && !pinnedPost ? (
        <div className="empty-state"><div className="ei">✨</div><h3>No posts yet</h3><p>{isMe ? 'Share your first thought!' : `${profileUser.name} hasn't posted yet.`}</p></div>
      ) : otherPosts.map(p => (
        <PostCard key={p.id} post={p} onQuote={setQuoteTarget} onDelete={(id) => setPosts(prev => prev.filter(x => x.id !== id))} />
      ))}

      <EditProfileModal open={editOpen} onClose={() => setEditOpen(false)} onSaved={load} />
      <ComposeModal open={!!quoteTarget} quotedPost={quoteTarget} onClose={() => setQuoteTarget(null)} onPosted={load} />
    </main>
  );
}
