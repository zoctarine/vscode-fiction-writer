const extractMetadataMock = jest.fn();

jest.mock('../../../metadata', () => ({
  extractMetadata: extractMetadataMock
}));

jest.mock('glob', () => {
  return {
    G: jest.fn()
  };
});

import { unique } from "..";
import { FileIndexer } from "../../../compile";


describe('FileIndexer', () => {

  let sut: FileIndexer;

  beforeEach(() => {
    sut = new FileIndexer();
    extractMetadataMock.mockClear();
  });

  describe('when constructed', () => {
    it('should have no ids', () => {
      expect(sut.ids()).toStrictEqual([]);
    });

    it('should have no locations', () => {
      expect(sut.ids()).toStrictEqual([]);
    });
  });

  describe('index()', () => {
    it('should do nothing with empty location', async () => {
      sut.index('');

      expectIsEmpty();
    });

    it('should index only path with files without metadata', () => {
      const path = unique('file/location');

      sut.index(path);

      expect(sut.ids()).toStrictEqual([]);
      expect(sut.paths()).toStrictEqual([path]);
      expect(sut.info(path)).toStrictEqual({
        id: undefined,
        metadata: undefined
      });
    });

    it('should index only info with files without metadata.id', () => {
      const path = unique('file/location');
      const metadata = { notId: 'someValue' };
      extractMetadataMock.mockReturnValue(metadata);

      sut.index(path);

      expect(sut.ids()).toStrictEqual([]);
      expect(sut.paths()).toStrictEqual([path]);
      expect(sut.info(path)).toStrictEqual({
        id: undefined,
        metadata
      });
    });

    it('should keep only last entry for wiles with same id', () => {
      const id12 = unique('id 1 and 2');
      const id3 = unique('id 3');
      const path1 = unique('path1');
      const path2 = unique('path2');
      const path3 = unique('path2');

      const meta1 = { id: id12 };
      const meta2 = { id: id12, a: 'A', b: 'B' };
      const meta3 = { id: id3, somethingElse: 'test' };

      extractMetadataMock
        .mockImplementationOnce(p => meta1)
        .mockImplementationOnce(p => meta2)
        .mockImplementationOnce(p => meta3);

      sut.index(path1);
      sut.index(path2);
      sut.index(path3);

      expect(sut.ids().sort()).toStrictEqual([id12, id3].sort());
      expect(sut.path(id12)).toBe(path2);
      expect(sut.path(id3)).toBe(path3);
      expect(sut.info(path1)).toStrictEqual({id: id12, metadata: meta1});
      expect(sut.info(path2)).toStrictEqual({id: id12, metadata: meta2});
      expect(sut.info(path3)).toStrictEqual({id: id3, metadata: meta3});
      expect(sut.paths().sort()).toStrictEqual([path1, path2, path3].sort());
      expect(extractMetadataMock.mock.calls.length).toBe(3);
      //expect(extractMetadataMock.mock.calls[0][0]).toBe(path);
    });


    it('should index both id and path with files with metetadata.id', async () => {
      const path = unique('path');
      const id = unique('id');
      const metadata = { id: id };
      extractMetadataMock.mockReturnValue(metadata);

      sut.index(path);

      expect(sut.ids()).toStrictEqual([id]);
      expect(sut.paths()).toStrictEqual([path]);
      expect(sut.path(id)).toBe(path);
      expect(sut.info(path)).toStrictEqual({ id, metadata });
      expect(extractMetadataMock.mock.calls.length).toBe(1);
      expect(extractMetadataMock.mock.calls[0][0]).toBe(path);
    });
  });


  describe('info()', () => {

    it('should return undefined if no files indexed', () => {
      expect(sut.info(unique('name'))).toBeUndefined();
    });

    it('should return undefined for not indexed file', () => {
      sut.index(unique('something'));
      expect(sut.info(unique('somethingElse'))).toBeUndefined();
    });

    it('should return FileInfo for indexed file', () => {
      const file = unique('filename');
      const id = unique('id');
      const metadata = { id };

      extractMetadataMock.mockReturnValue(metadata);

      sut.index(file);
      expect(sut.info(file)).toStrictEqual({ id, metadata });
    });
  });


  describe('clear()', () => {

    it('should not crash if no file indexed', () => {
      expect(() => sut.clear()).not.toThrow();
    });

    it('should clear all elements', () => {
      // TODO: Implement this
    });

  });


  describe('dispose()', () => {

    it('should not crash if no file indexed', () => {
      expect(() => sut.clear()).not.toThrow();
    });

    it('should clear all elements', () => {
      // TODO: Implement this
    });
  });

  function expectIsEmpty() {
    expect(sut.ids()).toStrictEqual([]);
    expect(sut.paths()).toStrictEqual([]);
  }
});