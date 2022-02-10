??? setting "Notes: Enabled"
    - Key: `config.fictionWriter.notes.enabled`
    - Enables/disables notes quick view.
    - Default: `enabled`

# Quick Document Notes

**Fiction Writer** supports showing/editing/saving of quick notes files from a `.txt` document.

![Notes view](img/notes_01.jpg)

- **(1)**: The `.md` and `.md.txt` file group.

- **(2)**: The **Notes** View for editing text notes.

- **(3)**: Open current file in Text Editor

- **(4)**: Pin current notes file (not changed when switching open document)

- **(5)**: Save changes to notes file

These files are intendend to keep short notes (thus the plain text `.txt` format) about specific `.md` files.

Matching between a fiction (`.md`) file and the (`.txt`) file is done by the same naming convention used for all related files:

_Related File must have the same name of the `.md` file (including the extension) + the specific file extension (in this case `.txt`. They also need to be in the same location_


=== "Recognized related notes files"

    ``` md
    .
    ├─ chapter01.md
    └─ chapter01.md.txt

    ```

=== "Not Recognized Notes files"

    ``` md
    .
    ├─ chapter01.md
    ├─ chapter01.txt        // missing .md
    └─ chapter01.md.txt     // missing 01
    ```

# The Notes View

*documentation coming soon...*

# Adding Document Notes

You can either manually create a file that follows the naming conventions described above, or use the _Create New Note File_ button

This will create a new note file for you, and will populate it with the default text set under **Notes: Default Text** section of the extension configuration. 

!!! setting "Notes: Default Text"
    - Key: `fictionWriter.notes.defaultText`
    - Default: `YOUR NOTES HERE`
    - As VS Code configuration does not support multiline text boxes, add each line as a new item in the `defaultText` array.

# Pin/UnPin notes

When switching documents, the **Notes View** also changes the displayed file.

If you want to always keep the same file in the **Notes View**, so you can quickly update/save the document notes, can _pin_ the file to this view, but selecting the _Pin_ icon.

Now, when you switch documents, the notes file will not be changed.

!!! note "Note"
    Modifying a pinned `.md.txt` file either in the active text editor, or in an external program, will result in the reloading of the **Notes View**. If you have changes in the view, you will be promted if you want to overwrite the notes.

# Save Notes

*documentation coming soon...*