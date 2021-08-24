import { create } from '../../../velocity/util/index';
import { mockedInputToRdsJsonString, mockedOutputFromRdsJsonString } from './mock-data';
import { GraphQLResolveInfo } from 'graphql';

const stubInfo = {} as unknown;
const mockInfo = stubInfo as GraphQLResolveInfo;
let util;

beforeEach(() => {
  util = create(undefined, undefined, mockInfo);
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

describe('$utils.rds.toJsonObject', () => {
  const mockedOutputFromRdsJsonObject = JSON.parse(mockedOutputFromRdsJsonString);
  it('should convert rds string to JSON object', () => {
    expect(util.rds.toJsonObject(mockedInputToRdsJsonString)).toEqual(mockedOutputFromRdsJsonObject);
  });
  it('handle input without sqlStatementResults input', () => {
    expect(util.rds.toJsonObject('{}')).toHaveLength(0);
  });
  it('handle invalid input', () => {
    expect(util.rds.toJsonObject('')).toEqual('');
  });
});
