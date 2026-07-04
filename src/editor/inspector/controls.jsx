/* Shared inspector controls: segmented buttons + color swatch rows */

export function Seg({ label, value, options, onChange, clearOn }) {
  return (
    <div className="ins-field">
      <span>{label}</span>
      <div className="ins-seg">
        {options.map(([val, lab]) => (
          <button
            key={String(val)}
            type="button"
            className={(value || clearOn) === val ? 'active' : ''}
            onClick={() => onChange(val === clearOn ? undefined : val)}
          >
            {lab}
          </button>
        ))}
      </div>
    </div>
  )
}

export function SwatchRow({ label, value, swatches, onChange }) {
  return (
    <div className="ins-field">
      <span>{label}</span>
      <div className="swatch-row">
        {swatches.map((c) => (
          <button
            key={String(c)}
            type="button"
            className={`swatch${c === null ? ' none' : ''}${value === c || (!value && c === null) ? ' on' : ''}`}
            style={c ? { background: c } : {}}
            title={c || 'Default'}
            onClick={() => onChange(c || undefined)}
          />
        ))}
        <input
          type="color"
          className="swatch-custom"
          title="Custom color"
          value={value && value.startsWith('#') ? value : '#888888'}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  )
}
