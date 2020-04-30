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

    return this.putFile(s3Params).then(() => projectBucket);
  }

  putFile(s3Params) {
    return this.s3.putObject(s3Params).promise();
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
          'The specified S3 bucket to store the CloudFormation templates is not present. We are creating one for you....',
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
  getAllObjectKeys(bucketName, continuationToken = null) {
    return new Promise((resolve, reject) => {
      this.s3
        .listObjectsV2({ Bucket: bucketName, ContinuationToken: continuationToken })
        .promise()
        .then((result, lerr) => {
          if (lerr) {
            reject(lerr);
            return;
          }
          const objects = result.Contents.map(r => {
            return { Key: r.Key };
          });
          if (result.IsTruncated) {
            this.getAllObjectKeys(bucketName, result.NextContinuationToken).then((result, error) => {
              if (error) {
                reject(error);
              } else {
                resolve(objects.concat(result));
              }
            });
          } else {
            resolve(objects);
          }
        });
    });
  }

  deleteAllObjects(bucketName) {
    return new Promise((resolve, reject) => {
      this.getAllObjectKeys(bucketName).then((bucketObjects, error) => {
        if (error) reject(error);
        const chunkedResult = _.chunk(bucketObjects, 1000);

        const deleteReq = chunkedResult
          .map(res => {
            return {
              Bucket: bucketName,
              Delete: {
                Objects: res,
                Quiet: false,
              },
            };
          })
          .map(delParams => this.s3.deleteObjects(delParams))
          .map(delRequest => delRequest.promise());
        Promise.all(deleteReq)
          .then(resolve)
          .catch(reject);
      });
    });
  }

  deleteS3Bucket(bucketName) {
    return new Promise((resolve, reject) => {
      this.ifBucketExists(bucketName).then((exists, err) => {
        if (err) {
          reject(err);
        }
        if (exists) {
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
        } else {
          resolve();
        }
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
