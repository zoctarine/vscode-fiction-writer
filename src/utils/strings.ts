export function isEmptyOrWhiteSpaces(str: string) {
  return str.length === 0 || str.match(/^ *$/) !== null;
}
