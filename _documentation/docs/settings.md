
This extension has the following settings:

| Setting (prefixed by `fictionWriter.`) | Default | Description|
|:----------------------------------- |:---------:|:------------|
| `edit.disableKeybindings` | false | Disable editor keybindings added by this extension (`enter`, `shift+enter`, `delete`, `backspace`, `tab`).  **Note:** If `disabled`, some of the settings will not work.    [Open Online Documentation](https://zoctarine.github.io/vscode-fiction-writer/edit/) |
| `edit.easyParagraphCreation` | Shift+Enter | A new paragraph (two line breaks) will be created when pressing: |
| `editDialogue.marker` | --  | Controls what punctuation is used when dialogue. |
| `editDialogue.markerAutoReplace` | true | If anything other than `quotes` is selected, it automatically replaces the `-- ` text at the begining of a new line, with the selected marker. |
| `editDialogue.sentenceIndent` | 3 | Indent for sequential lines of the same dialogue paragraph. (`0` for no indenting) |
| `editDialogue.sentenceIndentAutoDetect` | true | Sets the line indent from the same dialogue paragraph equal with the selected `#editDialogue.marker#`. |
| `export.include.enabled` | true | If `enabled`, the `{DOCUMENT_ID}` or `{document/file/path/filename.md}` syntax can be used to include on `.md` file into another file |
| `export.include.searchDocumentIdsInAllOpenFilesAndWorkspaces` | false | When including files, search `{DOCUMENT_ID}` in all opened files and workspace folders. If `disabled`, it only searches in the workspace folder that the document belongs to. |
| `export.include.showsErrorInOutputFile` | true | Shows errors in compiled document. |
| `export.outputFormat.alwaysShowFormatPicker` | false | Select the output format each time an export command is run.  If set to `false`, the selected `#export.outputFormat.default#` will be used. |
| `export.outputFormat.default` | odt | The output document format.  **Important:** This requires having [Pandoc](https://pandoc.org/installing.html) installed on your system, and available to be run from commandline. |
| `export.outputTemplate.enabled` | false | If enabled, the template file selected at `#export.outputTemplate.file#` will be used when exporting to `docx` or `odt` formats. |
| `export.outputTemplate.file` |  | The output template to be used when exporting to `docx` or `odt`.  **Note:** the template file extension must match the output type. It can be an absolut path, or relative to exported document. |
| `export.showSaveDialogue` | Always | Control when the Save File Dialogue is shown. |
| `export.skipCodeComments` | true | When parsing `.md` files, skips lines starting with `//`.  |
| `export.smartDeshes` | true | Converts `--` to `em-dash` (—) character in exported output. If not selected, it will default to `en-dash` (–).  Is PanDoc `+old_dashes` markdown extension. |
| `export.tocFilename` | toc.md | The filename compiled by **Compile TOC command.**. |
| `metadata.categories.default` | tags | Assigning keywords to this category, if none is specified.  For example, if default category is `tags`, then the metadata block:  `---`  **`draft, ch1`**  `---`   is equivalent to:  `---`  _`tags`_`: `**`draft, ch1`**  `---` |
| `metadata.categories.icons` | [object Object] | Assign for each metadata category (**Item**) a vscode icon (**Value**)  _**Note:** You can use any icon from [Product Icon Reference](https://code.visualstudio.com/api/references/icons-in-labels#icon-listing)._ |
| `metadata.categories.showIcons` | true | Show icons in **Metadata** view. |
| `metadata.categories.showNames` | true | If `disabled`, it hides category name in **Metadata View** for 1st level categories only. |
| `metadata.categories.summaryEnabled` | true | If `enabled`, it will show the contents of the `summary` 1st level category in the _message_ section of the  **Metadata View**, and not in the tree itself.   To use it, simply define a metadata block:  `---`  **`summary: The document summary`**  `---` |
| `metadata.easyLists` | , | Metadata values separated by this string, will be treated as list items.  Enter the list item separator character below _(or leave it empty to disable this feature)_:  _**Example:** `item1, item2, item three` will be equivalent to `[item1, item2, item three]` if the separator is comma (`,`)._   |
| `metadata.enabled` | true | It enables metadata reltated features. If `disabled` then **all** metadata related featueres will be disabled (parsing, metadata view, colors, etc...).  [Open Online Documentation](https://zoctarine.github.io/vscode-fiction-writer/metadata/) |
| `metadata.keywords.badges` | [object Object] |  |
| `metadata.keywords.badgesCategory` |  | Uses only this category when resolving **Explorer** badges. _(leave empty to do a full metadata search)_  _**Note:** the `first matched keyword` in this category will dictate the badge._ |
| `metadata.keywords.badgesInFileExplorer` | true | Show [Keyword Badges](#metadata.keywords.badges) in **Explorer** view.   _**Note:** Only the first matched keyword will be considered._ |
| `metadata.keywords.colors` | [object Object] | Defines a keyword (**Item**) and associate a color (**Value**) to it. The colors can be visible in **Metadata** view or **Explorer** view. |
| `metadata.keywords.colorsCategory` |  | Uses only this category when resolving **Explorer** colors. _(leave empty to do a full metadata search)_  _**Note:** the `first matched keyword` in this category will dictate the color._ |
| `metadata.keywords.colorsInFileExplorer` | true | Use [Keyword Colors](#metadata.keywords.colors) in **Explorer** view.   _**Note:** Only the `first matched keyword` will be considered_  _**Note:** file colors can be ovewritten by other extensions, so they might not show as expected._  _**Also:** `#explorer.decorations.colors#` must be `enabled`._ |
| `metadata.keywords.colorsInMetadataView` | true | Use [Keyword Colors](#metadata.keywords.colors) as icon colors in **Metadata** view.  _**Note:** if no icon is set/visible, then the color will not be visible._ |
| `notes.defaultText` | Your Notes Here | The default text for all new note files.  Add each line as a new _item_. |
| `notes.enabled` | true | Enables the notes view, that recognizes (and groups) `.txt` files together with `.md` and metadata files.  [Open Online Documentation](https://zoctarine.github.io/vscode-fiction-writer/notes/) |
| `smartRename.enabled` | true | If enabled, allows ordering of files based on number prefix. |
| `smartRename.renameRelatedFiles` | Ask Every Time | If `enabled`, renames/moves related (`.yml` and `.md`) files together. |
| `textFormatting.enabled` | true | This is feature is **EXPERIMENTAL**. Make sure make a backup before trying it out.  If enabled, it formats document using the selected formatters. Formatting is available with `Format Document` command..  [Open Online Documentation](https://zoctarine.github.io/vscode-fiction-writer/format/ |
| `textFormatting.fixDialogueIndents` | true | If `#editDialogue.marker#` is not quotes, and `#editDialogue.sentenceIndent#` is enabled, reformats dialogue indents to selected dialogue indent. |
| `textFormatting.fixMismatchDialogueMarkers` | true | If `#editDialogue.marker#` is not quotes, replaces mismatched markers with current selected marker. |
| `textFormatting.fixParagraphBreaks` | none | Controls how paragraph breaks and soft line breaks will be formatted. |
| `textFormatting.fixParagraphSpacing` | true | Normalizes space between different paragraph types (header, body, dialogue, ...). |
| `textFormatting.removeExtraLines` | true | Reduces multiple empty lines (more than two), to a single empty line. |
| `textFormatting.removeExtraSpaces` | true | Replaces multiple consecutive spaces with one single space. (not from begining or ending of line) |
| `textFormatting.removeTrailingSpaces` | true | Remove all whitespace characters from line ends. |
| `view.fadeMetadata` | true | Fade markdown metadata section by 50%. |
| `view.foldParagraphLines` | true | Show folding marker for paragraphs with multiple lines. (soft-breaks) |
| `view.highlight.dialogueMarkers` | true | Highlights the dialogue markers (---, --, — or quote marks symbols). |
| `view.highlight.textBetweenQuotes` | false | Highlights all text between quotes. Usefull for highlighting dialogues (if quoted syntax is used) |
| `statusBar.enabled` | true | Show the custom Fiction Writer status bar. |
| `statusBar.items` | {} | Enable/disable items from Fiction Writer status Bar. |
| `view.wordWrapIndent` | 0 | The hanging indent of wrapped lines.  **Select:** - `0` for same indent as first line, - `-1` for now wrapping indent, - any other value for hanging indent.    _**Warning:** Only works if `#editor.wordWrap#` is enabled, and might change the `#editor.tabSize#` setting for `markdown`._ |
| `view.focusMode.opacity` | 0.5 | Opacity for fade out text when focus mode is enabled | 
| `writingMode.fontSize` | 16 | The font size to be used in Writing Mode Mode. |
| `writingMode.theme` |  | The theme to be used in Writing Mode. _(leave empty for no theme switch)_ | 
| `writingMode.toggleFocusMode` | true | When entering Writing Mode, it fades out all text except current text line (known as Focus Mode) | 
| `splitDocument.switchToNewlyCreatedDocument` | true | When splitting a document, immediately open (and switch to) the newly created doument in the text editor. |