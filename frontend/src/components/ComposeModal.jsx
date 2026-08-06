import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth.jsx';
import { showToast, extractFirstUrl } from '../lib/utils.jsx';
import Avatar from './Avatar.jsx';

const TYPES = [
  { id: 'post', label: 'Post' },
  { id: 'thread', label: 'Thread' },
  { id: 'poll', label: 'Poll' },
];

export default function ComposeModal({ open, onClose, onPosted, quotedPost = null }) {
  const { profile } = useAuth();
  const [type, setType] = useState('post');
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [threadItems, setThreadItems] = useState(['']);
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [pollDuration, setPollDuration] = useState(24);
  const [scheduledAt, setScheduledAt] = useState('');
  const [posting, setPosting] = useState(false);
  const [linkPreview, setLinkPreview] = useState(null);

  useEffect(() => {
    if (open) {
      setType(quotedPost ? 'post' : 'post');
      setText(''); setImageFile(null); setImagePreview(null);
      setThreadItems(['']); setPollOptions(['', '']); setScheduledAt('');
      setLinkPreview(null);
    }
  }, [open, quotedPost]);

  // Fetch link preview when a URL is detected (debounced-ish via effect)
  useEffect(() => {
    const url = extractFirstUrl(text);
    if (!url) { setLinkPreview(null); return; }
    const t = setTimeout(() => {
      api.getLinkPreview(url).then(data => {
        if (data.title) setLinkPreview(data);
      }).catch(() => {});
    }, 700);
    return () => clearTimeout(t);
  }, [text]);

  if (!open) return null;

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const charsLeft = 300 - text.length;

  const canPost = () => {
    if (type === 'post') return (text.trim() || imageFile) && charsLeft >= 0;
    if (type === 'thread') return threadItems.some(t => t.trim());
    if (type === 'poll') return text.trim() && pollOptions.filter(o => o.trim()).length >= 2;
    return false;
  };

  const submit = async () => {
    if (!canPost() || posting) return;
    setPosting(true);
    try {
      if (type === 'thread') {
        const items = await Promise.all(threadItems.filter(t => t.trim()).map(async t => ({ text: t.trim() })));
        await api.createPost({ type: 'thread', threadPosts: items });
      } else if (type === 'poll') {
        await api.createPost({
          text: text.trim(), type: 'poll',
          pollOptions: pollOptions.filter(o => o.trim()),
          pollDurationHours: pollDuration
        });
      } else {
        let imageUrl = '';
        if (imageFile) {
          const res = await api.uploadImage(imageFile);
          imageUrl = res.url;
        }
        await api.createPost({
          text: text.trim(), imageUrl,
          type: 'post',
          quotedPostId: quotedPost?.id || null,
          linkPreview: linkPreview || null,
          scheduledAt: scheduledAt || null,
        });
      }
      showToast(scheduledAt ? 'Post scheduled' : 'Posted!');
      onPosted?.();
      onClose();
    } catch (e) { showToast(e.message); }
    setPosting(false);
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="compose-type-tabs">
            {TYPES.map(t => (
              <button key={t.id} className={`compose-type-tab ${type === t.id ? 'active' : ''}`} onClick={() => setType(t.id)}>
                {t.label}
              </button>
            ))}
          </div>

          {type === 'post' && (
            <div className="compose-row">
              <Avatar user={profile} size={40} />
              <div className="c-right">
                {quotedPost && (
                  <div className="quoted-post" style={{ marginBottom: 10 }}>
                    <div className="quoted-post-meta"><strong>{quotedPost.authorName}</strong> <span style={{ color: 'var(--text-3)' }}>@{quotedPost.authorHandle}</span></div>
                    <div className="quoted-post-text">{quotedPost.text}</div>
                  </div>
                )}
                <textarea
                  className="c-input" style={{ fontSize: 18, minHeight: 100 }}
                  placeholder="What's up?" value={text} autoFocus
                  onChange={e => setText(e.target.value)}
                />
                {imagePreview && (
                  <div className="img-preview-wrap">
                    <img src={imagePreview} alt="" />
                    <button className="rm-img" onClick={() => { setImageFile(null); setImagePreview(null); }}>✕</button>
                  </div>
                )}
                {linkPreview?.title && !imagePreview && (
                  <div className="link-preview-card">
                    {linkPreview.image && <img src={linkPreview.image} alt="" />}
                    <div className="link-preview-body">
                      <div className="link-preview-site">{linkPreview.siteName}</div>
                      <div className="link-preview-title">{linkPreview.title}</div>
                    </div>
                  </div>
                )}
                <div style={{ marginTop: 10 }}>
                  <label style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600 }}>Schedule for later (optional)</label>
                  <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)}
                    style={{ display: 'block', marginTop: 4, padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 }} />
                </div>
                <div className="c-divider" />
                <div className="c-footer">
                  <div className="c-tools">
                    <label className="c-tool" title="Add image">🖼️<input type="file" accept="image/*" onChange={handleImage} style={{ display: 'none' }} /></label>
                    <button className="c-tool" title="GIF (coming soon)">🎬</button>
                  </div>
                  <div className="c-right-meta">
                    <span className={`c-char ${charsLeft < 20 ? 'warn' : ''}`}>{charsLeft}</span>
                    <div className="c-divider-v" />
                    <button className="post-btn" disabled={!canPost() || posting} onClick={submit}>
                      {posting ? 'Posting…' : scheduledAt ? 'Schedule' : 'Post'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {type === 'thread' && (
            <div>
              {threadItems.map((item, i) => (
                <div key={i} className={i > 0 ? 'thread-item' : ''}>
                  <div className="compose-row">
                    <Avatar user={profile} size={36} />
                    <div className="c-right">
                      <textarea
                        className="c-input" style={{ minHeight: 60, fontSize: 15 }}
                        placeholder={i === 0 ? "Start your thread…" : "Add another post…"}
                        value={item}
                        onChange={e => setThreadItems(prev => prev.map((t, idx) => idx === i ? e.target.value : t))}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button className="add-option-btn" onClick={() => setThreadItems(prev => [...prev, ''])}>+ Add another post</button>
              <div className="c-footer">
                <span className="c-char">{threadItems.length} post{threadItems.length !== 1 ? 's' : ''}</span>
                <button className="post-btn" disabled={!canPost() || posting} onClick={submit}>
                  {posting ? 'Posting…' : 'Post thread'}
                </button>
              </div>
            </div>
          )}

          {type === 'poll' && (
            <div>
              <div className="compose-row" style={{ marginBottom: 14 }}>
                <Avatar user={profile} size={36} />
                <div className="c-right">
                  <textarea className="c-input" style={{ minHeight: 60, fontSize: 16 }}
                    placeholder="Ask a question…" value={text} onChange={e => setText(e.target.value)} />
                </div>
              </div>
              {pollOptions.map((opt, i) => (
                <div key={i} className="poll-option-row">
                  <input
                    type="text" placeholder={`Option ${i + 1}`} value={opt}
                    onChange={e => setPollOptions(prev => prev.map((o, idx) => idx === i ? e.target.value : o))}
                    maxLength={40}
                  />
                  {pollOptions.length > 2 && (
                    <button className="poll-rm" onClick={() => setPollOptions(prev => prev.filter((_, idx) => idx !== i))}>✕</button>
                  )}
                </div>
              ))}
              {pollOptions.length < 4 && (
                <button className="add-option-btn" onClick={() => setPollOptions(prev => [...prev, ''])}>+ Add option</button>
              )}
              <div style={{ marginTop: 10 }}>
                <label style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600 }}>Poll duration</label>
                <select value={pollDuration} onChange={e => setPollDuration(Number(e.target.value))}
                  style={{ display: 'block', marginTop: 4, padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, width: '100%' }}>
                  <option value={1}>1 hour</option>
                  <option value={6}>6 hours</option>
                  <option value={24}>1 day</option>
                  <option value={72}>3 days</option>
                  <option value={168}>1 week</option>
                </select>
              </div>
              <div className="c-footer" style={{ marginTop: 14 }}>
                <span />
                <button className="post-btn" disabled={!canPost() || posting} onClick={submit}>
                  {posting ? 'Posting…' : 'Post poll'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
