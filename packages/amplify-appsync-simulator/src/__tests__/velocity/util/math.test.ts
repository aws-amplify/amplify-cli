import { create } from '../../../velocity/util/index';
import { GraphQLResolveInfo } from 'graphql';
import { AppSyncGraphQLExecutionContext } from '../../../utils/graphql-runner';
import { AmplifyAppSyncSimulatorAuthenticationType } from '../../../type-definition';

const stubInfo = {} as unknown;
export const mockInfo = stubInfo as GraphQLResolveInfo;
let util;

beforeEach(() => {
  const executionContext: AppSyncGraphQLExecutionContext = {
    headers: { 'x-api-key': 'da-fake-key' },
    requestAuthorizationMode: AmplifyAppSyncSimulatorAuthenticationType.API_KEY,
    appsyncErrors: [],
  };

  util = create(undefined, undefined, mockInfo, executionContext);
});

describe('$utils.math.round', () => {
  it('should round a double', () => {
    expect(util.math.roundNum(10.2)).toEqual(10);
    expect(util.math.roundNum(10.8)).toEqual(11);
    expect(util.math.roundNum(10)).toEqual(10);
  });
});

describe('$utils.math.minVal', () => {
  it('should get the min value', () => {
    expect(util.math.minVal(13.45, 45.67)).toEqual(13.45);
  });
});

describe('$utils.math.maxVal', () => {
  it('get the max value', () => {
    expect(util.math.maxVal(13.45, 45.67)).toEqual(45.67);
  });
});

describe('$utils.math.random', () => {
  it('get a random value', () => {
    expect(typeof util.math.randomDouble()).toBe('number');
  });
});

describe('$utils.math.randomWithinRange', () => {
  it('get a randomWithinRange value', () => {
    expect(typeof util.math.randomWithinRange(10, 20)).toBe('number');
  });
});
