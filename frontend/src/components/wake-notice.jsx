import { useEffect, useState } from 'react';

import { onSlowRequest } from '../services/api.js';

// Aviso que aparece quando a API demora a responder.
// No plano gratuito o servidor hiberna, e a primeira requisicao pode
// levar quase um minuto. Sem esta faixa, a tela parece travada e a
// pessoa fecha a aba achando que quebrou.
function WakeNotice() {
  const [waking, setWaking] = useState(false);

  useEffect(() => onSlowRequest(setWaking), []);

  if (!waking) {
    return null;
  }

  return (
    // aria-live faz o leitor de tela anunciar o aviso quando ele surge,
    // sem roubar o foco de quem esta preenchendo o formulario.
    <div className="wake-notice" role="status" aria-live="polite">
      <span className="wake-spinner" aria-hidden="true" />
      <span>
        Acordando o servidor... A primeira visita pode levar ate um minuto.
      </span>
    </div>
  );
}

export default WakeNotice;
