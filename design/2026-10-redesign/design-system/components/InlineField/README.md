# InlineField

Click-to-edit text or number. At rest it looks like plain text; hover shows a dashed well (`surface-hover` + `line-control`) so the user learns it is editable; editing swaps in `hb-inline-input` with an accent ring.

- Enter or blur saves, Escape cancels. No Edit buttons, no batch editing.
- Numbers (`hb-num`) are right-aligned and tabular.
- Empty optional values show `hb-inline--placeholder` ("Add a note…").
- Replaces the styling of `InlineField.tsx` and `InlineCategorySelect.tsx`; their logic stays.
