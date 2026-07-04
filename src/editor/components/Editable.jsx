/* Inline-editable text (contentEditable, commits on blur) */
export default function Editable({ tag: Tag = 'div', value, onCommit, className, disabled, singleLine = true }) {
  return (
    <Tag
      className={className}
      contentEditable={!disabled}
      suppressContentEditableWarning
      spellCheck={false}
      onBlur={(e) => onCommit(e.currentTarget.textContent)}
      onKeyDown={(e) => {
        if (singleLine && e.key === 'Enter') {
          e.preventDefault()
          e.currentTarget.blur()
        }
      }}
    >
      {value}
    </Tag>
  )
}
