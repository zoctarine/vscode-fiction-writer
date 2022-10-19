import { Position, Range, TextDocumentChangeEvent, window, workspace } from 'vscode';
import { Config } from '../config';
import {
  IObservable,
  Observer,
  Constants,
  getActiveEditor,
  IDisposable,
  SupportedContent,
} from '../utils';

export class DialogueAutoCorrectObserver extends Observer<Config> implements IDisposable {
  constructor(observable: IObservable<Config>) {
    super(observable);
    this.tryBindTextChange();
  }

  protected onStateChange(newState: Config): void {
    super.onStateChange(newState);
    this.tryBindTextChange();
  }

  tryBindTextChange() {
    this.clearDisposable('TC');

    if (this.state.dialogueMarkerAutoReplace) {
      this.addDisposable(
        workspace.onDidChangeTextDocument(e => this.onTextChange(e)),
        'TC'
      );
    }
  }

  onTextChange(event: TextDocumentChangeEvent) {
    if (
      !this.state.isDialogueEnabled ||
      this.state.dialoguePrefix === Constants.Dialogue.AUTO_REPLACE
    )
      return;
    if (!event?.contentChanges?.length) return;
    if (event.contentChanges[0].text !== ' ') return;

    const editor = getActiveEditor(SupportedContent.Fiction);
    if (!editor) return;

    let cursorPos: Position = editor.selection.active;
    let line = editor.document.lineAt(cursorPos.line);
    let replaceString = Constants.Dialogue.AUTO_REPLACE;
    let replaceLength = replaceString.length;

    if (line.text.startsWith(replaceString) && cursorPos.character === replaceLength - 1) {
      return editor
        .edit(editBuilder => {
          editBuilder.delete(
            new Range(line.range.start, line.range.start.translate(undefined, replaceLength))
          );
          editBuilder.insert(line.range.start, this.state.dialoguePrefix);
          editor.selection.start.translate(replaceLength);
        })
        .then(() => {
          editor?.revealRange(editor.selection);
        });
    }
  }
}
