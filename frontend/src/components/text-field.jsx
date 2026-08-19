// Campo de formulario controlado: o valor vem do estado do React,
// e toda digitacao passa pelo onChange antes de virar valor novo.
function TextField({ id, label, type = 'text', value, onChange, autoComplete, placeholder }) {
  return (
    <div className="field">
      {/* htmlFor ligado ao id faz o clique no rotulo focar o campo. */}
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
      />
    </div>
  );
}

export default TextField;
