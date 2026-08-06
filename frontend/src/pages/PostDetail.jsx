import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth.jsx';
import { fmtTime, renderPostText, showToast } from '../lib/utils.jsx';
import Avatar from '../components/Avatar.jsx';
import PostCard from '../components/PostCard.jsx';
import ComposeModal from '../components/ComposeModal.jsx';

export default function PostDetail() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [quoteTarget, setQuoteTarget] = useState(null);

  const load = () => {
    setLoading(true);
    api.getPost(postId).then(data => {
      setPost(data);
      setComments(data.comments || []);
    }).catch(() => showToast('Post not found')).finally(() => setLoading(false));
  };

  useEffect(() => { load(); window.scrollTo(0, 0); }, [postId]);

  const submitReply = async () => {
    if (!replyText.trim() || submitting) return;
    setSubmitting(true);
    try {
      const comment = await api.commentOnPost(postId, replyText.trim());
      setComments(prev => [...prev, comment]);
      setPost(prev => ({ ...prev, commentCount: (prev.commentCount || 0) + 1 }));
      setReplyText('');
    } catch (e) { showToast(e.message); }
    setSubmitting(false);
  };

  if (loading) return <main className="main"><div className="spinner" /></main>;
  if (!post) return (
    <main className="main">
      <div className="empty-state"><div className="ei">🔍</div><h3>Post not found</h3><p>This post may have been deleted.</p></div>
    </main>
  );

  return (
    <main className="main">
      <div className="feed-header">
        <div className="feed-header-top">
          <button className="back-btn" onClick={() => navigate(-1)}>←</button>
          <h1>Post</h1>
        </div>
      </div>

      {/* Full post view (larger than card style) */}
      <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <Avatar user={{ name: post.authorName, avatar: post.authorAvatar }} size={44}
            onClick={() => navigate(`/u/${post.authorHandle}`)} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, cursor: 'pointer' }} onClick={() => navigate(`/u/${post.authorHandle}`)}>
              {post.authorName} {post.verified && <span className="verified-badge">✓</span>}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-3)' }}>@{post.authorHandle}</div>
          </div>
        </div>

        {post.text && <div className="post-text" style={{ fontSize: 19, marginBottom: 12 }}>{renderPostText(post.text)}</div>}
        {post.imageUrl && <img className="post-img" src={post.imageUrl} alt="" style={{ maxHeight: 500 }} />}

        <div style={{ fontSize: 14, color: 'var(--text-3)', padding: '12px 0', borderBottom: '1px solid var(--border)', marginBottom: 8 }}>
          {fmtTime(post.createdAt)} · <strong style={{ color: 'var(--text)' }}>{post.views || 0}</strong> views
        </div>

        <div style={{ display: 'flex', gap: 20, padding: '8px 0', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
          <span><strong>{post.repostCount || 0}</strong> <span style={{ color: 'var(--text-3)' }}>Reposts</span></span>
          <span><strong>{post.likeCount || 0}</strong> <span style={{ color: 'var(--text-3)' }}>Likes</span></span>
        </div>

        <div className="post-actions" style={{ paddingTop: 6 }}>
          <button className="act reply">💬 <span>{post.commentCount || 0}</span></button>
          <button className={`act repost ${post.reposted ? 'reposted' : ''}`}
            onClick={async () => { const r = await api.repostPost(post.id); setPost(prev => ({ ...prev, reposted: r.reposted, repostCount: r.repostCount })); }}>
            🔁 <span>{post.repostCount || 0}</span>
          </button>
          <button className={`act like ${post.liked ? 'liked' : ''}`}
            onClick={async () => { const r = await api.likePost(post.id); setPost(prev => ({ ...prev, liked: r.liked, likeCount: r.likeCount })); }}>
            {post.liked ? '❤️' : '🤍'} <span>{post.likeCount || 0}</span>
          </button>
          <button className="act" onClick={() => setQuoteTarget(post)}>💭</button>
        </div>
      </div>

      {/* Reply box */}
      <div className="compose-box">
        <div className="compose-row">
          <Avatar user={profile} size={38} />
          <div className="c-right">
            <textarea className="c-input" placeholder="Post your reply" style={{ minHeight: 44, fontSize: 15 }}
              value={replyText} onChange={e => setReplyText(e.target.value)} />
            <div className="c-footer">
              <span />
              <button className="post-btn" disabled={!replyText.trim() || submitting} onClick={submitReply}>
                {submitting ? 'Replying…' : 'Reply'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Comments thread */}
      {comments.length === 0 ? (
        <div className="empty-state"><div className="ei">💬</div><h3>No replies yet</h3><p>Be the first to reply.</p></div>
      ) : comments.map(c => (
        <div key={c.id} className="post-card" style={{ cursor: 'default' }}>
          <Avatar user={{ name: c.authorName, avatar: c.authorAvatar }} onClick={() => navigate(`/u/${c.authorHandle}`)} />
          <div className="post-body">
            <div className="post-meta">
              <span className="post-name" onClick={() => navigate(`/u/${c.authorHandle}`)}>{c.authorName}</span>
              <span className="post-handle">@{c.authorHandle}</span>
              <span className="post-dot">·</span>
              <span className="post-time">{fmtTime(c.createdAt)}</span>
            </div>
            <div className="post-text">{renderPostText(c.text)}</div>
          </div>
        </div>
      ))}

      <ComposeModal open={!!quoteTarget} quotedPost={quoteTarget} onClose={() => setQuoteTarget(null)} onPosted={load} />
    </main>
  );
}
