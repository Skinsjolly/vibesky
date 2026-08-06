import { useState } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';

export default function AuthScreen() {
  const { login, signup } = useAuth();
  const [tab, setTab] = useState('login');
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');

  const doLogin = async () => {
    setError('');
    try { await login(email, pass); } catch (e) { setError(e.message); }
  };
  const doSignup = async () => {
    setError('');
    if (!name || !handle || !email || !pass) { setError('All fields required.'); return; }
    try { await signup(name, handle, email, pass); } catch (e) { setError(e.message); }
  };

  return (
    <div id="auth-screen">
      <div className="auth-wrap">
        <div className="auth-logo">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="36" height="36" rx="10" fill="#0085ff"/>
            <path d="M18 8C13.0 8 9 12.5 9 18c0 3.5 1.7 6.6 4.3 8.5C14.6 27.4 16.2 28 18 28s3.4-.6 4.7-1.5C25.3 24.6 27 21.5 27 18c0-5.5-4-10-9-10z" fill="white" opacity=".9"/>
            <circle cx="18" cy="18" r="4" fill="#0085ff"/>
          </svg>
          <span>VibeSky</span>
        </div>
        <div className="auth-card">
          <div className="auth-tabs">
            <button className={`auth-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => { setTab('login'); setError(''); }}>Sign in</button>
            <button className={`auth-tab ${tab === 'signup' ? 'active' : ''}`} onClick={() => { setTab('signup'); setError(''); }}>Create account</button>
          </div>

          {tab === 'login' ? (
            <div>
              <div className="field"><label>Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" /></div>
              <div className="field"><label>Password</label><input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" onKeyDown={e => e.key === 'Enter' && doLogin()} /></div>
              <button className="btn-primary" onClick={doLogin}>Sign in</button>
            </div>
          ) : (
            <div>
              <div className="field"><label>Display name</label><input value={name} onChange={e => setName(e.target.value)} placeholder="Your Name" /></div>
              <div className="field"><label>Handle</label><input value={handle} onChange={e => setHandle(e.target.value.toLowerCase().replace(/\s/g, ''))} placeholder="yourhandle" /></div>
              <div className="field"><label>Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" /></div>
              <div className="field"><label>Password</label><input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="6+ characters" onKeyDown={e => e.key === 'Enter' && doSignup()} /></div>
              <button className="btn-primary" onClick={doSignup}>Create account</button>
            </div>
          )}
          <div className="auth-error">{error}</div>
        </div>
      </div>
    </div>
  );
}
