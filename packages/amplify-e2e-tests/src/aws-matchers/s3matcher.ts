import { S3 } from 'aws-sdk';

expect.extend({
  async toBeAS3Bucket(bucketName: string) {
    const s3 = new S3();
    let pass: boolean;
    try {
      await s3.headBucket({ Bucket: bucketName }).promise();
      pass = true;
    } catch (e) {
      pass = false;
    }

    const messageStr = pass ? `expected S3 bucket ${bucketName} exist` : `expected S3 bucket ${bucketName} does exist`;
    return {
      message: () => messageStr,
      pass,
    };
  },
});
