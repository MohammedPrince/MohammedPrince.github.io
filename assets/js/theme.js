// Applies the visitor's saved light / dark choice before the page is painted.
try {
  const saved = localStorage.getItem('theme');
  if (saved === 'light' || saved === 'dark') document.documentElement.dataset.theme = saved;
} catch { /* storage blocked: keep the default theme */ }
