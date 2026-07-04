import { BLOCK_DEFS } from '../../lib/store.js'

/* ---------------- Left slim rail: search, pinned, recent, all-blocks ---------------- */
export default function Rail({ sections, onSearch, onAll, startPaletteDrag, endDrag, insertFromPalette }) {
  return (
    <aside className="ed-left">
      <button type="button" className="rail-search" onClick={onSearch}>
        <span>Search blocks…</span>
        <kbd>⌘K</kbd>
      </button>
      {sections
        .filter(([, list]) => list.length > 0)
        .map(([title, list]) => (
          <div key={title}>
            <p className="ed-panel-title rail-title">{title}</p>
            {list.map((type) => (
              <div
                key={type}
                className="palette-item"
                draggable
                onDragStart={startPaletteDrag(type)}
                onDragEnd={endDrag}
                onClick={() => insertFromPalette(type, true)}
                title="Click to insert, or drag onto the page"
              >
                <span className={`palette-icon pi-${type}`} aria-hidden="true" />
                <div>
                  <strong>{BLOCK_DEFS[type].label}</strong>
                  <span>{BLOCK_DEFS[type].hint}</span>
                </div>
              </div>
            ))}
          </div>
        ))}
      <button type="button" className="rail-all" onClick={onAll}>
        All blocks <kbd>⌘L</kbd>
      </button>
    </aside>
  )
}
