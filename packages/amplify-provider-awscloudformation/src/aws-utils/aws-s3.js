const aws = require('./aws.js');
const _ = require('lodash');
const providerName = require('../../lib/constants').ProviderName;
const configurationManager = require('../../lib/configuration-manager');

class S3 {
  constructor(context, options = {}) {
    return (async () => {
      let cred = {};
      try {
        cred = await configurationManager.loadConfiguration(context);
      } catch (e) {
        // ignore missing config
      }
      this.context = context;
      this.s3 = new aws.S3({ ...cred, ...options });
      return this;
    })();
  }

  uploadFile(s3Params) {
    const projectDetails = this.context.amplify.getProjectDetails();
    const { envName } = this.context.amplify.getEnvInfo();
    const projectBucket = projectDetails.amplifyMeta.providers
      ? projectDetails.amplifyMeta.providers[providerName].DeploymentBucketName
      : projectDetails.teamProviderInfo[envName][providerName].DeploymentBucketName;
    s3Params.Bucket = projectBucket;

    return this.s3
      .putObject(s3Params)
      .promise()
      .then(() => projectBucket);
  }

  getFile(s3Params, envName = this.context.amplify.getEnvInfo().envName) {
    const projectDetails = this.context.amplify.getProjectDetails();
    const projectBucket = projectDetails.teamProviderInfo[envName][providerName].DeploymentBucketName;
    s3Params.Bucket = projectBucket;

    return this.s3
      .getObject(s3Params)
      .promise()
      .then(result => result.Body);
  }

  createBucket(bucketName) {
    // Check if bucket exists;
    const params = {
      Bucket: bucketName,
    };

    return this.ifBucketExists(bucketName).then(result => {
      if (!result) {
        this.context.print.warning(
          'The specified S3 bucket to store the CloudFormation templates is not present. We are creating one for you....'
        );
        this.context.print.warning(`Bucket name: ${bucketName}`);

        return this.s3
          .createBucket(params)
          .promise()
          .then(() => this.s3.waitFor('bucketExists', params).promise())
          .then(() => {
            this.context.print.success('S3 bucket sucessfully created');
            return bucketName;
          });
      }
    });
  }

  deleteAllObjects(bucketName) {
    return new Promise((resolve, reject) => {
      this.s3
        .listObjects({ Bucket: bucketName })
        .promise()
        .then((result, lerr) => {
          if (lerr) {
            reject(lerr);
            return;
          }

          const promises = result.Contents.map(r => this.s3.deleteObject({ Bucket: bucketName, Key: r.Key }).promise());
          Promise.all(promises).then((results, errors) => {
            if (!_.compact(errors).length) resolve();
            else reject(errors);
          });
        });
    });
  }

  deleteS3Bucket(bucketName) {
    return new Promise((resolve, reject) => {
      this.deleteAllObjects(bucketName).then((result, err) => {
        if (err) {
          reject(err);
          return;
        }

        this.s3
          .deleteBucket({
            Bucket: bucketName,
          })
          .promise()
          .then((dresult, derr) => {
            if (derr) {
              reject(derr);
              return;
            }
            resolve(dresult);
          });
      });
    });
  }

  ifBucketExists(bucketName) {
    return this.s3
      .listBuckets({})
      .promise()
      .then(result => {
        const index = result.Buckets.findIndex(bucket => bucket.Name === bucketName);
        if (index !== -1) {
          return true;
        }
        return false;
      });
  }
}

module.exports = S3;
