import { getExistingTableColumnNames } from '../../../provider-utils/awscloudformation/cfn-template-utils';
import { pathManager, readCFNTemplate } from 'amplify-cli-core';

jest.mock('amplify-cli-core');

const pathManager_mock = pathManager as jest.Mocked<typeof pathManager>;
const readCFNTemplate_mock = readCFNTemplate as jest.MockedFunction<typeof readCFNTemplate>;

pathManager_mock.getBackendDirPath.mockReturnValue('/test/path');

describe('get existing table column names', () => {
  it('returns empty array when no template exists', async () => {
    readCFNTemplate_mock.mockReturnValueOnce(undefined);
    const result = await getExistingTableColumnNames('testResource');
    expect(result).toEqual([]);
  });

  it('returns empty array when no table in template', async () => {
    readCFNTemplate_mock.mockReturnValueOnce({
      cfnTemplate: {
        Resources: {
          NoTablesHere: {
            Type: 'AWS::NotATable',
          },
        },
      },
    } as any);
    const result = await getExistingTableColumnNames('testResource');
    expect(result).toEqual([]);
  });

  it('returns empty array when table has no attributes', async () => {
    readCFNTemplate_mock.mockReturnValueOnce({
      cfnTemplate: {
        Resources: {
          TestTable: {
            Type: 'AWS::DynamoDB::Table',
            Properties: {
              AttributeDefinitions: [],
            },
          },
        },
      },
    } as any);
    const result = await getExistingTableColumnNames('testResource');
    expect(result).toEqual([]);
  });

  it('returns attribute names when present', async () => {
    readCFNTemplate_mock.mockReturnValueOnce({
      cfnTemplate: {
        Resources: {
          TestTable: {
            Type: 'AWS::DynamoDB::Table',
            Properties: {
              AttributeDefinitions: [
                {
                  AttributeName: 'col1',
                },
                {
                  AttributeName: 'col2',
                },
              ],
            },
          },
        },
      },
    } as any);
    const result = await getExistingTableColumnNames('restResource');
    expect(result).toEqual(['col1', 'col2']);
  });
});
