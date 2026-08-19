import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'controle-financeiro:theme';

// Se a pessoa nunca escolheu, seguimos a preferencia do sistema
// operacional em vez de impor o tema claro.
function systemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function storedTheme() {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved === 'dark' || saved === 'light' ? saved : null;
}

export function useTheme() {
  const [theme, setTheme] = useState(() => storedTheme() ?? systemTheme());

  useEffect(() => {
    // O CSS inteiro reage a este atributo no <html>.
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    // Se a pessoa mudar o tema do sistema e nunca tiver escolhido
    // um aqui, acompanhamos a mudanca.
    const query = window.matchMedia('(prefers-color-scheme: dark)');

    function handleChange(event) {
      if (!storedTheme()) {
        setTheme(event.matches ? 'dark' : 'light');
      }
    }

    query.addEventListener('change', handleChange);
    return () => query.removeEventListener('change', handleChange);
  }, []);

  const toggle = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, toggle };
}
