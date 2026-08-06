import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth.jsx';
import { useFeed } from '../hooks/useFeed.js';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll.js';
import { showToast } from '../lib/utils.jsx';
import Avatar from '../components/Avatar.jsx';
import PostCard from '../components/PostCard.jsx';
import ComposeModal from '../components/ComposeModal.jsx';

export default function Feed() {
  const { profile } = useAuth();
  const [tab, setTab] = useState('following'); // following | global | foryou
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [posting, setPosting] = useState(false);
  const [quoteTarget, setQuoteTarget] = useState(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [forYouPosts, setForYouPosts] = useState([]);
  const [forYouLoading, setForYouLoading] = useState(false);

  const followingFeed = useFeed('following');
  const globalFeed = useFeed('global');
  const activeFeed = tab === 'following' ? followingFeed : globalFeed;

  useEffect(() => {
    if (tab === 'following' && followingFeed.posts.length === 0) followingFeed.loadMore();
    if (tab === 'global' && globalFeed.posts.length === 0) globalFeed.loadMore();
    if (tab === 'foryou' && forYouPosts.length === 0) {
      setForYouLoading(true);
      api.getForYouFeed().then(d => setForYouPosts(d.posts)).finally(() => setForYouLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // This calls loadMore only while hasMore is true — the useFeed hook's
  // internal guard prevents this from ever looping once the feed is exhausted.
  const sentinelRef = useInfiniteScroll(
    () => { if (tab === 'following' || tab === 'global') activeFeed.loadMore(); },
    { enabled: tab !== 'foryou' }
  );

  const charsLeft = 300 - text.length;

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const submitPost = async () => {
    if ((!text.trim() && !imageFile) || charsLeft < 0 || posting) return;
    setPosting(true);
    try {
      let imageUrl = '';
      if (imageFile) {
        const res = await api.uploadImage(imageFile);
        imageUrl = res.url;
      }
      await api.createPost({ text: text.trim(), imageUrl, type: 'post' });
      setText(''); setImageFile(null); setImagePreview(null);
      showToast('Posted!');
      followingFeed.reset(); globalFeed.reset();
      if (tab === 'following') followingFeed.loadMore(); else if (tab === 'global') globalFeed.loadMore();
    } catch (e) { showToast(e.message); }
    setPosting(false);
  };

  const handleUpdate = (id, updates) => {
    followingFeed.updatePost(id, updates);
    globalFeed.updatePost(id, updates);
  };
  const handleDelete = (id) => {
    followingFeed.removePost(id);
    globalFeed.removePost(id);
    setForYouPosts(prev => prev.filter(p => p.id !== id));
  };

  const displayPosts = tab === 'foryou' ? forYouPosts : activeFeed.posts;
  const displayLoading = tab === 'foryou' ? forYouLoading : (activeFeed.loading && displayPosts.length === 0);

  return (
    <main className="main">
      <div className="feed-header">
        <div className="feed-header-top"><h1>Home</h1></div>
        <div className="feed-tabs">
          <div className={`feed-tab ${tab === 'following' ? 'active' : ''}`} onClick={() => setTab('following')}>Following</div>
          <div className={`feed-tab ${tab === 'foryou' ? 'active' : ''}`} onClick={() => setTab('foryou')}>For You</div>
          <div className={`feed-tab ${tab === 'global' ? 'active' : ''}`} onClick={() => setTab('global')}>Latest</div>
        </div>
      </div>

      <div className="compose-box">
        <div className="compose-row">
          <Avatar user={profile} size={42} />
          <div className="c-right">
            <textarea className="c-input" placeholder="What's up?" value={text} onChange={e => setText(e.target.value)} />
            {imagePreview && (
              <div className="img-preview-wrap">
                <img src={imagePreview} alt="" />
                <button className="rm-img" onClick={() => { setImageFile(null); setImagePreview(null); }}>✕</button>
              </div>
            )}
            <div className="c-divider" />
            <div className="c-footer">
              <div className="c-tools">
                <label className="c-tool">🖼️<input type="file" accept="image/*" onChange={handleImage} style={{ display: 'none' }} /></label>
                <button className="c-tool" title="More options" onClick={() => setComposeOpen(true)}>✨</button>
              </div>
              <div className="c-right-meta">
                <span className={`c-char ${charsLeft < 20 ? 'warn' : ''}`}>{charsLeft}</span>
                <div className="c-divider-v" />
                <button className="post-btn" disabled={(!text.trim() && !imageFile) || charsLeft < 0 || posting} onClick={submitPost}>
                  {posting ? 'Posting…' : 'Post'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {displayLoading ? (
        <div className="spinner" />
      ) : displayPosts.length === 0 ? (
        <div className="empty-state">
          <div className="ei">🌤️</div>
          <h3>Nothing here yet</h3>
          <p>{tab === 'following' ? 'Follow people to see their posts here.' : 'Be the first to post!'}</p>
        </div>
      ) : (
        <>
          {displayPosts.map(p => (
            <PostCard key={p.id} post={p} onUpdate={handleUpdate} onDelete={handleDelete}
              onQuote={(post) => setQuoteTarget(post)} />
          ))}
          {tab !== 'foryou' && (
            <>
              <div ref={sentinelRef} className="scroll-sentinel" />
              {activeFeed.loading && <div className="spinner" />}
              {!activeFeed.hasMore && displayPosts.length > 0 && (
                <div className="end-of-feed">You're all caught up ✨</div>
              )}
            </>
          )}
        </>
      )}

      <ComposeModal
        open={!!quoteTarget || composeOpen}
        quotedPost={quoteTarget}
        onClose={() => { setQuoteTarget(null); setComposeOpen(false); }}
        onPosted={() => { followingFeed.reset(); globalFeed.reset(); if (tab==='following') followingFeed.loadMore(); else if (tab==='global') globalFeed.loadMore(); }}
      />
    </main>
  );
}
