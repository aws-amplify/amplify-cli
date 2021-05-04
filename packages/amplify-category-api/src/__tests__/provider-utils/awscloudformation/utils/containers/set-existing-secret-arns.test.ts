import { setExistingSecretArns } from '../../../../../provider-utils/awscloudformation/utils/containers/set-existing-secret-arns';

describe('set existing secret arns', () => {
  it('does nothing if no template found', () => {
    const secretMap = new Map<string, string>();
    setExistingSecretArns(secretMap, {});
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
    const secretMap = new Map<string, string>();
    setExistingSecretArns(secretMap, mockTemplate);
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
    const secretMap = new Map<string, string>();
    setExistingSecretArns(secretMap, mockTemplate);
    expect(secretMap.size).toBe(1);
    expect(secretMap.entries().next().value).toMatchInlineSnapshot(`
      Array [
        "SOMETHING",
        "some:secretsmanager:arn",
      ]
    `);
  });
});
