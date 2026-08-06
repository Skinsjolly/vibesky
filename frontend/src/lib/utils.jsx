export function fmtTime(date) {
  if (!date) return '';
  const d = new Date(date);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function initial(name) {
  return (name || '?')[0]?.toUpperCase() || '?';
}

// Renders post text with clickable #hashtags
export function renderPostText(text) {
  if (!text) return null;
  const parts = text.split(/(#[\w]+)/g);
  return parts.map((part, i) => {
    if (part.startsWith('#')) {
      return <span key={i} className="hashtag">{part}</span>;
    }
    return part;
  });
}

// Extract first URL from text for link preview fetching
export function extractFirstUrl(text) {
  const match = text?.match(/(https?:\/\/[^\s]+)/);
  return match ? match[0] : null;
}

let toastFn = null;
export function registerToast(fn) { toastFn = fn; }
export function showToast(msg) { if (toastFn) toastFn(msg); }
