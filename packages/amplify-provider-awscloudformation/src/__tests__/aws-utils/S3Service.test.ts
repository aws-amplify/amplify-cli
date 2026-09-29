import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { createS3Service } from '../../aws-utils/S3Service';
import { HeadBucketCommand } from '@aws-sdk/client-s3';

// Mock the AWS SDK v3 S3Client
jest.mock('@aws-sdk/client-s3', () => {
  const mockSendForUsEast1 = jest.fn().mockImplementation(async (command) => {
    if (command instanceof HeadBucketCommand) {
      const params = command.input;
      if (params.Bucket!.includes('us-east-1')) {
        return {};
      }
      const error = new Error('BadRequest');
      error.name = 'BadRequest';
      throw error;
    }
    return {};
  });

  const mockSendForEuSouth1 = jest.fn().mockImplementation(async (command) => {
    if (command instanceof HeadBucketCommand) {
      const params = command.input;
      if (params.Bucket!.includes('eu-south-1')) {
        return {};
      }
      const error = new Error('BadRequest');
      error.name = 'BadRequest';
      throw error;
    }
    return {};
  });

  const mockS3Client = jest.fn().mockImplementation((options) => {
    const region = options.region || 'us-east-1';

    return {
      send: region === 'eu-south-1' ? mockSendForEuSouth1 : mockSendForUsEast1,
      config: {
        region,
        credentials: options.credentials,
      },
    };
  });

  return {
    S3Client: mockS3Client,
    HeadBucketCommand: jest.fn().mockImplementation((params) => {
      return {
        input: params,
      };
    }),
    ListBucketsCommand: jest.fn(),
    GetBucketLocationCommand: jest.fn(),
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
