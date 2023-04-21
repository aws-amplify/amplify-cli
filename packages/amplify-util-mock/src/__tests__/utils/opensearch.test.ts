import { querySearchable } from '../../utils/opensearch';
import fetch, { Response } from 'node-fetch';

jest.mock('node-fetch');
const fetchMock = fetch as jest.MockedFunction<typeof fetch>;

describe('configures a search query with given inputs', () => {
  const searchQueryParams = {
    path: '_todo',
    params: {
      body: {
        size: 10,
        sort: [{}],
        version: true,
        query: {},
        aggs: {},
      },
    },
  };

  beforeEach(() => {
    jest.resetAllMocks();
    fetchMock.mockResolvedValueOnce({
      status: 200,
      json: jest.fn().mockResolvedValueOnce({
        hits: {},
      }),
    } as unknown as Response);
  });

  it('throws error if invalid endpoint is provided', async () => {
    try {
      await querySearchable(null, searchQueryParams);
    } catch (err) {
      expect(err.message).toEqual('The local opensearch endpoint is not found');
    }
    expect(fetchMock).toBeCalledTimes(0);
  });

  it('constructs correct request for search query', async () => {
    const mockOpenSearchEndpoint = 'http://localhost:0000/';
    await querySearchable(mockOpenSearchEndpoint, searchQueryParams);

    const expectedFullURL = mockOpenSearchEndpoint.replace(/\/+$/, '') + searchQueryParams.path;
    expect(fetchMock).toBeCalledTimes(1);
    expect(fetchMock).toBeCalledWith(expectedFullURL, {
      method: 'POST',
      body: JSON.stringify(searchQueryParams.params.body),
      headers: {
        'Content-type': 'application/json',
      },
    });
  });
});
