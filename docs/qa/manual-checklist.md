# Aedes Manual QA Checklist

Use this after automated tests pass. These checks target visual, pixel-level, and animation behavior that is brittle to automate.

## Drag And Drop

- Drag each starter rail block into the root canvas; confirm drop-line placement matches the cursor.
- Drag a block above and below root siblings; confirm the handle, selected outline, and drop-line do not jump.
- Drag into a section and into each column; confirm empty-drop hints disappear after insertion.
- Try invalid drops, including a container into itself; confirm nothing breaks and selection remains sensible.

## Keyboard And Prediction

- With no text field focused, press `/`, `Cmd/Ctrl+K`, `Cmd/Ctrl+L`, and `Cmd/Ctrl+G`; confirm each palette opens and closes correctly.
- With an input or textarea focused, confirm slash and undo behave as native text editing.
- When the horizon ghost is visible, test `Tab`, left/right arrows, and `Esc`.
- Confirm gap seams can be dismissed and do not reappear immediately.

## Inspector

- Select each block type and scan that all schema fields render with correct defaults.
- Edit text, textarea, segmented controls, number fields, dates, arrays, and button controls.
- Change columns from 2 to 3 and back; confirm content from removed columns is merged into the last remaining column.
- Use breadcrumbs from a nested text block back to columns and section.

## Undo, Redo, Persistence

- Type quickly into one field, then undo once; confirm the whole typing burst is undone.
- Use duplicate, delete, move up/down, compose, and command palette insert; confirm undo/redo restores exact structure.
- Reload after edits and confirm localStorage persistence.
- Toggle preview, reload, and confirm edit state is not stuck in preview.

## Preview And Visual Polish

- Check desktop and mobile device toggles for clipped text, overlapping handles, and canvas width.
- Confirm preview hides editor chrome around blocks and disables inline editing.
- Check animations (`data-anim`) visually for blocks with animation styles.
- Publish and confirm the toast text is readable and disappears.

## Prioritized Run Order

1. Command bus undo/redo and command inverse tests. These protect every editor mutation.
2. Drag-and-drop insertion/reorder/nesting e2e checks. This is high-risk because it combines DOM geometry, command dispatch, and selection.
3. Keyboard shortcut and prediction tests. They are global event paths with lots of focus-state edge cases.
4. Inspector schema tests. They catch descriptor drift and broken user edits.
5. Registry, generator, projection, and layout unit tests. These are deterministic and should run on every change.
6. Manual visual QA for drop indicators, ghost behavior, and preview animation polish.
