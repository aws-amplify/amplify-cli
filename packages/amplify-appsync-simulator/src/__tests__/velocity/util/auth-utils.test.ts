import { create } from '../../../velocity/util/index';
import { GraphQLResolveInfo } from 'graphql';
import { AppSyncGraphQLExecutionContext } from '../../../utils/graphql-runner';
import { AmplifyAppSyncSimulatorAuthenticationType } from '../../../type-definition';

const stubInfo = {} as unknown;
const mockInfo = stubInfo as GraphQLResolveInfo;

describe('$util.authType', () => {
  it('should return API Key Authorization', () => {
    const executionContext: AppSyncGraphQLExecutionContext = {
      headers: { 'x-api-key': 'da-fake-key' },
      requestAuthorizationMode: AmplifyAppSyncSimulatorAuthenticationType.API_KEY,
      appsyncErrors: [],
    };

    const util = create(undefined, undefined, mockInfo, executionContext);

    expect(util.authType()).toEqual('API Key Authorization');
  });

  it('should return IAM Authorization', () => {
    const executionContext: AppSyncGraphQLExecutionContext = {
      headers: { 'x-api-key': 'da-fake-key' },
      requestAuthorizationMode: AmplifyAppSyncSimulatorAuthenticationType.AWS_IAM,
      appsyncErrors: [],
    };

    const util = create(undefined, undefined, mockInfo, executionContext);

    expect(util.authType()).toEqual('IAM Authorization');
  });

  it('should return Open ID Connect Authorization', () => {
    const executionContext: AppSyncGraphQLExecutionContext = {
      headers: { 'x-api-key': 'da-fake-key' },
      requestAuthorizationMode: AmplifyAppSyncSimulatorAuthenticationType.OPENID_CONNECT,
      appsyncErrors: [],
    };

    const util = create(undefined, undefined, mockInfo, executionContext);

    expect(util.authType()).toEqual('Open ID Connect Authorization');
  });

  it('should return User Pool Authorization', () => {
    const executionContext: AppSyncGraphQLExecutionContext = {
      headers: { 'x-api-key': 'da-fake-key' },
      requestAuthorizationMode: AmplifyAppSyncSimulatorAuthenticationType.AMAZON_COGNITO_USER_POOLS,
      appsyncErrors: [],
    };

    const util = create(undefined, undefined, mockInfo, executionContext);

    expect(util.authType()).toEqual('User Pool Authorization');
  });
});
