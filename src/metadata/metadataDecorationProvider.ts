import * as vscode from 'vscode';
import { Config, IKvp } from '../config';
import { FileManager } from '../smartRename';
import { IObservable, Observer, SupportedContent } from '../utils';
import { MetadataFileCache } from './index';

export class MetadataFileDecorationProvider
  extends Observer<Config>
  implements vscode.FileDecorationProvider
{
  private _decorations: { [key: string]: vscode.FileDecoration };

  constructor(
    observable: IObservable<Config>,
    private _cache: MetadataFileCache,
    private _fileManager: FileManager
  ) {
    super(observable);

    this._decorations = {};
    this.register();
  }

  private register() {
    this.clearDisposable('FD', 'SV');

    if (this.state.metaKeywordsShowBadges && this.state.metaEnabled) {
      this.addDisposable(vscode.window.registerFileDecorationProvider(this), 'FD');
    }
  }

  private readonly _onDidChangeDecorations = new vscode.EventEmitter<vscode.Uri[]>();
  readonly onDidChangeFileDecorations: vscode.Event<vscode.Uri[]> =
    this._onDidChangeDecorations.event;

  provideFileDecoration(uri: vscode.Uri): Promise<vscode.FileDecoration> {
    const contentType = this._fileManager.getPathContentType(uri?.fsPath, true);

    if (
      contentType.has(SupportedContent.Metadata) ||
      contentType.has(SupportedContent.Notes) ||
      uri?.fsPath.toLowerCase().endsWith('.tmp')
    ) {
      return Promise.resolve(
        new vscode.FileDecoration(
          undefined,
          undefined,
          new vscode.ThemeColor('tab.inactiveForeground')
        )
      );
    }

    if (contentType.has(SupportedContent.Fiction)) {
      return new Promise((resolve, reject) => {
        const useColors = this.state.metaKeywordShowInFileExplorer;
        const useBadges = this.state.metaKeywordsShowBadges;
        const meta = this._cache.get(uri);

        const metadata = meta?.metadata?.value as IKvp<string | string[]>;
        let badge: string | undefined;
        let color: vscode.ThemeColor | undefined;

        if (metadata) {
          let reason = new Set<string>();

          /**
           * Resolve File Explorer Badges
           */
          if (useBadges) {
            const knownKeywords = [...this.state.metaFileBadges.keys()].map(k => k.toLowerCase());
            const defaultBadgeCat = this.state.metaKeywordBadgeCategory;

            if (meta?.id) {
              reason.add(`ID: ${meta.id}`);
            }

            // - if we have a default badge category, deep search only
            //   that category
            if (defaultBadgeCat) {
              if (metadata[defaultBadgeCat]) {
                const cat = metadata[defaultBadgeCat];
                const tag = this.findFirstMatchIn(cat, knownKeywords);
                if (tag) {
                  const keyword = tag?.toLowerCase();
                  reason.add(tag);
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
                reason.add(match);
                badge = useBadges ? this.state.metaFileBadges.get(match)?.substr(0, 2) : undefined;
              }
            }
          }

          /**
           * Resolve File Explorer Colors
           */
          if (useColors) {
            const knownKeywords = [...this.state.metaKeywordColors.keys()].map(k =>
              k.toLowerCase()
            );
            const defaultColorCat = this.state.metaKeywordColorCategory;

            // - if we have a default color category, deep search only
            //   that category
            if (defaultColorCat) {
              if (metadata[defaultColorCat]) {
                const cat = metadata[defaultColorCat];
                const tag = this.findFirstMatchIn(cat, knownKeywords);
                if (tag) {
                  const keyword = tag?.toLowerCase();
                  reason.add(tag);
                  color = this.state.metaKeywordColors.get(keyword);
                }
              }
            } else {
              // - if no default badge category is set, then deep search
              //   metadata for any known keyword
              const match = this.findFirstMatchIn(metadata, knownKeywords);
              if (match) {
                reason.add(match);
                color = this.state.metaKeywordColors.get(match);
              }
            }
          }

          if (meta?.summary) reason.add(meta?.summary);

          // Only return decoration if we have a reason to
          if (badge || color || reason.size > 0) {
            let tooltip = [...reason.values()].join(' | ');
            return resolve(new vscode.FileDecoration(badge, tooltip, color));
          }
        }
        return reject();
      });
    }

    return Promise.reject();
  }

  fire(uri: vscode.Uri[]) {
    const uris = uri
      .map(u => this._cache.get(u)?.path)
      .filter((u): u is string => u !== undefined)
      .map(u => vscode.Uri.file(u));

    this._onDidChangeDecorations.fire(uris);
  }

  protected onStateChange(newState: Config) {
    super.onStateChange(newState);

    if (this.state.changeEvent?.affectsConfiguration('fictionWriter.metadata.enabled')) {
      this.register();
    }
    if (this.state.changeEvent?.affectsConfiguration('fictionWriter.metadata')) {
      this.fire(this._cache.getAllKeys().map(fp => vscode.Uri.file(fp)));
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

    if (typeof obj === 'object') {
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
