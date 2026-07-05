/*
 * Layout engine (pure). computeStyle(node, ctx) resolves the parent's layout
 * mode and delegates to that strategy, returning a ComputedStyle the renderer
 * consumes: { className, style, dataAnim, box }.
 *
 * ctx = { parentMode, breakpoint }
 *   parentMode — the container's mode; decides which strategy positions the child.
 *   breakpoint — wired now (from the device toggle) but inert in flow; responsive
 *                overrides will consume it in a later increment.
 */
import { flowStyle } from './strategies/flow.js'

const STRATEGIES = {
  flow: flowStyle,
  // free:  freeStyle,   // added in a later increment
  // grid:  gridStyle,
  // flex:  flexStyle,
}

export function computeStyle(node, ctx = {}) {
  const mode = ctx.parentMode || 'flow'
  const strategy = STRATEGIES[mode] || flowStyle
  return strategy(node, ctx)
}

export { getMode } from './mode.js'
