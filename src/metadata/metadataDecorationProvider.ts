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
            let reason = [];

            /**
             * Resolve File Explorer Badges
             */
            if (useBadges) {
              const knownKeywords = [...this.state.metaFileBadges.keys()].map(k => k.toLowerCase());
              const defaultBadgeCat = this.state.metaKeywordBadgeCategory;

              // - if we have a default badge category, deep search only
              //   that category
              if (defaultBadgeCat) {
                if (metadata[defaultBadgeCat]) {
                  const cat = metadata[defaultBadgeCat];
                  const tag = this.findFirstMatchIn(cat, knownKeywords);
                  if (tag) {
                    const keyword = tag?.toLowerCase();
                    reason.push(`${defaultBadgeCat}: ${tag}`);
                    badge = useBadges
                      ? this.state.metaFileBadges.get(keyword)?.substr(0, 2)
                      : undefined;
                  }
                }
              } else {
                // - if no default badge category is set, then deep search
                //   metadata for any known keyword
                const match = this.findFirstMatchIn(metadata, knownKeywords);
                if (match) {
                  reason.push(`B: ${match}`);
                  badge = useBadges
                    ? this.state.metaFileBadges.get(match)?.substr(0, 2)
                    : undefined;
                }
              }
            }

            /**
             * Resolve File Explorer Colors
             */
            if (useColors) {
              const knownKeywords = [...this.state.metaKeywordColors.keys()].map(k => k.toLowerCase());
              const defaultColorCat = this.state.metaKeywordColorCategory;

              // - if we have a default color category, deep search only
              //   that category
              if (defaultColorCat) {
                if (metadata[defaultColorCat]) {
                  const cat = metadata[defaultColorCat];
                  const tag = this.findFirstMatchIn(cat, knownKeywords);
                  if (tag) {
                    const keyword = tag?.toLowerCase();
                    reason.push(`${defaultColorCat}: ${tag}`);
                    color = this.state.metaKeywordColors.get(keyword);
                  }
                }
              } else {
                // - if no default badge category is set, then deep search
                //   metadata for any known keyword
                const match = this.findFirstMatchIn(metadata, knownKeywords);
                if (match) {
                  reason.push(`C: ${match}`);
                  color = this.state.metaKeywordColors.get(match);
                }
              }
            }

            // Only return decoration if we have a reason to
            if (color || badge){
              return resolve(new vscode.FileDecoration(badge, reason.join(', '), color));
            }
          } 

          return reject();
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

  private findFirstMatchIn(obj: any, values: string[]): string | undefined {
    if (obj === null || obj === undefined) return undefined;
    if (!values || values.length === 0) return undefined;

    if (Array.isArray(obj)) {
      for (let item of obj) {
        let res = this.findFirstMatchIn(item, values);
        if (res) return res;
      }
      return undefined;
    }

    if (typeof (obj) === 'object') {
      for (let item of Object.getOwnPropertyNames(obj)) {
        let res = this.findFirstMatchIn(obj[item], values);
        if (res) return res;
      }
      return undefined;
    }

    const value = obj.toString().toLowerCase();
    return values.includes(value) ? value : undefined;
  }
}
