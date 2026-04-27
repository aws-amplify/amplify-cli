const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');

const s3 = new S3Client({ region: process.env.AWS_REGION });
const BUCKET_NAME = process.env.STORAGE_MEDIAVAULT_BUCKETNAME;

exports.handler = async (event) => {
  console.log(`EVENT: ${JSON.stringify(event)}`);

  const { mediaFileKey } = event.arguments;

  const key = decodeURIComponent(mediaFileKey.replace(/\+/g, ' '));

  // Skip if already a thumbnail
  if (key.includes('/thumbnails/')) {
    return { statusCode: 200, message: 'Thumbnail processed' };
  }

  // Only process image files
  if (!key.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
    return { statusCode: 200, message: 'Thumbnail not applicable' };
  }

  // Get file metadata
  const getCommand = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key });
  const fileData = await s3.send(getCommand);

  console.log(`Processing image: ${key}`);
  console.log(`File size: ${fileData.ContentLength} bytes`);
  console.log(`Content type: ${fileData.ContentType}`);

  // Create a simple text file as "thumbnail" for now
  const thumbnailKey = key.replace(/^(.+)\/([^/]+)$/, '$1/thumbnails/$2') + '.txt';
  const thumbnailContent = `Thumbnail info for: ${key}\nSize: ${fileData.ContentLength} bytes\nType: ${fileData.ContentType}`;

  const putCommand = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: thumbnailKey,
    Body: thumbnailContent,
    ContentType: 'text/plain',
  });
  await s3.send(putCommand);

  console.log(`Thumbnail info created: ${thumbnailKey}`);

  return { statusCode: 200, message: 'Thumbnail processed' };
};
