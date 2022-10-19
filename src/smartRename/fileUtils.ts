import * as path from 'path';

/**
 * Transforms a flat path array into a IFile hierarchy
 * @param paths an array of relative or absolute paths
 * @returns a hierarchy of IFile objects
 */
export function getFileTree<T>(
  paths: string[],
  factory: (name: string, path: string, children: T[]) => T
): T[] {
  if (!paths || paths.length === 0) return [];

  const fragments = paths.map(p => p.split(path.sep));
  return getHierarchy(fragments, [], factory);
}

/**
 * Groups an array of path fragments, into a IFile hierarchy tree
 * TODO: to be optimised
 * @param fragments A list of path fragments, split by path sseparator
 * @param history The path fragments parsed so far (used to build current path)
 * @returns IFile[]
 */
export function getHierarchy<T>(
  fragments: string[][],
  history: string[],
  factory: (name: string, path: string, children: T[]) => T
): T[] {
  let map = new Map<string, string[][]>();
  const files: T[] = [];

  if (fragments.length === 0) return [];

  fragments.forEach(p => {
    if (p.length === 0) return;

    const key = p[0];
    const f = map.get(key) ?? [];
    f.push(p.slice(1));
    map.set(key, f);
  });

  map.forEach((value: string[][], key: string) => {
    const pathSoFar = history.concat(key);
    files.push(
      factory(
        key,
        path.join(...pathSoFar),
        value.length > 0 ? getHierarchy(value, pathSoFar, factory) : []
      )
    );
  });

  return files;
}
