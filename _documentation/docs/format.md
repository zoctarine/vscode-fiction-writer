# Document Formatting

!!! setting "`fictionWriter.textFormatting.enabled`"

Enables all document formatting features.

!!! danger "Experimental"
    This is an experimental feature. It works by changing text in your document.
    Make sure you make a backup of your document before enabling this, or use
    is on drafts and test documents only.


## Remove extra spaces

!!! setting "`fictionWriter.textFormatting.removeExtraSpaces`"

Removes multiple spaces (not at beginning or ending of lines), with one space.

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

!!! setting "`fictionWriter.textFormatting.removeTrailingSpaces`"

Removes all whitespace characters from line ends.

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

??? setting "`fictionWriter.textFormatting.fixParagraphBreaks`"
 
    - `none` **default**
    - `Soft line-breaks As New Paragraph`
    - `Soft line-breaks In Same Paragraph`
    - `One Sentence Per Line`

Converts soft and hard breaks, depending on the selected behaviour:

### Soft line-breaks As New Paragraph

- combines soft breaks from same paragraph into one line. (joins multi-line paragraphs)

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

### Soft line-breaks In Same Paragraph

- Converts soft line-breaks to hard line-breaks. The result is having an extra empty before each soft break. (multiple paragraphs)

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


### One Sentence Per Line

This is a technique used by some writers. It consists of writing each sentence from the same paragraph on a new line. Paragraphs are still marked with an empty line.

If enabled, this setting does the following:
- Splits each line in sentences (using the boundary characters: `.` `!` `?` `;` `:`)
- Adds every sentence on a new line.
- Keeps spacing between paragraphs.

=== "Before"

    ``` md
    # Using one sentence per line

    This means, each sentence. If in the same paragraph. Uses a soft line break.
    Already separated sentences, will remain as they are.

    Paragraph breaks are also kept. This is it.
    ```

=== "After"

    ``` md
    # Using one sentence per line

    This means, each sentence.
    If in the same paragraph.
    Uses a soft line break.
    Already separated sentences, will remain as they are.

    Paragraph breaks are also kept.
    This is it.
    ```

## Fix Paragraph Spacing

!!! setting "`fictionWriter.textFormatting.fixParagraphSpacing`"

Normalizes space between different paragraph types (header, body, dialogue, ...) by adding a new line if needed.

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

!!! setting "`fictionWriter.textFormatting.removeExtraLines`"

Reduces multiple empty lines (more than two), to a single empty line.

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

!!! setting "`fictionWriter.textFormatting.fixMismatchDialogueMarkers`"

If the currently selected dialogue marker is not quotes, then it replaces all known dialogue markers (not quotes) with the selected one.

=== "Before"

    ``` md
    -- This text has mixed dialogue markers.

    --Some are without space.

    --- Yes, it has quite a lot.

    — It can be fixed.
    ```

=== "After"

    ``` md
    — This text has mixed dialogue markers.

    — Some are without space.

    — Yes, it has quite a lot.

    — It can be fixed.
    ```


## Fix Dialogue Indents

!!! setting "`fictionWriter.textFormatting.fixDialogueIndents`"

Replaces all dialogue indents (visible if one sentence per line technique is used) with the currently selected dialogue indent.

This works only if  `fictionWriter.editDialogue.marker`is not `quotes`, and `fictionWriter.editDialogue.sentenceIndent` is greater than 0, or `fictionWriter.editDialogue.sentenceIndentAutoDetect` is enabled

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
