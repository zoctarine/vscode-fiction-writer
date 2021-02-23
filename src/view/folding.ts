import {
  FoldingContext, FoldingRange, FoldingRangeKind, FoldingRangeProvider, Disposable,
  CancellationToken, TextDocument, languages
} from 'vscode';
import { IObservable, Observer } from '../utils';
import { Config } from '../config';

class ParagraphFoldingProvider implements FoldingRangeProvider {
  provideFoldingRanges(document: TextDocument, context: FoldingContext, token: CancellationToken): FoldingRange[] {
    const result = [];
    let textLines = 0;

    let line = 0;
    for (; line < document.lineCount; line++) {
      if (document.lineAt(line).isEmptyOrWhitespace) {
        if (textLines > 0) {
          result.push(new FoldingRange(line - textLines, line - 1, FoldingRangeKind.Region));
        }
        textLines = 0;
      } else {
        textLines++;
      }
    }

    // If we have lines left, add them to folding region
    if (textLines > 0) {
      result.push(
        new FoldingRange(
          line - textLines, line - 1,
          FoldingRangeKind.Region));
    }
    return result;
  }
}

export class FoldingObserver extends Observer<Config> implements Disposable {

  private foldingDisposable?: Disposable;
  private foldingProvider: ParagraphFoldingProvider;

  constructor(observable: IObservable<Config>) {
    super(observable);

    this.foldingProvider = new ParagraphFoldingProvider();

    this.tryRegisterFoldingProvider();
  }

  protected onStateChange(newState: Config): void {
    super.onStateChange(newState);

    this.tryRegisterFoldingProvider();
  }

  private tryRegisterFoldingProvider() {
    this.foldingDisposable?.dispose();

    if (this.state.foldSentences) {
      this.foldingDisposable = languages.registerFoldingRangeProvider(
        {
          scheme: 'file',
          language: 'markdown'
        },
        this.foldingProvider);
    }
  }

  dispose() {
    this.foldingDisposable?.dispose();
  }
}