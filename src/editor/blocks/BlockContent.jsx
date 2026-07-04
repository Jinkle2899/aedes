import { RENDERERS } from '../../blocks/views/index.jsx'

/*
 * Thin dispatcher: every block type renders through its registered view
 * (src/blocks/views). Replaces the former one-switch-all-types component.
 */
export default function BlockContent({ block }) {
  const View = RENDERERS[block.type]
  return View ? <View block={block} /> : null
}
