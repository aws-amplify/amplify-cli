import { create } from '../../../velocity/util/index';
import { GraphQLResolveInfo } from 'graphql';
import { AmplifyAppSyncSimulatorAuthenticationType } from '../../../type-definition';
import { AppSyncGraphQLExecutionContext } from '../../../utils/graphql-runner';

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

describe('$utils.str.toLower', () => {
  it('should chnage a string to lowercase', () => {
    expect(util.str.toLower('HELLO WORLD')).toEqual('hello world');
    expect(util.str.toLower('hello world')).toEqual('hello world');
    expect(util.str.toLower('HeLlo WorlD')).toEqual('hello world');
  });
});

describe('$utils.str.toUpper', () => {
  it('should chnage a string to uppercase', () => {
    expect(util.str.toUpper('HELLO WORLD')).toEqual('HELLO WORLD');
    expect(util.str.toUpper('hello world')).toEqual('HELLO WORLD');
    expect(util.str.toUpper('HeLlo WorlD')).toEqual('HELLO WORLD');
  });
});

describe('$utils.str.toReplace', () => {
  it('should replace a string', () => {
    expect(util.str.toReplace('hello world, hello!', 'hello', 'mellow')).toEqual('mellow world, mellow!');
  });
});

describe('$utils.str.normalize', () => {
  it('should normalize a string', () => {
    expect(util.str.normalize('\u0041\u006d\u0065\u0301\u006c\u0069\u0065', 'nfc')).toEqual('Amélie');
    expect(util.str.normalize('\u0041\u006d\u0065\u0301\u006c\u0069\u0065', 'nfc')).toEqual('Amélie');
    expect(util.str.normalize('\u00F1', 'nfd')).toEqual('ñ');
    expect(util.str.normalize('\u006E\u0303', 'nfd')).toEqual('ñ');
  });
});
