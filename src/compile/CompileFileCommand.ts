import { StatusBarAlignment, StatusBarItem, Uri, window, workspace } from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { exec, execSync } from 'child_process';
import { Config } from '../config';
import { Constants, OutputFormats, RegEx } from '../utils';
import { TextEditor } from 'vscode';
import { IObservable, Observer } from '../observable';

export class CompileFileCommand extends Observer<Config> {
  protected item: StatusBarItem;

  constructor(config: IObservable<Config>) {
    super(config);

    this.item = window.createStatusBarItem(StatusBarAlignment.Left, 0);
    this.item.text = `$(sync~spin) Exporting document...`;
  }

  public async execute() {
    const editor = window.activeTextEditor;
    if (!editor) { return; }

    let format = undefined;
    if (this.state.compileShowFormatPicker) {
      format = await window.showQuickPick(Object.keys(OutputFormats));
    }
    this.item.show();
    await this.convertAndOpen(editor, [editor.document.fileName], undefined, format);
  }

  protected makeToc(inputs: Array<string>, errors: Array<string>)
    : { includePath: string, text: string, success: boolean } {
    try {
      const inputPath = inputs[0];
      return {
        text: fs.readFileSync(inputPath, 'UTF-8'),
        includePath: path.parse(inputPath).dir,
        success: true
      };
    } catch {
      errors.push(`Cannot read: ${inputs.join(', ')}`);
      return { text: '', includePath: '', success: false };
    }
  }

  protected async convertAndOpen(editor: TextEditor, inputs: Array<string>, outputName?: string, format?: string) {
    try {
      const doc = editor.document;
      const docPath = path.parse(path.resolve(doc.fileName));
      const errors: string[] = [];

      const tempCompiled = path.join(docPath.dir, `~${docPath.name}.tmp`);
      const outputPath = path.parse(tempCompiled);
      if (!fs.existsSync(outputPath.dir)) {
        fs.mkdirSync(outputPath.dir);
      }

      const buffer: string[] = [];
      const compiled = this.makeToc(inputs, errors);

      if (compiled.success) { this.load(compiled.text, compiled.includePath, buffer, [], errors); }

      if (errors.length > 0) { window.showErrorMessage(errors.join('; ')); }

      if (buffer.length === 0) { return; }

      fs.writeFileSync(tempCompiled, buffer.join('\n'));

      const outputFormat = format || this.state.compileOutputFormat;
      const ext = OutputFormats[outputFormat];

      let filename = 'untitled';
      if (!doc.isUntitled) {
        filename = outputName ? outputName : docPath.name;
      }
      let output = path.join(docPath.dir, filename + '.' + ext);
      try {

        if (this.state.compileShowSaveDialogue) {
          const result = await window.showSaveDialog({
            defaultUri: Uri.file(output),
          });

          if (result) {
            output = result.fsPath;
          } else {
            return;
          }
        }

        const inputFormat = 'markdown' + (this.state.compileEmDash ? '+old_dashes' : '');
        const input = `"${tempCompiled}"`;

        let template = '';
        if (['odt', 'docx'].includes(ext) &&
          this.state.compileTemplateFile &&
          this.state.compileTemplateFile.endsWith('.' + ext)) {
          let templatePath = this.state.compileTemplateFile;

          if (!path.isAbsolute(templatePath)) {
            templatePath = path.resolve(docPath.dir, templatePath);
          }
          template = `--reference-doc "${templatePath}"`;
        }

        execSync(`pandoc -f ${inputFormat} -t ${outputFormat} -s ${input} -o "${output}" ${template}`);
        const selection = await window.showInformationMessage(`Successfully compiled to '${outputFormat}':`, output);
        if (selection === output) {
          const cmd = `"${output.replace('"', '\\"')}"`;
          switch (process.platform) {
            case 'win32':
              exec(cmd);
              break;
            case 'darwin':
              exec(`\`open ${cmd}; exit\``);
              break;
            case 'linux':
              exec(`\`xdg-open ${cmd}; exit\``);
              break;
            default:
              window.showWarningMessage("Unknown platform!");
              break;
          }

        }
      }
      catch (error) {
        window.showErrorMessage('Error converting to [' + outputFormat + ']\n\n' + error.toString());
      } finally {
        try {
          fs.unlinkSync(tempCompiled);
        } catch (error) {
          window.showErrorMessage(`Could not delete temporary file: ${tempCompiled}. ` + error);
        }
      }
    }
    catch (Error) {
      window.showErrorMessage(Error);
    } finally {
      this.item.hide();
    }
  }


  private load(text: string, rootPath: string, buffer: Array<string>, opened: Array<string>, errors: Array<string>) {
    if (!buffer) { buffer = []; }

    const lines = text.split(/\n/);

    for (let line of lines) {
      let trimmedLine = line.trim();
      if (trimmedLine.startsWith('//') && this.state.compileSkipCommentsFromToc) {
        // comment skipped
      } else {
        let includedFiles = trimmedLine.match(RegEx.MARKDOWN_INCLUDE_FILE);
        if (includedFiles && includedFiles.length > 0) {
          includedFiles.forEach(match => {
            match = match.replace(RegEx.MARKDOWN_INCLUDE_FILE_BOUNDARIES, '').trim();
            let includedPath = path.isAbsolute(match)
              ? match
              : path.join(rootPath, match);
            this.loadFile(includedPath, buffer, opened, errors);
          });
        } else {
          buffer.push(line);
        }
      }
    }
  }

  private loadFile(filePath: string, buffer: Array<string>, opened: Array<string>, errors: Array<string>) {
    if (opened.includes(filePath)) {
      errors.push(`File: ${filePath} is included multiple times. Skipping.`);
      return [];
    }

    const index = opened.push(filePath) - 1;

    if (fs.existsSync(filePath)) {
      const docPath = path.parse(filePath);
      const text = fs.readFileSync(filePath, 'UTF-8');
      this.load(text, docPath.dir, buffer, opened, errors);
    } else {
      errors.push(`Could not export file: ${filePath}. File is missing.`);
    }
    opened.splice(index, 1);
  }
}