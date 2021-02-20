
This extension has the following settings:

| Setting | Default | Description|
|:----------------------------------- |:---------:|:------------|
| `edit.disableKeybindings` | false | Disable editor keybindings added by this extension (`enter`, `shift+enter`, `delete`, `backspace`, `tab`). **Note:** If `disabled`, some of the settings will not work. | 
| `edit.easyParagraphCreation` | Shift+Enter | A new paragraph (two line breaks) will be created when pressing: | 
| `editDialogue.marker` | --  | Controls what punctuation is used when dialogue. | 
| `editDialogue.markerAutoReplace` | true | If anything other than `quotes` is selected, it automatically replaces the `-- ` text at the begining of a new line, with the selected marker. | 
| `editDialogue.sentenceIndent` | 3 | Indent for sequential lines of the same dialogue paragraph. (`0` for no indenting) | 
| `editDialogue.sentenceIndentAutoDetect` | true | Sets the line indent from the same dialogue paragraph equal with the selected `markdown-fiction-writer.editDialogue.marker`. | 
| `view.wordWrapIndent` | 0 | The hanging indent of wrapped lines. **Warning:** Only works if `editor.wordWrap` is enabled, and might change the `editor.tabSize` setting for `markdown`._ | 
| `view.foldParagraphLines` | true | undefined | 
| `export.outputFormat.default` | odt | The output document format. **Important:** This requires having [Pandoc](https://pandoc.org/installing.html) installed on your system, and available to be run from commandline. | 
| `export.outputFormat.alwaysShowFormatPicker` | false | Select the output format each time an export command is run. If set to `false`, the selected `markdown-fiction-writer.export.outputFormat.default` will be used. | 
| `export.showSaveDialogue` | Always | Control when the Save File Dialogue is shown. | 
| `export.outputTemplate.enabled` | false | If enabled, the template file selected at `markdown-fiction-writer.export.outputTemplate.file` will be used when exporting to `docx` or `odt` formats. | 
| `export.outputTemplate.file` |  | The output template to be used when exporting to `docx` or `odt`. **Note:** the template file extension must match the output type. It can be an absolut path, or relative to exported document. | 
| `export.tocFilename` | toc.md | The filename compiled by **Compile TOC command.**. | 
| `export.smartDeshes` | true | Converts `--` to `em-dash` (—) character in exported output. If not selected, it will default to `en-dash` (–). Is PanDoc `+old_dashes` markdown extension. | 
| `export.skipCodeComments` | true | When parsing `.md` files, skips lines starting with `//`.  | 
| `textFormatting.enabled` | true | This is feature is **EXPERIMENTAL**. Make sure make a backup before trying it out. If enabled, it formats document using the selected formatters. Formatting is available with `Format Document` command | 
| `textFormatting.fixMismatchDialogueMarkers` | true | If `markdown-fiction-writer.editDialogue.marker` is not quotes, replaces mismatched markers with current selected marker. | 
| `textFormatting.fixDialogueIndents` | true | If `markdown-fiction-writer.editDialogue.marker` is not quotes, and `markdown-fiction-writer.editDialogue.sentenceIndent` is enabled, reformats dialogue indents to selected dialogue indent. | 
| `textFormatting.fixParagraphSpacing` | true | Normalizes space between different paragraph types (header, body, dialogue, ...). | 
| `textFormatting.removeExtraSpaces` | true | Replaces multiple consecutive spaces to one single space. (not from begining or ending of line) | 
| `textFormatting.removeExtraLines` | true | Reduces multiple empty lines (more than two), to a single empty line. | 
| `textFormatting.removeTrailingSpaces` | true | Remove all whitespace characters from line ends. | 
| `textFormatting.fixParagraphBreaks` | none | Controls how paragraph breaks and soft line breaks will be formatted. | 
| `view.writingMode.theme` |  | The theme to be used in Writing Mode. _(leave empty for no theme switch)_ | 
| `view.writingMode.fontSize` | 16 | The font size to be used in Writing Mode Mode. | 
| `view.statusBar.enabled` | true | If enabled, the custom Fiction Writer status bar will be visible | 
| `view.fileTags.enabled` | false | If enabled, reads tags from `.md` files and display corresponding badge in file explorer. Recognizes tags defined under `markdown-fiction-writer.view.fileTags.definitions` | 
| `view.fileTags.definitions` | undefined | Custom file tags. Add the tag (`item`) on the first line of a .md file, like this: `// draft`, and you will see the `value` as a badge in file explorer. **Note:** the badges should be only 1 or 2 characters long (the others will be ignored), and tag names are case sensitive | 
| `view.highlight.textBetweenQuotes` | false | Highlights all text between quotes. Usefull for highlighting dialogues (if quoted syntax is used) | 
| `view.highlight.dialogueMarkers` | true | Highlights the dialogue markers (---, --, — or quote marks symbols). | 


*[View: Highlight Dialogu]: markdown-fiction-writer.view.highlightDialogue
*[View: Highlight Dialogue Markers]: markdown-fiction-writer.view.highlightDialogueMarkers 
*[View: File Tags Enabled]: markdown-fiction-writer.view.fileTagsEnabled
*[View: File Tags]: markdown-fiction-writer.view.fileTags
*[General: New Paragraph Handling]: markdown-fiction-writer.general.new-paragraph-handling
*[Edit: Disable KeyBindings]: markdown-fiction-writer.edit.disableKeybindings
*[Edit: Dialogue Marker]: markdown-fiction-writer.edit.dialogueMarker
*[Edit: Dialogue Marker AutoReplace]: markdown-fiction-writer.edit.dialogueMarkerAutoReplace
*[Edit: Dialogue Indent]: markdown-fiction-writer.edit.dialogueIndent
*[Edit: Dialogue Indent Auto Detect]: markdown-fiction-writer.edit.dialogueIndentAutoDetect
*[Edit: Typewriter Mode ]: markdown-fiction-writer.edit.typewriterMode
*[View: Word Wrap Indent]: markdown-fiction-writer.view.wordWrapIndent
*[View: Fold Paragraph Sentences]: markdown-fiction-writer.view.foldSentences
*[Format: Enable Document Formatting]:markdown-fiction-writer.format.enableDocumentFormatting
*[Format: Backup Before Each Format]:markdown-fiction-writer.format.backupBeforeEachFormat
*[Format: Fix Mismatch Dialogue Markers]:markdown-fiction-writer.format.fixMismatchDialogueMarkers
*[Format: Fix Dialogue Indents]:markdown-fiction-writer.format.fixDialogueIndents
*[Format: Fix Paragraph Spacings]:markdown-fiction-writer.format.fixParagraphSpacing
*[Format: Remove Extra Spaces]:markdown-fiction-writer.format.removeExtraSpaces
*[Format: Remove Trailing Spaces]:markdown-fiction-writer.format.removeTrailingSpaces
*[Format: Remove Extra Lines]:markdown-fiction-writer.format.removeExtraLines
*[Format: Fix Paragraph Breaks]:markdown-fiction-writer.format.fixParagraphBreaks
*[Export: Output Format]: markdown-fiction-writer.export.outputFormat
*[Export: Show Format Picker]: markdown-fiction-writer.export.showFormatPicker
*[Export: Use Template File]: markdown-fiction-writer.export.useTemplateFile
*[Export: Template File]: markdown-fiction-writer.export.templateFile
*[Export: Smart Dashes]: markdown-fiction-writer.export.smartDeshes
*[Export: Skip Comments from TOC]: markdown-fiction-writer.export.skipCommentsFromToc
*[Export: Show Save Dialogue]: markdown-fiction-writer.export.showSaveDialogue
*[Export: TOC Filename]: markdown-fiction-writer.export.tocFilename