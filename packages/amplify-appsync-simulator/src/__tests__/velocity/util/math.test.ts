import { create } from '../../../velocity/util/index';
import { GraphQLResolveInfo } from 'graphql';

const stubInfo = {} as unknown;
export const mockInfo = stubInfo as GraphQLResolveInfo;
var util;

beforeEach(() => {
  util = create(undefined, undefined, mockInfo);
});

describe('$utils.math.round', () => {
  it('should round a double', () => {
    expect(util.math.roundNum(10.2)).toEqual(10);
    expect(util.math.roundNum(10.8)).toEqual(11);
    expect(util.math.roundNum(10)).toEqual(10);
  });
});

describe('$utils.str.minVal', () => {
  it('should get the min value', () => {
    expect(util.math.minVal(13.45, 45.67)).toEqual(13.45);
  });
});

describe('$utils.str.maxVal', () => {
  it('get the max value', () => {
    expect(util.math.maxVal(13.45, 45.67)).toEqual(45.67);
  });
});
