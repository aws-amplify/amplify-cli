const aws = require('aws-sdk');
const ora = require('ora');
const pathManager = require('./path-manager');
const { removeEnvFromCloud } = require('./remove-env-from-cloud');

async function deleteProject(context) {
  if (
    await context.amplify.confirmPrompt.run(
      'Are you sure you want to continue? (This would delete all the environments of the project from the cloud and wipe out all the local amplify resource files)'
    )
  ) {
    const removeEnvPromises = [];
    const allEnvs = context.amplify.getEnvDetails();
    Object.keys(allEnvs).forEach(env => {
      removeEnvPromises.push(removeEnvFromCloud(context, env));
    });
    const spinner = ora('Deleting resources from the cloud. This may take a few minutes...');
    spinner.start();
    await Promise.all(removeEnvPromises);
    if (
      context.input.options &&
      context.input.options.all &&
      (await context.amplify.confirmPrompt.run('Are you sure you want to continue to delete all the data contained and the S3 buckets?'))
    ) {
      spinner.text = 'Deleting S3 buckets';
      const amplifyMetaFilePath = context.amplify.pathManager.getAmplifyMetaFilePath();
      const amplifyMeta = context.amplify.readJsonFile(amplifyMetaFilePath);

      const deploymentBucketName = amplifyMeta.providers.awscloudformation.DeploymentBucketName;

      const storage = amplifyMeta.storage || {};
      const buckets = [
        ...Object.keys(storage)
          .filter(r => storage[r].service === 'S3')
          .map(r => storage[r].output.BucketName),
        deploymentBucketName,
      ];
      await Promise.all(buckets.map(deleteS3ObjectsAndBucket()));
    }
    spinner.succeed('Project deleted in the cloud');

    // Remove amplify dir
    context.filesystem.remove(pathManager.getAmplifyDirPath());
    context.print.success('Project deleted locally.');
  }
}

const deleteS3ObjectsAndBucket = (s3 = new aws.S3()) => async bucketname => {
  console.log(`started ${bucketname}`);
  let data = {};
  do {
    data = await s3.listObjects({ Bucket: bucketname }).promise();
    await Promise.all(
      data.Contents.map(r =>
        s3
          .deleteObject({
            Bucket: bucketname,
            Key: r.Key,
          })
          .promise()
      )
    );
  } while (data.IsTruncated);

  await s3.deleteBucket({ Bucket: bucketname }).promise();
  console.log(`finished ${bucketname}`);
};

module.exports = {
  deleteProject,
};
