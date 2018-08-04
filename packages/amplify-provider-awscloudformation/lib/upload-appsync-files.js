const fs = require('fs');
const path = require('path');
const moment = require('moment');
const archiver = require('archiver');
const schemaFileName = 'schema.graphql';
const S3 = require('../src/aws-utils/aws-s3');


function uploadAppSyncFiles(context, resources) {
  resources = resources.filter(resource => resource.service === 'AppSync');
  // There can only be one appsync resource
  if(resources.length > 0) {
    const resource = resources[0];
    const { category, resourceName } = resource;
    const backEndDir = context.amplify.pathManager.getBackendDirPath();
    const resourceBuildDir = path.normalize(path.join(backEndDir, category, resourceName, 'build'));
    const resolverDir = path.normalize(path.join(resourceBuildDir, 'resolver'));
    const schemaFilePath = path.normalize(path.join(resourceBuildDir, schemaFileName));
    let uploadFilePromises = [];
    let s3LocationMap = {};

    // Upload schema file
    uploadFilePromises.push(uploadAppSyncFile(context, schemaFileName, schemaFilePath, s3LocationMap));


    const resolverFiles = fs.readdirSync(resolverDir);

    for (const file of resolverFiles) {
      const resolverFilePath = path.join(resolverDir, file)

      uploadFilePromises.push(uploadAppSyncFile(context, file, resolverFilePath, s3LocationMap));
      
    }

    return Promise.all(uploadFilePromises)
      .then(() => {
        console.log(s3LocationMap);
        const parametersFilePath = path.join(backEndDir, category, resourceName, 'parameters.json');
        let currentParameters;

        if (fs.existsSync(parametersFilePath)) {
          try {
            currentParameters = JSON.parse(fs.readFileSync(parametersFilePath));
          } catch (e) {
            currentParameters = {};
          }
        }

        Object.assign(currentParameters, s3LocationMap);
        console.log(currentParameters);
        const jsonString = JSON.stringify(currentParameters, null, 4);
        fs.writeFileSync(parametersFilePath, jsonString, 'utf8');

      });

  }
}

function uploadAppSyncFile(context, fileName, filePath, s3LocationMap) {

  let formattedName = fileName.split('.').map((s, i) => i > 0 ? `${s[0].toUpperCase()}${s.slice(1, s.length)}` : s).join('');

  let s3Key = `amplify-appsync-files/${fileName}`;

  return new S3(context)
    .then((s3) => {
      const s3Params = {
        Body: fs.createReadStream(filePath),
        Key: s3Key,
      };
      return s3.uploadFile(s3Params)
    })
    .then((bucket) => {
      s3LocationMap[formattedName] = 's3://' + path.join(bucket, s3Key);
    });
}




module.exports = {
  uploadAppSyncFiles,
};
