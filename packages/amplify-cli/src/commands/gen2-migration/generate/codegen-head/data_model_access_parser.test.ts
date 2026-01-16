import { DataModelAccessParser } from './data_model_access_parser';

describe('DataModelAccessParser', () => {
  describe('extractTableNameFromResource', () => {
    it('should extract table name from Fn::Join with Fn::ImportValue pattern', () => {
      const resource = {
        'Fn::Join': [
          '',
          [
            'arn:aws:dynamodb:',
            {
              Ref: 'AWS::Region',
            },
            ':',
            {
              Ref: 'AWS::AccountId',
            },
            ':table/',
            {
              'Fn::ImportValue': {
                'Fn::Sub': '${apidiscussionsGraphQLAPIIdOutput}:GetAtt:PostTable:Name',
              },
            },
          ],
        ],
      };

      const result = (DataModelAccessParser as any).extractTableNameFromResource(resource);
      expect(result).toBe('PostTable');
    });

    it('should extract table name from CommentTable pattern', () => {
      const resource = {
        'Fn::Join': [
          '',
          [
            'arn:aws:dynamodb:us-east-1:123456789:table/',
            {
              'Fn::ImportValue': {
                'Fn::Sub': '${GraphQLAPIIdDataSource}:GetAtt:CommentTable:Name',
              },
            },
          ],
        ],
      };

      const result = (DataModelAccessParser as any).extractTableNameFromResource(resource);
      expect(result).toBe('CommentTable');
    });

    it('should return null for resource without Fn::Join', () => {
      const resource = {
        Ref: 'SomeTableArn',
      };

      const result = (DataModelAccessParser as any).extractTableNameFromResource(resource);
      expect(result).toBeNull();
    });

    it('should return null for Fn::Join without Fn::ImportValue', () => {
      const resource = {
        'Fn::Join': [
          '',
          [
            'arn:aws:dynamodb:',
            {
              Ref: 'AWS::Region',
            },
            ':table/MyTable',
          ],
        ],
      };

      const result = (DataModelAccessParser as any).extractTableNameFromResource(resource);
      expect(result).toBeNull();
    });

    it('should return null for Fn::ImportValue without GetAtt pattern', () => {
      const resource = {
        'Fn::Join': [
          '',
          [
            'arn:aws:dynamodb:',
            {
              'Fn::ImportValue': {
                'Fn::Sub': '${GraphQLAPIIdDataSource}:SomeOtherPattern',
              },
            },
          ],
        ],
      };

      const result = (DataModelAccessParser as any).extractTableNameFromResource(resource);
      expect(result).toBeNull();
    });
  });
});
