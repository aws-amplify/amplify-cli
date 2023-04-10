import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { createS3Service } from '../../aws-utils/S3Service';

jest.mock('aws-sdk', () => {
  const mockHeadBucketForUsEast1 = jest.fn().mockImplementation((params: { Bucket: string }) => {
    return {
      promise: jest.fn().mockImplementation(() => {
        if (params.Bucket.includes('us-east-1')) {
          return Promise.resolve({});
        }
        return Promise.reject({ code: 'BadRequest', region: 'eu-south-1' });
      }),
    };
  });

  const mockHeadBucketForEuSouth1 = jest.fn().mockImplementation((params) => {
    return {
      promise: jest.fn().mockImplementation(() => {
        if (params.Bucket.includes('eu-south-1')) {
          return Promise.resolve({});
        }
        return Promise.reject({ code: 'BadRequest', region: 'us-east-1' });
      }),
    };
  });

  return {
    S3: jest.fn((options) => {
      const region = options.region || 'us-east-1';
      if (region === 'eu-south-1') {
        return {
          headBucket: mockHeadBucketForEuSouth1,
        };
      }
      return {
        config: {
          region,
        },
        headBucket: mockHeadBucketForUsEast1,
      };
    }),
  };
});

describe('S3Service', () => {
  const bucketNameUsEast = `test-bucket-us-east-1-${Math.floor(Math.random() * 100000)}`;
  const bucketNameEuSouth = `test-bucket-eu-south-1-${Math.floor(Math.random() * 100000)}`;

  it('should correctly return if bucket exists in NON opt-in region', async () => {
    const s3service = await createS3Service({} as unknown as $TSContext);
    const bucketExists = await s3service.bucketExists(bucketNameUsEast);
    expect(bucketExists).toBe(true);
  });

  it('should correctly return if bucket exists in opt-in region', async () => {
    const s3service = await createS3Service({} as unknown as $TSContext);
    const bucketExists = await s3service.bucketExists(bucketNameEuSouth);
    expect(bucketExists).toBe(true);
  });
});
