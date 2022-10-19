import { describe, it } from '@jest/globals';
import { FileManager } from '../../../smartRename';
import { SupportedContent } from '../../../utils';
import * as path from 'path';

const glob = require('glob');
const fs = require('fs');

jest.mock('glob', () => ({ sync: jest.fn() }));
jest.mock('fs', () => ({ existsSync: jest.fn().mockReturnValue(true) }));

describe('FileManager', () => {
  let sut: FileManager;

  beforeEach(() => {
    sut = new FileManager({
      attach: jest.fn(),
      detach: jest.fn(),
      notify: jest.fn(),
      getState: jest.fn(),
    });
    glob.sync.mockReset();
    fs.existsSync.mockImplementation(() => true);
  });

  describe('getRoot()', () => {
    it.each([
      '',
      'some/unsupporoted/file.name',
      'this\\a\\file.txt',
      'this/a/file.txt',
      'this/a/yamlFile.yml',
      'file.yml',
      'file.docx',
      'c:\\test\\file.ext',
    ])('should return empty for: %s', unsupportedPath => {
      const result = sut.getRoot(unsupportedPath);
      expect(result).toBeUndefined();
    });

    it.each([
      { path: 'fileName.md', expected: 'fileName.md' },
      { path: 'fileName.MD', expected: 'fileName.MD' },
      { path: 'filename.MD.txt', expected: 'filename.MD' },
      { path: 'filename.md.yml', expected: 'filename.md' },
      { path: 'some/path/filename.md', expected: path.normalize('some/path/filename.md') },
      { path: 'some/path/filename.md.txt', expected: path.normalize('some/path/filename.md') },
      { path: 'some/path/filename.md.TXT', expected: path.normalize('some/path/filename.md') },
      { path: 'some/path/filename.md.yml', expected: path.normalize('some/path/filename.md') },
      { path: 'some/path/filename.md.YMl', expected: path.normalize('some/path/filename.md') },
      {
        path: 'c:\\some\\path\\filename.md',
        expected: path.normalize('c:\\some\\path\\filename.md'),
      },
      {
        path: 'c:\\some\\path\\filename.md.txt',
        expected: path.normalize('c:\\some\\path\\filename.md'),
      },
      {
        path: 'c:\\some\\path\\filename.md.TXT',
        expected: path.normalize('c:\\some\\path\\filename.md'),
      },
      {
        path: 'c:\\some\\path\\filename.md.yml',
        expected: path.normalize('c:\\some\\path\\filename.md'),
      },
      {
        path: 'c:\\some\\path\\filename.md.YMl',
        expected: path.normalize('c:\\some\\path\\filename.md'),
      },
    ])('should return .md filename for: %s.path', ({ path, expected }) => {
      const result = sut.getRoot(path);
      expect(result).toBe(expected);
    });
  });

  describe('getPathContentType()', () => {
    describe('without strict flag', () => {
      it.each(['.md', '.MD', '.mD', '.Md'])(
        'should return Fiction and Metadata for %s extension',
        (ext: string) => {
          const filePath = path.join('some', 'file', 'path', `filename${ext}`);

          const content = sut.getPathContentType(filePath);

          expect(content.has(SupportedContent.Fiction)).toBeTruthy();
          expect(content.has(SupportedContent.Metadata)).toBeTruthy();
          expect(content.has(SupportedContent.Unknown)).toBeFalsy();
        }
      );

      it.each(['.md.yml', '.MD.ymL', '.md.YML', '.Md.yML'])(
        'should return only Metadata for %s extension',
        (ext: string) => {
          const filePath = path.join('some', 'file', 'path', `filename${ext}`);
          const strict = true;

          const content = sut.getPathContentType(filePath, strict);

          expect(content.has(SupportedContent.Metadata)).toBeTruthy();
          expect(content.has(SupportedContent.Fiction)).toBeFalsy();
          expect(content.has(SupportedContent.Unknown)).toBeFalsy();
        }
      );
    });

    describe('with strict flag', () => {
      it.each(['.md', '.MD', '.mD', '.Md'])(
        'should return only Fiction for %s extension',
        (ext: string) => {
          const filePath = path.join('some', 'file', 'path', `filename${ext}`);
          const strict = true;

          const content = sut.getPathContentType(filePath, strict);

          expect(content.has(SupportedContent.Fiction)).toBeTruthy();
          expect(content.has(SupportedContent.Metadata)).toBeFalsy();
          expect(content.has(SupportedContent.Unknown)).toBeFalsy();
        }
      );

      it.each(['.md.yml', '.MD.ymL', '.md.YML', '.Md.yML'])(
        'should return only Metadata for %s extension',
        (ext: string) => {
          const filePath = path.join('some', 'file', 'path', `filename${ext}`);
          const strict = true;

          const content = sut.getPathContentType(filePath, strict);

          expect(content.has(SupportedContent.Metadata)).toBeTruthy();
          expect(content.has(SupportedContent.Fiction)).toBeFalsy();
          expect(content.has(SupportedContent.Unknown)).toBeFalsy();
        }
      );
    });
  });

  describe('getGroup()', () => {
    it.each([
      { fsPath: path.join('some', 'file', 'f.md'), meta: path.join('some', 'file', 'f.md.yml') },
      { fsPath: path.join('some', 'file', 'f.MD'), meta: path.join('some', 'file', 'f.MD.yML') },
    ])('should get existing meta file for fiction file: %s.fsPath', ({ fsPath, meta }) => {
      glob.sync.mockImplementationOnce(() => [meta]);

      const group = sut.getGroup(fsPath);

      expect([...group.files.entries()]).toStrictEqual([
        [SupportedContent.Fiction, fsPath],
        [SupportedContent.Metadata, meta],
      ]);
    });

    it.each([
      { fsPath: path.join('some', 'file', 'n.MD.YmL'), fiction: path.join('some', 'file', 'n.MD') },
      { fsPath: path.join('some', 'file', 'n.md.yml'), fiction: path.join('some', 'file', 'n.md') },
    ])('should get existing fiction file for meta file: %s.fsPath', ({ fsPath, fiction }) => {
      glob.sync.mockImplementationOnce(() => [fiction, fsPath]);

      const group = sut.getGroup(fsPath);

      expect([...group.files.entries()]).toStrictEqual([
        [SupportedContent.Fiction, fiction],
        [SupportedContent.Metadata, fsPath],
      ]);
    });

    it.each([
      { fsPath: path.join('some', 'file', 'n.MD.yml'), expContent: SupportedContent.Metadata },
      { fsPath: path.join('some', 'file', 'n.md'), expContent: SupportedContent.Fiction },
    ])('should return empty if no .md file found: %s.fsPath', ({ fsPath, expContent }) => {
      fs.existsSync.mockImplementation(() => false);
      glob.sync.mockImplementationOnce(() => []);

      const group = sut.getGroup(fsPath);

      expect(group.isEmpty()).toBeTruthy();
    });
  });
});
