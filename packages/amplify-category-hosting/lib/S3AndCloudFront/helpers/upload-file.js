const fs = require('fs-extra');
const path = require('path');
const mime = require('mime-types');
const { Upload } = require('@aws-sdk/lib-storage');

async function uploadFile(s3Client, hostingBucketName, distributionDirPath, filePath, hasCloudFront) {
  let relativeFilePath = path.relative(distributionDirPath, filePath);
  // make Windows-style relative paths compatible to S3
  relativeFilePath = relativeFilePath.replace(/\\/g, '/');
  const fileStream = fs.createReadStream(filePath);
  const contentType = mime.lookup(relativeFilePath);
  const uploadParams = {
    Bucket: hostingBucketName,
    Key: relativeFilePath,
    Body: fileStream,
    ContentType: contentType || 'text/plain',
  };

  if (!hasCloudFront) {
    uploadParams.ACL = 'public-read';
  }

  const upload = new Upload({
    client: s3Client,
    params: uploadParams,
  });

  const data = await upload.done();

  return data;
}

module.exports = {
  uploadFile,
};
