# Markdown Fiction Writer <!-- omit in toc -->

A [vscode](https://code.visualstudio.com) extension for writing fiction using [markdown](https://daringfireball.net/projects/markdown/).

Some tools I wrote for helping with writing fiction (novels/short stories) using markdown.

> ⚠ **Warning:** This extension is in early development phase. Use only for testing purposes.

## Features

- Enhanced text editing:
  - automatically insert new paragraph at Enter, or Shift+Enter
  - solutions for writing dialogue using dialogue markers (like in some non-english languages), using either em-dash (—) or other marks.
  - typewriter mode
  - fold paragraph lines

- Text formatting
  - cleaning up spaces
  - fixing dialogue lines, indents
  - fixing paragraph spaces (add/remove empty lines)
  - remove trailing spaces

- Export/Combine files
  - combine multiple .md files into one single file
  - export md, or collection of files, to other formats (uses `pandoc`)

- Analyze text
  - count words, phrases, visualize repetitions

All features are detailed here: [**Full Documentation**](https://zoctarine.github.io/vscode-fiction-writer/)

## Known Issues

As this plugin rebinds some keys, like:<kbd>enter</kbd>, <kbd>shift</kbd>+<kbd>enter</kbd>, <kbd>delete</kbd>, <kbd>tab</kbd>, <kbd>backspace</kbd>, it can interfear with other extensions that also overwrite this keybindings. 

Consider inspecting and rebinding some of them, as described here: [Key Bindings for Visual Studio Code](https://code.visualstudio.com/docs/getstarted/keybindings)

## Contributing

- File bugs, feature requests in [GitHub Issues](https://github.com/zoctarine/vscode-fiction-writer/issues).
  
## Release Notes

The current version is an **early draft** implementation. Features are still missing, and not all fetures are thoroguhly tested. I test/fix them as I write my novel.

The code is not refined and needs refactoring.


-----------------------------------------------------------------------------------------------------------

## For more information

* [Full Documentation](https://zoctarine.github.io/vscode-fiction-writer/)
* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**

