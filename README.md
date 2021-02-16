# Markdown Fiction Writer <!-- omit in toc -->

[![](https://vsmarketplacebadge.apphb.com/version-short/vsc-zoctarine.markdown-fiction-writer.svg)](https://marketplace.visualstudio.com/items?itemName=vsc-zoctarine.markdown-fiction-writer)

A [vscode](https://code.visualstudio.com) extension for writing fiction using [markdown](https://daringfireball.net/projects/markdown/).

Some tools I wrote for helping with writing fiction (novels/short stories) using markdown.

> ⚠ **Warning:** This extension is in early development phase. Use only for testing purposes.

## Features

- Enhanced text editing:
  - automatically insert new paragraph at Enter, or Shift+Enter

    ![](https://raw.githubusercontent.com/zoctarine/vscode-fiction-writer/gh-pages-source-material/docs/features/img/shift_enter_01.gif)

    ![](https://raw.githubusercontent.com/zoctarine/vscode-fiction-writer/gh-pages-source-material/docs/features/img/shift_enter_02.gif)

  - solutions for writing dialogue using dialogue markers (like in some non-english languages), using either em-dash (—) or other marks.

    ![](https://raw.githubusercontent.com/zoctarine/vscode-fiction-writer/gh-pages-source-material/docs/features/img/dlg_marker_01.gif)

    ![](https://raw.githubusercontent.com/zoctarine/vscode-fiction-writer/gh-pages-source-material/docs/features/img/dlg_marker_02.gif)

    ![](https://raw.githubusercontent.com/zoctarine/vscode-fiction-writer/gh-pages-source-material/docs/features/img/dlg_marker_03.gif)

  - typewriter mode

- Export/Combine files

  - combine multiple .md files into one single file

  - export md, or collection of files, to other formats (uses `pandoc`)

    ![](https://raw.githubusercontent.com/zoctarine/vscode-fiction-writer/gh-pages-source-material/docs/features/img/export_01.gif)

- Analyze text

  - count words, phrases, visualize repetitions

    ![](https://raw.githubusercontent.com/zoctarine/vscode-fiction-writer/gh-pages-source-material/docs/features/img/freq_01.gif)

    ![](https://raw.githubusercontent.com/zoctarine/vscode-fiction-writer/gh-pages-source-material/docs/features/img/stats_01.gif)


- Text formatting
  - cleaning up spaces
  - fixing dialogue lines, indents
  - fixing paragraph spaces (add/remove empty lines)
  - remove trailing spaces

- View
  - add tag to files in File Explorer
  
    ![](https://raw.githubusercontent.com/zoctarine/vscode-fiction-writer/gh-pages-source-material/docs/features/img/tags_01.gif)

- fold paragraph lines

    ![](https://raw.githubusercontent.com/zoctarine/vscode-fiction-writer/gh-pages-source-material/docs/features/img/folding_01.gif)

All features are detailed here: [**Full Documentation**](https://zoctarine.github.io/vscode-fiction-writer/)

## Known Issues

As this plugin rebinds some keys, like:<kbd>enter</kbd>, <kbd>shift</kbd>+<kbd>enter</kbd>, <kbd>delete</kbd>, <kbd>tab</kbd>, <kbd>backspace</kbd>, it can interfear with other extensions that also overwrite this keybindings.

Consider inspecting and rebinding some of them, as described here: [Key Bindings for Visual Studio Code](https://code.visualstudio.com/docs/getstarted/keybindings)

## Contributing

- File bugs, feature requests in [GitHub Issues](https://github.com/zoctarine/vscode-fiction-writer/issues).

## Release Notes

The current version is an **early draft** implementation. Features are still missing, and not all fetures are thoroguhly tested. I test/fix them as I write my novel.

The code is not refined and needs refactoring.

[View Changelog](https://zoctarine.github.io/vscode-fiction-writer/changelog/)

-----------------------------------------------------------------------------------------------------------

## For more information

* [Full Documentation](https://zoctarine.github.io/vscode-fiction-writer/)
* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**

