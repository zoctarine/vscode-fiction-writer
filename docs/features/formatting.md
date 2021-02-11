

## Enable Document Formatting

!!! danger "Experimental"
    This is an experimental feature. It works by changing text in your document. 
    Make sure you make a backup of your document before enabling this, or use
    is on drafts and test documents only.

- enables all document formatting features

- `markdown-fiction-writer.format.enableDocumentFormatting` is enabled

## Backup Before Each Format

- works if `markdown-fiction-writer.format.backupBeforeEachFormat` is enabled.

- because text formatting is under experimental use only, you can choose to create a backup of the file before each format operation.

- the file will be created under the `.fic` directory in your workspace, or, if no workspace is opened, then the `.fic` directory will be created in the same directory with your file.

```
my_writings/
├── .fic/
│   └── bk/
│       ├── my_file-63727312.md
│       ├── my_file-67823911.md
│       └── my_file-87238212.md
└── my_file.md
```
!!! warning "Clean Up"
    If you want to use this backup feature, don't forget to cleanup the `.fic/bk/` folder as, in time, it might grow in size.

## Remove extra spaces 

- works if `markdown-fiction-writer.format.removeExtraSpaces` is enabled

- Remove multiple spaces (not at beginning or ending of lines), with one space

    === "Before"

        ``` md
        This is   a  text with  a lot  ,  of spaces.
        On multiple  lines  .

            Indents   are not removed    !
        ```

    === "After"

        ``` md
        This is a text with a lot, of spaces.
        On multiple lines.

            Indents are not removed!
        ```

## Remove Trailing Spaces

- works if `markdown-fiction-writer.format.removeTrailingSpaces` is enabled

- remove all whitespace characters from line ends.

    === "Before"

        ``` md
        This is a text.   
        Having too much space at the end of each line.    
        ```

    === "After"

        ``` md
        This is a text.
        Having too much space at the end of each line.
        ```


## Fix Paragraph Breaks

- works if `markdown-fiction-writer.format.fixParagraphBreaks` has other selection than `none`


### softBreaksInSameParagraph

- combines consecutive lines not separated by an empty line, into the same line. (same paragraph)

    === "Before"

        ``` md
        This is a line
        with a soft linebreak.

        This is a new paragraph.
        With another line break.
        And another line break
        ```

    === "After"

        ``` md
        This is a line with a soft linebreak.

        This is a new paragraph. With another line break. And another line break
        ```


### softBreaksAsNewParagraphs

- Treat line breaks as new paragraph, inserting one empty line before each soft line break.

    === "Before"

        ``` md
        This is a line
        with a soft linebreak.

        This is a new paragraph.
        With another line break.
        And another line break
        ```

    === "After"

        ``` md
        This is a line
        
        with a soft linebreak.

        This is a new paragraph.

        With another line break.

        And another line break
        ```        


### oneSentencePerLine

- Splits each paragraph in sentences.
- Adds every sentence on a new line.
- Keeps spacing between paragraphs.
- Sentences are split by sentence boundaries defined under: `markdown-fiction-writer.format.oneSentencePerLine.sentenceBoundaries` (Default characters are: `.!?;:`)

    === "Before"

        ``` md
        # Using one sentence per line
        
        This means, each sentence. If in the same paragraph.
        Uses a soft line break.
        
        Paragraphs, are still separated: by one emtpy line; This is it
        ```

    === "After"

        ``` md
        # Using one sentence per line
        
        This means, each sentence.
        If in the same paragraph.
        Uses a soft line break.
        
        Paragraphs, are still separated:
        by one emtpy line;
        This is it
        ```

## Fix Paragraph Spacing

- works if `markdown-fiction-writer.format.fixParagraphSpacing` is enabled

- Normalizes space between different paragraph types (header, body, dialogue, ...) by adding a new line if needed

- Fix paragraph spacings

    === "Before"

        ``` md
        # This is a header
        And this is a first line. The second sentence is this.
                
        Then, a lot of empty lines here.
        ## This can be another header

        And a lot here.
        ***
        ```

    === "After"

        ``` md
        # This is a header

        And this is a first line. The second sentence is this.

        Then, a lot of empty lines here.
        
        ## This can be another header
        
        And a lot here.

        ***
        ```

## Remove Extra Lines

- works if `markdown-fiction-writer.format.removeExtraLines` is enabled

- reduce multiple empty lines (two or more) with one single line.

    === "Before"

        ``` md
        And this is a first line. The second sentence is this.
        
        
        
        Then, a lot of empty lines here.




        And a lot here.
        ***
        ```

    === "After"

        ``` md
        And this is a first line. The second sentence is this.

        Then, a lot of empty lines here.
        
        And a lot here.

        ***
        ```


## Fix Mismatch Dialogue Markers

- works if `markdown-fiction-writer.format.fixMismatchDialogueMarkers` is enabled.

- replaces all known dialogue markers with the currently selected one.

    === "Before"

        ``` md
        -- This text has mixed dialogue markers.

        --- Yes, it has quite a lot.

        — This all can be fixed.
        ```

    === "After"

        ``` md
        — This text has mixed dialogue markers.

        — Yes, it has quite a lot.

        — This all can be fixed.
        ```


## Fix Dialogue Indents

- works if `markdown-fiction-writer.format.fixDialogueIndents` is enabled.

- replaces all dialogue indents (visible if one sentence per line technique is used) with the currently selected dialogue indent.

    === "Before"

        ``` md
        This text has mixed dialogue indents.

        -- Sentences for same dialogue.
          Start at different indents.

        -- Yes, this can be quite annoing sometimes.
        Some start too early.
                   And some start too late.

        Of course, normal paragraphs are left untouched.
        ```

    === "After"

        ``` md
        This text has mixed dialogue indents.

        -- Sentences for same dialogue.
           Start at different indents.

        -- Yes, this can be quite annoing sometimes.
           Some start too early.
           And some start too late.

        Of course, normal paragraphs are left untouched.
        ```        