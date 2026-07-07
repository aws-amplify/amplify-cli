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
    const json = [
      { Key: 'user:Stack', Value: 'dev', key: 'notgood' },
      { Key: 'user:Application', Value: 'foobar' },
      { Key: 'user:Application', Value: 'foobar' },
    ];

    it('tags-validation should throw an error stating that the tags.json file has exceeded the tags amount limit', () => {
      expect(() => validate(json)).toThrowError(new Error('Tag should be of type Key: string, Value: string'));
    });
  });

  describe('case: tags-validatation recives a JSON file that contains invalid char in tag Key', () => {
    const json = [{ Key: 'user:Stack,', Value: 'dev' }];

    it('tags-validation should throw an error stating that the tags.json file has exceeded the tags amount limit', () => {
      expect(() => validate(json)).toThrowError(
        new Error(
          'Invalid character found in Tag Key. Tag Key may only contain unicode letters, digits, whitespace, or one of these symbols: _ . : / = + - @',
        ),
      );
    });
  });

  describe('case: tags-validatation recives a JSON file that contains tag key length greater than 128', () => {
    const json = [{ Key: 'a'.repeat(129), Value: 'dev' }];

    it('tags-validation should throw an error stating that the tags.json file has exceeded the tags amount limit', () => {
      expect(() => validate(json)).toThrowError(new Error('Tag key can be up to 128 characters but found 129'));
    });
  });

  describe('case: tags-validatation recives a JSON file that contains invalid char in tag Value', () => {
    const json = [{ Key: 'user:Stack', Value: 'dev,123' }];

    it('tags-validation should throw an error stating that the tags.json file has exceeded the tags amount limit', () => {
      expect(() => validate(json)).toThrowError(
        new Error(
          'Invalid character found in Tag Value. Tag values may only contain unicode letters, digits, whitespace, or one of these symbols: _ . : / = + - @',
        ),
      );
    });
  });

  describe('case: tags-validatation recives a JSON file that contains tag value length greater than 256', () => {
    const json = [{ Key: 'a'.repeat(128), Value: 'd'.repeat(257) }];

    it('tags-validation should throw an error stating that the tags.json file has exceeded the tags amount limit', () => {
      expect(() => validate(json)).toThrowError(new Error('Tag value can be up to 256 characters but found 257'));
    });
  });
  describe('case: tags-validation receives a JSON file that contains more than 50 key-value pairs', () => {
    const jsonObjects: any = [];

    for (let i = 0; i < 55; i++) {
      jsonObjects.push({
        Key: `user:key${i}`,
        Value: `value${i}`,
      });
    }

    it('tags-validation should throw an error stating that the tags.json file has exceeded the tags amount limit', () => {
      expect(() => validate(jsonObjects)).toThrowError(new Error('No. of tags cannot exceed 50'));
    });
  });
});
