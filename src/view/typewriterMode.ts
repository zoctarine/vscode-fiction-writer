import { workspace } from 'vscode';
import { Config } from '../config';
import { IObservable, Observer, getActiveEditor, SupportedContent } from '../utils';

export class TypewriterModeObserver extends Observer<Config>{

  constructor(observable: IObservable<Config>) {
    super(observable);
    this.updateCursorSurroundingLines();
  }

  protected onStateChange(newState: Config): void {
    super.onStateChange(newState);
    this.updateCursorSurroundingLines();
  }

  updateCursorSurroundingLines() {
    const editor = getActiveEditor(SupportedContent.Fiction);;
    if (!editor) return;

    let maxHeight = 0;
    if (this.state.isTypewriterMode) {
      editor.visibleRanges.forEach(range =>{
        let height = range.end.line - range.start.line;
        if (maxHeight < height) maxHeight = height;
      });
    } else {
      maxHeight =  workspace
      .getConfiguration('editor', {languageId:'markdown'})
      .inspect<number>('cursorSurroundingLines')?.globalValue || 0;
    }

    workspace
      .getConfiguration('editor',  {languageId:'markdown'})
      .update('cursorSurroundingLines', maxHeight, undefined, true);
  }
}