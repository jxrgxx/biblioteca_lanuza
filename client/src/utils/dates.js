export const fmt = (s) => {
  if (!s) return '—';
  const [y, m, d] = s.split('-');
  return `${d}-${m}-${y}`;
};
