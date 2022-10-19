import * as path from 'path';
import { getFileTree } from '../../../smartRename';

describe('fileUtils', () => {
  describe('getFileTree()', () => {
    interface IFile {
      name: string;
      path: string;
      children: IFile[];
    }

    function factory(name: string, path: string, children: IFile[]): IFile {
      return { name, path, children };
    }

    function asPath(...paths: string[]): string {
      return paths.join(path.sep);
    }

    it('should return empty for no paths', () => {
      expect(getFileTree([], factory)).toStrictEqual([]);
    });

    it('should return single level for simple path array', () => {
      expect(getFileTree(['file1'], factory)).toStrictEqual([
        {
          name: 'file1',
          path: 'file1',
          children: [],
        },
      ]);
    });

    it('should get deep path file structure', () => {
      const paths = [
        asPath('root1', 'sub', 'file.md'),
        asPath('root1', 'sub', 'file1'),
        asPath('root1', 'sub1', 'file2'),
        asPath('root1', 'sub1', 'sub12', 'file3'),
        asPath('root1', 'sub2', 'file4'),
        asPath('root1', 'sub2', 'file5'),
        asPath('root2', 'file6.md'),
        asPath('root2', 'sub3', 'file7'),
      ];

      expect(getFileTree(paths, factory)).toStrictEqual([
        {
          name: 'root1',
          path: 'root1',
          children: [
            {
              name: 'sub',
              path: path.join('root1', 'sub'),
              children: [
                {
                  name: 'file.md',
                  path: path.join('root1', 'sub', 'file.md'),
                  children: [],
                },
                {
                  name: 'file1',
                  path: path.join('root1', 'sub', 'file1'),
                  children: [],
                },
              ],
            },
            {
              name: 'sub1',
              path: path.join('root1', 'sub1'),
              children: [
                {
                  name: 'file2',
                  path: path.join('root1', 'sub1', 'file2'),
                  children: [],
                },
                {
                  name: 'sub12',
                  path: path.join('root1', 'sub1', 'sub12'),
                  children: [
                    {
                      name: 'file3',
                      path: path.join('root1', 'sub1', 'sub12', 'file3'),
                      children: [],
                    },
                  ],
                },
              ],
            },
            {
              name: 'sub2',
              path: path.join('root1', 'sub2'),
              children: [
                {
                  name: 'file4',
                  path: path.join('root1', 'sub2', 'file4'),
                  children: [],
                },
                {
                  name: 'file5',
                  path: path.join('root1', 'sub2', 'file5'),
                  children: [],
                },
              ],
            },
          ],
        },
        {
          name: 'root2',
          path: 'root2',
          children: [
            {
              name: 'file6.md',
              path: path.join('root2', 'file6.md'),
              children: [],
            },
            {
              name: 'sub3',
              path: path.join('root2', 'sub3'),
              children: [
                {
                  name: 'file7',
                  path: path.join('root2', 'sub3', 'file7'),
                  children: [],
                },
              ],
            },
          ],
        },
      ]);
    });
  });
});
