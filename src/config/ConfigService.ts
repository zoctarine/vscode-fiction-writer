import { Constants, DialogueMarkerMappings, OutputFormats } from '../utils/constants';
import { window, workspace, WorkspaceConfiguration } from 'vscode';
import { Observable } from '../observable';
import { Config, ContextConfig } from './interfaces';
import { ContextService } from './contextService';

export class ConfigService extends Observable<Config> {
  private config?: Config;

  constructor(private localSettings: ContextService) {
    super();
    this.reload();
  }

  getState(): Config {
    if (!this.config) {
      throw new Error('Configuration is not set!');
    }

    return { ...this.config };
  }

  read<T>(config: WorkspaceConfiguration, key: string, fallback: T): T {
    return config.get<T>(key, fallback);
  }

  reload() {
    const editing = workspace.getConfiguration('markdown-fiction-writer.edit');
    const editDialogue = workspace.getConfiguration('markdown-fiction-writer.editDialogue');
    const exporting = workspace.getConfiguration('markdown-fiction-writer.export');
    const view = workspace.getConfiguration('markdown-fiction-writer.view');
    const formatting = workspace.getConfiguration('markdown-fiction-writer.textFormatting');

    const dialoguePrefix = DialogueMarkerMappings[this.read<string>(editDialogue, 'marker', Constants.Dialogue.TWODASH)] ?? '';
    const isDialogueEnabled = dialoguePrefix !== '';

    let config = {
      keybindingsDisabled: this.read<boolean>(editing, 'disableKeybindings', false),
      inverseEnter: this.read<string>(editing, 'easyParagraphCreation', Constants.Paragraph.NEW_ON_ENTER)
        === Constants.Paragraph.NEW_ON_ENTER,
      dialoguePrefix,
      dialogueMarkerAutoReplace: this.read<boolean>(editDialogue, 'markerAutoReplace', true),
      dialogueMarkerAutoDetect: false,
      dialogueIndentAutoDetect: this.read<boolean>(editDialogue, 'sentenceIndentAutoDetect', true),
      dialgoueIndentLength: this.read<number>(editDialogue, 'sentenceIndentAutoDetect', 0),
      
      // EXPORT 
      
      compileTemplateFile: this.read<string>(exporting, 'outputTemplate.file', ''),
      compileUseTemplateFile: this.read<boolean>(exporting, 'outputTemplate.enabled', false),
      compileOutputFormat: this.read<string>(exporting, 'outputFormat.default', OutputFormats['odt']),
      compileShowFormatPicker: this.read<boolean>(exporting, 'outputFormat.alwaysShowFormatPicker', true),
      compileEmDash: this.read<boolean>(exporting, 'smartDeshes', true),
      compileShowSaveDialogue: this.read<string>(exporting, 'showSaveDialogue', Constants.Compile.SaveDialogue.ALWAYS)
      === Constants.Compile.SaveDialogue.ALWAYS,
      compileSkipCommentsFromToc: this.read<boolean>(exporting, 'skipCommentsFromToc', true),
      compileTocFilename: this.read<string>(exporting, 'tocFilename', 'toc.md'),
      
      // FORMATTING
      
      formattingIsEnabled: this.read<boolean>(formatting, 'enabled', true),
      formattingFixMismatchDialogueMarkers: this.read<boolean>(formatting, 'fixMismatchDialogueMarkers', true),
      formattingFixDialogueIndents: this.read<boolean>(formatting, 'fixDialogueIndents', true),
      formattingFixParagraphSpacing: this.read<boolean>(formatting, 'fixParagraphSpacing', true),
      formattingFixParagraphBreaks: this.read<string>(formatting, 'fixParagraphBreaks', Constants.Format.ParagraphBreaks.NONE),
      formattingRemoveExtraSpaces: this.read<boolean>(formatting, 'removeExtraSpaces', true),
      formattingRemoveExtraLines: this.read<boolean>(formatting, 'removeExtraLines', true),
      formattingRemoveTrailingSpaces: this.read<boolean>(formatting, 'removeTrailingSpaces', true),
      
      viewFileTags: this.read<{ [key: string]: string }>(view, 'fileTags.definitions', {}),
      viewFileTagsEnabled: this.read<boolean>(view, 'fileTags.enabled', false),
      viewDialogueHighlight: this.read<boolean>(view, 'highlight.textBetweenQuotes', false),
      viewDialogueHighlightMarkers: this.read<boolean>(view, 'highlight.dialogueMarkers', true),
      
      viewZenModeEnabled: this.read<boolean>(view, 'enhancedZenMode.enabled', false),
      viewZenModeTheme: this.read<string>(view, 'enhancedZenMode.theme', ''),
      viewZenModeFontSize: this.read<number>(view, 'enhancedZenMode.fontSize', 0),
      wrapIndent: this.read<number>(view, 'wordWrapIndent', 0),
      
      foldSentences: this.read<boolean>(view, 'foldParagraphLines', true),
      viewStatusBarEnabled: this.read<boolean>(view, 'statusBar.enabled', true),
      
      isDialogueEnabled : isDialogueEnabled,
      dialgoueIndent: ''
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
      let localSettings = this.localSettings.getValue<ContextConfig>('config', {});
      this.config = { ...config, ...localSettings };
      
      // Notify observers
      this.notify();
    }
    
    setLocal<T extends string | number | boolean | undefined | { [key: string]: string }>(key: string, value: T) {
      if (!this.config) { return; }
      
      this.config[key] = value;

    let localConfig = this.localSettings.getValue<ContextConfig>('config', {});
    this.localSettings.setValue<ContextConfig>('config', localConfig);
    localConfig[key] = value;

    this.notify();
  }

  getFlag(key: string) : boolean {
    return this.localSettings.getValue<boolean>(key, false);
  }

  setFlag(key: string) { this.localSettings.setValue<boolean>(key, true); }
  usetFlag(key: string) { this.localSettings.setValue<boolean>(key, false); }

  backup(config: string, key: string) : any {
    const value = workspace.getConfiguration(config).get(key);
    this.localSettings.setValue(
      `${config}.${key}`,
      value
    );

    return value;
  }

  restore(config: string, key: string) {
    const storedValue = this.localSettings.getValue(
      `${config}.${key}`,
      undefined);

    if (storedValue) {
      workspace.getConfiguration(config).update(
        key,
        storedValue);
    }
  }
}