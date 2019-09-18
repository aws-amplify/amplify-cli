const AmplifyCodeGenConfig = require('../../src/codegen-config/AmplifyCodeGenConfig');

const loadConfig = require('../../src/codegen-config');

jest.mock('../../src/codegen-config/AmplifyCodeGenConfig');
const MOCK_CONTEXT = 'MOCK_CONTEXT';

describe('codegen-config', () => {
  it('is singleton', () => {
    loadConfig(MOCK_CONTEXT);
    expect(AmplifyCodeGenConfig).toHaveBeenCalledWith(MOCK_CONTEXT, false);
    loadConfig(MOCK_CONTEXT);
    expect(AmplifyCodeGenConfig).toHaveBeenCalledTimes(1);
  });
});
