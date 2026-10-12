# Dialog

Modal on a plum scrim (`scrim`) with a display-face uppercase title, body text, optional list on `surface-sunken`, and actions bottom-right.

- The 3-way "used elsewhere" dialog keeps its exact choices: **Cancel / Create a copy of the item / Continue** (delete: Cancel / Keep in gearlists / Delete everywhere), and lists the affected gearlists. It is blocking and never replaced by a toast.
- Action buttons carry an icon AND their label: Create a copy `copy-plus`, Continue `check`, Delete everywhere `trash-2`, Keep in gearlists `archive`. In a blocking decision the words stay, the icon helps recognise the choice.
- Cancel is a ghost button pushed left (`hb-spacer`); the recommended action is primary; destructive is danger.
- `--wide` for "Add item to Gear Vault" and "Add gear to this gearlist". The add-item dialog does not close on a click outside.
