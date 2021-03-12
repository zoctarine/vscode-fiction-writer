import { unique } from '..';
import { sync } from 'glob';

const extractMetadata = jest.fn();
let normalizeMock = jest.fn();

jest.mock('../../../metadata', () => ({ extractMetadata }));
jest.mock('path');
jest.mock('glob');

const syncMock = sync as jest.Mock;

import { FileIndexer } from "../../../compile";


describe('FileIndexer', () => {

  let sut: FileIndexer;

  beforeEach(() => {
    sut = new FileIndexer();
    extractMetadata.mockReset();
    syncMock.mockReset();
  });

  describe('_constructor()', () => {
    it('should create obj with empty path collection', () => {
      expect(sut.paths()).toStrictEqual([]);
    });
  });

  describe('index()', () => {
    it('should do nothing with empty location', async () => {
      sut.index('');

      expectIsEmpty();
    });

    it('should index files without metadata', () => {
      const path = unique('file/location');

      sut.index(path);

      expect(sut.paths()).toStrictEqual([path]);
      expect(sut.getByPath(path)).toStrictEqual({
        id: undefined,
        metadata: undefined,
        path
      });
    });

    it('should index file metadata for files without metadata.id', () => {
      const filePath = unique('file/location');
      const metadata = { notId: 'someValue' };
      extractMetadata.mockReturnValue(metadata);
      normalizeMock.mockReturnValue(filePath);
      sut.index(filePath);

      expect(sut.paths()).toStrictEqual([filePath]);
      expect(sut.getByPath(filePath)).toStrictEqual({
        id: undefined,
        path: filePath,
        metadata
      });
    });

    it('should index entries with same id and return all of them', () => {

      // ARRANGE
      const path1 = unique('path1');
      const id12 = unique('id 1 and 2');
      const meta1 = { id: id12 };
      const expectedInfo1 = { id: id12, metadata: meta1, path: path1 };

      const path2 = unique('path2');
      const meta2 = { id: id12, a: 'A', b: 'B' }; // same id as path 1
      const expectedInfo2 = { id: id12, metadata: meta2, path: path2 };

      const path3 = unique('path2');
      const id3 = unique('id 3');
      const meta3 = { id: id3, somethingElse: 'test' };
      const expectedInfo3 = { id: id3, metadata: meta3, path: path3 };

      extractMetadata
        .mockImplementationOnce(p => meta1)
        .mockImplementationOnce(p => meta2)
        .mockImplementationOnce(p => meta3);

      // ACT
      sut.index(path1);
      sut.index(path2);
      sut.index(path3);


      // ASSERT
      expect(sut.getById(id12)).toStrictEqual([expectedInfo1, expectedInfo2]);
      expect(sut.getById(id3)).toStrictEqual([expectedInfo3]);

      expect(sut.paths().sort()).toStrictEqual([path1, path2, path3].sort());
      expect(sut.getByPath(path1)).toStrictEqual(expectedInfo1);
      expect(sut.getByPath(path2)).toStrictEqual(expectedInfo2);
      expect(sut.getByPath(path3)).toStrictEqual(expectedInfo3);
      expect(extractMetadata.mock.calls.length).toBe(3);
    });


    it('should index file id for files with metetadata.id', async () => {
      const path = unique('path');
      const id = unique('id');
      const metadata = { id: id };
      const expectedInfo = { id, metadata, path };
      extractMetadata.mockReturnValue(metadata);

      sut.index(path);

      expect(sut.paths()).toStrictEqual([path]);
      expect(sut.getById(id)).toStrictEqual([expectedInfo]);
      expect(sut.getByPath(path)).toStrictEqual(expectedInfo);
      expect(extractMetadata.mock.calls.length).toBe(1);
      expect(extractMetadata.mock.calls[0][0]).toBe(path);
    });

    it('should index only filepath if extractMeta throws error', () => {
      extractMetadata.mockImplementation(p => { throw new Error(); });
      const path = unique('any path');
      sut.index(path);

      expect(sut.paths()).toStrictEqual([path]);
      expect(sut.getByPath(path)).toStrictEqual({ path });
    });
  });

  describe('indexLocation()', () => {
    it('should not index anything for empty baseDir', async () => {

      await expect(sut.indexLocation('', '*.*')).rejects.toMatch('error');

      expectIsEmpty();
    });

    it('should not index anything for empty pattern', async () => {

      await expect(sut.indexLocation('some/path/to/file', '')).rejects.toMatch('error');

      expectIsEmpty();
    });

    it('should index location', async () => {
      const paths = [
        unique('file1'),
        unique('file2'),
        unique('file3')
      ];

      syncMock.mockImplementation(() => paths);

      await expect(sut.indexLocation('any/location/meta/is/mocked', '**/*'))
        .resolves
        .toStrictEqual(paths);
    });

    it('should append/overwrite indexes if called multiple times', async () => {
      const paths1 = [
        unique('file1'),
        unique('file2'),
        unique('file3')
      ];

      const paths2 = [
        paths1[2],    // will ovwerite paths1 path
        unique('file4'),
      ];

      syncMock
        .mockImplementationOnce(() => paths1)
        .mockImplementationOnce(() => paths2);

      await sut.indexLocation('location/one', '**/*');
      await sut.indexLocation('location/two', '**/*');

      expect(sut.paths()).toStrictEqual([
        paths1[0], paths1[1], paths1[2], paths2[1]
      ]);
    });

  });

  describe('getByPath()', () => {

    it('should return undefined if no files indexed', () => {
      expect(sut.getByPath(unique('name'))).toBeUndefined();
    });

    it('should return undefined for not indexed file', () => {
      sut.index(unique('something'));
      expect(sut.getByPath(unique('somethingElse'))).toBeUndefined();
    });

    it('should return FileInfo for indexed file', () => {
      const path = unique('filename');
      const id = unique('id');
      const metadata = { id };

      extractMetadata.mockReturnValue(metadata);

      sut.index(path);
      expect(sut.getByPath(path)).toStrictEqual({ id, metadata, path });
    });
  });


  describe('getById()', () => {

    it('should return undefined if no files indexed', () => {
      expect(sut.getById(unique('name'))).toStrictEqual([]);
    });

    it('should return undefined for not indexed file', () => {
      sut.index(unique('something'));
      expect(sut.getById(unique('somethingElse'))).toStrictEqual([]);
    });

    it('should return FileInfo for indexed file', () => {
      const path = unique('filename');
      const id = unique('id');
      const metadata = { id };

      extractMetadata.mockReturnValue(metadata);

      sut.index(path);
      expect(sut.getById(id)).toStrictEqual([{ id, metadata, path }]);
    });
  });

  describe('delete()', () => {

    it('should not throw if indexes are empty', () => {
      expect(() => sut.delete(unique('some/nonindexed/file'))).not.toThrow();
      expectIsEmpty();
    });

    it('should leave indexes intact, if key to remove does not exist', () => {
      const paths = [unique('path1'), unique('path2'), unique('path3')];
      paths.forEach(p => sut.index(p));

      expect(() => sut.delete(unique('some/nonindexed/file'))).not.toThrow();

      expect(sut.paths()).toStrictEqual(paths);
    });

    it('should delete indexed entry in both id and path', () => {
      const paths = [unique('path1'), unique('path2'), unique('path3')];
      extractMetadata
        .mockImplementationOnce(p => ({ id: 'id1' }))
        .mockImplementationOnce(p => ({ id: 'id2' }))
        .mockImplementationOnce(p => ({ id: 'id3' }));
      paths.forEach(p => sut.index(p));

      sut.delete(paths[1]);

      expect(sut.paths()).toStrictEqual([paths[0], paths[2]]);

    });

    it('should be possible to delete all entries', () => {
      const paths = [unique('path1'), unique('path2'), unique('path3')];
      extractMetadata
        .mockImplementationOnce(p => ({ id: 'id1' }))
        .mockImplementationOnce(p => ({ id: 'id2' }))
        .mockImplementationOnce(p => ({ id: 'id3' }));
      paths.forEach(p => sut.index(p));

      paths.forEach(path => sut.delete(path));

      expect(sut.paths()).toStrictEqual([]);
    });
  });

  describe('clear()', () => {

    it('should not crash if no file indexed', () => {
      expect(() => sut.clear()).not.toThrow();
    });

    it('should clear all elements', () => {

      extractMetadata.mockImplementation(p => ({
        someMeta: unique('someValue')
      }));

      sut.index(unique('filePath'));
      sut.index(unique('filePath'));
      sut.index(unique('filePath'));

      sut.clear();

      expectIsEmpty();
    });

  });


  describe('dispose()', () => {

    it('should not crash if no file indexed', () => {
      expect(() => sut.dispose()).not.toThrow();
    });

    it('should clear all elements', () => {
      extractMetadata.mockImplementation(p => ({
        someMeta: unique('someValue')
      }));

      sut.index(unique('filePath'));
      sut.index(unique('filePath'));
      sut.index(unique('filePath'));

      sut.dispose();

      expectIsEmpty();
    });
  });

  function expectIsEmpty() {
    expect(sut.paths()).toStrictEqual([]);
  }
});