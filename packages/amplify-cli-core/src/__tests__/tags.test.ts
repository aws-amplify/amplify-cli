import { validate } from '../tags/Tags';

describe('tags-validation:', () => {
  describe('case: tags-validation receives a JSON file with duplicate keys', () => {
    const json = [
      { Key: 'user:Stack', Value: 'dev' },
      { Key: 'user:Application', Value: 'foobar' },
      { Key: 'user:Application', Value: 'foobar' },
    ];

    it('tags-validation should throw an error saying that the tags.json file contians duplicate keys', () => {
      expect(() => validate(json)).toThrowError(new Error("'Key' should be unique"));
    });
  });

  describe('case: tags-validation receives a JSON file that contains more than 50 key-value pairs', () => {
    const jsonObj: any = [];

    const json = [
      { Key: 'user:Stack', Value: 'dev', key: 'notgood' },
      { Key: 'user:Application', Value: 'foobar' },
      { Key: 'user:Application', Value: 'foobar' },
    ];

    it('tags-validation should throw an error stating that the tags.json file has exceeded the tags amount limit', () => {
      expect(() => validate(json)).toThrowError(new Error('Tag thould be of type Key: string, Value: string'));
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
      expect(() => validate(jsonObj)).toThrowError(new Error('No. of tags cannot exceed 50'));
    });
  });
});
