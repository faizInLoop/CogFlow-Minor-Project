export function normalizeTheme(value) {
  return value === 'dark' || value === 'dark-zen' ? 'dark' : 'bright';
}
