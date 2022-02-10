import { Observable, Constants, DialogueMarkerMappings, OutputFormats, KnownColor } from '../utils';
import { ConfigurationChangeEvent, ThemeColor, ThemeIcon, workspace, WorkspaceConfiguration } from 'vscode';
import { Config, IContextConfig, IKvp } from './interfaces';
import { ContextService } from './contextService';

export class ConfigService extends Observable<Config> {
  private _config?: Config;

  constructor(private _localSettings: ContextService) {
    super();
    this.reload();
  }

  getState(): Config {
    if (!this._config) {
      throw new Error('Configuration is not set!');
    }

    return { ...this._config };
  }

  read<T>(config: WorkspaceConfiguration, key: string, fallback: T): T {
    return config.get<T>(key, fallback);
  }

  reload(event?: ConfigurationChangeEvent) {
    const writingMode = workspace.getConfiguration('fictionWriter.writingMode');
    const editing = workspace.getConfiguration('fictionWriter.edit');
    const editDialogue = workspace.getConfiguration('fictionWriter.editDialogue');
    const exporting = workspace.getConfiguration('fictionWriter.export');
    const view = workspace.getConfiguration('fictionWriter.view');
    const statusBar = workspace.getConfiguration('fictionWriter.statusBar');
    const metadata = workspace.getConfiguration('fictionWriter.metadata');
    const formatting = workspace.getConfiguration('fictionWriter.textFormatting');
    const smartRename = workspace.getConfiguration('fictionWriter.smartRename');
    const notes = workspace.getConfiguration('fictionWriter.notes');
    const splitDocument = workspace.getConfiguration('fictionWriter.splitDocument');

    const dialoguePrefix = DialogueMarkerMappings[this.read<string>(editDialogue, 'marker', Constants.Dialogue.TWODASH)] ?? '';
    const isDialogueEnabled = dialoguePrefix !== '';
    let config : Config = new Config();

    // event responsible for changing the configuration
    config.changeEvent = event;

    // configuration keys
    config.keybindingsDisabled = this.read<boolean>(editing, 'disableKeybindings', false);
    config.inverseEnter = this.read<string>(editing, 'easyParagraphCreation', Constants.Paragraph.NEW_ON_ENTER)
      === Constants.Paragraph.NEW_ON_ENTER;
    config.dialoguePrefix = dialoguePrefix;
    config.dialogueMarkerAutoReplace = this.read<boolean>(editDialogue, 'markerAutoReplace', true);
    config.dialogueMarkerAutoDetect = false;
    config.dialogueIndentAutoDetect = this.read<boolean>(editDialogue, 'sentenceIndentAutoDetect', true);
    config.dialgoueIndentLength = this.read<number>(editDialogue, 'sentenceIndentAutoDetect', 0);

    // EXPORT

    config.compileTemplateFile = this.read<string>(exporting, 'outputTemplate.file', '');
    config.compileUseTemplateFile = this.read<boolean>(exporting, 'outputTemplate.enabled', false);
    config.compileOutputFormat = this.read<string>(exporting, 'outputFormat.default', OutputFormats['odt']);
    config.compileShowFormatPicker = this.read<boolean>(exporting, 'outputFormat.alwaysShowFormatPicker', true);
    config.compileEmDash = this.read<boolean>(exporting, 'smartDeshes', true);
    config.compileShowSaveDialogue = this.read<string>(exporting, 'showSaveDialogue', Constants.Compile.SaveDialogue.ALWAYS) === Constants.Compile.SaveDialogue.ALWAYS;
    config.compileSkipCommentsFromToc = this.read<boolean>(exporting, 'skipCommentsFromToc', true);
    config.compileTocFilename = this.read<string>(exporting, 'tocFilename', 'toc.md');
    config.compileShowsErrorInOutputFile = this.read<boolean>(exporting, 'include.showsErrorInOutputFile', true);
    config.compileIncludeIsEnabled = this.read<boolean>(exporting, 'include.enabled', true);
    config.compileSearchDocumentIdsInAllOpened = this.read<boolean>(exporting, 'include.searchDocumentIdsInAllOpenFilesAndWorkspaces', false);

    // FORMATTING

    config.formattingIsEnabled = this.read<boolean>(formatting, 'enabled', true);
    config.formattingFixMismatchDialogueMarkers = this.read<boolean>(formatting, 'fixMismatchDialogueMarkers', true);
    config.formattingFixDialogueIndents = this.read<boolean>(formatting, 'fixDialogueIndents', true);
    config.formattingFixParagraphSpacing = this.read<boolean>(formatting, 'fixParagraphSpacing', true);
    config.formattingFixParagraphBreaks = this.read<string>(formatting, 'fixParagraphBreaks', Constants.Format.ParagraphBreaks.NONE);
    config.formattingRemoveExtraSpaces = this.read<boolean>(formatting, 'removeExtraSpaces', true);
    config.formattingRemoveExtraLines = this.read<boolean>(formatting, 'removeExtraLines', true);
    config.formattingRemoveTrailingSpaces = this.read<boolean>(formatting, 'removeTrailingSpaces', true);

    config.viewFileTags = this.read<{ [key: string]: string }>(view, 'fileTags.definitions', {});
    config.viewDialogueHighlight = this.read<boolean>(view, 'highlight.textBetweenQuotes', false);
    config.viewDialogueHighlightMarkers = this.read<boolean>(view, 'highlight.dialogueMarkers', true);
    config.viewFadeMetadata = this.read<boolean>(view, 'fadeMetadata', true);
    config.viewZenModeTheme = this.read<string>(writingMode, 'theme', '');
    config.viewZenModeFontSize = this.read<number>(writingMode, 'fontSize', 0);
    config.viewZenModeToggleFocus = this.read<boolean>(writingMode, 'toggleFocusMode', true);
    config.viewFocusModeOpacity = this.read<number>(view, 'focusMode.opacity', 0.5);
    config.viewFocusModeType = this.read<string>(view, 'focusMode.highlightType', Constants.FocusType.PARAGRAPH);
    config.wrapIndent = this.read<number>(view, 'wordWrapIndent', 0);

    config.foldSentences = this.read<boolean>(view, 'foldParagraphLines', true);
    config.statusBarEnabled = this.read<boolean>(statusBar, 'enabled', true);
    config.statusBarItems = this.read<{[key:string]:boolean}>(statusBar, 'items', {});

    config.isDialogueEnabled = isDialogueEnabled;
    config.dialgoueIndent = '';

    // NOTES

    config.notesEnabled = this.read<boolean>(notes, 'enabled', true);
    config.notesDefaultText = this.read<string>(notes, 'defaultText', 'YOUR NOTES HERE');

    // SMART EDIT

    config.smartRenameEnabled = this.read<boolean>(smartRename, 'enabled', false);
    config.smartRenameRelated = this.read<string>(smartRename, 'renameRelatedFiles', Constants.RenameRelated.ASK);

    // SPLIT DOCUMENT

    config.splitDocumentSwitchToFileEnabled = this.read<boolean>(splitDocument, 'switchToNewlyCreatedDocument', true);

    // METADATA

    config.metaEnabled = this.read<boolean>(metadata, 'enabled', true);

    config.metaKeywordColors = new Map<string, ThemeColor>();
    config.metaKeywordShowInFileExplorer = this.read<boolean>(metadata, 'keywords.colorsInFileExplorer', true) && config.metaEnabled;
    config.metaKeywordShowInMetadataView = this.read<boolean>(metadata, 'keywords.colorsInMetadataView', true) && config.metaEnabled;

    config.metaCategories = new Map<string, string>();
    config.metaCategoryIconsEnabled = this.read<boolean>(metadata, 'categories.showIcons', true) && config.metaEnabled;
    config.metaCategoryNamesEnabled = this.read<boolean>(metadata, 'categories.showNames', true) && config.metaEnabled;
    config.metaSummaryCategoryEnabled = this.read<boolean>(metadata, 'categories.summaryEnabled', true) && config.metaEnabled;

    config.metaDefaultCategory = this.read<string>(metadata, 'categories.default', 'tags');
    config.metaEasyLists = this.read<string>(metadata, 'easyLists', ',');
    config.metaKeywordBadgeCategory = this.read<string>(metadata, 'keywords.badgesCategory', 'tags');
    config.metaKeywordColorCategory = this.read<string>(metadata, 'keywords.colorsCategory', 'tags');
    config.metaFileBadges = new Map<string, string>();
    config.metaKeywordsShowBadges = this.read<boolean>(metadata, 'keywords.badgesInFileExplorer', true) && config.metaEnabled;

    const metaKeywordColors = this.read<IKvp<KnownColor>>(
      metadata,
      'keywords.colors',
      {}
    );

    for (const [key, val] of Object.entries(metaKeywordColors)) {
      if (val && val !== KnownColor.NONE) {
        config.metaKeywordColors.set(key.toLowerCase(), new ThemeColor(`fictionWriter.${val}`));
      }
    };

    const metaFileBadges = this.read<IKvp<string>>(
      metadata,
      'keywords.badges',
      {}
    );

    for (const [key, val] of Object.entries(metaFileBadges)) {
      if (val) {
        config.metaFileBadges.set(key.toLowerCase(), val.substring(0, 2));
      }
    };

    const metaCatIcons = this.read<IKvp<string>>(
      metadata,
      'categories.icons',
      {}
    );

    for (const [key, val] of Object.entries(metaCatIcons)) {
      if (val) {
        config.metaCategories.set(key.toLowerCase(), val);
      }
    };


    // Disable dialogue related settings
    if (!isDialogueEnabled) {
      config.dialgoueIndent = '';
      config.dialogueIndentAutoDetect = false;
      config.dialgoueIndentLength = 0;
      config.dialogueMarkerAutoReplace = false;
      config.dialogueMarkerAutoDetect = false;
      config.formattingFixDialogueIndents = false;
      config.formattingFixMismatchDialogueMarkers = false;
    } else {
      config.dialgoueIndent = ' '.repeat(
        (config.dialgoueIndentLength < 0 || config.dialogueIndentAutoDetect)
          ? config.dialoguePrefix.length
          : config.dialgoueIndentLength);
    };

    // TODO: Move some settings to extension settings.
    let localSettings = this._localSettings.getValue<IContextConfig>('config', {});
    this._config = { ...config, ...localSettings };
    // Notify observers
    this.notify();
  }

  setLocal<T extends string | number | boolean | undefined | { [key: string]: string }>(key: string, value: T) {
    if (!this._config) { return; }

    this._config[key] = value;

    let localConfig = this._localSettings.getValue<IContextConfig>('config', {});
    localConfig[key] = value;
    this._localSettings.setValue<IContextConfig>('config', localConfig);

    this.notify();
  }

  getLocal(key: string) : any {
    if (!this._config) { return undefined; }

    let localConfig = this._localSettings.getValue<IContextConfig>('config', {});
    
    return localConfig[key];
  }


  getFlag(key: string): boolean {
    return this._localSettings.getValue<boolean>(key, false);
  }

  setFlag(key: string) { this._localSettings.setValue<boolean>(key, true); }
  unsetFlag(key: string) { this._localSettings.setValue<boolean>(key, false); }

  backup(config: string, key: string): any {
    const value = workspace.getConfiguration(config).get(key);
    this._localSettings.setValue(
      `${config}.${key}`,
      value
    );

    return value;
  }

  restore(config: string, key: string) {
    const storedValue = this._localSettings.getValue(
      `${config}.${key}`,
      undefined);

    if (storedValue) {
      workspace.getConfiguration(config).update(
        key,
        storedValue);
    }
  }
}