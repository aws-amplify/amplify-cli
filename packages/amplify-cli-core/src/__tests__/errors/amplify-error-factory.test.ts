import { AmplifyError } from '../../errors/amplify-error';
import { AmplifyErrorFactory } from '../../errors/amplify-error-factory';
import { AmplifyErrorType, AmplifyException } from '../../errors/amplify-exception';
import { AmplifyFault } from '../../errors/amplify-fault';


const errorType: AmplifyErrorType = 'DeploymentError';
// converted error to amplifyException
const error = new Error('mockMessage');
error.name = errorType;
/**
 * deepest amplify exception to get printed if amplify fault is thrown
 */
const deepestAmplifyException = new AmplifyError(
    errorType,
  {
    message: error.message,
  },
  error,
);

const amplifyFault = new AmplifyFault(
  'DeploymentFault',
  {
    message: 'mockMessage',
  },
  deepestAmplifyException,
);

const amplifyError = new AmplifyError(
    'AmplifyStudioError',
    {
      message: 'mockMessage',
    },
  );

test('returns amplify fault if the error isnt mentioned in list', async () => {
  expect(getDeepestAmplifyException(new AmplifyErrorFactory(amplifyFault).create(error)).name).toMatch(errorType);
});

test('returns amplify fault if the error isnt instance of Error', async () => {
  expect(getDeepestAmplifyException(new AmplifyErrorFactory(amplifyFault).create(amplifyError)).name).toMatch(errorType);
});

test('returns user error if the error is present in list', async () => {
    // error name is user error list
  error.name = 'InvalidDirectiveError';
  expect(getDeepestAmplifyException(new AmplifyErrorFactory(amplifyFault).create(error)).name).toMatch('InvalidDirectiveError')
});

test('returns regex error if the error contains regex user mapping', async () => {
    const testUserErrorString = [
        'No GraphQL schema found in schema location',
        'No schema found, your graphql schema should be in either',
        'Could not find a schema in either',
        'Api Not found',
        `GraphQL API myMockAppsyncApi already exists in the project. Use 'amplify update api' to make modifications.`,
        `GraphQL API mockapi2 already exists.`
    ];
    // making name as null
    error.name = '';
    // error name is user error list
    testUserErrorString.forEach(testString => {
        error.message = testString;
        expect(getDeepestAmplifyException(new AmplifyErrorFactory(amplifyFault).create(error)).name).toMatchSnapshot()
    });
});

const getDeepestAmplifyException = (amplifyException: AmplifyException): AmplifyException => {
  let deepestAmplifyException = amplifyException;
  while (deepestAmplifyException.downstreamException && deepestAmplifyException.downstreamException instanceof AmplifyException) {
    deepestAmplifyException = deepestAmplifyException.downstreamException;
  }
  return deepestAmplifyException;
};
