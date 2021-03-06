import { InMemoryCache } from '../../../utils';
import { unique } from '..';

jest.mock('vscode');

describe('InMemoryCache', function () {

  let sut: InMemoryCache<string>;

  beforeEach(() => { sut = new InMemoryCache(); });

  describe('_constructor()', function () {
    it('should create empty cache', function () {
      expect(sut.getAllKeys()).toStrictEqual([]);
    });
  });

  describe('set() / get()', function () {
    ['', undefined, null, 'a', 'SOME TEST'].forEach(value => {

      it(`should add '${value}' value to map`, function () {
        const key = unique('key');
        sut.set(key, value);
        expect(sut.getSnapshot()).toStrictEqual([[key, value]]);
      });
    });

    it('should not set empty keys', function () {
      const emptyKey = '';
      const value = unique('value');

      sut.set(emptyKey, value);

      expect(sut.get(emptyKey)).toBeUndefined();
    });

    it('should overwrite existing key value', function () {
      const key = unique('key');
      const oldValue = unique('value');
      const newValue = unique('new-value');

      sut.set(key, oldValue);
      sut.set(key, newValue);

      expect(sut.get(key)).toStrictEqual(newValue);
    });

    it(`should add multiple values`, function () {
      const expected =
        [
          [unique('key'), unique('value')],
          [unique('key'), unique('value')],
          [unique('key'), unique('value')]
        ];

      expected
        .forEach(([key, value]) =>
          sut.set(key, value));

      expect(sut.getSnapshot()).toStrictEqual(expected);
    });
  });

  describe('dispose()', function () {

    it('should not crash on empty cache', function () {
      expect(() => sut.dispose()).not.toThrowError();
    });

    it('should clear cache and all getters return empty or undefined', function () {
      sut.set('A', 'A Value');
      sut.set('B', 'Another Value');
      sut.dispose();

      expect(sut.getCache()).toBeUndefined();
      expect(sut.get('A')).toBeUndefined();
      expect(sut.get('B')).toBeUndefined();
      expect(sut.getSnapshot()).toStrictEqual([]);
      expect(sut.getAllKeys()).toStrictEqual([]);
    });
  });
});