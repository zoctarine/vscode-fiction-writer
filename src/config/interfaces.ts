import { ConfigurationChangeEvent, ThemeColor, ThemeIcon } from "vscode";
import { KnownColor } from "../utils";

export interface IKvp<T> {
  [key:string]: T
}

export interface IContextConfig {
  [key: string]: ConfigurationChangeEvent| string | number | boolean | undefined | IKvp<string> | IKvp<boolean> | Map<string, ThemeColor> | Map<string, ThemeColor>;

  isZenMode?: boolean;
  isTypewriterMode?: boolean;
  isFocusMode?: boolean;
}
export class Config implements IContextConfig {
  [key: string]: string | number | boolean | ConfigurationChangeEvent | IKvp<string> | IKvp<boolean> | Map<string, ThemeColor> | undefined;
  isZenMode?: boolean | undefined;
  isTypewriterMode?: boolean | undefined;
  isFocusMode?: boolean | undefined;

  changeEvent?: ConfigurationChangeEvent;

  dialoguePrefix!: string;
  dialgoueIndent!: string;
  dialgoueIndentLength!: number;
  dialogueMarkerAutoReplace?: boolean;
  wrapIndent!: number;
  keybindingsDisabled?: boolean;
  dialogueIndentAutoDetect?: boolean;
  dialogueMarkerAutoDetect?: boolean;
  viewDialogueHighlight?: boolean;
  viewDialogueHighlightMarkers?: boolean;
  foldSentences?: boolean;
  inverseEnter?: boolean;
  isDialogueEnabled?: boolean;

  formattingIsEnabled?: boolean;
  formattingFixMismatchDialogueMarkers?: boolean;
  formattingFixDialogueIndents?: boolean;
  formattingFixParagraphSpacing?: boolean;
  formattingFixParagraphBreaks?: string;
  formattingRemoveExtraSpaces?: boolean;
  formattingRemoveExtraLines?: boolean;
  formattingRemoveTrailingSpaces?: boolean;

  compileTemplateFile!: string;
  compileOutputFormat!: string;
  compileUseTemplateFile?: boolean;
  compileEmDash?: boolean;
  compileShowFormatPicker?: boolean;
  compileShowSaveDialogue?: boolean;
  compileSkipCommentsFromToc?: boolean;
  compileShowsErrorInOutputFile?:boolean;
  compileSearchDocumentIdsInAllOpened?:boolean;
  compileIncludeIsEnabled?: boolean;
  compileTocFilename!: string;

  viewFileTags?: { [key: string]: string };
  viewZenModeFontSize?: number;
  viewZenModeTheme?: string;
  statusBarEnabled?: boolean;
  statusBarItems?: { [key: string]: boolean };
  viewFadeMetadata?: boolean;
  viewZenModeToggleFocus?: boolean;
  viewFocusModeOpacity!: number;
  viewFocusModeType!: string;
  
  metaEnabled?: boolean;
  metaEasyLists!: string;
  metaDefaultCategory?: string;
  metaKeywordColors!: Map<string, ThemeColor>;
  metaKeywordColorCategory!: string;
  metaKeywordShowInFileExplorer?: boolean;
  metaKeywordShowInMetadataView?: boolean;
  metaFileBadges!: Map<string, string>;
  metaKeywordsShowBadges?: boolean;
  metaCategories!: Map<string, string>;
  metaCategoryIconsEnabled?: boolean;
  metaCategoryNamesEnabled?: boolean;
  metaKeywordBadgeCategory!: string;
  metaSummaryCategoryEnabled?: boolean;

  smartRenameEnabled?:boolean;
  smartRenameRelated!: string;

  splitDocumentSwitchToFileEnabled?: boolean;

  notesEnabled?: boolean;
  notesDefaultText!: string;
}
