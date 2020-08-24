import { isValidJSON, hasValidTags, isWithinLimit, checkDuplicates } from '../../../extensions/amplify-helpers/tags-validation';

describe('tags-validation:', () => {
  describe('case: tags-validation receives a JSON file with duplicate keys', () => {
    const json = [
      { Key: 'user:Stack', Value: 'dev' },
      { Key: 'user:Application', Value: 'foobar' },
      { Key: 'user:Application', Value: 'foobar' },
    ];

    it('tags-validation should throw an error saying that the tags.json file contians duplicate keys', () => {
      expect(() => checkDuplicates(json)).toThrowError(new Error('File contains duplicate keys'));
    });
  });

  describe('case: tags-validation receives a JSON file that contains more than 50 key-value pairs', () => {
    const jsonObj: any = [];

    for (let i = 0; i < 55; i++) {
      jsonObj.push({
        Key: `user:key${i}`,
        Value: `value${i}`,
      });
    }

    it('tags-validation should throw an error stating that the tags.json file has exceeded the tags amount limit', () => {
      expect(() => isWithinLimit(jsonObj)).toThrowError(new Error('Tag limit exceeded (50 tags max)'));
    });
  });
});
