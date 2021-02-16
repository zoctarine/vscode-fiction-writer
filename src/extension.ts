import * as vscode from 'vscode';
import { ConfigObservable, Config, LocalSettingsService } from './config';
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
  let storageManager = new LocalSettingsService(context.globalState);
  let configurationService = new ConfigObservable(storageManager);
  currentConfig = configurationService.getState();

  const statusBar = new StatusBarObserver(configurationService);
  const enhancedBehaviour = new EnhancedEditorBehaviour(configurationService);
  const dialogueBehaviour = new EnhancedDialogueEditorBehaviour(configurationService);

  const behaviour = () => currentConfig.isDialogueEnabled ? dialogueBehaviour : enhancedBehaviour;
  const compileFileCommand = new CompileFileCommand(configurationService);
  const compileAllCommand = new CompileAllCommand(configurationService);
  const compileTocCommand = new CompileTocCommand(configurationService);

  const wordFrequencyProvider = new WordFrequencyTreeDataProvider();
  const docStatisticProvider = new DocStatisticTreeDataProvider();

  var freqTree = vscode.window.createTreeView('wordFrequencies', { treeDataProvider: wordFrequencyProvider });
  const statTree = vscode.window.createTreeView('statistics', { treeDataProvider: docStatisticProvider  });

  const cmd = Constants.Commands;

  context.subscriptions.push(
    statTree,
    freqTree,
    statusBar,
    new FoldingObserver(configurationService),
    new TypewriterModeObserver(configurationService),
    new FormatProviderObserver(configurationService),
    new DialogueAutoCorrectObserver(configurationService),
    new TextDecorations(configurationService),
    new FileTagDecorationProvider(configurationService),
    
    vscode.workspace.onDidChangeConfiguration((e) => onConfigChange(e, configurationService)),
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
    vscode.commands.registerCommand(cmd.TOGGLE_TYPEWRITER, toggleTypewriterModeCommand),
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
  );

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
  const options: { [key: string]: string; } = {
    'Compile: Current file': 'fiction-writer.extension.compileFile',
    'Compile: TOC file': 'fiction-writer.extension.compileToc',
    'Compile: Selection of files from current folder': 'fiction-writer.extension.compileAll',
    'Cancel': '',
  };
  vscode.window.showQuickPick(Object.keys(options), { 'canPickMany': false, 'ignoreFocusOut': false })
    .then(selection => {
      if (selection && selection !== 'Cancel'){
        vscode.commands.executeCommand(options[selection]);
      }
    });
}

function selectDialogueMode() {
  vscode.window.showQuickPick(Object.keys(DialogueMarkerMappings), { 'canPickMany': false, 'ignoreFocusOut': false })
    .then(selection => {
      if (selection && selection !== 'Cancel') {
        let config = vscode.workspace.getConfiguration('markdown-fiction-writer.edit');
        config.update('dialogueMarker', selection, vscode.ConfigurationTarget.Workspace);
      }
    });
}

function toggleParagraphCommand() {
  let config = vscode.workspace.getConfiguration('markdown-fiction-writer.edit');
  let current = config.get<string>('newParagraphHandling');
  if (current === Constants.Paragraph.NEW_ON_ENTER) {
    config.update('newParagraphHandling', Constants.Paragraph.NEW_ON_SHIFT_ENTER, vscode.ConfigurationTarget.Workspace);
  } else {
    config.update('newParagraphHandling', Constants.Paragraph.NEW_ON_ENTER, vscode.ConfigurationTarget.Workspace);
  }
}

function toggleTypewriterModeCommand() {
  let config = vscode.workspace.getConfiguration('markdown-fiction-writer.edit');
  let current = config.get<boolean>('typewriterMode');
  config.update('typewriterMode', !current, vscode.ConfigurationTarget.Workspace);
}

function toggleKeybindingsCommand() {
  let config = vscode.workspace.getConfiguration('markdown-fiction-writer.edit');
  let current = config.get<boolean>('disableKeybindings');
  config.update('disableKeybindings', !current, vscode.ConfigurationTarget.Workspace);
}

async function onConfigChange(event: vscode.ConfigurationChangeEvent, configuration: ConfigObservable) {
  if (event.affectsConfiguration('markdown-fiction-writer')) {
    const previousConfig = { ...currentConfig };
    configuration.reload();
    currentConfig = configuration.getState();

    var mdConfig = vscode.workspace.getConfiguration('editor', { languageId: 'markdown' });

    if (currentConfig.compileUseTemplateFile && !previousConfig.compileUseTemplateFile){
      const selectedTemplate = await vscode.window.showOpenDialog({
        canSelectFiles: true,
        canSelectFolders: false,
        canSelectMany: false,
        filters: {
          '.doc, .docx or .odt files': ['odt', 'doc', 'docx'],
        }
      });

      if (selectedTemplate){
        vscode.workspace.getConfiguration('markdown-fiction-writer.export')
          .update('templateFile', selectedTemplate[0].fsPath, vscode.ConfigurationTarget.Global);
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
