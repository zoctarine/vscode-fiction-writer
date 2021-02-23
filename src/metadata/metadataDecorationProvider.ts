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

    if (this.state.metaFileBadgesEnabled) {
      this.addDisposable(vscode.window.registerFileDecorationProvider(this), 'FD');
    }
  }

  private readonly _onDidChangeDecorations = new vscode.EventEmitter<vscode.Uri[]>();
  readonly onDidChangeFileDecorations: vscode.Event<vscode.Uri[]> = this._onDidChangeDecorations.event;

  provideFileDecoration(uri: vscode.Uri): Promise<vscode.FileDecoration> {
    if (!isSupportedPathAsync(uri))
      return Promise.reject();

    return new Promise((resolve, reject) => {
      this.cache.get(uri)
        .then(meta => {

          const metadata = meta?.metadata as IKvp<string | string[]>;
          const defaultCat = this.state.metaCatDefault;
          if (metadata && metadata[defaultCat]) {
            const cat = metadata[defaultCat];
            const tag: string = (Array.isArray(cat) ? cat[0] : cat);
            const keyword = tag?.toLowerCase();
              console.log(keyword);
              console.log(this.state.metaKeywordColors.size);
              this.state.metaFileBadges.forEach((v,k)=>console.log(`${k}:${v}`));
            const color = this.state.metaKeywordColors.get(keyword);
            const bg = this.state.metaFileBadges.get(keyword);

            console.log(color);
            console.log(bg);

            let badge = bg
              ? bg.substr(0, 2)
              : undefined;

            resolve(new vscode.FileDecoration(badge, tag, color));
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
      console.log("FIRIG FILE CHANGE EVENTS");
      this.fire(this.cache.getAllKeys().map(fp => vscode.Uri.file(fp)));
    }
  }
}
