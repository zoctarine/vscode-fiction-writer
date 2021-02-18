import { DocumentFormattingEditProvider, languages, TextDocument, TextEdit, TextLine, window } from 'vscode';
import { Config } from '../config';
import { IObservable, Observer } from '../observable';
import { Constants, RegEx } from '../utils';
import * as fs from 'fs';
import * as path from 'path';


export class CustomFormattingProvider extends Observer<Config> implements DocumentFormattingEditProvider {

  constructor(observable: IObservable<Config>) {
    super(observable);
    this.tryRegisterFormatProvider();
  }

  protected onStateChange(newState: Config): void {
    super.onStateChange(newState);
    this.tryRegisterFormatProvider();
  }

  private tryRegisterFormatProvider() {
    this.clearDisposable('FP');

    if (this.state.formattingIsEnabled) {
      this.addDisposable(languages.registerDocumentFormattingEditProvider('markdown', this), 'FP');
    }
  }

  backupOriginal(document: TextDocument) {
    try {
      const parsed = path.parse(document.fileName);
      const outputDir = path.join(parsed.dir, Constants.Format.BACKUP_DIR);
      const outputFile = path.join(outputDir, `${parsed.name}_${Date.now()}.${parsed.ext}`);

      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
      }
      fs.writeFileSync(outputFile, document.getText());
    } catch (error) {
      window.showErrorMessage(`Could not create backup of: ${document.fileName}. ${error}`);
    }
  }

  async provideDocumentFormattingEdits(document: TextDocument): Promise<TextEdit[]> {
    var result = await window.showInformationMessage(
      'This is an experimental feature. ' +
       'Would you like to backup the current file before continuing?', 
       'Yes', 'No');

    if (result === 'Yes') 
      this.backupOriginal(document);

    const formatting: Array<TextEdit> = [];
    let textLines = 0;
    let emptyLines = 0;
    let isDialogueParagraph = false;
    let isSectionStart = false;
    let isFirstDialogueLine = false;
    let isInsideParagraph = false;
    let prevLine: TextLine | undefined = undefined;

    for (let i = 0; i < document.lineCount; i++) {
      const wasSectionStart = isSectionStart;
      const line = document.lineAt(i);
      let lineText = line.text;

      // Count consecutive text lines
      if (line.isEmptyOrWhitespace) {
        textLines = 0;
        emptyLines++;
        isDialogueParagraph = false;
        isInsideParagraph = false;

        // Remove extra empty lines
        if (this.state.formattingRemoveExtraLines && emptyLines >= 2) {
          formatting.push(TextEdit.delete(line.rangeIncludingLineBreak));
          continue;
        }
      } else {
        emptyLines = 0;
        textLines++;
        isInsideParagraph = textLines > 1;
      }

      // Remove ending white space characters
      if (this.state.formattingRemoveTrailingSpaces)
        lineText = lineText.trimEnd();

      // Replace known dialogue markes with selected dialogue marker
      if (this.state.formattingFixMismatchDialogueMarkers)
        lineText = lineText.replace(RegEx.KNOWN_DIALOGUE_MARKERS, this.state.dialoguePrefix);

      // Check if is first line of dialogue
      if (isFirstDialogueLine = lineText.startsWith(this.state.dialoguePrefix)) {
        isDialogueParagraph = true;
      }

      // Check if it is a new section. It should be separated by empty line.
      isSectionStart = lineText.match(RegEx.START_OF_MARKDOWN_SECTION) !== null;

      let firstLinesHandled = false;
      // Add extra lines before and after section / dialogues
      if (this.state.formattingFixParagraphSpacing &&
        isInsideParagraph && (isFirstDialogueLine || isSectionStart || wasSectionStart)) {
        if (prevLine) formatting.push(TextEdit.insert(prevLine.range.end, '\n'));
        firstLinesHandled = true;
      }

      // Replace all starting line indents with dialogue indent
      if (this.state.formattingFixDialogueIndents &&
        isDialogueParagraph && !isFirstDialogueLine) {
        lineText = lineText.replace(RegEx.ANY_OR_NONE_LINE_INDENT, this.state.dialgoueIndent)
      };

      // Replace two or more occurances of space characters with one space
      if (this.state.formattingRemoveExtraSpaces)
        lineText = lineText.replace(RegEx.TWO_OR_MORE_SPACES_IN_MIDDLE, ' ')

      switch (this.state.formattingFixParagraphBreaks) {

        // If One-Sentence-Per-Line mode is selected, try and split the line in sentences.
        case Constants.Format.ParagraphBreaks.ONE_SENTENCE_PER_LINE:
          // Add dialogue indent, if specified
          const prefix = this.state.formattingFixDialogueIndents && isDialogueParagraph
            ? this.state.dialgoueIndent
            : '';

          // Split in sentences
          // TODO: Refactor sentence splitting
          const lines = lineText.replace(RegEx.SENTENCE_SEPARATORS, '$1\n').split('\n');
          
          if (lines.length > 0) {
            formatting.push(TextEdit.replace(line.range, lines[0]));
            for (let i = 1; i < lines.length; i++) {
              formatting.push(TextEdit.insert(line.range.end, '\n' + prefix + lines[i]));
            }
          }
          break;

        case Constants.Format.ParagraphBreaks.SOFT_BREAK_NEW_PARAGRAPH:
          // Convert soft breaks to new paragraphs.
          if (isInsideParagraph && !firstLinesHandled) {
            if (prevLine) formatting.push(TextEdit.insert(prevLine.range.end, '\n'));
          }
          if (lineText != line.text) formatting.push(TextEdit.replace(line.range, lineText))
          break;

        case Constants.Format.ParagraphBreaks.SOFT_BREAK_SAME_PARAGRAPH:
          // Delete softbreaks and add them to previous paragraph.
          if (isInsideParagraph && (!isSectionStart && !wasSectionStart)) {
            if (prevLine) formatting.push(TextEdit.replace(
              prevLine.rangeIncludingLineBreak,
              prevLine.text.replace('\n', ''))
            );
            lineText = ' ' + lineText.replace(RegEx.ANY_LINE_INDENT, '')

          }
          if (lineText != line.text) formatting.push(TextEdit.replace(line.range, lineText))

          break;

        default:
          if (lineText != line.text) formatting.push(TextEdit.replace(line.range, lineText))
      }

      prevLine = line;
    }
    return formatting;
  }
}