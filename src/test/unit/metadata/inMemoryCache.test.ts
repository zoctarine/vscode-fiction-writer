import { extract, parse } from '../../../metadata';
import { InMemoryCache } from '../../../utils';

jest.mock('vscode');

const any = (value: string) => value + ': ' + Math.random().toString(36);


describe('InMemoryCache', function () {

  let sut: InMemoryCache<string>;

  beforeEach(() => { sut = new InMemoryCache(); });

  describe('when created', function () {
    it('should be empty', function () {
      expect(sut.getAllKeys()).toStrictEqual([]);
    });
  });

  describe('set', function () {
    ['', undefined, null, 'a', 'SOME TEST'].forEach(value => {

      it(`should add '${value}' value to map`, function () {
        const key = any('key');
        sut.set(key, value);
        expect(sut.getSnapshot()).toStrictEqual([[key, value]]);
      });
    });

    it('should not set empty keys', function () {
      const emptyKey = '';
      const value = any('value');

      sut.set(emptyKey, value);

      expect(sut.get(emptyKey)).toBeUndefined();
    });

    it('should overwrite existing key value', function () {
      const key = any('key');
      const oldValue = any('value');
      const newValue = any('new-value');

      sut.set(key, oldValue);
      sut.set(key, newValue);

      expect(sut.get(key)).toStrictEqual(newValue);
    });

    it(`should add multiple values`, function () {
      const expected =
        [
          [any('key'), any('value')],
          [any('key'), any('value')],
          [any('key'), any('value')]
        ];

      expected
        .forEach(([key, value]) =>
          sut.set(key, value));

      expect(sut.getSnapshot()).toStrictEqual(expected);
    });
  });

  describe('dispose', function () {

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