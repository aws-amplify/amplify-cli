import { GetBucketAccelerateConfigurationCommand, S3Client } from '@aws-sdk/client-s3';
import nock from 'nock';
import { AwsFetcher } from '../../../../commands/gen2-migration/_common/aws-fetcher';
import { AwsClients } from '../../../../commands/gen2-migration/_common/aws-clients';

describe('AwsFetcher', () => {
  it('returns the bucket accelerate status when available', async () => {
    const send = jest.fn();
    const fetcher = new AwsFetcher({ s3: { send } } as unknown as AwsClients);
    send.mockResolvedValueOnce({ Status: 'Enabled' });

    await expect(fetcher.fetchBucketAccelerate('my-bucket')).resolves.toBe('Enabled');
    expect(send).toHaveBeenCalledWith(expect.any(GetBucketAccelerateConfigurationCommand));
  });

  it('returns undefined for an SDK-deserialized MethodNotAllowed response', async () => {
    const endpoint = 'https://s3.example.com';
    const scope = nock(endpoint)
      .get(/.*/)
      .reply(
        405,
        '<?xml version="1.0" encoding="UTF-8"?><Error><Code>MethodNotAllowed</Code><Message>The specified method is not allowed against this resource.</Message></Error>',
        { 'Content-Type': 'application/xml' },
      );
    const s3 = new S3Client({
      region: 'us-east-1',
      endpoint,
      forcePathStyle: true,
      credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
    });
    const fetcher = new AwsFetcher({ s3 } as unknown as AwsClients);

    try {
      await expect(fetcher.fetchBucketAccelerate('my-bucket')).resolves.toBeUndefined();
      scope.done();
    } finally {
      s3.destroy();
      nock.cleanAll();
    }
  });

  it('propagates non-MethodNotAllowed errors', async () => {
    const send = jest.fn();
    const fetcher = new AwsFetcher({ s3: { send } } as unknown as AwsClients);
    const error = new Error('Access denied');
    error.name = 'AccessDenied';
    send.mockRejectedValueOnce(error);

    await expect(fetcher.fetchBucketAccelerate('my-bucket')).rejects.toBe(error);
  });
});
