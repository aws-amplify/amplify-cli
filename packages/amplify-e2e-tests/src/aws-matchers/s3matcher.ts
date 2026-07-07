import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';

export const toBeAS3Bucket = async (bucketName: string) => {
  const s3 = new S3Client();
  let pass: boolean;
  try {
    await s3.send(new HeadBucketCommand({ Bucket: bucketName }));
    pass = true;
  } catch (e) {
    pass = false;
  }

  const messageStr = pass ? `expected S3 bucket ${bucketName} exist` : `expected S3 bucket ${bucketName} does exist`;
  return {
    message: () => messageStr,
    pass,
  };
};
