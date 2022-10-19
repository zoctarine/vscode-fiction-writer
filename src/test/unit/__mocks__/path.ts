export function normalize(path: string): string {
  return path;
}

export function join(...paths: string[]): string {
  return paths.join('/');
}
