import { hasCdBranches } from '../../utils/check-hosting';

let mockBranches = {};

jest.mock('../../extensions/amplify-helpers/get-plugin-instance', () => {
  return {
    getPluginInstance: (_context, _plugin) => {
      return {
        getConfiguredAmplifyClient: (_context, _) => {
          return Promise.resolve({
            listBranches: _options => {
              return {
                promise: () => mockBranches,
              };
            },
          });
        },
      };
    },
  };
});

describe('hasCdBranches', () => {
  let mockContext = { exeInfo: { amplifyMeta: { providers: { awscloudformation: { AmplifyAppId: 'id' } } } } };

  it('should return true if CD branches are present', async () => {
    mockBranches = { branches: [{ some_branch_obj: 'main' }] };
    const result = await hasCdBranches(mockContext);
    expect(result).toBe(true);
  });

  it('should return false if no CD branches are present', async () => {
    mockBranches = { branches: [] };
    const result = await hasCdBranches(mockContext);
    expect(result).toBe(false);
  });
});
