import * as vscode from 'vscode';
import { Config, IKvp } from '../config';
import { IObservable, isSupportedPathAsync, KnownColor, Observer } from '../utils';
import { KnownMeta, MetadataFileCache } from './index';


export class MetadataFileDecorationProvider extends Observer<Config> implements vscode.FileDecorationProvider {
  private decorations: { [key: string]: vscode.FileDecoration; };

  constructor(observable: IObservable<Config>, private cache: MetadataFileCache) {
    super(observable);

    this.decorations = {};
    this.register();
  }

  private register() {
    this.clearDisposable('FD', 'SV');

    if (this.state.metaKeywordsShowBadges) {
      this.addDisposable(vscode.window.registerFileDecorationProvider(this), 'FD');
    }
  }

  private readonly _onDidChangeDecorations = new vscode.EventEmitter<vscode.Uri[]>();
  readonly onDidChangeFileDecorations: vscode.Event<vscode.Uri[]> = this._onDidChangeDecorations.event;

  provideFileDecoration(uri: vscode.Uri): Promise<vscode.FileDecoration> {
    if (!isSupportedPathAsync(uri))
      return Promise.reject();

    return new Promise((resolve, reject) => {
      const useColors = this.state.metaKeywordShowInFileExplorer;
      const useBadges = this.state.metaKeywordsShowBadges;
      this.cache.get(uri)
        .then(meta => {

          const metadata = meta?.metadata as IKvp<string | string[]>;
          let badge: string | undefined;
          let color: vscode.ThemeColor | undefined;

          if (metadata) {
            const defaultBadgeCat = this.state.metaKeywordBadgeCategory;
            if (metadata[defaultBadgeCat]) {
              const cat = metadata[defaultBadgeCat];
              const tag: string = (Array.isArray(cat) ? cat[0] : cat);
              const keyword = tag?.toLowerCase();
              badge = useBadges
                ? this.state.metaFileBadges.get(keyword)?.substr(0, 2)
                : undefined;
            }

            const defaultColorCat = this.state.metaKeywordColorCategory;
            if (metadata[defaultColorCat]) {
              const cat = metadata[defaultColorCat];
              const tag: string = (Array.isArray(cat) ? cat[0] : cat);
              const keyword = tag?.toLowerCase();
              color = useColors ? this.state.metaKeywordColors.get(keyword) : undefined;
            }
            resolve(new vscode.FileDecoration(badge, `TODO ADD BOTH`, color));
          } else {
            reject();
          }
        })
        .catch(err => reject(err));
    });
  }

  fire(uri: vscode.Uri[]) {
    this._onDidChangeDecorations.fire(uri);
  }

  protected onStateChange(newState: Config) {
    super.onStateChange(newState);

    if (this.state.changeEvent?.affectsConfiguration('markdown-fiction-writer.metadata')) {
      this.fire(this.cache.getAllKeys().map(fp => vscode.Uri.file(fp)));
    }
  }
}
