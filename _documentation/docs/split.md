**Fiction Writer** helps you work with large files by splitting then in single ones

![Split](img/split_file_01.gif)

There are several options for splitting files

- **Split Document Here (at line)**: will take everything from current line, to the end of the file and will move to another file
- **Split Document Here (at cursor)**: will take everithing from the cursor position, to the end of the file and will move it to another file
- **Move Selected Text to New Document**: will extract the selected text to a new file

## Naming

- When splitting, files will be named as follows:
- if there is no selected text, then the current document name will be taken, and an ending number will be added:
- Example: 
```
File: big_file.md
Becomes: big_file.md and big_file-1.md
If you continue splitting, the new files will be big_file-2.md, big_file-3.md, and so on...
```

- if you select a part of the text, that text will be the name of the new file:
- Example:
```
File: big_file.md
Selection: you select Chapter 1 text, and split
Becomes: big_file.md and chapter_1.md (as the name is taken from the selection)
```


!!! setting "Split Document: Switch To Newly Created Document`"
    - Key: `fictionWriter.splitDocument.switchToNewlyCreatedDocument`
    - After splitting a file, immediatly open the new file in the editor, and switch to it.
    - Default value: `enabled`


## Key Bindings
 - ++alt+k++ ++k++: Shows the split document dialogue
 - ++alt+k++ ++l++: Split document at line
 - ++alt+k++ ++x++: Move selected text to new document