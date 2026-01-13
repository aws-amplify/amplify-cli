import { S3CloudFormationAccessParser } from './s3_cfn_access_parser';
import { Template } from 'cloudform-types';

describe('S3CloudFormationAccessParser', () => {
  describe('parseTemplate', () => {
    it('should extract S3 permissions from IAM policy with Fn::Join resource', () => {
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
                    Action: 's3:ListBucket',
                    Resource: [
                      {
                        'Fn::Join': [
                          '',
                          [
                            'arn:aws:s3:::',
                            {
                              Ref: 'storagefitnessappstorageBucketName',
                            },
                          ],
                        ],
                      },
                    ],
                  },
                  {
                    Effect: 'Allow',
                    Action: ['s3:PutObject', 's3:GetObject', 's3:DeleteObject'],
                    Resource: [
                      {
                        'Fn::Join': [
                          '',
                          [
                            'arn:aws:s3:::',
                            {
                              Ref: 'storagefitnessappstorageBucketName',
                            },
                            '/*',
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

      const permissions = S3CloudFormationAccessParser.parseTemplate(template);

      expect(permissions).toHaveLength(2);
      expect(permissions[0]).toEqual({
        actions: ['s3:ListBucket'],
      });
      expect(permissions[1]).toEqual({
        actions: ['s3:PutObject', 's3:GetObject', 's3:DeleteObject'],
      });
    });

    it('should ignore non-S3 actions', () => {
      const template: Template = {
        Resources: {
          TestPolicy: {
            Type: 'AWS::IAM::Policy',
            Properties: {
              PolicyDocument: {
                Statement: [
                  {
                    Effect: 'Allow',
                    Action: 'dynamodb:GetItem',
                    Resource: 'arn:aws:dynamodb:us-east-1:123456789012:table/MyTable',
                  },
                ],
              },
            },
          },
        },
      };

      const permissions = S3CloudFormationAccessParser.parseTemplate(template);
      expect(permissions).toHaveLength(0);
    });
  });

  describe('mapS3ActionsToGen2Permissions', () => {
    it('should map S3 actions to Gen2 permissions correctly', () => {
      const s3Actions = ['s3:GetObject', 's3:PutObject', 's3:DeleteObject', 's3:ListBucket'];
      const gen2Permissions = S3CloudFormationAccessParser.mapS3ActionsToGen2Permissions(s3Actions);

      expect(gen2Permissions).toEqual(expect.arrayContaining(['read', 'write', 'delete']));
      expect(gen2Permissions).toHaveLength(3);
    });
  });
});
