# Typewriter Mode


# File Tags

??? setting "Settings"
    `markdown-fiction-writer.view.fileTags`
    `markdown-fiction-writer.view.fileTagsEnabled`
    
Ability to add tags to files. Each file will display the corresponding badge (1 or 2 letter word) in file explorer:

![Tags 01](img/tags_01.gif)

- Go to: `markdown-fiction-writer.view.fileTags`
- Add a few tags (eg. `draft` = `D`, and `rev1` = `R1`)
- Then open any `.md` file, and add `// draft` or `// rev1` on **the first line**.
  - if the tag line is not on the first line of the file, the tag will be ignored
- Save the document.
- You should see `D` or `R1` as a badge in file explorer, near your document.

!!! warning "Under development"
    Tagging works for files in the same folder as opened file. 
    Soon will work on all opened files in the workspace.


# Fold Paragraph lines

??? setting "Setting"
    `markdown-fiction-writer.view.foldSentences`

Separate lines from same paragraph can be folded/unfolded. This is specailly useful when OneSentencePerLine writing technique is used.

![Folding 01](img/folding_01.gif)

Folding works for dialogue indents as well, if writing dialgoues with dialogue markers (like em-dash) is used:


# Syntax Highlighting

??? setting "Settings"
    `mmarkdown-fiction-writer.view.highlightDialogueMarkers`
    `markdown-fiction-writer.view.highlightDialogue`


# Word Wrap Indent

[tbd]
