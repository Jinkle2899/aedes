/* Universal block style → wrapper class + inline styles */

export function blockStyleClass(st) {
  return [
    'blk',
    st.bg ? 'has-bg' : '',
    st.color ? 'has-color' : '',
    st.align ? `align-${st.align[0]}` : '',
    st.pad && st.pad !== 'md' ? `pad-${st.pad}` : '',
    st.width === 'narrow' ? 'w-narrow' : st.width === 'full' ? 'w-full' : '',
    st.border ? `br-${st.border}` : '',
    st.radius ? `rad-${st.radius}` : '',
    st.shadow ? `sh-${st.shadow}` : '',
    st.gap ? `gap-${st.gap}` : '',
  ]
    .filter(Boolean)
    .join(' ')
}

export function blockStyleInline(st) {
  const s = {}
  if (st.bg) s.backgroundColor = st.bg
  if (st.color) s.color = st.color
  if (st.size === 's') s.zoom = 0.88
  if (st.size === 'l') s.zoom = 1.15
  return s
}
