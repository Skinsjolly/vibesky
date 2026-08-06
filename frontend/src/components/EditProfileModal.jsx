import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth.jsx';
import { showToast } from '../lib/utils.jsx';

export default function EditProfileModal({ open, onClose, onSaved }) {
  const { profile } = useAuth();
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [bio, setBio] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && profile) {
      setName(profile.name || '');
      setHandle(profile.handle || '');
      setBio(profile.bio || '');
      setAvatarPreview(profile.avatar || '');
      setAvatarFile(null);
    }
  }, [open, profile]);

  if (!open) return null;

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const save = async () => {
    if (!name.trim() || !handle.trim()) { showToast('Name and handle required'); return; }
    setSaving(true);
    try {
      let avatarUrl = profile?.avatar || '';
      if (avatarFile) {
        const res = await api.uploadAvatar(avatarFile);
        avatarUrl = res.url;
      }
      await api.updateMe({ name: name.trim(), handle: handle.trim(), bio: bio.trim(), avatar: avatarUrl });
      showToast('Profile saved');
      onSaved?.();
      onClose();
    } catch (e) { showToast(e.message); }
    setSaving(false);
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <button className="modal-close" onClick={onClose}>✕</button>
          <span className="modal-title">Edit profile</span>
          <button className="post-btn" style={{ marginLeft: 'auto' }} onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
        <div className="modal-body">
          <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="avatar" style={{ width: 64, height: 64, fontSize: 24 }}>
              {avatarPreview ? <img src={avatarPreview} alt="" /> : (name[0] || '?').toUpperCase()}
            </div>
            <label className="follow-btn" style={{ cursor: 'pointer' }}>
              Change photo
              <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
            </label>
          </div>
          <div className="edit-field"><label>Display name</label><input value={name} onChange={e => setName(e.target.value)} maxLength={60} /></div>
          <div className="edit-field"><label>Handle</label><input value={handle} onChange={e => setHandle(e.target.value)} maxLength={30} /></div>
          <div className="edit-field"><label>Bio</label><textarea value={bio} onChange={e => setBio(e.target.value)} maxLength={300} placeholder="Tell people about yourself" /></div>
        </div>
      </div>
    </div>
  );
}
