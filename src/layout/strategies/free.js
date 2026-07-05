/*
 * Free strategy — constraint-based absolute positioning inside a `free`
 * container. Positions are stored as PERCENTAGES of the parent (+ edge pins),
 * not raw pixels, so layouts survive responsive (see freeform analysis).
 *
 * A child's constraints live at node.layout.free:
 *   { left?, top?, right?, bottom?, width?, height?, z? }   // numbers = %
 * Which of left/right (and top/bottom) are set determines the pins.
 */
import { blockStyleClass, blockStyleInline } from '../../editor/style.js'

const pct = (v) => (v == null ? undefined : `${v}%`)

export function freeStyle(node) {
  const st = (node.props && node.props.style) || {}
  const f = (node.layout && node.layout.free) || {}

  const wrapperStyle = {
    position: 'absolute',
    left: pct(f.left),
    right: pct(f.right),
    top: pct(f.top),
    bottom: pct(f.bottom),
    width: pct(f.width),
    height: pct(f.height),
    zIndex: f.z,
  }
  Object.keys(wrapperStyle).forEach((k) => wrapperStyle[k] === undefined && delete wrapperStyle[k])

  return {
    className: blockStyleClass(st),
    style: blockStyleInline(st),
    dataAnim: st.anim || undefined,
    wrapperStyle,
    box: { xPct: f.left ?? null, yPct: f.top ?? null, wPct: f.width ?? null, hPct: f.height ?? null, z: f.z ?? 0 },
  }
}
