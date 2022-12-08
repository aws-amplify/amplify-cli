const { Redactor } = require('amplify-cli-logger');

describe('test amplify logger', () => {
  test('undefined object logger', () => {
    const info = jest.fn();
    const error = jest.fn();
    jest.mock('amplify-cli-logger', () => ({
      Redactor,
      getAmplifyLogger: () => ({
        logInfo: info,
        logError: error,
      }),
    }));
    const { fileLogger } = require('../../utils/aws-logger');
    fileLogger('aws-logging-test')('test-func', [undefined])();
    expect(info).toBeCalledWith({ message: 'amplify-provider-awscloudformation.aws-logging-test.test-func([null])' });
    fileLogger('aws-logging-test')('test-func', undefined)();
    expect(info).toBeCalledWith({ message: 'amplify-provider-awscloudformation.aws-logging-test.test-func()' });
    fileLogger('aws-logging-test')('test-func', undefined)({ name: 'mockError' });
    expect(error).toBeCalledWith({
      message: 'amplify-provider-awscloudformation.aws-logging-test.test-func()',
      error: { name: 'mockError' },
    });
  });
});
