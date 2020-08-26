import { JSONUtilities } from '../jsonUtilities';
import _ from 'lodash';

export interface Tag {
  Key: string;
  Value: String;
}

export function ReadValidateTags(tagsFilePath: string): Tag[] {
  const tags = JSONUtilities.readJson<Tag[]>(tagsFilePath, {
    throwIfNotExist: false,
    preserveComments: false,
  });

  if (!tags) return [];

  validate(tags);

  return tags;
}

export function validate(tags: Tag[]): void {
  const allowedKeySet = new Set(['Key', 'Value']);

  //check if Tags have the right format
  _.each(tags, tags => {
    if (_.some(Object.keys(tags), r => !allowedKeySet.has(r))) throw new Error('Tag thould be of type Key: string, Value: string');
  });

  //check if Tag Key is repeated
  if (_.uniq(tags.map(r => r.Key)).length !== tags.length) throw new Error("'Key' should be unique");

  //check If tags exceed limit
  if (tags.length > 50) throw new Error('No. of tags cannot exceed 50');
}
