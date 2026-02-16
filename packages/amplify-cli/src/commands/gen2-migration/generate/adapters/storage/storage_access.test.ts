import { extractFunctionS3Access, extractFunctionDynamoDBAccess, getStorageAccess } from './storage_access';
import { S3CloudFormationAccessParser } from '../../codegen-head/s3_cfn_access_parser';
import { DynamoDBCloudFormationAccessParser } from '../../codegen-head/dynamodb_cfn_access_parser';
import { renderStorage } from '../../generators/storage';

jest.mock('../../codegen-head/s3_cfn_access_parser');
jest.mock('../../codegen-head/dynamodb_cfn_access_parser');
const mockS3Parser = S3CloudFormationAccessParser as jest.Mocked<typeof S3CloudFormationAccessParser>;
const mockDynamoParser = DynamoDBCloudFormationAccessParser as jest.Mocked<typeof DynamoDBCloudFormationAccessParser>;

describe('Storage Access with S3 Function Support', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('extractFunctionS3Access', () => {
    it('should extract function access patterns from CloudFormation templates', () => {
      mockS3Parser.findFunctionCloudFormationTemplate.mockReturnValue(
        'amplify/backend/function/generateReports/generateReports-cloudformation-template.json',
      );

      mockS3Parser.parseTemplateFile.mockReturnValue([
        {
          actions: ['s3:PutObject', 's3:GetObject', 's3:DeleteObject'],
        },
      ]);

      mockS3Parser.mapS3ActionsToGen2Permissions.mockReturnValue(['read', 'write', 'delete']);

      const result = extractFunctionS3Access(['generateReports']);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        functionName: 'generateReports',
        permissions: ['read', 'write', 'delete'],
      });
    });

    it('should return empty array when no S3 actions found', () => {
      mockS3Parser.findFunctionCloudFormationTemplate.mockReturnValue(
        'amplify/backend/function/processImages/processImages-cloudformation-template.json',
      );

      mockS3Parser.parseTemplateFile.mockReturnValue([]);

      const result = extractFunctionS3Access(['processImages']);
      expect(result).toHaveLength(0);
    });
  });

  describe('extractFunctionDynamoDBAccess', () => {
    it('should extract DynamoDB access patterns from CloudFormation templates', () => {
      mockDynamoParser.findFunctionCloudFormationTemplate.mockReturnValue(
        'amplify/backend/function/dataProcessor/dataProcessor-cloudformation-template.json',
      );

      mockDynamoParser.parseTemplateFile.mockReturnValue([
        {
          tableResource: 'storagecountsTableName',
          actions: ['dynamodb:PutItem', 'dynamodb:GetItem', 'dynamodb:Query'],
        },
      ]);

      const result = extractFunctionDynamoDBAccess(['dataProcessor'], ['countsTable']);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        functionName: 'dataProcessor',
        tableResource: 'storagecountsTableName',
        actions: ['dynamodb:PutItem', 'dynamodb:GetItem', 'dynamodb:Query'],
      });
    });
  });

  describe('getStorageAccess', () => {
    it('should maintain existing functionality for CLI inputs', () => {
      const cliInputs = {
        guestAccess: ['READ' as const],
        authAccess: ['READ' as const, 'CREATE_AND_UPDATE' as const],
        groupAccess: {
          Admins: ['READ' as const, 'CREATE_AND_UPDATE' as const, 'DELETE' as const],
        },
      };

      const result = getStorageAccess(cliInputs);

      expect(result).toEqual({
        guest: ['read'],
        auth: ['read', 'write'],
        groups: {
          Admins: ['read', 'write', 'delete'],
        },
      });
    });
  });

  describe('renderStorage snapshot', () => {
    it('should generate storage resource with function access patterns', () => {
      const storageParams = {
        storageIdentifier: 'fitnessappstorage-dev',
        accessPatterns: {
          guest: ['read' as const],
          auth: ['read' as const, 'write' as const],
          functions: [
            {
              functionName: 'generateReports',
              permissions: ['read' as const, 'write' as const, 'delete' as const],
            },
          ],
        },
      };

      const result = renderStorage(storageParams);
      expect(result).toMatchSnapshot();
    });

    it('should generate backend with DynamoDB function access escape hatch', () => {
      const mockBackendSynthesizer = {
        render: jest
          .fn()
          .mockReturnValue([
            'backend.dataProcessor.resources.lambda.addToRolePolicy(',
            '  new PolicyStatement({',
            '    actions: ["dynamodb:PutItem", "dynamodb:GetItem", "dynamodb:Query"],',
            '    resources: [',
            '      "arn:aws:dynamodb:*:*:table/storagecountsTableName",',
            '      "arn:aws:dynamodb:*:*:table/storagecountsTableName/index/*"',
            '    ]',
            '  })',
            ');',
          ]),
      };

      const renderArgs = {
        storage: {
          dynamoFunctionAccess: [
            {
              functionName: 'dataProcessor',
              tableResource: 'storagecountsTableName',
              actions: ['dynamodb:PutItem', 'dynamodb:GetItem', 'dynamodb:Query'],
            },
          ],
        },
      };

      const result = mockBackendSynthesizer.render(renderArgs);
      expect(result).toMatchSnapshot();
    });
  });
});
