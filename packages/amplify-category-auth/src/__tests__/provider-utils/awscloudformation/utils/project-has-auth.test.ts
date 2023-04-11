import { stateManager } from '@aws-amplify/amplify-cli-core';
import { projectHasAuth } from '../../../../provider-utils/awscloudformation/utils/project-has-auth';

jest.mock('@aws-amplify/amplify-cli-core');

describe('auth category dependency check', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns true if auth category exists', () => {
    stateManager.getMeta = jest.fn().mockReturnValue({
      auth: {
        myapp12345: {
          service: 'Cognito',
        },
      },
    });
    expect(projectHasAuth()).toEqual(true);
  });

  it('returns false if auth category does not exist', () => {
    stateManager.getMeta = jest.fn().mockReturnValue({
      geo: {
        map12345: {},
      },
    });
    expect(projectHasAuth()).toEqual(false);
  });
});
