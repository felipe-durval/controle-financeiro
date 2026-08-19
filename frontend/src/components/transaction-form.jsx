import { useEffect, useRef, useState } from 'react';

import { createTransaction, updateTransaction } from '../services/transaction-service.js';
import { toDateInputValue, todayInputValue } from '../utils/format.js';

const MAX_DESCRIPTION_LENGTH = 100;

// Estado inicial dos campos: em branco para criar,
// preenchido com a transacao existente para editar.
function initialValues(transaction) {
  if (!transaction) {
    return {
      description: '',
      amount: '',
      type: 'expense',
      date: todayInputValue(),
      categoryId: '',
    };
  }

  return {
    description: transaction.description,
    // O input trabalha com texto; convertemos para numero so no envio.
    amount: String(transaction.amount),
    type: transaction.type,
    date: toDateInputValue(transaction.date),
    categoryId: String(transaction.category.id),
  };
}

// Mesmas regras do backend, para avisar antes de gastar uma requisicao.
function validate({ description, amount, date, categoryId }) {
  if (!description.trim()) {
    return 'Informe a descricao.';
  }

  if (description.trim().length > MAX_DESCRIPTION_LENGTH) {
    return `A descricao deve ter no maximo ${MAX_DESCRIPTION_LENGTH} caracteres.`;
  }

  const parsedAmount = Number(amount);

  if (!amount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
    return 'O valor deve ser maior que zero.';
  }

  if (!date) {
    return 'Informe a data.';
  }

  if (!categoryId) {
    return 'Escolha uma categoria.';
  }

  return '';
}

function TransactionForm({ transaction, categories, onClose, onSaved }) {
  const [values, setValues] = useState(() => initialValues(transaction));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const dialogRef = useRef(null);

  // O <dialog> nativo cuida de travar o foco dentro do formulario
  // e de fechar com Esc, sem precisarmos programar isso.
  useEffect(() => {
    const dialog = dialogRef.current;

    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }, []);

  const isEditing = Boolean(transaction);

  function setField(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validationError = validate(values);

    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setSaving(true);

    const payload = {
      description: values.description.trim(),
      amount: Number(values.amount),
      type: values.type,
      date: values.date,
      categoryId: Number(values.categoryId),
    };

    try {
      if (isEditing) {
        await updateTransaction(transaction.id, payload);
      } else {
        await createTransaction(payload);
      }

      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    // onCancel captura o Esc, para o React tambem saber que fechou.
    <dialog ref={dialogRef} className="dialog" onCancel={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        <h2>{isEditing ? 'Editar transacao' : 'Nova transacao'}</h2>

        <div className="field">
          <label htmlFor="description">Descricao</label>
          <input
            id="description"
            value={values.description}
            onChange={(event) => setField('description', event.target.value)}
            maxLength={MAX_DESCRIPTION_LENGTH}
            placeholder="Ex: Mercado do mes"
          />
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="amount">Valor (R$)</label>
            <input
              id="amount"
              type="number"
              // step permite centavos; sem isso o navegador recusa 32,50.
              step="0.01"
              min="0.01"
              value={values.amount}
              onChange={(event) => setField('amount', event.target.value)}
              placeholder="0,00"
            />
          </div>

          <div className="field">
            <label htmlFor="type">Tipo</label>
            <select
              id="type"
              value={values.type}
              onChange={(event) => setField('type', event.target.value)}
            >
              <option value="expense">Despesa</option>
              <option value="income">Receita</option>
            </select>
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="date">Data</label>
            <input
              id="date"
              type="date"
              value={values.date}
              onChange={(event) => setField('date', event.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="categoryId">Categoria</label>
            <select
              id="categoryId"
              value={values.categoryId}
              onChange={(event) => setField('categoryId', event.target.value)}
            >
              <option value="">Selecione...</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}

        <div className="dialog-actions">
          <button type="button" className="button-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </dialog>
  );
}

export default TransactionForm;
