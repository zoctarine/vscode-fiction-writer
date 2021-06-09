# Markdown Fiction Writer <!-- omit in toc -->

[![](https://vsmarketplacebadge.apphb.com/version-short/vsc-zoctarine.markdown-fiction-writer.svg)](https://marketplace.visualstudio.com/items?itemName=vsc-zoctarine.markdown-fiction-writer)

![LOGO](https://raw.githubusercontent.com/zoctarine/vscode-fiction-writer/main/resources/fiction-writer-icon.png)

A [vscode extension](https://marketplace.visualstudio.com/items?itemName=vsc-zoctarine.markdown-fiction-writer) for writers.

Some tools I wrote for writing, organizing and exporting fiction (short stories, novels) using [markdown](https://daringfireball.net/projects/markdown/).

> ⚠ **Warning:** This extension is soon entering the be Beta phase. This means, a major restructuring of settings and features will follow. Please make sure to remember/backup you settings if you want to reuse them with the newer version.

## Features

This is a quick overview of the main features. Please read the [Full Documentation](https://zoctarine.github.io/vscode-fiction-writer/) to find out more about this extension.

- **Enhanced text editing**:
  - automatically insert new paragraph on ++enter++, or ++shift+enter++
  - solutions for writing dialogue using dialogue markers (like in some non-english languages), using either `em-dash` (—) or other marks.
  - autoreplace `-- ` with **—**
  - solutions for writing dialogue using dialogue markers (like in some non-english languages), using either em-dash (—) or other marks.

  - [more details](https://zoctarine.github.io/vscode-fiction-writer/edit/)

    ![](https://raw.githubusercontent.com/zoctarine/vscode-fiction-writer/gh-pages-source-material/docs/img/shift_enter_01.gif)

    ![](https://raw.githubusercontent.com/zoctarine/vscode-fiction-writer/gh-pages-source-material/docs/img/shift_enter_02.gif)

    ![](https://raw.githubusercontent.com/zoctarine/vscode-fiction-writer/gh-pages-source-material/docs/img/dlg_marker_01.gif)

    ![](https://raw.githubusercontent.com/zoctarine/vscode-fiction-writer/gh-pages-source-material/docs/img/dlg_marker_02.gif)

    ![](https://raw.githubusercontent.com/zoctarine/vscode-fiction-writer/gh-pages-source-material/docs/img/dlg_marker_03.gif)

- **Export/Combine files**

  - combine multiple `.md` files into one single file.

  - export `.md` to other formats (like `.doc` or `.docx`)

    - uses [pandoc](https://pandoc.org/installing.html)

  - [more details](https://zoctarine.github.io/vscode-fiction-writer/export/)

    ![](https://raw.githubusercontent.com/zoctarine/vscode-fiction-writer/gh-pages-source-material/docs/img/export_01.gif)

- **Split files**
   - easily split large `.md` files into one multiple documents.
   
   ![](https://zoctarine.github.io/vscode-fiction-writer/img/split_file_01.gif)

  - [more details](https://zoctarine.github.io/vscode-fiction-writer/split/)

- **Use metadata to categorize text**

  - Parse yaml metadata (either in document or as external `.md.yml.` file)

    ![](https://zoctarine.github.io/vscode-fiction-writer/img/meta_view_02.jpg)

    - (1): The yaml metadata block. The first thing in the document.
    - (2): The Metadata tree view. Parses the metadata block.
    - (3), (4): Assigned keyword colors and badges

    ![](https://raw.githubusercontent.com/zoctarine/vscode-fiction-writer/gh-pages-source-material/docs/img/meta_view_01.gif)

  - [more details](https://zoctarine.github.io/vscode-fiction-writer/metadata/)

- **Analyze text**

  - count words, phrases, standard pages
  - view word/phrase repetitions

  - [more details](https://zoctarine.github.io/vscode-fiction-writer/stats/)

    ![](https://raw.githubusercontent.com/zoctarine/vscode-fiction-writer/gh-pages-source-material/docs/img/freq_01.gif)

    ![](https://raw.githubusercontent.com/zoctarine/vscode-fiction-writer/gh-pages-source-material/docs/img/stats_01.gif)

- **Text formatting**

  - cleaning up spaces
  - fixing dialogue lines, indents
  - fixing paragraph spaces (add/remove empty lines)
  - remove trailing spaces
  - [more details](https://zoctarine.github.io/vscode-fiction-writer/format/)

- **Take Quick Notes**

  - take short notes and associate them with markdown (`.md`) files.

    ![](https://raw.githubusercontent.com/zoctarine/vscode-fiction-writer/gh-pages-source-material/docs/img/notes_01.gif)

  - [more details](https://zoctarine.github.io/vscode-fiction-writer/notes/)

- **View**

  - writing mode: quickly toggle font size, theme, zenMode and focusMode

    ![](https://raw.githubusercontent.com/zoctarine/vscode-fiction-writer/gh-pages-source-material/docs/img/wmode_toggle_01.gif)

  - fold paragraph lines

    ![](https://raw.githubusercontent.com/zoctarine/vscode-fiction-writer/gh-pages-source-material/docs/img/folding_01.gif)

  - status bar icons

    ![](https://raw.githubusercontent.com/zoctarine/vscode-fiction-writer/gh-pages-source-material/docs/img/statusbar_01.gif)

  - typewriter mode

  - [more details](https://zoctarine.github.io/vscode-fiction-writer/view/)

## Known Issues

As this plugin rebinds some keys, like:<kbd>enter</kbd>, <kbd>shift</kbd>+<kbd>enter</kbd>, <kbd>delete</kbd>, <kbd>tab</kbd>, <kbd>backspace</kbd>, it can interfear with other extensions that also overwrite this keybindings.

Consider inspecting and rebinding some of them, as described here: [Key Bindings for Visual Studio Code](https://code.visualstudio.com/docs/getstarted/keybindings)

## Contributing

- File bugs, feature requests in [GitHub Issues](https://github.com/zoctarine/vscode-fiction-writer/issues).

## Release Notes

The current version is an **early concept**. Features are still missing, and not all features are thoroughly tested, or have reached a stable version.

[View Changelog](https://zoctarine.github.io/vscode-fiction-writer/changelog/)

-----------------------------------------------------------------------------------------------------------

## For more information

* [Full Documentation](https://zoctarine.github.io/vscode-fiction-writer/)
* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**
