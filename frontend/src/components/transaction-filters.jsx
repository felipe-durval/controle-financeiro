// Filtros da listagem. O componente nao guarda estado proprio:
// recebe os valores atuais e avisa a pagina quando mudam.
function TransactionFilters({ month, categoryId, categories, onMonthChange, onCategoryChange, onClear }) {
  const hasFilter = Boolean(month || categoryId);

  return (
    <section className="filters">
      <div className="field">
        <label htmlFor="filter-month">Mes</label>
        {/* type="month" ja entrega o valor no formato AAAA-MM que a API espera. */}
        <input
          id="filter-month"
          type="month"
          value={month}
          onChange={(event) => onMonthChange(event.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="filter-category">Categoria</label>
        <select
          id="filter-category"
          value={categoryId}
          onChange={(event) => onCategoryChange(event.target.value)}
        >
          <option value="">Todas</option>
          {categories.map((category) => (
            // key ajuda o React a saber qual item mudou ao redesenhar a lista.
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        className="button-secondary"
        onClick={onClear}
        disabled={!hasFilter}
      >
        Limpar filtros
      </button>
    </section>
  );
}

export default TransactionFilters;
