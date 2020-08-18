import { initEnv, isMockable } from '../../src';
import sequential from 'promise-sequential';

jest.mock('promise-sequential');

const sequential_mock = sequential as jest.MockedFunction<typeof sequential>;

describe('function category provider', () => {
  describe('initialize environment', () => {
    it('only initializes function category resources', async () => {
      const contextStub = {
        amplify: {
          removeResourceParameters: jest.fn(),
          getResourceStatus: () => ({
            resourcesToBeCreated: [
              {
                category: 'function',
                resourceName: 'someResource',
              },
              {
                category: 'other',
                resourceName: 'dontIncludeMe',
              },
            ],
            resourcesToBeDeleted: [
              {
                category: 'something',
                resourceName: 'dontDeleteMe',
              },
              {
                category: 'function',
                resourceName: 'doDeleteThis',
              },
            ],
            resourcesToBeUpdated: [
              {
                category: 'function',
                resourceName: 'updateMe',
              },
              {
                category: 'different',
                resourceName: 'leaveThisOut',
              },
            ],
          }),
        },
      };
      await initEnv(contextStub);
      expect(contextStub.amplify.removeResourceParameters.mock.calls.length).toBe(1);
      expect(sequential_mock.mock.calls.length).toBe(1);
      expect(sequential_mock.mock.calls[0][0].length).toBe(2);
    });
  });
});

describe('mock function', () => {
  it('mock function with layers', async () => {
    const contextStub = {
      amplify: {
        getProjectMeta: () => ({
          function: {
            issue4992d7983625: {
              build: true,
              providerPlugin: 'awscloudformation',
              service: 'Lambda',
              dependsOn: [
                {
                  category: 'function',
                  resourceName: 'demofunction',
                },
                {
                  category: 'function',
                  resourceName: 'demolayer',
                },
              ],
            },
            demofunction: {
              build: true,
              providerPlugin: 'awscloudformation',
              service: 'Lambda',
              dependsOn: [],
            },
            demolayer: {
              build: true,
              providerPlugin: 'awscloudformation',
              service: 'LambdaLayer',
              dependsOn: [],
            },
          },
        }),
      },
    };
    const resourceName = 'issue4992d7983625';
    expect(isMockable(contextStub, resourceName)).toMatchSnapshot();
  });

  it('mock function with functions', async () => {
    const contextStub = {
      amplify: {
        getProjectMeta: () => ({
          function: {
            issue4992d7983625: {
              build: true,
              providerPlugin: 'awscloudformation',
              service: 'Lambda',
              dependsOn: [
                {
                  category: 'function',
                  resourceName: 'demofunction',
                },
                {
                  category: 'function',
                  resourceName: 'demolayer',
                },
              ],
            },
            demofunction: {
              build: true,
              providerPlugin: 'awscloudformation',
              service: 'Lambda',
              dependsOn: [],
            },
            demolayer: {
              build: true,
              providerPlugin: 'awscloudformation',
              service: 'Lambda',
              dependsOn: [],
            },
          },
        }),
      },
    };
    const resourceName = 'issue4992d7983625';
    expect(isMockable(contextStub, resourceName)).toMatchSnapshot();
  });
});
