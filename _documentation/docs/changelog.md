All notable changes to this project will be documented in this file.


## Unreleased 

**Added**

- Add `exclude` and `compile: false` support for metadata block so, a file can be exluded from the automatic compiled script [[#36]](https://github.com/zoctarine/vscode-fiction-writer/issues/36)

**Fixes**

- A bug that did not parse all nested indcluded files in compilation [[#38]](https://github.com/zoctarine/vscode-fiction-writer/issues/38)
- Fixed failing tests on Windows envirnoment

## 0.1.1 - pre-release 1 

!!! bug "Unstable warning"

    The pre-release versions are highly unstable at this moment, and for testing purposes only.
    Use the latest stable version ([0.0.55](#0055-alpha-55)). Some settings might not be backward compatile at this point.

**Added**

- Add `exclude` and `compile: false` support for metadata block so, a file can be exluded from the automatic compiled script [[#36]](https://github.com/zoctarine/vscode-fiction-writer/issues/36)
- Upgrade minimum supported version to `1.72`
- Support for [file nesting](https://code.visualstudio.com/updates/v1_64#_explorer-file-nesting). Adds `{"*.md": "${capture}.md.txt, ${capture}.md.yml"}` pattern to `explorer.fileNesting.patterns` in configuration defaults.

**Fixes**

- A bug that did not parse all nested indcluded files in compilation [[#38]](https://github.com/zoctarine/vscode-fiction-writer/issues/38)
- Some speed issues and loading times with the indexer
- Fixed failing tests on Windows envirnoment
- Fixed Linux/Windows Glob match pattern, on file indexer and metadata indexer

**Changed**

- Changed the build tool from `webpack` to `esbuild`
- Changed extension display name from **Markdown Fiction Writer** to **Fiction Writer** to accomodate future language support
- Changed settings prefix from `markdowon-fiction-writer.` to `fiction-writer`  [[#28]](https://github.com/zoctarine/vscode-fiction-writer/issues/28)

- **Settings**

    - Changed: `fictionWriter.statusBar.items` to be of type `object` with checkboxes
    - Changed settings from `application` scope to `window` scope so it can be configured per workspace as well:
        - `fictionWriter.editDialogue.marker`
        - `fictionWriter.export.outputTemplate.file`
        - `fictionWriter.export.outputTemplate.enabled`
        - `fictionWriter.export.tocFilename`
        - `fictionWriter.export.smartDeshes`
        - `fictionWriter.export.skipCodeComments`
        - `fictionWriter.textFormatting.*`
        - `fictionWriter.metadata.keywords.colors`
        - `fictionWriter.metadata.keywords.colorsCategory`
        - `fictionWriter.metadata.keywords.badgesCategory`
        - `fictionWriter.metadata.keywords.badges`
        - `fictionWriter.metadata.categories.icons`
        - `fictionWriter.metadata.categories.default`
        - `fictionWriter.notes.defaultText`

    
 

## 0.0.55 - alpha 5.5

**Added**

- Group Fiction writer context menu in Fiction Writer category on Explorer and on Editor
- Split File: [Possibility to split files in multiple files, or extract selected document](split.md)

**Fixes**
- Focus Mode now can highlight paragraph, or line (set up in settings) 

## 0.0.53 - alpha 5.3
- Status Bar: now has the possibility to show/hide specific buttons
- Writing Mode: `Select Writing Mode theme` command now previews the theme on changing selection with Up/Down arrow keys.
- **Settings**
    - Added: `markdown-fiction-writer.statusbar.items`
    - Added: `markdown-fiction-writer.splitDocument.switchToNewlyCreatedDocument`

**Changed**

- Settings moved: `markdown-fiction-writer.view.statusbar.*` to `markdown-fiction-writer.statusbar.*`.
- Don't show the `This Version Contains Breaking Changes..` notification message for minor alpha version changes.

**Fixed**

- Fixed a bug that did not always hide status bar when changing active editor to a non-markdown editor.

## 0.0.52 - alpha 5.2

**Added**

- Keybinding: ++ctrl+f11++ toggles both [ZenMode](https://code.visualstudio.com/docs/getstarted/tips-and-tricks#_zen-mode) and [Writing Mode](view.md#writer-mode)
- Focus Mode: fade out all text except current text line (not editor line)
- Command: `Select Writing Mode font size` now is accessible from command pallete.
- Command: `Select Writing Mode theme` shows a selection of all installed themes to choose from.
- Command: `Toggle Focus Mode` enables/disables focus mode
- **Settings**

    - `markdown-fiction-writer.view.focusMode.opacity`
    - `markdown-fiction-writer.writingMode.toggleFocusMode`

**Changed**

- Moved `markdown-fiction-writer.view.writingMode.*` settings under `markdown-fiction-writer.writingMode.*`

## 0.0.50 - alpha 5.0

**Added**

- Metadata: [support for `summary` category](metadata.md#known-metadata)
- Metadata: [support for external `.yml` metadata file](metadata.md#external-metadata)
- Metadata: new open file icon on **Metadata View**
- Metadata: **Explorer** view, various tooltip improvements (id, summary)
- Metadata: fade-out file decorations for additional files
- Notes: [added support for additional `.txt` file containing short notes](notes.md#quick-document-notes)
- Notes: [added webview for quickly editing/view-ing document related notes](notes.md#adding-document-notes)
- Smart Rename: add _Rename Related_ command to **Explorer** context
- Smart Rename: when renaming a file, can rename all related files (with same name)
- Statistics: [added reading speed estimation calculated at ~200 wpm](stats.md#get-writing-statistics)
- General: Optimizes file indexing, to reduce disk read calls
- **Settings**:

    - `markdown-fiction-writer.notes.enabled`
    - `mardkwon-fiction-writer.notes.defaultText`
    - `markdown-fiction-writer.smartRename.enabled`
    - `markdown-fiction-writer.smartRename.renameRelatedFiles`

**Changes**

- `_bk` folder now created under `.fic` folder
- Setting `markdown-fiction-writer.metadata.defaultCategory` becomes `markdown-fiction-writer.metadata.categories.default`
- Selecting an item in **Metadata View** does not immediately open file. The file can now be opened from the Open File icon in the view title bar
- Document Statistics: can be computed for any document, not only for `.md` files
- Hide unecessary commands from Command Pallete

**Fixes**

- Fix: markdown formatting now skips inline metadata blocks
- Fix: document statistics and repetitions now skips metada block
- Fix a bug on Linux, that prevented opening files in external editor
- Fix a performance issue when Document Statistics was loading even if view was not visible.
- Consistent name of _Writing Mode_ everywhere (some places still using the old _Enhanced Zen Mode_ naming)

## 0.0.50 - alpha 5

**Added**

- Vairous bug fixes and improvements
- Group Fiction writer context menu in Fiction Writer category on Explorer and on Editor
- Split File: [Possibility to split files in multiple files, or extract selected document](split.md)

**Fixes**
- Focus Mode now can highlight paragraph, or line (set up in settings) 

## 0.0.42 - alpha 4.2

**Added**

- Metadata: [recognize the `id` top level metadata field](metadata.md#known-metadata)
- Export: [possibility to disable _include files_ syntax](export.md#including-other-documents)
- Export: [possibility to add _include file_ errors in the exported document](export.md#include-errors)
- Export: files can be included either by [filename](export.md#include-by-aboslute-or-relative-path), or by [`metadata.id`](export.md#include-by-metadata-id) value
- Export: [can  now search for included files in all opened documents/workspaces](export.md#resolve-document-id)
- **Settings**:

    - `markdown-fiction-writer.export.include.enabled`
    - `markdown-fiction-writer.export.include.searchDocumentIdsInAllOpenFilesAndWorkspaces`
    - `markdown-fiction-writer.export.include.showsErrorInOutputFile`

**Fixed**

- Fix some typos in documentation
- Fix some configuration key descriptions
- Fix `debug` flag that was showing file cache debug view

## 0.0.35 - alpha 3.0

**Added**

- Metadata: now supports yaml markdown metadata support
- Metadata: new metadata tree view under explorer
- Metadata: file colors, badges are resolved using keywords
- Metadata: easy array parsing (add arrays without `[]`) for known categories
- **Settings**:

    - `markdown-fiction-writer.metadata.enabled`
    - `markdown-fiction-writer.metadata.categories`
    - `markdown-fiction-writer.metadata.categoryIconsEnabled`
    - `markdown-fiction-writer.metadata.defaultCategory`
    - `markdown-fiction-writer.metadata.keywords.badges`
    - `markdown-fiction-writer.metadata.keywords.badgeCategory`
    - `markdown-fiction-writer.metadata.keywords.badgesInFileExplorer`
    - `markdown-fiction-writer.metadata.keywords.colors`
    - `markdown-fiction-writer.metadata.keywords.colorCategory`
    - `markdown-fiction-writer.metadata.keywords.colorsInMetadataView`
    - `markdown-fiction-writer.metadata.keywords.colorsInFileExplorer`

**Changed**

- Updated extension icon (still work in progress)
- Update configuration setting descriptions (still work in progress)
- All main settings are now User settings (not workspace settings)
- various small fixes and bugs
- Writing Mode now is disabled when restarting editor (if closed with it enabled)
- **Statistics** view now auto-refreshes when changing text-editor is changed and on save
- fix Extension name Configuration Settings
- fix a bug where text formatting was ignoring heading

**Removed**

- **settings**:
  - `markdown-fiction-writer.view.fileTags.enabled` (replaced by `markdown.fiction-writer.metadata` features)
  - `markdown-fiction-writer.view.fileTags.definitions`

**Fixed**

- Fix disposables not disposed of properly
- Fix Document Statistics view  not refreshing on config change

## 0.0.23 - alpha 2.3

**Added**

- Writing mode
- Reorganizes settings (breaking change)

## 0.0.21 - alpha 2.1

**Added**

- View: Highlight dialogue markers
- View: Highlight quoted dialogue
- View: File Tags - add small 2 letter badges to files form current directory `markdown-fiction-writer.view.fileTags`
- Major Refactorings to Disposable usage
- **Settings**:
  - `markdown-fiction-writer.format.backupBeforeEachFormat` setting. It always asks before performing formatting.

## 0.0.17 - alpha 1.7

**Added**

- Export: Add SaveAs dialogue to export commands.
- Export: Add option to always show SaveAs dialgoue
- Export: Add option to change TOC filename
- Export: Show OpenFileDialogue when use template is enabled

## 0.0.11 - alpha 1.1

**Added**

- add writing statistics (word count, etc)

## 0.0.6 - alpha 0.6

**Added**

- add text analysis (word frequency count)

## 0.0.3 - alpha 0.3

**Added**

- add status bar buttons
- folding, unfolding of paragraph lines
- more support for one-sentence-per line

## 0.0.2 - alpha 0.2

**Added**

- add text formatting options
- add include `.md` file support using `{file.md}` syntax
- add syntax highlighting for included file

## 0.0.1 - alpha 0.1

**Added**

- add compile/export using `pandoc`
- supporting `em-dash` (—) dialogue markers
- new paragraph on ++shift+enter++
- support for one-sentence-per line

## Known issues

- As this plugin rebinds some keys, like:<kbd>enter</kbd>, <kbd>shift</kbd>+<kbd>enter</kbd>, <kbd>delete</kbd>, <kbd>tab</kbd>, <kbd>backspace</kbd>, it can interfere with other extensions that also overwrite this key bindings.

- Consider inspecting and rebinding some of them, as described here: [Key Bindings for Visual Studio Code](https://code.visualstudio.com/docs/getstarted/keybindings)