import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

export async function getS3ObjectContent(s3Url: string): Promise<string> {
  const url = new URL(s3Url);
  const splitPath = url.pathname.split('/');
  const bucket = splitPath[1];
  const key = splitPath.slice(2).join('/');
  console.log('bucket', bucket, 'key', key);

  const s3Client = new S3Client({});
  const response = await s3Client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));

  return await response.Body!.transformToString();
}
