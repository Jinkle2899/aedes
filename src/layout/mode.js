/*
 * Layout mode of a container node. A container's mode decides how its children
 * are arranged and what their per-child `layout` data means. Absent ⇒ 'flow'
 * (document flow — today's behavior). `free`/`grid`/`flex` arrive as strategies.
 */
export function getMode(node) {
  return (node && node.layout && node.layout.mode) || 'flow'
}
