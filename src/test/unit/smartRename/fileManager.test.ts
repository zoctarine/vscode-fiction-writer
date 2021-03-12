import { each } from '..';
import { FileManager } from '../../../smartRename';
import { SupportedContent } from '../../../utils';
import * as path from 'path';

const glob = require('glob');

jest.mock('glob', () => ({sync: jest.fn()}));

describe('FileManager', () => {

  let sut: FileManager;

  beforeEach(() => {
    sut = new FileManager();
    glob.sync.mockReset();
  });

  describe('getPathContentType()', () => {

    describe('without strict flag', () => {
      each([
        '.md', '.MD', '.mD', '.Md'
      ])('should return Fiction and Metadata for %s extension', (ext: string) => {
        const filePath = path.join('some', 'file', 'path', 'filename', ext);

        const content = sut.getPathContentType(filePath);

        expect(content.has(SupportedContent.Fiction)).toBeTruthy();
        expect(content.has(SupportedContent.Metadata)).toBeTruthy();
        expect(content.has(SupportedContent.Unknown)).toBeFalsy();
      });

      each([
        '.yml', '.ymL', '.yMl', '.yML', 
        '.Yml', '.YmL', '.YMl', '.YML',
      ])('should return only Metadata for %s extension', (ext: string) => {
        const filePath = path.join('some', 'file', 'path', 'filename', ext);
        const strict = true;

        const content = sut.getPathContentType(filePath, strict);

        expect(content.has(SupportedContent.Metadata)).toBeTruthy();
        expect(content.has(SupportedContent.Fiction)).toBeFalsy();
        expect(content.has(SupportedContent.Unknown)).toBeFalsy();
      });
    });

    describe('with strict flag', () => {
      each([
        '.md', '.MD', '.mD', '.Md'
      ])('should return only Fiction for %s extension', (ext: string) => {
        const filePath = path.join('some', 'file', 'path', 'filename', ext);
        const strict = true;

        const content = sut.getPathContentType(filePath, strict);

        expect(content.has(SupportedContent.Fiction)).toBeTruthy();
        expect(content.has(SupportedContent.Metadata)).toBeFalsy();
        expect(content.has(SupportedContent.Unknown)).toBeFalsy();
      });

      each([
        '.yml', '.ymL', '.yMl', '.yML', 
        '.Yml', '.YmL', '.YMl', '.YML',
      ])('should return only Metadata for %s extension', (ext: string) => {
        const filePath = path.join('some', 'file', 'path', 'filename', ext);
        const strict = true;

        const content = sut.getPathContentType(filePath, strict);

        expect(content.has(SupportedContent.Metadata)).toBeTruthy();
        expect(content.has(SupportedContent.Fiction)).toBeFalsy();
        expect(content.has(SupportedContent.Unknown)).toBeFalsy();
      });
    });
  });

  describe('getGroup()', () => {
    each([
      {fsPath: path.join('some', 'file', 'f.md'), meta: path.join('some', 'file', 'f.yml')},
      {fsPath: path.join('some', 'file', 'f.MD'), meta: path.join('some', 'file', 'f.yML')}
    ])('should get existing meta file for fiction file: %s.fsPath', ({fsPath, meta}) => {

      glob.sync.mockImplementationOnce(() => [meta]);

      const group = sut.getGroup(fsPath); 
      
      expect(group.path).toBe(fsPath);
      expect(group.content).toBe(SupportedContent.Fiction);
      expect([...group.other.entries()]).toStrictEqual([[SupportedContent.Metadata, meta]]);
      expect(glob.sync).toBeCalledWith(path.join('some', 'file', 'f.[yY][mM][lL]'));
    });

    each([
      {fsPath: path.join('some', 'file', 'n.YmL'), fiction: path.join('some', 'file', 'n.Md')},
      {fsPath: path.join('some', 'file', 'n.yml'), fiction: path.join('some', 'file', 'n.md')}
    ])('should get existing fiction file for meta file: %s.fsPath', ({fsPath, fiction}) => {

      glob.sync.mockImplementationOnce(() => [fiction]);

      const group = sut.getGroup(fsPath); 
      
      expect(group.path).toBe(fsPath);
      expect(group.content).toBe(SupportedContent.Metadata);
      expect([...group.other.entries()]).toStrictEqual([[SupportedContent.Fiction, fiction]]);
      expect(glob.sync).toBeCalledWith(path.join('some', 'file', 'n.[mM][dD]'));
    });

    each([
      {fsPath: path.join('some', 'file', 'n.YmL'), expContent: SupportedContent.Metadata },
      {fsPath: path.join('some', 'file', 'n.md'), expContent: SupportedContent.Fiction }
    ])('should leave other files empty if no match is found: %s.fsPath', ({fsPath, expContent}) => {

      glob.sync.mockImplementationOnce(() => []);

      const group = sut.getGroup(fsPath); 
      
      expect(group.path).toBe(fsPath);
      expect(group.content).toBe(expContent);
      expect([...group.other.entries()]).toStrictEqual([]);
    });
  });
});