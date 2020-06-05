import { KeyDirectiveArguments, getKeyDirectiveQueryFieldName, shouldKeyDirectiveGenerateQuery } from '../KeyDirectiveUtils';
import { ObjectTypeDefinitionNode } from 'graphql';

describe('KeyTransformer Utils', () => {
  describe('getKeyDirectiveQueryFieldName', () => {
    it('should generate query name based on type name and index name', () => {
      const arg: KeyDirectiveArguments = {
        fields: ['a', 'b'],
        name: 'byAuthor',
      };
      const obj: ObjectTypeDefinitionNode = {
        kind: 'ObjectTypeDefinition',
        name: { kind: 'Name', value: 'Book' },
      };
      expect(getKeyDirectiveQueryFieldName(obj, arg)).toEqual('queryBookByAuthor');
    });

    it('should throw error when primary index is used to generate queryField name', () => {
      const arg: KeyDirectiveArguments = {
        fields: ['a', 'b'],
      };
      const obj: ObjectTypeDefinitionNode = {
        kind: 'ObjectTypeDefinition',
        name: { kind: 'Name', value: 'Book' },
      };

      expect(() => getKeyDirectiveQueryFieldName(obj, arg)).toThrowError("KeyDirective without name can't have queryField");
    });
  });

  describe('shouldKeyDirectiveGenerateQuery', () => {
    it('should generate query when generateQuery is undefined', () => {
      const arg: KeyDirectiveArguments = {
        fields: ['a', 'b'],
        name: 'someKey',
      };
      expect(shouldKeyDirectiveGenerateQuery(arg)).toBeTruthy();
    });

    it('should generate query when generateQuery is true', () => {
      const arg: KeyDirectiveArguments = {
        fields: ['a', 'b'],
        name: 'someKey',
        generateQuery: true,
      };
      expect(shouldKeyDirectiveGenerateQuery(arg)).toBeTruthy();
    });

    it('should not generate query when generateQuery is false', () => {
      const arg: KeyDirectiveArguments = {
        fields: ['a', 'b'],
        name: 'someKey',
        generateQuery: false,
      };
      expect(shouldKeyDirectiveGenerateQuery(arg)).toBeFalsy();
    });

    it('should generate query when queryField is set', () => {
      const arg: KeyDirectiveArguments = {
        fields: ['a', 'b'],
        name: 'someKey',
        queryField: 'queryFooByBar',
      };
      expect(shouldKeyDirectiveGenerateQuery(arg)).toBeTruthy();
    });

    it('should not generate query when the index is primary index', () => {
      const arg: KeyDirectiveArguments = {
        fields: ['a', 'b'],
        generateQuery: true,
        queryField: 'queryFooByBar',
      };
      expect(shouldKeyDirectiveGenerateQuery(arg)).toBeFalsy();
    });
  });
});
