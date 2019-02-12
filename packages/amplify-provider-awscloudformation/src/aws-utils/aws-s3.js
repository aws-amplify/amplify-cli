const aws = require('./aws.js');
const providerName = require('../../lib/constants').ProviderName;

class S3 {
  constructor(context) {
    return aws.configureWithCreds(context)
      .then((awsItem) => {
        this.context = context;
        this.s3 = new awsItem.S3();
        return this;
      });
  }

  uploadFile(s3Params) {
    const projectDetails = this.context.amplify.getProjectDetails();
    const { envName } = this.context.amplify.getEnvInfo();
    const projectBucket = projectDetails.amplifyMeta.providers ?
      projectDetails.amplifyMeta.providers[providerName].DeploymentBucketName :
      projectDetails.teamProviderInfo[envName][providerName].DeploymentBucketName;
    s3Params.Bucket = projectBucket;

    return this.s3.putObject(s3Params).promise()
      .then(() => projectBucket);
  }

  getFile(s3Params) {
    const projectDetails = this.context.amplify.getProjectDetails();
    const { envName } = this.context.amplify.getEnvInfo();

    const projectBucket = projectDetails.amplifyMeta.providers ?
      projectDetails.amplifyMeta.providers[providerName].DeploymentBucketName :
      projectDetails.teamProviderInfo[envName][providerName].DeploymentBucketName;
    s3Params.Bucket = projectBucket;

    return this.s3.getObject(s3Params).promise()
      .then(result => result.Body);
  }

  createBucket(bucketName) {
    // Check if bucket exists;
    const params = {
      Bucket: bucketName,
    };

    return this.ifBucketExists(bucketName)
      .then((result) => {
        if (!result) {
          this.context.print.warning('The specified S3 bucket to store the CloudFormation templates is not present. We are creating one for you....');
          this.context.print.warning(`Bucket name: ${bucketName}`);

          return this.s3.createBucket(params).promise()
            .then(() => this.s3.waitFor('bucketExists', params).promise())
            .then(() => {
              this.context.print.success('S3 bucket sucessfully created');
              return bucketName;
            });
        }
      });
  }

  ifBucketExists(bucketName) {
    return this.s3.listBuckets({}).promise()
      .then((result) => {
        const index = result.Buckets.findIndex(bucket => bucket.Name === bucketName);
        if (index !== -1) {
          return true;
        }
        return false;
      });
  }
}


module.exports = S3;
