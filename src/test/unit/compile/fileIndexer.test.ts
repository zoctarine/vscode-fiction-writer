import { unique } from '..';
import { sync } from 'glob';
import { existsSync } from 'fs';
import * as path from 'path';

import { IMetadata, MetaLocation, MetadataService } from '../../../metadata';

let normalizeMock = jest.fn();
let extractMetadata = jest.fn();

const metaServiceMock = jest.fn<MetadataService, []>(() => ({
  extractMetadata: extractMetadata,
}));

const configServiceMock = {
  attach: jest.fn(),
  detach: jest.fn(),
  notify: jest.fn(),
  getState: jest.fn(),
};

jest.mock('glob');
jest.mock('vscode');
jest.mock('fs');

const syncMock = sync as jest.Mock;
const existSyncMock = existsSync as jest.Mock;

import { FileIndexer } from '../../../compile';
import { FileManager, knownFileTypes } from '../../../smartRename';
import { Config } from '../../../config';
import { IObservable } from '../../../utils';

const fileManager = new FileManager(configServiceMock);

describe('FileIndexer', () => {
  let sut: FileIndexer;

  beforeEach(() => {
    sut = new FileIndexer(new metaServiceMock(), fileManager);
    syncMock.mockReset();
    extractMetadata.mockReset();
    existSyncMock.mockReset();

    // for now, let always find the indexed file
    existSyncMock.mockReturnValue(true);
  });

  describe('_constructor()', () => {
    it('should create obj with empty path collection', () => {
      expect(sut.keys()).toStrictEqual([]);
    });
  });

  describe('index()', () => {
    it('should do nothing with empty location', async () => {
      sut.index('');

      expect(sut.keys()).toStrictEqual([]);
    });

    it('should not index unsupported files', () => {
      const filePath = unique('file/location') + '.docx';

      sut.index(filePath);

      expect(sut.keys()).toStrictEqual([]);
      expect(sut.getByPath(filePath)).toBeUndefined();
    });

    it('should index files without metadata', () => {
      const filePath = uniqueMdFile('file/location');
      syncMock.mockReturnValue([filePath]);

      sut.index(filePath);

      expect(sut.keys().length).toBe(1);
      expect(sut.getByPath(filePath)).toStrictEqual({
        id: undefined,
        key: fileManager.normalize(filePath),
        path: filePath,
        metadata: undefined,
        notes: undefined,
        summary: undefined,
      });
    });

    it('should index file metadata for files without metadata.id', () => {
      const filePath = uniqueMdFile('file/location');
      const metadata: IMetadata = {
        type: MetaLocation.Internal,
        value: { notId: 'someValue' },
      };
      syncMock.mockReturnValue([filePath]);
      extractMetadata.mockReturnValue(metadata);
      normalizeMock.mockReturnValue(filePath);
      sut.index(filePath);

      expect(sut.keys().length).toBe(1);
      expect(sut.getByPath(filePath)).toStrictEqual({
        id: undefined,
        key: fileManager.normalize(filePath),
        path: filePath,
        metadata: metadata,
        notes: undefined,
        summary: undefined,
      });
    });

    it('should index entries with same id and return all of them', () => {
      // ARRANGE
      const path1 = uniqueMdFile('path1');
      const id12 = unique('id 1 and 2');
      const meta1 = { type: MetaLocation.Internal, value: { id: id12 } };
      const expectedInfo1 = {
        id: id12,
        metadata: meta1,
        path: path1,
        key: path1,
        notes: undefined,
        summary: undefined,
      };

      const path2 = uniqueMdFile('path2');
      const meta2 = { type: MetaLocation.Internal, value: { id: id12, a: 'A', b: 'B' } }; // same id as path 1
      const expectedInfo2 = {
        id: id12,
        metadata: meta2,
        path: path2,
        key: path2,
        notes: undefined,
        summary: undefined,
      };

      const path3 = uniqueMdFile('path3');
      const id3 = unique('id 3');
      const meta3 = { type: MetaLocation.Internal, value: { id: id3, somethingElse: 'test' } };
      const expectedInfo3 = {
        id: id3,
        metadata: meta3,
        path: path3,
        key: path3,
        notes: undefined,
        summary: undefined,
      };

      extractMetadata
        .mockImplementationOnce(p => meta1)
        .mockImplementationOnce(p => meta2)
        .mockImplementationOnce(p => meta3);

      // ACT
      syncMock.mockReturnValue([path1]);
      sut.index(path1);
      syncMock.mockReturnValue([path2]);
      sut.index(path2);
      syncMock.mockReturnValue([path3]);
      sut.index(path3);

      // ASSERT
      expect(sut.getById(id12)).toStrictEqual([expectedInfo1, expectedInfo2]);
      expect(sut.getById(id3)).toStrictEqual([expectedInfo3]);

      expect(sut.keys().sort()).toStrictEqual([path1, path2, path3].sort());
      expect(sut.getByPath(path1)).toStrictEqual(expectedInfo1);
      expect(sut.getByPath(path2)).toStrictEqual(expectedInfo2);
      expect(sut.getByPath(path3)).toStrictEqual(expectedInfo3);
      expect(extractMetadata.mock.calls.length).toBe(3);
    });

    it('should index file id for files with metetadata.id', async () => {
      const fsPath = uniqueMdFile('path');
      const id = unique('id');
      const metadata = { type: MetaLocation.Internal, value: { id: id } };
      const expectedInfo = {
        id,
        metadata,
        path: fsPath,
        key: fsPath,
        notes: undefined,
        summary: undefined,
      };
      extractMetadata.mockReturnValue(metadata);
      syncMock.mockReturnValue([fsPath]);

      sut.index(fsPath);

      expect(sut.keys().length).toBe(1);
      expect(sut.getById(id)).toStrictEqual([expectedInfo]);
      expect(sut.getByPath(fsPath)).toStrictEqual(expectedInfo);
      expect(extractMetadata.mock.calls.length).toBe(1);
    });

    it('should index only filepath if extractMeta throws error', () => {
      extractMetadata.mockImplementation(p => {
        throw new Error();
      });
      const fsPath = uniqueMdFile('any path');
      syncMock.mockReturnValue([fsPath]);

      sut.index(fsPath);

      expect(sut.keys()).toStrictEqual([fsPath]);
      expect(sut.getByPath(fsPath)).toStrictEqual({ path: fsPath, key: fsPath, notes: undefined });
    });
  });

  describe('indexLocation()', () => {
    it('should not index anything for empty baseDir', async () => {
      await expect(sut.indexLocation('', '*.*')).rejects.toMatch('error');

      expect(sut.keys()).toStrictEqual([]);
    });

    it('should not index anything for empty pattern', async () => {
      await expect(sut.indexLocation('some/path/to/file', '')).rejects.toMatch('error');

      expect(sut.keys()).toStrictEqual([]);
    });

    it('should index location', async () => {
      const paths = [uniqueMdFile('file1'), uniqueMdFile('file2'), uniqueMdFile('file3')];

      syncMock.mockImplementation(() => paths);

      await expect(sut.indexLocation('any/location/meta/is/mocked', '**/*')).resolves.toStrictEqual(
        paths
      );
    });

    it('should append/overwrite indexes if called multiple times', async () => {
      const paths1 = [uniqueMdFile('file1'), uniqueMdFile('file2'), uniqueMdFile('file3')];

      const paths2 = [
        paths1[2], // will ovwerite paths1 path
        uniqueMdFile('file4'),
      ];

      syncMock.mockImplementation(() => paths1);
      await sut.indexLocation('location/one', '**/*');

      syncMock.mockImplementation(() => paths2);
      await sut.indexLocation('location/two', '**/*');

      expect(sut.keys()).toStrictEqual([paths1[0], paths1[1], paths1[2], paths2[1]]);
    });
  });

  describe('getByPath()', () => {
    it('should return undefined if no files indexed', () => {
      expect(sut.getByPath(uniqueMdFile('name'))).toBeUndefined();
    });

    it('should return undefined for not indexed file', () => {
      sut.index(unique('something'));
      expect(sut.getByPath(unique('somethingElse'))).toBeUndefined();
    });

    it('should return FileInfo for indexed file', () => {
      const fsPath = uniqueMdFile('filename');
      const id = unique('id');
      const key = fsPath;
      const metadata: IMetadata = {
        type: MetaLocation.Internal,
        value: { id },
      };
      syncMock.mockReturnValue([fsPath]);
      extractMetadata.mockReturnValue(metadata);

      sut.index(fsPath);
      expect(sut.getByPath(fsPath)).toStrictEqual({
        id,
        key,
        metadata,
        path: fsPath,
        notes: undefined,
        summary: undefined,
      });
    });
  });

  describe('getById()', () => {
    it('should return undefined if no files indexed', () => {
      expect(sut.getById(unique('name'))).toStrictEqual([]);
    });

    it('should return undefined for not indexed file', () => {
      sut.index(uniqueMdFile('something'));
      expect(sut.getById(unique('somethingElse'))).toStrictEqual([]);
    });

    it('should return FileInfo for indexed file', () => {
      const path = uniqueMdFile('filename');
      const id = unique('id');
      const key = path;
      const metadata: IMetadata = {
        type: MetaLocation.Internal,
        value: { id },
      };

      syncMock.mockImplementation(tst => {
        if (tst.endsWith(knownFileTypes.metadata.pattern)) return [path];
        return [];
      });

      extractMetadata.mockReturnValue(metadata);

      sut.index(path);
      expect(sut.getById(id)).toStrictEqual([
        {
          id,
          key,
          metadata,
          path,
          notes: undefined,
          summary: undefined,
        },
      ]);
    });
  });

  describe('delete()', () => {
    it('should not throw if indexes are empty', () => {
      expect(() => sut.delete(uniqueMdFile('some/nonindexed/file'))).not.toThrow();
      expect(sut.keys()).toStrictEqual([]);
    });

    it('should leave indexes intact, if key to remove does not exist', () => {
      const paths = [uniqueMdFile('path1'), uniqueMdFile('path2'), uniqueMdFile('path3')];

      syncMock.mockImplementation(tst => {
        return [];
      });

      paths.forEach(p => sut.index(p));

      expect(() => sut.delete(unique('some/nonindexed/file'))).not.toThrow();
      const k = sut.keys();
      expect(sut.keys()).toStrictEqual(paths);
    });

    it('should delete indexed entry in both id and path', () => {
      const paths = [uniqueMdFile('path1'), uniqueMdFile('path2'), uniqueMdFile('path3')];

      extractMetadata
        .mockImplementationOnce(p => ({ type: MetaLocation.Internal, value: { id: 'id1' } }))
        .mockImplementationOnce(p => ({ type: MetaLocation.Internal, value: { id: 'id2' } }))
        .mockImplementationOnce(p => ({ type: MetaLocation.Internal, value: { id: 'id3' } }));
      syncMock.mockImplementation(tst => {
        return [];
      });
      paths.forEach(p => sut.index(p));

      sut.delete(paths[1]);

      expect(sut.keys()).toStrictEqual([paths[0], paths[2]]);
      expect(sut.getById('id2')).toStrictEqual([]);
    });

    it('should be possible to delete all entries', () => {
      const paths = [uniqueMdFile('path1'), uniqueMdFile('path2'), uniqueMdFile('path3')];
      extractMetadata
        .mockImplementationOnce(p => ({ id: 'id1' }))
        .mockImplementationOnce(p => ({ id: 'id2' }))
        .mockImplementationOnce(p => ({ id: 'id3' }));
      paths.forEach(p => sut.index(p));

      paths.forEach(path => sut.delete(path));

      expect(sut.keys()).toStrictEqual([]);
    });
  });

  describe('clear()', () => {
    it('should not crash if no file indexed', () => {
      expect(() => sut.clear()).not.toThrow();
    });

    it('should clear all elements', () => {
      extractMetadata.mockImplementation(p => ({
        someMeta: unique('someValue'),
      }));

      sut.index(uniqueMdFile('filePath'));
      sut.index(uniqueMdFile('filePath'));
      sut.index(uniqueMdFile('filePath'));

      sut.clear();

      expect(sut.keys()).toStrictEqual([]);
    });
  });

  describe('dispose()', () => {
    it('should not crash if no file indexed', () => {
      expect(() => sut.dispose()).not.toThrow();
    });

    it('should clear all elements', () => {
      extractMetadata.mockImplementation(p => ({
        someMeta: unique('someValue'),
      }));

      sut.index(uniqueMdFile('filePath'));
      sut.index(uniqueMdFile('filePath'));
      sut.index(uniqueMdFile('filePath'));

      sut.dispose();

      expect(sut.keys()).toStrictEqual([]);
    });
  });

  function uniqueMdFile(name: string) {
    return path.normalize(unique(name) + '.md');
  }
});
