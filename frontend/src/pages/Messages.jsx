import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth.jsx';
import { fmtTime, showToast } from '../lib/utils.jsx';
import Avatar from '../components/Avatar.jsx';

export function ConversationList() {
  const navigate = useNavigate();
  const [convos, setConvos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getConversations().then(setConvos).finally(() => setLoading(false));
  }, []);

  return (
    <main className="main">
      <div className="feed-header"><div className="feed-header-top"><h1>Messages</h1></div></div>
      {loading ? <div className="spinner" /> : convos.length === 0 ? (
        <div className="empty-state"><div className="ei">✉️</div><h3>No messages yet</h3><p>Visit a profile and tap Message to start a conversation.</p></div>
      ) : convos.map(c => (
        <div key={c.id} className="convo-item" onClick={() => navigate(`/messages/${c.otherUser?.uid}`)}>
          <Avatar user={c.otherUser} size={44} />
          <div className="convo-info">
            <div className="convo-name">{c.otherUser?.name || 'Unknown'}</div>
            <div className="convo-preview">{c.lastMessage}</div>
          </div>
          {c.unreadCount > 0 && <span className="nav-badge">{c.unreadCount}</span>}
        </div>
      ))}
    </main>
  );
}

export function MessageThread() {
  const { otherUid } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [otherUser, setOtherUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([api.getUser(otherUid), api.getMessages(otherUid)])
      .then(([u, msgs]) => { setOtherUser(u); setMessages(msgs); })
      .finally(() => setLoading(false));
  }, [otherUid]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    if (!text.trim()) return;
    const t = text.trim();
    setText('');
    try {
      const msg = await api.sendMessage(otherUid, t);
      setMessages(prev => [...prev, msg]);
    } catch (e) { showToast(e.message); }
  };

  if (loading) return <main className="main"><div className="spinner" /></main>;

  return (
    <main className="main" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <div className="feed-header">
        <div className="feed-header-top">
          <button className="back-btn" onClick={() => navigate('/messages')}>←</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Avatar user={otherUser} size={30} />
            <h1 style={{ fontSize: 15 }}>{otherUser?.name}</h1>
          </div>
        </div>
      </div>
      <div className="msg-thread" style={{ flex: 1 }}>
        {messages.length === 0 && <div className="empty-state"><div className="ei">👋</div><h3>Say hello!</h3></div>}
        {messages.map(m => (
          <div key={m.id} className={`msg-bubble ${m.senderUid === user.uid ? 'mine' : 'theirs'}`}>
            {m.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="msg-input-row">
        <input
          type="text" placeholder="Type a message…" value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
        />
        <button className="post-btn" onClick={send} disabled={!text.trim()}>Send</button>
      </div>
    </main>
  );
}
