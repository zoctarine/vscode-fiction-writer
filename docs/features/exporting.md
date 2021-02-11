
## Export


## Requirements

If you want to also compile `.md` to other document formats, you need to have `pandoc` installed. You can get it from here: [Installing pandoc](https://pandoc.org/installing.html).


## Including other documents


Compiles `toc.md` file from current directory.

If no `toc.md` file exists, it will show an error message.

The toc file can contain any markdown syntax. If you want to include a extenal file (relative to `toc.md` directory) surround the filename with `{}`.

Simple `toc.md` document:
```md
{chapter01.md}
{chapter02.md}
{chapter03.md}
{chapter04.md}
```

`toc.md` document containg additional markdown syntax:

``` markdown

# My Book Title

## Preface

Some opening words

## Chapter One

{chapter01.md}

## Chapter Tso
{chapter02.md}

## The End

This is the end.
```

The compiled output filename is `compiled.toc.[format]` (ex: `compiled.toc.odt` or `compiled.toc.epub`)

## Commands

### Compile Current File

### Compile All

Compiles all markdown documents (having `.md` extension) from current directory, into one file.

The include order is filename order.

**Example:** if `odt` output is selected, it produces `compiled.odt` file, in same directory

### Compile TOC

!!! note Test
    If there is a `toc.md` file in the same folder as the opened document, that file will be used. Othwrise, it will search in the workspace root.

    If no `toc.md` files is found in either location, then compile will fail.

**Example:**

    toc.md           # The toc.md in workspace root
    part1/
        chapter1.md
        chapter2.md
        chapter3.md
        toc.md       # The toc.md from part.1
    part2/
        chapter4.md
        chapter5.md
        chapter6.md

- if `chapter1.md` is opened, and **Compile toc.md** command is run, then `/part1/toc.md` will be used.
- if `chapter4.md` is opened, and **Compile toc.md** command is run, then `/toc.md` from workspace root will be used.

