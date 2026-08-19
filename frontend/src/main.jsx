import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App.jsx';
import './index.css';

// Pega a div#root do index.html e monta o React dentro dela.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* BrowserRouter habilita as rotas e precisa envolver quem usa <Route>. */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
