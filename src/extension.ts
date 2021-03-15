import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

import { ConfigService, Config, ContextService } from './config';
import { CompileAllCommand, CompileFileCommand, CompileTocCommand, FileIndexer } from './compile';
import { EnhancedEditBehaviour, EnhancedEditDialogueBehaviour, CustomFormattingProvider, DialogueAutoCorrectObserver } from "./edit";
import { Constants, DialogueMarkerMappings, getActiveEditor, getContentType, isInActiveEditor, SupportedContent } from './utils';
import { DocStatisticTreeDataProvider, WordFrequencyTreeDataProvider, WordStatTreeItemSelector } from './analysis';
import { TextDecorations, FoldingObserver, StatusBarObserver, TypewriterModeObserver } from './view';
import { MarkdownMetadataTreeDataProvider, MetadataFileCache, MetadataFileDecorationProvider, MetadataNotesProvider } from './metadata';
import { fileManager, ProjectFilesTreeDataProvider } from './smartRename';

let currentConfig: Config;

export function activate(context: vscode.ExtensionContext) {
  vscode.commands.executeCommand('setContext', 'isDevelopmentMode', true);

  const fileIndexer = new FileIndexer();
  const storageManager = new ContextService(context.globalState);
  const configService = new ConfigService(storageManager);
  const cache = new MetadataFileCache(fileIndexer, configService);

  currentConfig = configService.getState();

  const statusBar = new StatusBarObserver(configService);
  const enhancedBehaviour = new EnhancedEditBehaviour(configService);
  const dialogueBehaviour = new EnhancedEditDialogueBehaviour(configService);

  const behaviour = () => currentConfig.isDialogueEnabled ? dialogueBehaviour : enhancedBehaviour;
  const compileFileCommand = new CompileFileCommand(configService, fileIndexer);
  const compileAllCommand = new CompileAllCommand(configService, fileIndexer);
  const compileTocCommand = new CompileTocCommand(configService, fileIndexer);

  const wordFrequencyProvider = new WordFrequencyTreeDataProvider();
  const docStatisticProvider = new DocStatisticTreeDataProvider();
  const projectFilesProvider = new ProjectFilesTreeDataProvider(configService, fileIndexer);
  const notesProvider = new MetadataNotesProvider(context.extensionUri, fileIndexer);

  const metadataProvider = new MarkdownMetadataTreeDataProvider(configService, cache);
  const freqTree = vscode.window.createTreeView('fw-wordFrequencies', { treeDataProvider: wordFrequencyProvider });
  const projectTree = vscode.window.createTreeView('fw-projectFiles', { treeDataProvider: projectFilesProvider });
  const statTree = vscode.window.createTreeView('fw-statistics', { treeDataProvider: docStatisticProvider });
  const metadataTree = vscode.window.createTreeView('fw-metadata', { treeDataProvider: metadataProvider });
  const metadataDecoration = new MetadataFileDecorationProvider(configService, cache);
  metadataProvider.tree = metadataTree;
  const notesWebView = vscode.window.registerWebviewViewProvider(MetadataNotesProvider.viewType, notesProvider, {
    webviewOptions: { retainContextWhenHidden: true }
  });

  const watcher = vscode.workspace.createFileSystemWatcher('**/*.{[mM][dD],[yY][mM][lL],[tT][xX][tT]}', false, false, false);
  const cmd = Constants.Commands;
  context.subscriptions.push(
    cache,
    watcher,
    statTree,
    freqTree,
    projectTree,
    metadataTree,
    metadataDecoration,
    statusBar,
    fileIndexer,
    notesWebView,


    new FoldingObserver(configService),
    new TypewriterModeObserver(configService),
    new CustomFormattingProvider(configService),
    new DialogueAutoCorrectObserver(configService),
    new TextDecorations(configService),

    vscode.workspace.onDidChangeConfiguration((e) => onConfigChange(e, configService)),

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
    vscode.commands.registerCommand(cmd.WORDFREQ_FIND_PREV, (e) => { WordStatTreeItemSelector.prev([e]); }),
    vscode.commands.registerCommand(cmd.WORDFREQ_FIND_NEXT, (e) => { WordStatTreeItemSelector.next([e]); }),
    vscode.commands.registerCommand(cmd.WORDFREQ_REFRESH, () => { wordFrequencyProvider.refresh(); }),
    vscode.commands.registerCommand(cmd.WORDFREQ_CLEAR, () => { wordFrequencyProvider.clear(); }),
    vscode.commands.registerCommand(cmd.DOCSTAT_REFRESH, () => { docStatisticProvider.refresh(); }),
    vscode.commands.registerCommand(cmd.METADATA_REFRESH, () => { metadataProvider.refresh(); }),
    vscode.commands.registerCommand(cmd.TOGGLE_ZEN_MODE, () => toggleZenWritingMode(configService)),
    vscode.commands.registerCommand(cmd.EXIT_ZEN_MODE, () => exitZenWritingMode(configService)),
    vscode.commands.registerCommand(cmd.SET_FULLSCREEN_THEME, () => setFullscreenTheme(configService)),
    vscode.commands.registerCommand(cmd.UNPIN_NOTE, () => { if (notesProvider.unPin()) toggleIsNotePinned(false); }),
    vscode.commands.registerCommand(cmd.PIN_NOTE, () => { if (notesProvider.pin()) toggleIsNotePinned(true); }),
    vscode.commands.registerCommand(cmd.SAVE_NOTES, (e) => { notesProvider.saveNotes(); }),
    vscode.commands.registerCommand(cmd.NEW_NOTES, (e) => { notesProvider.newNotes(); }),
    vscode.commands.registerCommand(cmd.OPEN_NOTES, (e) => { notesProvider.openNotes(); }),

    vscode.commands.registerCommand(cmd.MOVE_FILE_UP, (e) => { fileManager.smartRename(e.fsPath); }),

    vscode.window.onDidChangeActiveTextEditor(async e => {
      updateIsSupportedEditor(e);
      statusBar.showHide();
      const docUri = e?.document?.uri;

      if (isInActiveEditor(docUri, SupportedContent.Fiction)) {
        docStatisticProvider.refresh();
        notesProvider.loadDocument(e?.document?.uri?.fsPath);
      };

      if (isInActiveEditor(docUri, SupportedContent.Notes)) {
        notesProvider.loadDocument(e?.document?.uri?.fsPath);
      };

      if (isInActiveEditor(docUri, SupportedContent.Metadata)) {
        await metadataProvider.refresh();
        notesProvider.loadDocument(e?.document?.uri?.fsPath);
      }
    }),

    watcher.onDidCreate(e => {
      if (!e) return;
      if (!fileManager.getPathContentType(e?.fsPath).isKnown()) return;

      fileIndexer.index(e.fsPath);

      if (isInActiveEditor(e, SupportedContent.Metadata)) {
        metadataProvider.refresh();
      }

      notesProvider.refresh();

      metadataDecoration.fire([e]);
    }),

    watcher.onDidDelete(e => {
      if (!e) return;
      if (!fileManager.getPathContentType(e?.fsPath).isKnown()) return;

      // TODO: delete notes or meta before deleting fiction
      fileIndexer.delete(e.fsPath);

      if (isInActiveEditor(e, SupportedContent.Metadata)) {
        metadataProvider.refresh();
      }
      metadataDecoration.fire([e]);
    }),


    watcher.onDidChange(async e => {
      if (!fileManager.getPathContentType(e?.fsPath).isKnown()) return;

      fileIndexer.index(e.fsPath);

      if (isInActiveEditor(e, SupportedContent.Fiction)) {
        docStatisticProvider.refresh();
      }

      if (isInActiveEditor(e, SupportedContent.Notes)) {
        notesProvider.loadDocument(e?.fsPath);
      };

      if (isInActiveEditor(e, SupportedContent.Metadata)) {
        metadataProvider.refresh();
      }
      metadataDecoration.fire([e]);
    }),

    vscode.workspace.onDidOpenTextDocument(e => {
      if (!getContentType(e).isKnown()) return;

      fileIndexer.index(e.uri.fsPath);
    }),

    vscode.workspace.onDidCloseTextDocument(e => {
      if (!getContentType(e).isKnown()) return;

      // if not from an open workspace, then remove from indexes
      if (!vscode.workspace.getWorkspaceFolder(e.uri)) {
        fileIndexer.delete(e.uri.fsPath);
      }
      metadataDecoration.fire([e.uri]);
    }),

    vscode.workspace.onWillRenameFiles(e => {
      if (!currentConfig.smartEditEnabled) return;

      e.files.forEach(f => {
        if (f.oldUri.scheme === 'file' && f.newUri.scheme === 'file') {

          fileManager.batchRename(f.oldUri.fsPath, f.newUri.fsPath, (from: string, to: string) => {
            if (currentConfig.smartEditRenameRelated === Constants.RenameRelated.NEVER) {
              return Promise.resolve(false);
            }
            if (currentConfig.smartEditRenameRelated === Constants.RenameRelated.ALWAYS) {
              return Promise.resolve(true);
            }
            return new Promise((resolve, reject) => {
              const options = ['Yes', 'No', 'Yes (never ask again)', 'No (never ask again)'];

              return vscode.window.showInformationMessage(`A file with similar name exists on disk. Do you want to also rename/move ${from}?`, ...options)
                .then(answer => {
                  const doRename = answer === options[0] || answer === options[2];
                  const saveAnswer = answer === options[2] || answer === options[3];

                  if (saveAnswer) {
                    vscode.workspace
                      .getConfiguration('markdown-fiction-writer.smartEdit')
                      .update(
                        'renameRelatedFiles',
                        doRename ? Constants.RenameRelated.ALWAYS : Constants.RenameRelated.NEVER,
                        vscode.ConfigurationTarget.Global);
                  }

                  return resolve(doRename);
                });
            });
          });
        }
      });
    })
  );

  const globPattern = '**/*.{[mM][dD],[yY][mM][lL],[tT][xX][tT]}';

  updateIsSupportedEditor(vscode.window.activeTextEditor);
  fileIndexer.index(vscode.window.activeTextEditor?.document.uri.fsPath);
  vscode.workspace.workspaceFolders?.forEach(f => {
    fileIndexer.indexLocation(f.uri.fsPath, globPattern);
  });

  vscode.workspace.onDidChangeWorkspaceFolders(c => {
    c.added?.forEach(f => fileIndexer.indexLocation(f.uri.fsPath, globPattern));
    c.removed?.forEach(f => fileIndexer.removeLocation(f.uri.fsPath, globPattern));
  });
  metadataProvider.refresh();
  docStatisticProvider.refresh();
  notesProvider.refresh();
  notesProvider.loadDocument(getActiveEditor(SupportedContent.Notes)?.document?.uri?.fsPath);
  showAgreeWithChanges(configService);
  exitZenWritingMode(configService);
}

function updateIsSupportedEditor(editor: vscode.TextEditor | undefined) {
  const contentType = getContentType(editor?.document);

  vscode.commands.executeCommand('setContext', 'fw:isSupportedEditor', contentType.has(SupportedContent.Fiction));
  vscode.commands.executeCommand('setContext', 'fw:isSupportedMetadata', contentType.has(SupportedContent.Metadata) || contentType.has(SupportedContent.Notes));
}

function toggleIsNotePinned(isPineed: boolean) {
  vscode.commands.executeCommand('setContext', 'fw:isNotePinned', isPineed);
}

function exitZenWritingMode(configurationService: ConfigService) {
  if (configurationService.getState().isZenMode) {
    configurationService.restore('workbench', 'colorTheme');
    configurationService.restore('editor', 'fontSize');
    configurationService.setLocal('isZenMode', false);
  }
}

function enterZenWritingMode(configurationService: ConfigService) {
  const changeThemeTo = configurationService.getState().viewZenModeTheme;
  const changeFontTo = configurationService.getState().viewZenModeFontSize;

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
      'It can be that some settings would need to be restored manually. Make sure  you turn ZenMode off before deactivating/uninstalling this extension.',
      'OK, Continue', 'Cancel', 'Read More');

    if (option === 'OK, Continue') {
      configService.setFlag('isAgreeZenMode');
    } if (option === 'Read More') {
      vscode.env.openExternal(vscode.Uri.parse('https://zoctarine.github.io/vscode-fiction-writer/view/#writing-mode'));
    } else {
      return;
    }
  }

  if (configService.getState().isZenMode) {
    exitZenWritingMode(configService);
  } else {
    enterZenWritingMode(configService);
  }
}



async function showAgreeWithChanges(configService: ConfigService) {
  let version = 'latest version';
  let change = '0043-alpha43';
  try {
    version = vscode.extensions.getExtension('vsc-zoctarine.markdown-fiction-writer')!.packageJSON.version ?? version;
    const alphaVersion: string[] = version.split('.');
    change = alphaVersion.join('') + '-alpha' + alphaVersion[2];
  } catch { }

  const flag = `isAgreeChanges${change}`;
  const uri = `https://zoctarine.github.io/vscode-fiction-writer/changelog/#${change}`;

  if (!configService.getFlag(flag)) {
    const option = await vscode.window.showWarningMessage(
      `Markdwon Fiction Writer ${version} introduces some breaking changes from the previous version.\n\n` +
      'Please review the extension configuration settings.\n\n',
      'Ok (don\'t show this notification)', 'View Changes');

    if (option === 'View Changes') {
      vscode.env.openExternal(vscode.Uri.parse(uri));
      return;
    } else if (option === 'Ok (don\'t show this notification)') {
      configService.setFlag(flag);
    }
  }
}

function setFullscreenTheme(configurationService: ConfigService) {
  const theme = configurationService.backup('workbench', 'colorTheme');
  vscode.workspace.getConfiguration('markdown-fiction-writer.view.writingMode').update('theme', theme, vscode.ConfigurationTarget.Global);
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
      'Make sure you exit writer mode before deactivating/uninstalling this extension.',
      'OK, Continue', 'Cancel', 'ReadMore');

    if (option === 'OK, Continue') {
      configService.setFlag('isAgreeTypewriterMode');
    } else if (option === 'ReadMore') {
      vscode.env.openExternal(vscode.Uri.parse('https://zoctarine.github.io/vscode-fiction-writer/view/#writing-mode'));
    } else {
      return;
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
    configuration.reload(event);
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
export function deactivate() {
}

