import { create } from '../../../velocity/util/index';
import { mockedInputToRdsJsonString, mockedOutputFromRdsJsonString } from './mock-data';
import { GraphQLResolveInfo } from 'graphql';
import { AppSyncGraphQLExecutionContext } from '../../../utils/graphql-runner';
import { AmplifyAppSyncSimulatorAuthenticationType } from '../../../type-definition';

const stubInfo = {} as unknown;
const mockInfo = stubInfo as GraphQLResolveInfo;
let util;

beforeEach(() => {
  const executionContext: AppSyncGraphQLExecutionContext = {
    headers: { 'x-api-key': 'da-fake-key' },
    requestAuthorizationMode: AmplifyAppSyncSimulatorAuthenticationType.API_KEY,
    appsyncErrors: [],
  };

  util = create(undefined, undefined, mockInfo, executionContext);
});

describe('$utils.rds.toJsonString', () => {
  it('should convert rds object to stringified JSON', () => {
    expect(util.rds.toJsonString(mockedInputToRdsJsonString)).toEqual(mockedOutputFromRdsJsonString);
  });
  it('handle input without sqlStatementResults input', () => {
    expect(util.rds.toJsonString('{}')).toEqual('[]');
  });
  it('handle invalid input', () => {
    expect(util.rds.toJsonString('')).toEqual('');
  });
});
