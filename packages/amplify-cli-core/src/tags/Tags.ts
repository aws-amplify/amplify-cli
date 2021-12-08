import { JSONUtilities } from '../jsonUtilities';
import _ from 'lodash';

export interface Tag {
  Key: string;
  Value: string;
}

export function ReadTags(tagsFilePath: string): Tag[] {
  const tags = JSONUtilities.readJson<Tag[]>(tagsFilePath, {
    throwIfNotExist: false,
    preserveComments: false,
  });

  if (!tags) return [];

  return tags;
}

export function validate(tags: Tag[], skipProjectEnv: boolean = false): void {
  const allowedKeySet = new Set(['Key', 'Value']);

  //check if Tags have the right format
  _.each(tags, tags => {
    if (_.some(Object.keys(tags), r => !allowedKeySet.has(r))) throw new Error('Tag should be of type Key: string, Value: string');
  });

  //check if Tag Key is repeated
  if (_.uniq(tags.map(r => r.Key)).length !== tags.length) throw new Error("'Key' should be unique");

  //check If tags exceed limit
  if (tags.length > 50) throw new Error('No. of tags cannot exceed 50');

  // check if the tags has valid keys and values
  _.each(tags, tag => {
    const tagValidationRegExp = /[^a-z0-9_.:/=+@\- ]/gi;
    const tagValue = skipProjectEnv ? tag.Value.replace('{project-env}', '') : tag.Value;
    if (tagValidationRegExp.test(tagValue)) {
      throw new Error(
        'Invalid character found in Tag Value. Tag values may only contain unicode letters, digits, whitespace, or one of these symbols: _ . : / = + - @',
      );
    }

    if (tagValidationRegExp.test(tag.Key)) {
      throw new Error(
        'Invalid character found in Tag Key. Tag Key may only contain unicode letters, digits, whitespace, or one of these symbols: _ . : / = + - @',
      );
    }

    if (tag.Value.length > 256) {
      throw new Error(`Tag value can be up to 256 characters but found ${tag.Value.length}`);
    }

    if (tag.Key.length > 128) {
      throw new Error(`Tag key can be up to 128 characters but found ${tag.Key.length}`);
    }
  });
}

export function HydrateTags(tags: Tag[], tagVariables: TagVariables, skipProjectEnv: boolean = false): Tag[] {
  const { envName, projectName } = tagVariables;
  const replace: any = {
    '{project-name}': projectName,
    '{project-env}': envName,
  };
  const regexMatcher = skipProjectEnv ? /{project-name}/g : /{project-name}|{project-env}/g;
  const hydrdatedTags = tags.map(tag => {
    return {
      ...tag,
      Value: tag.Value.replace(regexMatcher, (matched: string) => replace[matched]),
    };
  });
  validate(hydrdatedTags, skipProjectEnv);
  return hydrdatedTags;
}

type TagVariables = {
  envName: string;
  projectName: string;
};
