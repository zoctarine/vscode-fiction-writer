import * as vscode from 'vscode';
import * as path from 'path';

import { ConfigService, Config, ContextService } from './config';
import { CompileAllCommand, CompileFileCommand, CompileTocCommand, FileIndexer } from './compile';
import { EnhancedEditBehaviour, EnhancedEditDialogueBehaviour, CustomFormattingProvider, DialogueAutoCorrectObserver } from "./edit";
import { Constants, DialogueMarkerMappings, getContentType, isDebugMode, logger, SupportedContent } from './utils';
import { DocStatisticTreeDataProvider, WordFrequencyTreeDataProvider, WordStatTreeItemSelector } from './analysis';
import { TextDecorations, FoldingObserver, StatusBarObserver, TypewriterModeObserver, WritingMode } from './view';
import { MarkdownMetadataTreeDataProvider, MetadataFileCache, MetadataFileDecorationProvider, MetadataNotesProvider, metaService } from './metadata';
import { fileManager, knownFileTypes, ProjectFilesTreeDataProvider } from './smartRename';

let currentConfig: Config;
let isWatcherEnabled = true;

export async function activate(context: vscode.ExtensionContext) {
  vscode.commands.executeCommand('setContext', 'fw:isDevelopmentMode', isDebugMode);

  const fileIndexer = new FileIndexer(metaService);
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

  const writingMode = new WritingMode(configService);
  const wordFrequencyProvider = new WordFrequencyTreeDataProvider();
  const docStatisticProvider = new DocStatisticTreeDataProvider();
  const projectFilesProvider = new ProjectFilesTreeDataProvider(configService, fileIndexer);
  const notesProvider = new MetadataNotesProvider(configService, context.extensionUri, fileIndexer, context.subscriptions);
  const metadataProvider = new MarkdownMetadataTreeDataProvider(configService, cache);
  const freqTree = vscode.window.createTreeView('fw-wordFrequencies', { treeDataProvider: wordFrequencyProvider });
  const projectTree = vscode.window.createTreeView('fw-projectFiles', { treeDataProvider: projectFilesProvider });
  const statTree = vscode.window.createTreeView('fw-statistics', { treeDataProvider: docStatisticProvider });
  const metadataTree = vscode.window.createTreeView('fw-metadata', { treeDataProvider: metadataProvider });
  const notesWebView = vscode.window.registerWebviewViewProvider('fw-notes', notesProvider, {
    webviewOptions: { retainContextWhenHidden: true }
  });
  const metadataDecoration = new MetadataFileDecorationProvider(configService, cache);
  wordFrequencyProvider.tree = freqTree;
  docStatisticProvider.tree = statTree;
  metadataProvider.tree = metadataTree;
  isWatcherEnabled = true;
  const watcher = vscode.workspace.createFileSystemWatcher(knownFileTypes.all.pattern, false, false, false);
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

    statTree.onDidChangeVisibility(e => {
      if (e.visible) docStatisticProvider.refresh();
    }),

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
    vscode.commands.registerCommand(cmd.WORDFREQ_OPEN, () => { wordFrequencyProvider.open(); }),
    vscode.commands.registerCommand(cmd.WORDFREQ_CLEAR, () => { wordFrequencyProvider.clear(); }),
    vscode.commands.registerCommand(cmd.DOCSTAT_REFRESH, () => { docStatisticProvider.refresh(); }),
    vscode.commands.registerCommand(cmd.METADATA_REFRESH, () => { metadataProvider.refresh(); }),
    vscode.commands.registerCommand(cmd.METADATA_OPEN, () => { metadataProvider.open(); }),
    vscode.commands.registerCommand(cmd.METADATA_TOGGLE_SUMMARY, () => { toggleMetadataSummary(); }),
    vscode.commands.registerCommand(cmd.TOGGLE_WRITING_MODE, () => writingMode.toggleWritingMode()),
    vscode.commands.registerCommand(cmd.TOGGLE_WRITING_AND_ZEN_MODE, () => writingMode.toggleWritingMode(true)),
    vscode.commands.registerCommand(cmd.TOGGLE_FOCUS_MODE, () => toggleFocusMode(configService)),
    vscode.commands.registerCommand(cmd.EXIT_WRITING_MODE, () => writingMode.exitWritingMode()),
    vscode.commands.registerCommand(cmd.SET_FULLSCREEN_THEME, () => writingMode.setCurrentThemeAsFullscreenTheme()),
    vscode.commands.registerCommand(cmd.SELECT_FULLSCREEN_THEME, () => writingMode.selectFullscreenTheme()),
    vscode.commands.registerCommand(cmd.SELECT_FULLSCREEN_FONT_SIZE, () => writingMode.selectFullscreenFont()),
    vscode.commands.registerCommand(cmd.UNPIN_NOTE, () => { if (notesProvider.unPin()) toggleIsNotePinned(false); }),
    vscode.commands.registerCommand(cmd.PIN_NOTE, () => { if (notesProvider.pin()) toggleIsNotePinned(true); }),
    vscode.commands.registerCommand(cmd.SAVE_NOTES, () => { notesProvider.saveNotes(); }),
    vscode.commands.registerCommand(cmd.NEW_NOTES, () => { notesProvider.newNotes(); }),
    vscode.commands.registerCommand(cmd.OPEN_NOTES, () => { notesProvider.openNotes(); }),
    vscode.commands.registerCommand(cmd.RENAME_SIMILAR, (e: vscode.Uri) => {
      const oldName = e?.fsPath;
      if (!fileManager.getPathContentType(oldName).isKnown()) return;


      const rootName = fileManager.getRoot(oldName);
      if (!rootName) return;

      const parsed = path.parse(rootName);
      vscode.window
        .showInputBox({ value: parsed.name })
        .then(fileName => {
          if (!fileName) return;
          const newName = path.join(parsed.dir, `${fileName}${parsed.ext}`);
          if (fileName) fileManager.batchRename(rootName, newName);
        });
    }),
    vscode.commands.registerCommand(cmd.DEV_SHOW_INDEXES, async () => {
      fileIndexer.getState().forEach((val) => {

        if (val.path) logger.push('- main: ' + val.path);
        if (val.metadata?.location) logger.push('- meta: ' + val.metadata?.location);
        if (val.notes?.path) logger.push('- note: ' + val.notes?.path);
        logger.info(val.key);
      });
    }),
    vscode.commands.registerCommand(cmd.DEV_REINDEX, async () => {
      fileIndexer.clear();
      indexAllOpened(fileIndexer);
      await metadataProvider.refresh(true);
      await notesProvider.refresh(true);
    }),


    vscode.window.onDidChangeActiveTextEditor(async e => {
      // TODO: This check is  necessary as sometimes, when switching documents,
      //       you first get an undefined event, followed by the correct event
      if (!e) return;

      updateContextValues(e);
      statusBar.showHide();
      docStatisticProvider.refresh();
      await metadataProvider.refresh();
      await notesProvider.refresh();
    }),

    watcher.onDidCreate(async e => {
      if (!isWatcherEnabled) return;
      logger.debug('OnDidCreate: ' + e?.fsPath);

      if (!e) return;
      if (!fileManager.getPathContentType(e?.fsPath).isKnown()) return;

      await notesProvider.refresh();

      const result = fileIndexer.index(e.fsPath);
      const pathsToRefresh = [e];
      if (result?.path) {
        pathsToRefresh.push(vscode.Uri.file(result.path));
      }
      await notesProvider.refresh();
      await metadataProvider.refresh();
      metadataDecoration.fire(pathsToRefresh);
    }),

    watcher.onDidDelete(async e => {
      if (!isWatcherEnabled) return;
      logger.debug('OnDidDelete: ' + e?.fsPath);
      if (!e) return;
      if (!fileManager.getPathContentType(e?.fsPath).isKnown()) return;

      //TODO: only index what changed
      fileIndexer.delete(e.fsPath);
      const result = fileIndexer.index(e.fsPath);

      await metadataProvider.refresh();
      await notesProvider.refresh();
      const pathsToRefresh = [e];
      if (result?.path) {
        pathsToRefresh.push(vscode.Uri.file(result.path));
      }
      metadataDecoration.fire(pathsToRefresh);
    }),

    watcher.onDidChange(async e => {
      if (!isWatcherEnabled) return;
      logger.debug('OnDidChange: ' + e?.fsPath);
      const contentType = fileManager.getPathContentType(e?.fsPath);

      if (!contentType.isKnown()) return;
      docStatisticProvider.refresh();

      const result = fileIndexer.index(e.fsPath);
      await metadataProvider.refresh(contentType.has(SupportedContent.Metadata));
      await notesProvider.refresh(contentType.has(SupportedContent.Notes));

      const pathsToRefresh = [e];
      if (result?.path) {
        pathsToRefresh.push(vscode.Uri.file(result.path));
      }
      metadataDecoration.fire(pathsToRefresh);
    }),

    vscode.workspace.onDidOpenTextDocument(e => {
      if (!getContentType(e).isKnown()) return;

      logger.debug('onDidOpenTextDocument: ' + e?.uri.fsPath);

      fileIndexer.index(e.uri.fsPath, { skipIndexedLocations: true });
    }),

    vscode.workspace.onDidCloseTextDocument(e => {
      if (!getContentType(e).isKnown()) return;

      // if not from an open workspace, then remove from indexes
      if (!vscode.workspace.getWorkspaceFolder(e.uri)) {
        fileIndexer.delete(e.uri.fsPath);
      }
      metadataDecoration.fire([e.uri]);
    }),

    vscode.workspace.onDidRenameFiles(async e => {

      if (!currentConfig.smartRenameEnabled) return;
      if (currentConfig.smartRenameRelated === Constants.RenameRelated.NEVER) return;

      for (const f of e.files) {
        logger.debug('OnDidRename: ' + f.oldUri.fsPath);

        // only trigger for fiction files
        if (!fileManager.getPathContentType(f.oldUri.fsPath).has(SupportedContent.Fiction)) return;

        if (f.oldUri.scheme === 'file' && f.newUri.scheme === 'file') {

          // do not want to interfere with move operations
          // Note: renaming of folders does not trigger file watcher (known limitation of workspace watcher that can change in the future)
          if (!fileManager.areInSameLocation(f.oldUri.fsPath, f.newUri.fsPath)) return;

          await fileManager.batchRename(f.oldUri.fsPath, f.newUri.fsPath, async (from: string, to: string) => {

            if (currentConfig.smartRenameRelated === Constants.RenameRelated.NEVER) {
              return false;
            }
            if (currentConfig.smartRenameRelated === Constants.RenameRelated.ALWAYS) {
              return true;
            }
            const options = ['Yes', 'No', 'Yes (never ask again)', 'No (never ask again)'];

            const answer = await vscode.window.showInformationMessage(`A file with similar name exists on disk. Do you want to also rename ${from}?`, ...options);
            const doRename = answer === options[0] || answer === options[2];
            const saveAnswer = answer === options[2] || answer === options[3];

            if (saveAnswer) {
              vscode.workspace
                .getConfiguration('markdown-fiction-writer.smartRename')
                .update(
                  'renameRelatedFiles',
                  doRename ? Constants.RenameRelated.ALWAYS : Constants.RenameRelated.NEVER,
                  vscode.ConfigurationTarget.Global);
            }

            return doRename;
          });
        }
      };
    })
  );

  updateContextValues(vscode.window.activeTextEditor);

  indexAllOpened(fileIndexer);

  vscode.workspace.onDidChangeWorkspaceFolders(c => {
    c.added?.forEach(f => fileIndexer.indexLocation(f.uri.fsPath, knownFileTypes.all.pattern));
    c.removed?.forEach(f => fileIndexer.removeLocation(f.uri.fsPath, knownFileTypes.all.pattern));
  });
  await metadataProvider.refresh();
  await notesProvider.refresh();
  docStatisticProvider.refresh();
  showAgreeWithChanges(configService);
  writingMode.exitWritingMode();
}

function indexAllOpened(fileIndexer: FileIndexer) {
  vscode.workspace.workspaceFolders?.forEach(f => {
    fileIndexer.indexLocation(f.uri.fsPath, knownFileTypes.all.pattern);
  });

  vscode.workspace.textDocuments?.forEach(d => {
    fileIndexer.index(d.uri.fsPath, { skipIndexedLocations: true, skipNotify: true });
  });

  fileIndexer.notify();
}

function updateContextValues(editor: vscode.TextEditor | undefined) {
  const contentType = getContentType(editor?.document);

  vscode.commands.executeCommand('setContext', 'fw:isSupportedMetadata', contentType.isKnown());
  vscode.commands.executeCommand('setContext', 'fw:isSupportedEditor', contentType.has(SupportedContent.Fiction));
}

function toggleIsNotePinned(isPineed: boolean) {
  vscode.commands.executeCommand('setContext', 'fw:isNotePinned', isPineed);
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
  vscode.window.showQuickPick(
    Object.keys(DialogueMarkerMappings),
    { 'canPickMany': false, 'ignoreFocusOut': false }
  ).then(selection => {
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


function toggleFocusMode(configService: ConfigService) {
  let enabled = configService.getState().isFocusMode;
  configService.setLocal('isFocusMode', !enabled);
}

function toggleMetadataSummary() {
  let config = vscode.workspace.getConfiguration('markdown-fiction-writer.metadata.categories');
  let enabled = config.get<boolean>('summaryEnabled');
  config.update('summaryEnabled', !enabled, vscode.ConfigurationTarget.Global);
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

