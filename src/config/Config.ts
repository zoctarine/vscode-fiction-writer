export interface Config {
    dialoguePrefix: string;
    dialgoueIndent: string;
    dialgoueIndentLength: number;
    dialogueMarkerAutoReplace?: boolean;
    wrapIndent: number;
    keybindingsDisabled?: boolean,
    dialogueIndentAutoDetect?: boolean;
    dialogueMarkerAutoDetect?: boolean;
    foldSentences?: boolean;
    inverseEnter?: boolean;
    isTypewriterMode?: boolean;
    isDialogueEnabled?: boolean;
    
    formattingIsEnabled?: boolean;
    formattingBackupBeforeEachFormat?: boolean;
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
    compileTocFilename: string
}
