import * as yaml from 'js-yaml';
import * as fs from 'fs';
export * from './metadataFileCache';
export * from './metadataTreeDataProvider';
export * from './metadataDecorationProvider';
export * from './metadataTreeItem';

export function extract(text: string) {
  const exp = /(?:^---[\n\r]+)(.*?)(?:---|\.\.\.)/sgu;
  const result = exp.exec(text);
  if (result && result.length > 0) return result[1].trim();
  return '';
}

export function parse(yamlText: string | undefined) {
  if (!yamlText) return undefined;

  const result = yaml.load(yamlText, {
    json: true // dplicate keys in a mapping will override values rather than throwing an error.
  });

  return result;
}

export interface KnownMeta {
  id: string | undefined,
  description: string[] | string | undefined,
  summary: string[] | string | undefined,
  tag: string[] | string | undefined,
  tags: string[] | string | undefined;
};

/**
 * Extracts metadata object from a document
 * @param text the text from which to extract metadata from
 */
export function extractMetadata(filePath: string): string | object | number | undefined | null {
  try {
    if (fs.existsSync(filePath)) {
      const text = fs.readFileSync(filePath, 'utf8');
      const metadataBlock = extract(text);
      let value = parse(metadataBlock);
      if (value === null || value === undefined) return undefined;
      return value;
     }
  } catch {
    //TODO Log some error
  }
  return  undefined;
}

