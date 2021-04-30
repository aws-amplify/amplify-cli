import { JSONUtilities } from 'amplify-cli-core';
import * as fs from 'fs-extra';
import { setExistingSecretArns } from '../../../../../provider-utils/awscloudformation/utils/containers/set-existing-secret-arns';

jest.mock('fs-extra');
const fs_mock = fs as jest.Mocked<typeof fs>;
fs_mock.existsSync.mockReturnValue(true);

jest.mock('amplify-cli-core', () => ({
  pathManager: {
    getBackendDirPath: jest.fn().mockReturnValue('/backend/dir/path'),
  },
  JSONUtilities: {
    readJson: jest.fn(),
  },
}));

const readJson_mock = JSONUtilities.readJson as jest.MockedFunction<typeof JSONUtilities.readJson>;

describe('set existing secret arns', () => {
  it('does nothing if no template found', () => {
    fs_mock.existsSync.mockReturnValueOnce(false);
    const secretMap = new Map<string, string>();
    setExistingSecretArns(secretMap, 'resourceName');
    expect(secretMap.size).toBe(0);
  });

  it('does nothing if template does not have secrets', () => {
    const mockTemplate = {
      Resources: {
        TaskDefinition: {
          Type: 'AWS::ECS::TaskDefinition',
          Properties: {
            ContainerDefinitions: [
              {
                Secrets: [],
              },
            ],
          },
        },
      },
    };
    readJson_mock.mockReturnValueOnce(mockTemplate);
    const secretMap = new Map<string, string>();
    setExistingSecretArns(secretMap, 'resourceName');
    expect(secretMap.size).toBe(0);
  });

  it('adds all secrets to secret map', () => {
    const mockTemplate = {
      Resources: {
        TaskDefinition: {
          Type: 'AWS::ECS::TaskDefinition',
          Properties: {
            ContainerDefinitions: [
              {
                Secrets: [
                  {
                    Name: 'SOMETHING',
                    ValueFrom: 'some:secretsmanager:arn',
                  },
                ],
              },
            ],
          },
        },
      },
    };
    readJson_mock.mockReturnValueOnce(mockTemplate);
    const secretMap = new Map<string, string>();
    setExistingSecretArns(secretMap, 'resourceName');
    expect(secretMap.size).toBe(1);
    expect(secretMap.entries().next().value).toMatchInlineSnapshot(`
      Array [
        "SOMETHING",
        "some:secretsmanager:arn",
      ]
    `);
  });
});
