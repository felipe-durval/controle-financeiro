import { useCallback, useEffect, useState } from 'react';

import { listTransactions } from '../services/transaction-service.js';

// Concentra o ciclo "carregando -> dados ou erro" em um lugar so,
// para a pagina cuidar apenas de exibir o resultado.
export function useTransactions({ month, categoryId }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // useCallback evita recriar a funcao a cada render, o que faria
  // o useEffect abaixo disparar em loop.
  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await listTransactions({ month, categoryId });
      setTransactions(data);
    } catch (err) {
      setError(err.message);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [month, categoryId]);

  // Roda na primeira renderizacao e sempre que um filtro muda.
  useEffect(() => {
    load();
  }, [load]);

  // reload permite atualizar a lista depois de criar ou excluir algo.
  return { transactions, loading, error, reload: load };
}
