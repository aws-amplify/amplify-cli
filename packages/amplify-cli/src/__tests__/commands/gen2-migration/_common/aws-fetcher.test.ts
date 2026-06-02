import { GetBucketAccelerateConfigurationCommand } from '@aws-sdk/client-s3';
import { AwsFetcher } from '../../../../commands/gen2-migration/_common/aws-fetcher';
import { AwsClients } from '../../../../commands/gen2-migration/_common/aws-clients';

describe('AwsFetcher', () => {
  describe('fetchBucketAccelerate', () => {
    const send = jest.fn();
    const fetcher = new AwsFetcher({ s3: { send } } as unknown as AwsClients);

    beforeEach(() => {
      send.mockReset();
    });

    it('returns the bucket accelerate status when available', async () => {
      send.mockResolvedValueOnce({ Status: 'Enabled' });

      await expect(fetcher.fetchBucketAccelerate('my-bucket')).resolves.toBe('Enabled');
      expect(send).toHaveBeenCalledWith(expect.any(GetBucketAccelerateConfigurationCommand));
    });

    it('returns undefined when bucket acceleration is not supported for the bucket', async () => {
      const error = new Error('The specified method is not allowed against this resource.');
      error.name = 'MethodNotAllowed';
      send.mockRejectedValueOnce(error);

      await expect(fetcher.fetchBucketAccelerate('my-bucket')).resolves.toBeUndefined();
    });

    it('propagates non-MethodNotAllowed errors', async () => {
      const error = new Error('Access denied');
      error.name = 'AccessDenied';
      send.mockRejectedValueOnce(error);

      await expect(fetcher.fetchBucketAccelerate('my-bucket')).rejects.toBe(error);
    });
  });
});
