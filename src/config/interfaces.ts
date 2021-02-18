export interface LocalConfig {
    [key: string]: string | number | boolean | undefined | {[key:string]:string};
    isZenMode?: boolean;
    isTypewriterMode?:boolean;
}
export interface Config extends LocalConfig{
    dialoguePrefix: string;
    dialgoueIndent: string;
    dialgoueIndentLength: number;
    dialogueMarkerAutoReplace?: boolean;
    wrapIndent: number;
    keybindingsDisabled?: boolean,
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
    formattingRemoveTrailingSpaces?: boolean,

    compileTemplateFile: string,
    compileOutputFormat: string,
    compileUseTemplateFile?: boolean,
    compileEmDash?: boolean,
    compileShowFormatPicker?: boolean,
    compileShowSaveDialogue?: boolean,
    compileSkipCommentsFromToc?: boolean
    compileTocFilename: string,

    viewFileTagsEnabled?: boolean,
    viewFileTags?: {[key:string]:string}
    viewZenModeEnabled?: boolean;
    viewZenModeFontSize?: number;
    viewZenModeTheme?: string;

    viewStatusBarEnabled?: boolean;
}
