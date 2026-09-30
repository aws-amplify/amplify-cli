import { AwsFetcher } from '../../../../commands/gen2-migration/_common/aws-fetcher';
import { AwsClients } from '../../../../commands/gen2-migration/_common/aws-clients';
import { mockClient } from 'aws-sdk-client-mock';
import { APIGatewayClient, GetResourcesCommand } from '@aws-sdk/client-api-gateway';

describe('AwsFetcher', () => {
  let apiGatewayMock: ReturnType<typeof mockClient>;
  let fetcher: AwsFetcher;

  beforeEach(() => {
    apiGatewayMock = mockClient(APIGatewayClient);
    const clients = new (AwsClients as any)({ region: 'us-east-1' });
    (clients as any).apiGateway = new APIGatewayClient({});
    fetcher = new AwsFetcher(clients);
  });

  afterEach(() => apiGatewayMock.restore());

  describe('fetchRestApiRootResourceId', () => {
    it('returns the root resource id when it is on the first page', async () => {
      apiGatewayMock.on(GetResourcesCommand).resolves({
        items: [
          { id: 'abc123', path: '/items' },
          { id: 'root01', path: '/' },
        ],
      });

      await expect(fetcher.fetchRestApiRootResourceId('api-1')).resolves.toBe('root01');
      expect(apiGatewayMock.commandCalls(GetResourcesCommand)).toHaveLength(1);
    });

    it('follows pagination when the root resource is on a later page', async () => {
      const firstPage = Array.from({ length: 25 }, (_, i) => ({ id: `res${i}`, path: `/path${i}` }));
      apiGatewayMock
        .on(GetResourcesCommand)
        .resolvesOnce({ items: firstPage, position: 'page-2' })
        .resolvesOnce({
          items: [
            { id: 'res25', path: '/path25' },
            { id: 'root01', path: '/' },
          ],
        });

      await expect(fetcher.fetchRestApiRootResourceId('api-1')).resolves.toBe('root01');

      const calls = apiGatewayMock.commandCalls(GetResourcesCommand);
      expect(calls).toHaveLength(2);
      expect(calls[1].args[0].input).toMatchObject({ restApiId: 'api-1', position: 'page-2' });
    });

    it('throws RestApiResourceNotFoundError when no page contains the root resource', async () => {
      apiGatewayMock
        .on(GetResourcesCommand)
        .resolvesOnce({ items: [{ id: 'res0', path: '/path0' }], position: 'page-2' })
        .resolvesOnce({ items: [{ id: 'res1', path: '/path1' }] });

      await expect(fetcher.fetchRestApiRootResourceId('api-1')).rejects.toThrow("Root resource not found for REST API 'api-1'");
      expect(apiGatewayMock.commandCalls(GetResourcesCommand)).toHaveLength(2);
    });
  });
});
