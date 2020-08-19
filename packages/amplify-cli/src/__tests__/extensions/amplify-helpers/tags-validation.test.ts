import { isValidJSON, hasValidTags, isWithinLimit, checkDuplicates } from '../../../extensions/amplify-helpers/tags-validation';

describe('tags-validation:', () => {
  describe('case: tags-validation receives a JSON file with duplicate keys', () => {
    const json =
      '[{ "Key": "user:Stack", "Value": "dev" }, { "Key": "user:Application", "Value": "foobar" }, { "Key": "user:AmplifyCLIVersion", "Value": "4.21.3" }, { "Key": "user:AmplifyCLIVersion", "Value": "4.21.3" }]';

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
      expect(() => isWithinLimit(JSON.stringify(jsonObj))).toThrowError(new Error('Tag limit exceeded (50 tags max)'));
    });
  });

  describe('case: tags-validation receives an invalid JSON file', () => {
    const json = jest.fn();

    it('tags-validation should throw an error stating that the tags.json file is not valid', () => {
      expect(() => isValidJSON(json)).toThrowError(new Error("JSON file can't be read"));
    });
  });

  describe('case: tags-validation receives a tags.json file with an empty object', () => {
    const json = JSON.parse('[{ "Key": "user:Stack", "Value": "dev" }, { "Key": "user:Application", "Value": "foobar" }, {}]');

    it('tags-validation should throw an error stating that its an invalid format', () => {
      expect(() => hasValidTags(json)).toThrowError(
        new Error('Make sure to follow the correct key-value format. Check tags.json file for example'),
      );
    });
  });

  describe('case: tags-validation receives a tags.json file with incomplete values', () => {
    const json = JSON.parse('[{ "Key": "user:Stack", "Value": "dev" }, { "Key": "user:Application" }]');

    it('tags-validation should throw an error stating that the an object in the tags.json has incomplete data', () => {
      expect(() => hasValidTags(json)).toThrowError(
        new Error('Make sure to follow the correct key-value format. Check tags.json file for example'),
      );
    });
  });
});
