import { Seg, SwatchRow } from './controls.jsx'
import { BG_SWATCHES, TEXT_SWATCHES } from '../constants.js'

/* ---------------- Style panel (universal, every block) ---------------- */
export default function StylePanel({ block, onProp }) {
  const st = block.props.style || {}
  const set = (patch) => {
    const next = { ...st, ...patch }
    Object.keys(next).forEach((k) => next[k] === undefined && delete next[k])
    onProp(block.id, { style: next })
  }
  const hasStyle = Object.keys(st).length > 0
  return (
    <div className="ins-style">
      <p className="ins-subhead">
        Style
        {hasStyle && (
          <button type="button" className="ins-reset" onClick={() => onProp(block.id, { style: {} })}>
            Reset
          </button>
        )}
      </p>
      <SwatchRow label="Background" value={st.bg} swatches={BG_SWATCHES} onChange={(bg) => set({ bg })} />
      <SwatchRow label="Text color" value={st.color} swatches={TEXT_SWATCHES} onChange={(color) => set({ color })} />
      <Seg
        label="Align"
        value={st.align}
        clearOn="auto"
        options={[['auto', 'auto'], ['left', 'left'], ['center', 'center'], ['right', 'right']]}
        onChange={(align) => set({ align })}
      />
      <Seg
        label="Vertical padding"
        value={st.pad}
        clearOn="md"
        options={[['none', '0'], ['sm', 'S'], ['md', 'M'], ['lg', 'L'], ['xl', 'XL']]}
        onChange={(pad) => set({ pad })}
      />
      <Seg
        label="Content width"
        value={st.width}
        clearOn="normal"
        options={[['narrow', 'narrow'], ['normal', 'normal'], ['full', 'full']]}
        onChange={(width) => set({ width })}
      />
      <Seg
        label="Size"
        value={st.size}
        clearOn="m"
        options={[['s', 'S'], ['m', 'M'], ['l', 'L']]}
        onChange={(size) => set({ size })}
      />
      <Seg
        label="Border"
        value={st.border}
        clearOn="none"
        options={[['none', 'none'], ['thin', 'thin'], ['thick', 'thick']]}
        onChange={(border) => set({ border })}
      />
      <Seg
        label="Corners"
        value={st.radius}
        clearOn="none"
        options={[['none', 'square'], ['md', 'rounded'], ['lg', 'extra']]}
        onChange={(radius) => set({ radius })}
      />
      <Seg
        label="Shadow"
        value={st.shadow}
        clearOn="none"
        options={[['none', 'none'], ['soft', 'soft'], ['lift', 'lift']]}
        onChange={(shadow) => set({ shadow })}
      />
      {['features', 'gallery', 'stats', 'columns', 'countdown'].includes(block.type) && (
        <Seg
          label="Inner gap"
          value={st.gap}
          clearOn="m"
          options={[['sm', 'S'], ['m', 'M'], ['lg', 'L']]}
          onChange={(gap) => set({ gap })}
        />
      )}
      <Seg
        label="Entrance (in preview)"
        value={st.anim}
        clearOn="none"
        options={[['none', 'none'], ['fade', 'fade'], ['rise', 'rise'], ['slide', 'slide'], ['zoom', 'zoom']]}
        onChange={(anim) => set({ anim })}
      />
    </div>
  )
}
