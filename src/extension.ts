import * as vscode from 'vscode';
import { ConfigService, Config, LocalSettingsService } from './config';
import { CompileAllCommand, CompileFileCommand, CompileTocCommand } from './compile';
import { EnhancedEditorBehaviour, EnhancedDialogueEditorBehaviour, TypewriterModeObserver, FormatProviderObserver, DialogueAutoCorrectObserver } from "./edit";
import { Constants, DialogueMarkerMappings } from './utils';
import { DocStatisticTreeDataProvider, WordFrequencyTreeDataProvider, WordStatTreeItemSelector } from './analysis';
import * as path from 'path';
import { TextDecorations, FileTagDecorationProvider, FoldingObserver, StatusBarObserver } from './view';
let currentConfig: Config;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  const storageManager = new LocalSettingsService(context.globalState);
  const configService = new ConfigService(storageManager);
  currentConfig = configService.getState();

  const statusBar = new StatusBarObserver(configService);
  const enhancedBehaviour = new EnhancedEditorBehaviour(configService);
  const dialogueBehaviour = new EnhancedDialogueEditorBehaviour(configService);

  const behaviour = () => currentConfig.isDialogueEnabled ? dialogueBehaviour : enhancedBehaviour;
  const compileFileCommand = new CompileFileCommand(configService);
  const compileAllCommand = new CompileAllCommand(configService);
  const compileTocCommand = new CompileTocCommand(configService);

  const wordFrequencyProvider = new WordFrequencyTreeDataProvider();
  const docStatisticProvider = new DocStatisticTreeDataProvider();

  var freqTree = vscode.window.createTreeView('wordFrequencies', { treeDataProvider: wordFrequencyProvider });
  const statTree = vscode.window.createTreeView('statistics', { treeDataProvider: docStatisticProvider });

  const cmd = Constants.Commands;

  context.subscriptions.push(
    statTree,
    freqTree,
    statusBar,
    new FoldingObserver(configService),
    new TypewriterModeObserver(configService),
    new FormatProviderObserver(configService),
    new DialogueAutoCorrectObserver(configService),
    new TextDecorations(configService),
    new FileTagDecorationProvider(configService),

    vscode.workspace.onDidChangeConfiguration((e) => onConfigChange(e, configService)),
    vscode.window.onDidChangeActiveTextEditor(() => statusBar.showHide()),

    vscode.commands.registerCommand(cmd.ON_NEW_LINE, () => behaviour().onEnterKey()),
    vscode.commands.registerCommand(cmd.ON_NEW_LINE_ALTERED, () => behaviour().onShiftEnterKey()),
    vscode.commands.registerCommand(cmd.ON_BACKSPACE, () => behaviour().onBackspaceKey()),
    vscode.commands.registerCommand(cmd.ON_DELETE, () => behaviour().onDeleteKey()),
    vscode.commands.registerCommand(cmd.ON_TAB, () => behaviour().onTabKey()),
    vscode.commands.registerCommand(cmd.COMPILE_FILE, async () => { await compileFileCommand.execute(); }),
    vscode.commands.registerCommand(cmd.COMPILE_ALL, async () => { await compileAllCommand.execute(); }),
    vscode.commands.registerCommand(cmd.COMPILE_TOC, async () => { await compileTocCommand.execute(); }),
    vscode.commands.registerCommand(cmd.COMPILE, compileCommand),
    vscode.commands.registerCommand(cmd.SELECT_EDIT_MODE, selectDialogueMode),
    vscode.commands.registerCommand(cmd.TOGGLE_PARAGRAPH, toggleParagraphCommand),
    vscode.commands.registerCommand(cmd.TOGGLE_TYPEWRITER, () => toggleTypewriterModeCommand(configService)),
    vscode.commands.registerCommand(cmd.TOGGLE_KEYBINDINGS, toggleKeybindingsCommand),
    vscode.commands.registerCommand(cmd.WORDFREQ_FIND_PREV, () => { WordStatTreeItemSelector.prev(freqTree.selection); }),
    vscode.commands.registerCommand(cmd.WORDFREQ_FIND_NEXT, () => { WordStatTreeItemSelector.next(freqTree.selection); }),
    vscode.commands.registerCommand(cmd.WORDFREQ_REFRESH, () => {
      freqTree.title = 'Frequencies: ' + getCurrentFile();
      wordFrequencyProvider.refresh();
    }),
    vscode.commands.registerCommand(cmd.WORDFREQ_CLEAR, () => {
      freqTree.title = 'Word Frequencies';
      wordFrequencyProvider.clear();
    }),
    vscode.commands.registerCommand(cmd.DOCSTAT_REFRESH, () => {
      statTree.title = 'Statistics: ' + getCurrentFile();
      docStatisticProvider.refresh();
    }),
    vscode.commands.registerCommand(cmd.TOGGLE_ZEN_MODE, () => toggleZenWritingMode(configService)),
    vscode.commands.registerCommand(cmd.EXIT_ZEN_MODE, () => exitZenWritingMode(configService)),
    vscode.commands.registerCommand(cmd.SET_FULLSCREEN_THEME, () => setFullscreenTheme(configService)),
  );

}

function exitZenWritingMode(configurationService: ConfigService) {
  vscode.commands.executeCommand('workbench.action.exitZenMode');

  configurationService.restore('workbench', 'colorTheme');
  configurationService.restore('editor', 'fontSize');
  configurationService.setLocal('isZenMode', false);
}

function enterZenWritingMode(configurationService: ConfigService) {
  const changeThemeTo = configurationService.getState().viewZenModeTheme;
  const changeFontTo = configurationService.getState().viewZenModeFontSize;
  vscode.commands.executeCommand('workbench.action.toggleZenMode');

  if (changeThemeTo) {
    configurationService.backup('workbench', 'colorTheme');
    vscode.workspace.getConfiguration('workbench').update('colorTheme', changeThemeTo);
  }

  if (changeFontTo && changeFontTo > 0) {
    configurationService.backup('editor', 'fontSize');
    vscode.workspace.getConfiguration('editor').update('fontSize', changeFontTo);
  }
  configurationService.setLocal('isZenMode', true);
}

async function toggleZenWritingMode(configService: ConfigService) {
  if (!configService.getFlag('isAgreeZenMode')) {
    const option = await vscode.window.showWarningMessage(
      'Enhanced ZenMode overrides some editor settings.\n\n' +
      'It can be that some settings would need to be restored manually.\n\n' +
      'Please refer to: .',
      'OK, Continue', 'Cancel');

    if (option === 'Cancel') {
      return;
    } else {
      configService.setFlag('isAgreeZenMode');
    }
  }

  if (configService.getState().isZenMode) {
    exitZenWritingMode(configService);
  } else {
    enterZenWritingMode(configService);
  }
}


function setFullscreenTheme(configurationService: ConfigService) {
  const theme = configurationService.backup('workbench', 'colorTheme');
  vscode.workspace.getConfiguration('markdown-fiction-writer.view.enhancedZenMode').update('theme', theme, vscode.ConfigurationTarget.Global);
  vscode.window.showInformationMessage(`Zen Writing Mode theme set to: ${theme}`);
}

function getCurrentFile(): string {
  const currentFile = vscode.window.activeTextEditor?.document.fileName;
  if (currentFile) {
    const parsed = path.parse(currentFile);
    return parsed.base;
  }
  return '';
}

function compileCommand() {
  const options = new Map<string, string>([
    ['Compile current document', 'fiction-writer.extension.compileFile'],
    [`Compile TOC file: ${currentConfig.compileTocFilename}`, 'fiction-writer.extension.compileToc'],
    ['Compile all documents', 'fiction-writer.extension.compileAll'],
    ['Cancel', '']
  ]);
  vscode.window.showQuickPick([...options.keys()], { 'canPickMany': false, 'ignoreFocusOut': false })
    .then(selection => {
      console.log(selection);
      if (!selection) return;

      const cmd = options.get(selection);
      if (cmd) {
        vscode.commands.executeCommand(cmd);
      }
    });
}

function selectDialogueMode() {
  vscode.window.showQuickPick(Object.keys(DialogueMarkerMappings), { 'canPickMany': false, 'ignoreFocusOut': false })
    .then(selection => {
      if (selection && selection !== 'Cancel') {
        vscode.workspace
        .getConfiguration('markdown-fiction-writer.editDialogue')
        .update('marker', selection, vscode.ConfigurationTarget.Global);
      }
    });
}

function toggleParagraphCommand() {
  let config = vscode.workspace.getConfiguration('markdown-fiction-writer.edit');
  let current = config.get<string>('easyParagraphCreation');
  if (current === Constants.Paragraph.NEW_ON_ENTER) {
    config.update('easyParagraphCreation', Constants.Paragraph.NEW_ON_SHIFT_ENTER, vscode.ConfigurationTarget.Global);
  } else {
    config.update('easyParagraphCreation', Constants.Paragraph.NEW_ON_ENTER, vscode.ConfigurationTarget.Global);
  }
}

async function toggleTypewriterModeCommand(configService: ConfigService) {
  if (!configService.getFlag('isAgreeTypewriterMode')) {
    const option = await vscode.window.showWarningMessage(
      'Typewriter Mode overrides some editor settings.\n\n' +
      'It can be that some settings would need to be restored manually.\n\n' +
      'Please refer to: <a href="#">Tesst</a>.',
      'OK, Continue', 'Cancel');

    if (option === 'Cancel') {
      return;
    } else {
      configService.setFlag('isAgreeTypewriterMode');
    }
  }

  currentConfig.isTypewriterMode = !currentConfig.isTypewriterMode;
  configService.setLocal('isTypewriterMode', currentConfig.isTypewriterMode);
}

function toggleKeybindingsCommand() {
  let config = vscode.workspace.getConfiguration('markdown-fiction-writer.edit');
  let current = config.get<boolean>('disableKeybindings');
  config.update('disableKeybindings', !current, vscode.ConfigurationTarget.Global);
}

async function onConfigChange(event: vscode.ConfigurationChangeEvent, configuration: ConfigService) {
  if (event.affectsConfiguration('markdown-fiction-writer')) {
    const previousConfig = { ...currentConfig };
    configuration.reload();
    currentConfig = configuration.getState();

    var mdConfig = vscode.workspace.getConfiguration('editor', { languageId: 'markdown' });

    if (currentConfig.compileUseTemplateFile && !previousConfig.compileUseTemplateFile) {
      const selectedTemplate = await vscode.window.showOpenDialog({
        canSelectFiles: true,
        canSelectFolders: false,
        canSelectMany: false,
        filters: {
          '.doc, .docx or .odt files': ['odt', 'doc', 'docx'],
        }
      });

      if (selectedTemplate) {
        vscode.workspace.getConfiguration('markdown-fiction-writer.export.outputTemplate')
          .update('file', selectedTemplate[0].fsPath, vscode.ConfigurationTarget.Global);
      }
    }

    if (currentConfig.wrapIndent <= 0) {
      mdConfig.update('tabSize',
        vscode.workspace.getConfiguration('editor').get<number>('tabSize'),
        vscode.ConfigurationTarget.Workspace, true);

      mdConfig.update('wrappingIndent',
        currentConfig.wrapIndent < 0 ? 'none' : 'same',
        vscode.ConfigurationTarget.Workspace, true);

    } else {
      mdConfig.update('tabSize',
        currentConfig.wrapIndent,
        vscode.ConfigurationTarget.Workspace, true);

      mdConfig.update('wrappingIndent',
        'indent',
        vscode.ConfigurationTarget.Workspace, true);
    }
  }
}

// this method is called when your extension is deactivated
export function deactivate() { }
