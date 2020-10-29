import { URLSearchParams } from 'url';
import { decodeHeaderFromQueryParam } from '../../../../../server/subscription/websocket-server/utils/decode-header';

describe('decodeHeaderFromQueryParam', () => {
  it('should decode header query param from the the url', () => {
    const header = {
      authorization: 'some token',
      someOtherValue: 'value',
    };
    const paramName = 'header';
    const base64EncodedHeaderValue = Buffer.from(JSON.stringify(header)).toString('base64');
    const queryParam = new URLSearchParams({
      [paramName]: base64EncodedHeaderValue,
    });
    const url = `/graphql?${queryParam.toString()}`;
    expect(decodeHeaderFromQueryParam(url)).toEqual(header);
    expect(decodeHeaderFromQueryParam(url, paramName)).toEqual(header);
  });

  it('should return an empty object when the parameter is missing in the query', () => {
    const url = `/graphql`;
    const paramName = 'header';
    expect(decodeHeaderFromQueryParam(url)).toEqual({});
    expect(decodeHeaderFromQueryParam(url, paramName)).toEqual({});
  });
});
