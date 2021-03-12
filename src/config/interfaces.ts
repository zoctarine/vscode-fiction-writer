import { ConfigurationChangeEvent, ThemeColor, ThemeIcon } from "vscode";
import { KnownColor } from "../utils";

export interface IKvp<T> {
  [key:string]: T
}

export interface IContextConfig {
  [key: string]: ConfigurationChangeEvent| string | number | boolean | undefined | IKvp<string> | Map<string, ThemeColor> | Map<string, ThemeColor>;

  isZenMode?: boolean;
  isTypewriterMode?: boolean;
}
export class Config implements IContextConfig {
  [key: string]: string | number | boolean | ConfigurationChangeEvent | IKvp<string> | Map<string, ThemeColor> | undefined;
  isZenMode?: boolean | undefined;
  isTypewriterMode?: boolean | undefined;

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
  viewZenModeEnabled?: boolean;
  viewZenModeFontSize?: number;
  viewZenModeTheme?: string;
  viewStatusBarEnabled?: boolean;
  viewFadeMetadata?: boolean;

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

  smartEditEnabled?:boolean;
  smartEditRenameRelated!: string;
}
