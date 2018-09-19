const graphQLConfig = require('graphql-config');
const { join } = require('path');

const AmplifyCodeGenConfig = require('../../src/codegen-config/AmplifyCodeGenConfig');

jest.mock('graphql-config');

describe('AmplifyCodeGenConfig', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should load config', () => {
    // const config = NEW
  });
});
