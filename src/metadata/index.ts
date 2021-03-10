import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';
import { pathToFileURL } from 'url';
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

export function fileGroup(filePath: string): {path: string, meta: string}{
  const parsed = path.parse(filePath);
  return {
    path: path.join(parsed.dir, parsed.name + '.md'),
    meta: path.join(parsed.dir, parsed.name + '.yml')
  };
}

/**
 * Extracts metadata object from a document
 * @param text the text from which to extract metadata from
 */
export function extractMetadata(filePath: string): string | object | number | undefined | null {
  try {
    // search for separate file metadata
    const group = fileGroup(filePath);

    if (fs.existsSync(group.meta)){
      const metadataBlock = fs.readFileSync(group.meta, 'utf8');
      let value = parse(metadataBlock);
      if (value === null || value === undefined) return undefined;
      return value;
    }
    // search for inline metadata
    if (fs.existsSync(group.path)) {
      const text = fs.readFileSync(group.path, 'utf8');
      const metadataBlock = extract(text);
      let value = parse(metadataBlock);
      if (value === null || value === undefined) return undefined;
      return value;
     }
  } catch (error) {
    //TODO Log some error
  }
  return  undefined;
}

