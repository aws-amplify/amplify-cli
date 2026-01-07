import { DynamoDBCloudFormationAccessParser } from './dynamodb_cfn_access_parser';
import { Template } from 'cloudform-types';

describe('DynamoDBCloudFormationAccessParser', () => {
  describe('parseTemplate', () => {
    it('should extract DynamoDB permissions from IAM policy with Fn::Join resource', () => {
      const template: Template = {
        Resources: {
          AmplifyResourcesPolicy: {
            Type: 'AWS::IAM::Policy',
            Properties: {
              PolicyDocument: {
                Version: '2012-10-17',
                Statement: [
                  {
                    Effect: 'Allow',
                    Action: ['dynamodb:PutItem', 'dynamodb:GetItem', 'dynamodb:Query'],
                    Resource: [
                      {
                        'Fn::Join': [
                          '',
                          [
                            'arn:aws:dynamodb:*:*:table/',
                            {
                              Ref: 'storagecountsTableName',
                            },
                          ],
                        ],
                      },
                    ],
                  },
                ],
              },
            },
          },
        },
      };

      const permissions = DynamoDBCloudFormationAccessParser.parseTemplate(template);

      expect(permissions).toHaveLength(1);
      expect(permissions[0]).toEqual({
        tableResource: 'storagecountsTableName',
        actions: ['dynamodb:PutItem', 'dynamodb:GetItem', 'dynamodb:Query'],
      });
    });

    it('should ignore non-DynamoDB actions', () => {
      const template: Template = {
        Resources: {
          TestPolicy: {
            Type: 'AWS::IAM::Policy',
            Properties: {
              PolicyDocument: {
                Statement: [
                  {
                    Effect: 'Allow',
                    Action: 's3:GetObject',
                    Resource: 'arn:aws:s3:::my-bucket/*',
                  },
                ],
              },
            },
          },
        },
      };

      const permissions = DynamoDBCloudFormationAccessParser.parseTemplate(template);
      expect(permissions).toHaveLength(0);
    });
  });

  describe('mapDynamoDBActionsToGen2Permissions', () => {
    it('should map DynamoDB actions to Gen2 permissions correctly', () => {
      const dynamoActions = ['dynamodb:GetItem', 'dynamodb:PutItem', 'dynamodb:DeleteItem', 'dynamodb:Query'];
      const gen2Permissions = DynamoDBCloudFormationAccessParser.mapDynamoDBActionsToGen2Permissions(dynamoActions);

      expect(gen2Permissions).toEqual(expect.arrayContaining(['read', 'write', 'delete']));
      expect(gen2Permissions).toHaveLength(3);
    });
  });
});
