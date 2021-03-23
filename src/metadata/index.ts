import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';
import { fileManager, IFileGroup } from '../smartRename';
import { SupportedContent } from '../utils';

export * from './metadataFileCache';
export * from './metadataTreeDataProvider';
export * from './metadataDecorationProvider';
export * from './metadataTreeItem';
export * from './metadataNotesProvider';

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
  id: string | undefined;
  description: string[] | string | undefined;
  summary: string[] | string | undefined;
  tag: string[] | string | undefined;
  tags: string[] | string | undefined;
};

export enum MetaLocation {
  Unknown,
  Internal,
  External
}

export interface IMetadata {
  location?: string;
  type: MetaLocation;
  value?: any
}

/**
 * Extracts metadata object from a document group
 * @param text the text from which to extract metadata from
 */
export class MetadataService {
  public extractMetadata(group: IFileGroup): IMetadata {
    try {
      // search for inline metadata
      const actualFile = group.getPath(SupportedContent.Fiction);
      if (actualFile && fs.existsSync(actualFile)) {
        const text = fs.readFileSync(actualFile, 'utf8');
        const metadataBlock = extract(text);
        let value = parse(metadataBlock);
        if (value) {
          return {
            location: actualFile,
            type: MetaLocation.Internal,
            value: value
          };
        }
      }

      // if no inline meta is found, search in external file
      const externalMeta = group.getPath(SupportedContent.Metadata);
      if (externalMeta && fs.existsSync(externalMeta)) {
        const metadataBlock = fs.readFileSync(externalMeta, 'utf8');
        let value = parse(metadataBlock);

        if (value) {
          return {
            location: externalMeta,
            type: MetaLocation.External,
            value: value
          };
        }
      }


    } catch (error) {
      //TODO Log some error
    }
    return {
      type: MetaLocation.Unknown
    };
  }
}

export const metaService = new MetadataService();