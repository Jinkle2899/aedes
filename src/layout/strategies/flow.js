/*
 * Flow strategy — document flow + the universal style panel. Wraps the existing
 * style.js so output is byte-identical to today. This is the default (and, for
 * now, only) strategy; `free`/`grid`/`flex` will be siblings behind computeStyle.
 */
import { blockStyleClass, blockStyleInline } from '../../editor/style.js'

export function flowStyle(node) {
  const st = (node.props && node.props.style) || {}
  return {
    className: blockStyleClass(st),
    style: blockStyleInline(st),
    dataAnim: st.anim || undefined,
    wrapperStyle: undefined, // flow adds no positioning to the node wrapper
    box: null, // free mode populates an explicit box
  }
}
