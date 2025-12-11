
// Utility to generate consistent colors for dynamic medium names
export const getMediumStyles = (medium: string) => {
  // Simple hash to select a color theme
  let hash = 0;
  for (let i = 0; i < medium.length; i++) {
    hash = medium.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const themes = [
    { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', hover: 'hover:bg-blue-100', row: 'hover:bg-blue-50/40' }, // English-ish
    { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', hover: 'hover:bg-amber-100', row: 'hover:bg-amber-50/40' }, // Kannada-ish
    { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', hover: 'hover:bg-emerald-100', row: 'hover:bg-emerald-50/40' },
    { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', hover: 'hover:bg-purple-100', row: 'hover:bg-purple-50/40' },
    { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', hover: 'hover:bg-rose-100', row: 'hover:bg-rose-50/40' },
    { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', hover: 'hover:bg-cyan-100', row: 'hover:bg-cyan-50/40' },
  ];

  const index = Math.abs(hash) % themes.length;
  const theme = themes[index];

  return {
    badge: `${theme.bg} ${theme.text} ${theme.border} ${theme.hover}`,
    row: theme.row,
    text: theme.text,
    border: theme.border,
    bg: theme.bg
  };
};
