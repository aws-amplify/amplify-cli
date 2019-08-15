
const fs = require('fs-extra');
const path = require('path');
const download = require('download');

const { getDynamoDBLocalDirectory } = require('../index');
const DYNAMO_DB_LOCAL_DOWNLOAD_LOCATION =
  'https://s3-us-west-2.amazonaws.com/dynamodb-local/dynamodb_local_latest.zip';
function downloadDynamoDBLocal() {
  const ddbLocalDir = getDynamoDBLocalDirectory();
  fs.ensureDirSync(ddbLocalDir);
  return download(DYNAMO_DB_LOCAL_DOWNLOAD_LOCATION, ddbLocalDir, { extract: true });
}

downloadDynamoDBLocal();
