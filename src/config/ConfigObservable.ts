import { Constants, DialogueMarkerMappings, OutputFormats } from '../utils/constants';
import { workspace, WorkspaceConfiguration } from 'vscode';
import { Observable } from '../observable';
import { Config, LocalConfig } from './Config';
import { LocalSettingsService } from './LocalSettingsService';

export class ConfigObservable extends Observable<Config> {
  private config?: Config;

  constructor(private localSettings: LocalSettingsService) {
    super();
    this.reload();
  }

  getState(): Config {
    if (!this.config) {
      throw new Error('Configuration is not set!');
    }

    return { ...this.config };
  }

  read<T>(config: WorkspaceConfiguration, key: string, fallback: T ): T {
    return config.get<T>(key, fallback);
  }

  reload() {
    const editing = workspace.getConfiguration('markdown-fiction-writer.edit');
    const exporting = workspace.getConfiguration('markdown-fiction-writer.export');
    const view = workspace.getConfiguration('markdown-fiction-writer.view');
    const formatting = workspace.getConfiguration('markdown-fiction-writer.format');

    const dialoguePrefix = DialogueMarkerMappings[this.read<string>(editing, 'dialogueMarker', Constants.Dialogue.TWODASH)] ?? '';
    const isDialogueEnabled = dialoguePrefix !== '';

    let config = {
      inverseEnter: this.read<string>(editing, 'newParagraphHandling', Constants.Paragraph.NEW_ON_ENTER)
        === Constants.Paragraph.NEW_ON_ENTER,
      dialoguePrefix,
      dialogueMarkerAutoReplace: this.read<boolean>(editing, 'dialogueMarkerAutoReplace', true),
      dialogueMarkerAutoDetect: false,
      dialogueIndentAutoDetect: this.read<boolean>(editing, 'dialogueIndentAutoDetect', true),
      dialgoueIndentLength: this.read<number>(editing, 'dialogueIndent', 0),
      foldSentences: this.read<boolean>(editing, 'foldSentences', true),
      keybindingsDisabled: this.read<boolean>(editing, 'disableKeybindings', false),
      isTypewriterMode: this.read<boolean>(editing, 'typewriterMode', false),

      wrapIndent: this.read<number>(view, 'wordWrapIndent', 0),

      compileTemplateFile: this.read<string>(exporting, 'templateFile', ''),
      compileUseTemplateFile: this.read<boolean>(exporting, 'useTemplateFile', false),
      compileOutputFormat: this.read<string>(exporting, 'outputFormat', OutputFormats['odt']),
      compileEmDash: this.read<boolean>(exporting, 'smartDeshes', true),
      compileShowFormatPicker: this.read<boolean>(exporting, 'showFormatPicker', true),
      compileShowSaveDialogue: this.read<string>(exporting, 'showSaveDialogue', Constants.Compile.SaveDialogue.ALWAYS)
        === Constants.Compile.SaveDialogue.ALWAYS,
      compileSkipCommentsFromToc: this.read<boolean>(exporting, 'skipCommentsFromToc', true),
      compileTocFilename: this.read<string>(exporting, 'tocFilename', 'toc.md'),

      formattingIsEnabled: this.read<boolean>(formatting, 'enableDocumentFormatting', true),
      formattingFixMismatchDialogueMarkers: this.read<boolean>(formatting, 'fixMismatchDialogueMarkers', true),
      formattingFixDialogueIndents: this.read<boolean>(formatting, 'fixDialogueIndents', true),
      formattingFixParagraphSpacing: this.read<boolean>(formatting, 'fixParagraphSpacing', true),
      formattingFixParagraphBreaks: this.read<string>(formatting, 'fixParagraphBreaks', Constants.Format.ParagraphBreaks.NONE),
      formattingRemoveExtraSpaces: this.read<boolean>(formatting, 'removeExtraSpaces', true),
      formattingRemoveExtraLines: this.read<boolean>(formatting, 'removeExtraLines', true),
      formattingRemoveTrailingSpaces: this.read<boolean>(formatting, 'removeTrailingSpaces', true),

      viewFileTags: this.read<{[key:string]:string}>(view, 'fileTags', {}),
      viewFileTagsEnabled: this.read<boolean>(view, 'fileTagsEnabled', false),
      viewDialogueHighlight: this.read<boolean>(view, 'highlightDialogue', false),
      viewDialogueHighlightMarkers: this.read<boolean>(view, 'highlightDialogueMarkers', true),

      viewFullscreenFontSize: this.read<number>(view, 'writeModeFontSize', 0),

      isDialogueEnabled,
      dialgoueIndent: '',
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
    let localSettings = this.localSettings.getValue<LocalConfig>('config', { });
    this.config = { ...config, ...localSettings };

    // Notify observers
    this.notify();
  }

  setLocal<T extends string | number | boolean | undefined | {[key:string]:string}>(key: string, value: T) {
    if (!this.config) { return; }

    this.config[key] = value;

    let localConfig = this.localSettings.getValue<LocalConfig>('config', { });
    localConfig[key] = value;
    this.localSettings.setValue<LocalConfig>('config', localConfig);
    
    this.notify();
  }

}