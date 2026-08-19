import { useTheme } from '../hooks/use-theme.js';

// Icones desenhados em SVG para nao trazer uma biblioteca inteira
// so por causa de dois simbolos.
function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 13.2A9 9 0 1 1 10.8 3a7 7 0 0 0 10.2 10.2z" />
    </svg>
  );
}

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      className="icon-button"
      onClick={toggle}
      // O botao so mostra um icone; o rotulo e o titulo dizem
      // o que ele faz para quem nao ve a imagem.
      aria-label={isDark ? 'Mudar para o tema claro' : 'Mudar para o tema escuro'}
      title={isDark ? 'Tema claro' : 'Tema escuro'}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

export default ThemeToggle;
