import { useContext } from 'react'
import { EdCtx } from '../context.js'
import Editable from '../components/Editable.jsx'
import BlockBtn from '../components/BlockBtn.jsx'
import Freeform from '../../components/Freeform.jsx'
import { TabsBlock, AccordionBlock, CountdownBlock, RotatorBlock } from './interactive.jsx'
import { Children } from '../components/BlockNode.jsx'

/* The block renderers — the "published site" look. One switch, all types. */
export default function BlockContent({ block }) {
  const ed = useContext(EdCtx)
  const { preview, onProp } = ed
  const p = block.props
  const commit = (key) => (v) => onProp(block.id, { [key]: v })

  switch (block.type) {
    case 'section':
      return (
        <div
          className={`b-sec tone-${p.tone} pad-${p.pad}`}
          onDragOver={ed.overContainer(block.id, block.children.length)}
        >
          <Children blocks={block.children} parentId={block.id} emptyHint="Drop blocks into this section" />
        </div>
      )
    case 'columns':
      return (
        <div
          className="b-columns"
          style={{ gridTemplateColumns: `repeat(${block.children.length}, 1fr)` }}
        >
          {block.children.map((col) => (
            <div
              className="b-column"
              key={col.id}
              onDragOver={ed.overContainer(col.id, col.children.length)}
            >
              <Children blocks={col.children} parentId={col.id} emptyHint="Drop here" />
            </div>
          ))}
        </div>
      )
    case 'canvas':
      return <Freeform block={block} preview={preview} onProp={onProp} />
    case 'tabs':
      return <TabsBlock block={block} />
    case 'accordion':
      return <AccordionBlock block={block} />
    case 'countdown':
      return <CountdownBlock block={block} />
    case 'rotator':
      return <RotatorBlock block={block} />
    case 'stats':
      return (
        <div className="b-stats">
          {p.items.map((it, i) => (
            <div className="b-stat" key={i}>
              <Editable
                tag="strong"
                value={it.n}
                disabled={preview}
                onCommit={(v) => onProp(block.id, { items: p.items.map((x, j) => (j === i ? { ...x, n: v } : x)) })}
              />
              <Editable
                tag="span"
                value={it.l}
                disabled={preview}
                onCommit={(v) => onProp(block.id, { items: p.items.map((x, j) => (j === i ? { ...x, l: v } : x)) })}
              />
            </div>
          ))}
        </div>
      )
    case 'navbar':
      return (
        <div className="b-navbar">
          <Editable tag="strong" value={p.brand} onCommit={commit('brand')} disabled={preview} />
          <div className="b-nav-links">
            {p.links.map((l, i) => (
              <Editable
                key={i}
                tag="span"
                value={l}
                disabled={preview}
                onCommit={(v) => onProp(block.id, { links: p.links.map((x, j) => (j === i ? v : x)) })}
              />
            ))}
          </div>
          <BlockBtn p={p} className="b-btn-sm" />
        </div>
      )
    case 'quote':
      return (
        <div className="b-quote">
          <Editable tag="blockquote" value={p.text} onCommit={commit('text')} disabled={preview} singleLine={false} />
          <div className="b-quote-author">
            <Editable tag="strong" value={p.author} onCommit={commit('author')} disabled={preview} />
            <Editable tag="span" value={p.role} onCommit={commit('role')} disabled={preview} />
          </div>
        </div>
      )
    case 'form':
      return (
        <div className="b-form">
          <Editable tag="h2" value={p.heading} onCommit={commit('heading')} disabled={preview} />
          <Editable tag="p" className="b-form-sub" value={p.sub} onCommit={commit('sub')} disabled={preview} />
          <div className="b-form-fields">
            <input placeholder="Name" readOnly tabIndex={-1} />
            <input placeholder="Email" readOnly tabIndex={-1} />
            <textarea placeholder="Message" rows="4" readOnly tabIndex={-1} />
          </div>
          <BlockBtn p={p} />
        </div>
      )
    case 'spacer':
      return (
        <div className="b-spacer" style={{ height: p.height }}>
          {!preview && <span>Spacer · {p.height}px</span>}
        </div>
      )
    case 'footer':
      return (
        <div className="b-footer">
          <Editable tag="strong" value={p.brand} onCommit={commit('brand')} disabled={preview} />
          <div className="b-footer-links">
            {p.links.map((l, i) => (
              <Editable
                key={i}
                tag="span"
                value={l}
                disabled={preview}
                onCommit={(v) => onProp(block.id, { links: p.links.map((x, j) => (j === i ? v : x)) })}
              />
            ))}
          </div>
          <Editable tag="span" className="b-footer-note" value={p.note} onCommit={commit('note')} disabled={preview} />
        </div>
      )
    case 'hero':
      return (
        <div className={`b-hero align-${p.align} tone-${p.tone}`}>
          <Editable tag="h1" value={p.heading} onCommit={commit('heading')} disabled={preview} />
          <Editable tag="p" className="b-hero-sub" value={p.sub} onCommit={commit('sub')} disabled={preview} />
          <BlockBtn p={p} />
        </div>
      )
    case 'text':
      return (
        <div className="b-text">
          <Editable tag="h2" value={p.heading} onCommit={commit('heading')} disabled={preview} />
          <Editable tag="p" value={p.body} onCommit={commit('body')} disabled={preview} singleLine={false} />
        </div>
      )
    case 'image':
      return (
        <div className="b-image">
          <div className={`b-img-ph ratio-${p.ratio}`}>
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <circle cx="9" cy="10" r="2" />
              <path d="M3 17l5-4 4 3 5-5 4 4" />
            </svg>
          </div>
          <Editable tag="p" className="b-caption" value={p.caption} onCommit={commit('caption')} disabled={preview} />
        </div>
      )
    case 'gallery':
      return (
        <div className="b-gallery">
          <Editable tag="h3" value={p.caption} onCommit={commit('caption')} disabled={preview} />
          <div className="b-gallery-grid">
            {[0, 1, 2].map((i) => (
              <div className="b-img-ph" key={i} />
            ))}
          </div>
        </div>
      )
    case 'features':
      return (
        <div className="b-features">
          {p.items.map((it, i) => (
            <div className="b-feature" key={i}>
              <span className="b-feature-dot" />
              <Editable
                tag="h4"
                value={it.t}
                disabled={preview}
                onCommit={(v) => onProp(block.id, { items: p.items.map((x, j) => (j === i ? { ...x, t: v } : x)) })}
              />
              <Editable
                tag="p"
                value={it.d}
                disabled={preview}
                singleLine={false}
                onCommit={(v) => onProp(block.id, { items: p.items.map((x, j) => (j === i ? { ...x, d: v } : x)) })}
              />
            </div>
          ))}
        </div>
      )
    case 'cta':
      return (
        <div className="b-cta">
          <Editable tag="h2" value={p.heading} onCommit={commit('heading')} disabled={preview} />
          <BlockBtn p={p} className="invert" />
        </div>
      )
    default:
      return null
  }
}
