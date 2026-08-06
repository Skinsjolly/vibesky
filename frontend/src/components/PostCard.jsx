import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth.jsx';
import { fmtTime, renderPostText, showToast } from '../lib/utils.jsx';
import Avatar from './Avatar.jsx';

export default function PostCard({ post, onUpdate, onDelete, onQuote, onOpenComments }) {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [busy, setBusy] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [localPost, setLocalPost] = useState(post);
  const [bookmarked, setBookmarked] = useState(false);

  const p = localPost;
  const isMine = p.uid === user?.uid;

  const stop = (e) => e.stopPropagation();

  const handleLike = async (e) => {
    stop(e);
    if (busy) return;
    setBusy(true);
    // Optimistic update
    const wasLiked = p.liked;
    setLocalPost(prev => ({
      ...prev, liked: !wasLiked,
      likeCount: (prev.likeCount || 0) + (wasLiked ? -1 : 1)
    }));
    try {
      const res = await api.likePost(p.id);
      setLocalPost(prev => ({ ...prev, liked: res.liked, likeCount: res.likeCount }));
      onUpdate?.(p.id, { liked: res.liked, likeCount: res.likeCount });
    } catch (err) {
      setLocalPost(prev => ({ ...prev, liked: wasLiked, likeCount: p.likeCount }));
      showToast(err.message);
    }
    setBusy(false);
  };

  const handleRepost = async (e) => {
    stop(e);
    if (busy) return;
    setBusy(true);
    try {
      const res = await api.repostPost(p.id);
      setLocalPost(prev => ({ ...prev, reposted: res.reposted, repostCount: res.repostCount }));
      onUpdate?.(p.id, { reposted: res.reposted, repostCount: res.repostCount });
      showToast(res.reposted ? 'Reposted' : 'Repost removed');
    } catch (err) { showToast(err.message); }
    setBusy(false);
  };

  const handleBookmark = async (e) => {
    stop(e);
    try {
      const res = await api.toggleBookmark(user.uid, p.id);
      setBookmarked(res.bookmarked);
      showToast(res.bookmarked ? 'Saved' : 'Removed from bookmarks');
    } catch (err) { showToast(err.message); }
  };

  const handleDelete = async (e) => {
    stop(e);
    if (!confirm('Delete this post?')) return;
    try {
      await api.deletePost(p.id);
      onDelete?.(p.id);
      showToast('Post deleted');
    } catch (err) { showToast(err.message); }
    setMenuOpen(false);
  };

  const handlePollVote = async (idx, e) => {
    stop(e);
    try {
      const res = await api.votePoll(p.id, idx);
      setLocalPost(prev => ({ ...prev, poll: res.poll }));
    } catch (err) { showToast(err.message); }
  };

  const goToPost = () => navigate(`/post/${p.id}`);
  const goToProfile = (e, handle) => { stop(e); navigate(`/u/${handle}`); };

  const myVoteIndex = p.poll?.options?.findIndex(o => o.votes?.includes(user?.uid));
  const pollEnded = p.poll && new Date() > new Date(p.poll.endsAt?._seconds ? p.poll.endsAt._seconds * 1000 : p.poll.endsAt);
  const pollTotal = p.poll?.options?.reduce((s, o) => s + (o.votes?.length || 0), 0) || 0;

  return (
    <div className="post-card" onClick={goToPost}>
      <Avatar user={{ name: p.authorName, avatar: p.authorAvatar }} onClick={(e) => goToProfile(e, p.authorHandle)} />
      <div className="post-body">
        {p.pinned && <div className="pinned-label">📌 Pinned post</div>}
        <div className="post-meta">
          <span className="post-name" onClick={(e) => goToProfile(e, p.authorHandle)}>{p.authorName}</span>
          {p.verified && <span className="verified-badge">✓</span>}
          <span className="post-handle">@{p.authorHandle}</span>
          <span className="post-dot">·</span>
          <span className="post-time">{fmtTime(p.createdAt)}</span>
          {isMine && (
            <div style={{ marginLeft: 'auto', position: 'relative' }}>
              <button className="post-menu-btn" onClick={(e) => { stop(e); setMenuOpen(!menuOpen); }}>⋯</button>
              {menuOpen && (
                <div style={{ position: 'absolute', right: 0, top: 30, background: '#fff', border: '1px solid var(--border)', borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,.15)', zIndex: 20, minWidth: 160 }}>
                  <div style={{ padding: '10px 14px', fontSize: 13, cursor: 'pointer' }} onClick={handleDelete}>🗑️ Delete post</div>
                  <div style={{ padding: '10px 14px', fontSize: 13, cursor: 'pointer' }} onClick={(e) => { stop(e); setMenuOpen(false); navigate(`/post/${p.id}/analytics`); }}>📊 View analytics</div>
                </div>
              )}
            </div>
          )}
        </div>

        {p.text && <div className="post-text">{renderPostText(p.text)}</div>}

        {p.imageUrl && <img className="post-img" src={p.imageUrl} alt="" onError={(e) => { e.target.style.display = 'none'; }} />}

        {p.imageUrls?.length > 1 && (
          <div className="post-img-grid">
            {p.imageUrls.slice(0, 4).map((url, i) => <img key={i} src={url} alt="" />)}
          </div>
        )}

        {p.linkPreview && (
          <a className="link-preview-card" href={p.linkPreview.url} target="_blank" rel="noopener noreferrer" onClick={stop}>
            {p.linkPreview.image && <img src={p.linkPreview.image} alt="" />}
            <div className="link-preview-body">
              <div className="link-preview-site">{p.linkPreview.siteName}</div>
              <div className="link-preview-title">{p.linkPreview.title}</div>
              {p.linkPreview.description && <div className="link-preview-desc">{p.linkPreview.description.slice(0, 100)}</div>}
            </div>
          </a>
        )}

        {p.quotedPost && (
          <div className="quoted-post" onClick={(e) => { stop(e); navigate(`/post/${p.quotedPost.id}`); }}>
            <div className="quoted-post-meta">
              <Avatar user={{ name: p.quotedPost.authorName, avatar: p.quotedPost.authorAvatar }} size={18} />
              <strong>{p.quotedPost.authorName}</strong>
              <span style={{ color: 'var(--text-3)' }}>@{p.quotedPost.authorHandle}</span>
            </div>
            <div className="quoted-post-text">{p.quotedPost.text}</div>
          </div>
        )}

        {p.poll && (
          <div className="poll-wrap" onClick={stop}>
            {p.poll.options.map((opt, i) => {
              const count = opt.votes?.length || 0;
              const pct = pollTotal ? Math.round((count / pollTotal) * 100) : 0;
              const voted = myVoteIndex >= 0;
              return (
                <div key={i} className="poll-option" onClick={(e) => !voted && !pollEnded && handlePollVote(i, e)}>
                  {(voted || pollEnded) && <div className="poll-option-fill" style={{ width: `${pct}%` }} />}
                  <div className="poll-option-label">
                    <span>{opt.text} {myVoteIndex === i && '✓'}</span>
                    {(voted || pollEnded) && <span>{pct}%</span>}
                  </div>
                </div>
              );
            })}
            <div className="poll-meta">{pollTotal} vote{pollTotal !== 1 ? 's' : ''} · {pollEnded ? 'Final results' : 'Poll active'}</div>
          </div>
        )}

        <div className="post-actions">
          <button className="act reply" onClick={(e) => { stop(e); onOpenComments ? onOpenComments(p) : goToPost(); }}>
            💬 <span>{p.commentCount || 0}</span>
          </button>
          <button className={`act repost ${p.reposted ? 'reposted' : ''}`} onClick={handleRepost}>
            🔁 <span>{p.repostCount || 0}</span>
          </button>
          <button className={`act like ${p.liked ? 'liked' : ''}`} onClick={handleLike}>
            {p.liked ? '❤️' : '🤍'} <span>{p.likeCount || 0}</span>
          </button>
          <button className={`act bookmark ${bookmarked ? 'bookmarked' : ''}`} onClick={handleBookmark}>
            {bookmarked ? '🔖' : '🏷️'}
          </button>
          <button className="act" onClick={(e) => { stop(e); onQuote?.(p); }}>
            💭
          </button>
        </div>
      </div>
    </div>
  );
}
