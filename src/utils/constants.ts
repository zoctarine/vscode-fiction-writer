/* eslint-disable @typescript-eslint/naming-convention */
export const Constants = {
  WorkDir: '.fic',
  Paragraph: {
    NEW_ON_ENTER: 'Enter',
    NEW_ON_SHIFT_ENTER: 'Shift+Enter',
  },
  Compile: {
    SaveDialogue: {
      ALWAYS: 'Always',
      NONE: 'Never (save in same directory as exported file)'
    }
  },

  Dialogue : {
    NONE: '"Hello," (quotes)',
    EMDASH: '— Hello, (em-dash followed by one space)',
    TWODASH: '-- Hello, (two dashes followed by one space)',
    THREEDASH: '--- Hello, (three dashes followed by one space)',
    EMDASH_NOSP: '—Hello, (em-dash, no space)',
    TWODASH_NOSP: '--Hello, (two dashes, no space)',
    THREEDASH_NOSP: '---Hello, (three dashes, no space)',
    AUTO_REPLACE: '-- '
  },
  RenameRelated: {
    NEVER: 'Never',
    ALWAYS: 'Always',
    ASK: 'Ask Every Time'
  },
  Format: {
    BACKUP_DIR: '_bk',
    ParagraphBreaks: {
      NONE: 'none',
      SOFT_BREAK_NEW_PARAGRAPH: 'Soft line-breaks As New Paragraph',
      SOFT_BREAK_SAME_PARAGRAPH: 'Soft line-breaks In Same Paragraph',
      ONE_SENTENCE_PER_LINE: 'One Sentence Per Line'
    }
  },
  Commands: {
    ON_NEW_LINE: 'fiction-writer.extension.onNewLine',
    ON_NEW_LINE_ALTERED: 'fiction-writer.extension.onNewLineAltered',
    ON_BACKSPACE: 'fiction-writer.extension.onBackspace',
    ON_DELETE: 'fiction-writer.extension.onDelete',
    ON_TAB: 'fiction-writer.extension.onTab',
    COMPILE_FILE: 'fiction-writer.extension.compileFile',
    COMPILE_ALL: 'fiction-writer.extension.compileAll',
    COMPILE_TOC: 'fiction-writer.extension.compileToc',
    COMPILE: 'fiction-writer.extension.compile',
    SELECT_EDIT_MODE: 'fiction-writer.extension.selectEditMode',
    TOGGLE_PARAGRAPH: 'fiction-writer.extension.toggleNewParagraph',
    TOGGLE_TYPEWRITER: 'fiction-writer.extension.toggleTypewriterMode',
    TOGGLE_KEYBINDINGS: 'fiction-writer.extension.toggleKeybindings',
    WORDFREQ_FIND_PREV: 'fiction-writer.extension.wordFrequency.next.up',
    WORDFREQ_FIND_NEXT: 'fiction-writer.extension.wordFrequency.next.down',
    WORDFREQ_REFRESH: 'fiction-writer.extension.wordFrequency.refresh',
    WORDFREQ_CLEAR: 'fiction-writer.extension.wordFrequency.clear',
    DOCSTAT_REFRESH: 'fiction-writer.extension.statistics.refresh',
    METADATA_REFRESH: 'fiction-writer.extension.metadata.refresh',
    METADATA_OPEN: 'fiction-writer.extension.metadata.openFile',
    METADATA_TOGGLE_SUMMARY: 'fiction-writer.extension.metadata.enableSummary',
    TOGGLE_WRITING_MODE: 'fiction-writer.extension.toggleWritingMode',
    EXIT_WRITING_MODE: 'fiction-writer.extension.exitWritingMode',
    SET_FULLSCREEN_THEME: 'fiction-writer.extension.setWritingModeTheme',
    MOVE_FILE_UP: 'fiction-writer.extension.moveFileUp',
    MOVE_FILE_DOWN: 'fiction-writer.extension.moveFileDown',
    SAVE_NOTES: 'fiction-writer.extension.notes.save',
    OPEN_NOTES: 'fiction-writer.extension.notes.open',
    NEW_NOTES: 'fiction-writer.extension.notes.new',
    PIN_NOTE: 'fiction-writer.extension.notes.pinOn',
    UNPIN_NOTE: 'fiction-writer.extension.notes.pinOff',
    MOVE_TO_RESOURCES: 'fiction-writer.extension.moveToResources',
    RENAME_SIMILAR: 'fiction-writer.extension.renameGroup',
    REINDEX: 'fiction-writer.extension.reindex'
  },

  KnownLabels: [
    'keyword', 'keywords',
    'tag','tags',
    'character', 'characters',
    'title',
    'summary',
    'description',
    'author',
    'authors'
  ]
};

export const ReservedNames: Array<string> = [
  Constants.Format.BACKUP_DIR
];

const dialogueMarkerMappings: {[id:string]: string} = {};
dialogueMarkerMappings[`${Constants.Dialogue.EMDASH}`] = '— ';
dialogueMarkerMappings[`${Constants.Dialogue.EMDASH_NOSP}`] = '—';
dialogueMarkerMappings[`${Constants.Dialogue.THREEDASH}`] = '--- ';
dialogueMarkerMappings[`${Constants.Dialogue.THREEDASH_NOSP}`] = '---';
dialogueMarkerMappings[`${Constants.Dialogue.TWODASH}`] = '-- ';
dialogueMarkerMappings[`${Constants.Dialogue.TWODASH_NOSP}`] = '--';
dialogueMarkerMappings[`${Constants.Dialogue.NONE}`] = '';
export const DialogueMarkerMappings = dialogueMarkerMappings;


export const OutputFormats: { [id: string]: string; } = {
  'docx': 'docx',
  'odt': 'odt',
  'html': 'html',
  'asciidoc': 'adoc',
  'epub': 'epub',
  'fb2': 'fb2',
  'docbook': 'xml'
};


export const RegEx = {

  WORDS_AND_SEPARATORS: /([\p{L}'\-]+)(?: *)([^\p{L}]*)/igu,

  WORD_OR_MULTIWORD: /^[\p{L}\-' ]+$/uig,

  WHOLE_WORD: /[\p{L}'\-]+/igu,

  ANY_CHARACTER_ESCEPT_NEWLINE: /[^\r\n]/ug,

  ANY_CHARACTER_EXCEPT_WHITESPACE: /[^\s]/ug,

  KNOWN_DIALOGUE_MARKERS: /^(\-\-{1,2} {0,1}|— {0,1})/,

  START_OF_MARKDOWN_SECTION: /^(#|\*|{---){1,}/,

  ANY_OR_NONE_LINE_INDENT: /^\s*/,

  ANY_LINE_INDENT: /^\s+/,

  TWO_OR_MORE_SPACES_IN_MIDDLE: /(?<!^\s*)\s{2,}/g,

  SENTENCE_SEPARATORS: /([\.\?\!\:\;])([\s]+)/g,

  MARKDOWN_INCLUDE_FILE:  /^\s*{(.*?)}/g,

  MARKDOWN_INCLUDE_FILE_BOUNDARIES:  /[{}]/g,

  NEWLINE: /\r?\n/g,

  METADATA_MARKER_START: /^---[ \t]*$/,

  METADATA_MARKER_END: /^(---|\.\.\.)[ \t]*$/,

  METADATA_BLOCK: /^---[ \t]*$((.|\n|\r)+?)^(---|\.\.\.)[ \t]*$(\r|\n|\r\n){0,1}/gm
};


export enum KnownColor {
    NONE = 'default color',
    BLUE = 'blue',
    RED = 'red',
    GREEN = 'green',
    LIME = 'lime',
    ORANGE = 'orange',
    AMBER = 'amber',
    PURPLE = 'purple',
    BLUEGREY = 'bluegrey',
    GREY = 'grey',
    YELLOW = 'yellow',
    WHITE = 'white',
    BLACK = 'black',
    PINK = 'pink'
}