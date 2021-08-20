import { create } from '../../../velocity/util/index';
import { httpUtils } from '../../../velocity/util/http';
import { GraphQLResolveInfo } from 'graphql';

const stubInfo = {} as unknown;
const mockInfo = stubInfo as GraphQLResolveInfo;
let util;

beforeEach(() => {
  util = create(undefined, undefined, mockInfo);
});

describe('$utils.http.copyHeaders()', () => {
  it('should clone a passed object of headers', () => {
    const headers = { accept: 'application/json', 'accept-language': 'en-US,en;q=0.5' };
    let copiedHeaders = httpUtils.copyHeaders(headers);
    expect(copiedHeaders).toEqual(headers);

    copiedHeaders.connection = 'keep-alive';
    expect(headers).not.toHaveProperty('connection');
  });

  it('should return an empty object if passed `undefined`', () => {
    const copiedHeaders = httpUtils.copyHeaders(undefined);
    expect(copiedHeaders).toEqual({});
  });
});
