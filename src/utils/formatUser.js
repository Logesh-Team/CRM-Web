const AVATAR_COLORS = ['#534AB7', '#185FA5', '#0F6E56', '#BA7517', '#A32D2D', '#1A1A18'];

export function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

export function getAvatarColor(name) {
  if (!name) return AVATAR_COLORS[0];
  const code = name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

export function getDisplayName(user) {
  if (!user) return 'User';
  if (user.name) return user.name;
  if (user.given_name) {
    return user.family_name ? `${user.given_name} ${user.family_name}` : user.given_name;
  }
  return user.preferred_username || 'User';
}

export function formatLastLogin(iso) {
  if (!iso) return '—';
  try {
    const date = new Date(iso);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (d.getTime() === today.getTime()) {
      return `Today ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
    }
    if (d.getTime() === yesterday.getTime()) return 'Yesterday';
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}
