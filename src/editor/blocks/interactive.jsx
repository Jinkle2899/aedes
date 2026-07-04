import { useContext, useEffect, useState } from 'react'
import { EdCtx } from '../context.js'
import Editable from '../components/Editable.jsx'

/* Stateful block renderers: tabs, accordion, countdown, animated text */

export function TabsBlock({ block }) {
  const ed = useContext(EdCtx)
  const p = block.props
  const [active, setActive] = useState(0)
  const i = Math.min(active, p.items.length - 1)
  const patchItem = (j, key) => (v) =>
    ed.onProp(block.id, { items: p.items.map((x, k) => (k === j ? { ...x, [key]: v } : x)) })
  return (
    <div className="b-tabs">
      <div className="b-tabs-bar">
        {p.items.map((it, j) => (
          <span
            key={j}
            className={`b-tab${j === i ? ' on' : ''}`}
            onClick={() => setActive(j)}
          >
            <Editable tag="span" value={it.t} disabled={ed.preview} onCommit={patchItem(j, 't')} />
          </span>
        ))}
      </div>
      <Editable
        tag="p"
        className="b-tabs-panel"
        value={p.items[i].d}
        disabled={ed.preview}
        singleLine={false}
        onCommit={patchItem(i, 'd')}
      />
    </div>
  )
}

export function AccordionBlock({ block }) {
  const ed = useContext(EdCtx)
  const p = block.props
  const [open, setOpen] = useState(0)
  const patchItem = (j, key) => (v) =>
    ed.onProp(block.id, { items: p.items.map((x, k) => (k === j ? { ...x, [key]: v } : x)) })
  return (
    <div className="b-acc">
      {p.items.map((it, j) => (
        <div className={`b-acc-item${open === j ? ' open' : ''}`} key={j}>
          <div className="b-acc-head" onClick={() => setOpen(open === j ? -1 : j)}>
            <Editable tag="span" value={it.q} disabled={ed.preview} onCommit={patchItem(j, 'q')} />
            <i>+</i>
          </div>
          {open === j && (
            <Editable
              tag="p"
              className="b-acc-body"
              value={it.a}
              disabled={ed.preview}
              singleLine={false}
              onCommit={patchItem(j, 'a')}
            />
          )}
        </div>
      ))}
    </div>
  )
}

export function CountdownBlock({ block }) {
  const ed = useContext(EdCtx)
  const p = block.props
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  const diff = Math.max(0, new Date(p.target).getTime() - now || 0)
  const units = [
    [Math.floor(diff / 864e5), 'days'],
    [Math.floor(diff / 36e5) % 24, 'hours'],
    [Math.floor(diff / 6e4) % 60, 'min'],
    [Math.floor(diff / 1000) % 60, 'sec'],
  ]
  return (
    <div className="b-count">
      <Editable
        tag="h2"
        value={p.heading}
        disabled={ed.preview}
        onCommit={(v) => ed.onProp(block.id, { heading: v })}
      />
      <div className="b-count-units">
        {units.map(([n, l]) => (
          <div className="b-count-unit" key={l}>
            <strong>{String(n).padStart(2, '0')}</strong>
            <span>{l}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function RotatorBlock({ block }) {
  const ed = useContext(EdCtx)
  const p = block.props
  const [wi, setWi] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setWi((i) => i + 1), 2200)
    return () => clearInterval(t)
  }, [])
  const word = p.words[wi % p.words.length] || ''
  return (
    <h2 className="b-rotator">
      <Editable
        tag="span"
        value={p.prefix}
        disabled={ed.preview}
        onCommit={(v) => ed.onProp(block.id, { prefix: v })}
      />{' '}
      <span className="b-rot-word" key={word}>{word}</span>
    </h2>
  )
}
