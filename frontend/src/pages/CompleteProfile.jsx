import { useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth.jsx';

// Shown when a Firebase Auth user exists but has no matching Firestore
// profile — e.g. accounts created while the /register bug was live.
// Lets the person finish creating their profile instead of being stuck.
export default function CompleteProfile() {
  const { refreshProfile, logout } = useAuth();
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!name.trim() || !handle.trim()) { setError('Both fields are required.'); return; }
    setSaving(true);
    setError('');
    try {
      await api.registerUser(name.trim(), handle.trim().toLowerCase().replace(/\s/g, ''));
      await refreshProfile();
    } catch (e) {
      setError(e.message);
    }
    setSaving(false);
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
          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>Finish setting up your account</h2>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20 }}>
            Your account was created but your profile wasn't finished. Pick a name and handle to continue.
          </p>
          <div className="field"><label>Display name</label><input value={name} onChange={e => setName(e.target.value)} placeholder="Your Name" /></div>
          <div className="field"><label>Handle</label><input value={handle} onChange={e => setHandle(e.target.value.toLowerCase().replace(/\s/g, ''))} placeholder="yourhandle" onKeyDown={e => e.key === 'Enter' && submit()} /></div>
          <button className="btn-primary" onClick={submit} disabled={saving}>{saving ? 'Saving…' : 'Continue'}</button>
          <div className="auth-error">{error}</div>
          <button
            onClick={logout}
            style={{ marginTop: 14, width: '100%', background: 'none', border: 'none', color: 'var(--text-3)', fontSize: 13, cursor: 'pointer' }}>
            Sign out instead
          </button>
        </div>
      </div>
    </div>
  );
}
