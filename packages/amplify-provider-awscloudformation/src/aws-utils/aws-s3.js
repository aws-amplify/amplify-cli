const aws = require('./aws.js');
const _ = require('lodash');
const providerName = require('../../lib/constants').ProviderName;
const fs = require('fs-extra');
const ora = require('ora');

const minChunkSize = 5 * 1024 * 1024; // 5 MB https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3/ManagedUpload.html#minPartSize-property
const { CreateService } = require('./aws-service-creator');
const { fileLogger } = require('../utils/aws-logger');
const logger = fileLogger('aws-s3');

class S3 {
  constructor(context, options = {}) {
    return (async () => {
      this.context = context;
      this.s3 = await CreateService(context, aws.S3, options);
      return this;
    })();
  }

  uploadFile(s3Params) {
    // envName and bucket does not change during execution, cache them into a class level
    // field.
    if (this.uploadState === undefined) {
      const projectDetails = this.context.amplify.getProjectDetails();
      const { envName } = this.context.amplify.getEnvInfo();
      const projectBucket = projectDetails.amplifyMeta.providers
        ? projectDetails.amplifyMeta.providers[providerName].DeploymentBucketName
        : projectDetails.teamProviderInfo[envName][providerName].DeploymentBucketName;

      this.uploadState = {
        envName,
        s3Params: {
          Bucket: projectBucket,
        },
      };
    }

    const augmentedS3Params = {
      ...s3Params,
      ...this.uploadState.s3Params,
    };
    const { Body, ...others } = augmentedS3Params;

    let uploadTask = null;
    const spinner = new ora('Uploading Files...');
    spinner.start();
    if (
      (s3Params.Body instanceof fs.ReadStream && fs.statSync(s3Params.Body.path).size > minChunkSize) ||
      (Buffer.isBuffer(s3Params.Body) && s3Params.Body.length > minChunkSize)
    ) {
      logger('uploadFile.s3.upload', [others])();
      uploadTask = this.s3.upload(augmentedS3Params);
      uploadTask.on('httpUploadProgress', max => {
        spinner.text = `Uploading Files...${Math.round((max.loaded / max.total) * 100)}%`;
      });
    } else {
      logger('uploadFile.s3.putObject', [others])();
      uploadTask = this.s3.putObject(augmentedS3Params);
    }

    return uploadTask
      .promise()
      .catch(ex => {
        logger('uploadFile', [others])(ex);
        spinner.stop();
        throw ex;
      })
      .then(() => {
        spinner.stop();
        return this.uploadState.s3Params.Bucket;
      });
  }

  getFile(s3Params, envName = this.context.amplify.getEnvInfo().envName) {
    const projectDetails = this.context.amplify.getProjectDetails();
    const projectBucket = projectDetails.teamProviderInfo[envName][providerName].DeploymentBucketName;
    s3Params.Bucket = projectBucket;
    const { Body, ...others } = s3Params;
    const log = logger('uploadFile.s3.putObject', [others]);
    log();
    return this.s3
      .getObject(s3Params)
      .promise()
      .then(result => result.Body)
      .catch(ex => {
        log(ex);
        throw ex;
      });
  }

  createBucket(bucketName) {
    // Check if bucket exists;
    const params = {
      Bucket: bucketName,
    };
    logger('createBucket.ifBucketExists', [bucketName])();
    return this.ifBucketExists(bucketName).then(result => {
      if (!result) {
        this.context.print.warning(
          'The specified S3 bucket to store the CloudFormation templates is not present. We are creating one for you....',
        );
        this.context.print.warning(`Bucket name: ${bucketName}`);
        logger('createBucket.s3.createBucket', [params])();
        return this.s3
          .createBucket(params)
          .promise()
          .then(() => {
            logger('createBucket.s3.waitFor', ['bucketExists', params])();
            return this.s3.waitFor('bucketExists', params).promise();
          })
          .then(() => {
            this.context.print.success('S3 bucket successfully created');
            return bucketName;
          });
      }
    });
  }

  getAllObjectKeys(bucketName, continuationToken = null) {
    return new Promise((resolve, reject) => {
      logger('getAllObjectKey.s3.listObjectsV2', [
        {
          Bucket: bucketName,
          ContinuationToken: continuationToken,
        },
      ])();
      this.s3
        .listObjectsV2({ Bucket: bucketName, ContinuationToken: continuationToken })
        .promise()
        .then((result, lerr) => {
          if (lerr) {
            logger('getAllObjectKey.s3.listObjectsV2', [
              {
                Bucket: bucketName,
                ContinuationToken: continuationToken,
              },
            ])(lerr);
            reject(lerr);
            return;
          }
          const objects = result.Contents.map(r => {
            return { Key: r.Key };
          });
          if (result.IsTruncated) {
            logger('getAllObjectKey.this.getAllObjectKeys', [
              {
                Bucket: bucketName,
                ContinuationToken: result.NextContinuationToken,
              },
            ])();
            this.getAllObjectKeys(bucketName, result.NextContinuationToken).then((result, error) => {
              if (error) {
                logger('getAllObjectKey.this.getAllObjectKeys', [
                  {
                    Bucket: bucketName,
                    ContinuationToken: result.NextContinuationToken,
                  },
                ])(error);
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
      logger('deleteAllObjects.s3.getAllObjectKey', [bucketName])();

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
          .map(delParams => {
            logger('deleteAllObjects.s3.deleteObjects', [delParams])();
            return this.s3.deleteObjects(delParams);
          })
          .map(delRequest => delRequest.promise());
        Promise.all(deleteReq)
          .then(resolve)
          .catch(err => {
            logger('deleteAllObjects.s3.deleteObjects', [])(err);
            reject(err);
          });
      });
    });
  }

  deleteS3Bucket(bucketName) {
    return new Promise((resolve, reject) => {
      logger('deleteS3Bucket.s3.ifBucketExists', [bucketName])();
      this.ifBucketExists(bucketName).then((exists, err) => {
        if (err) {
          reject(err);
        }
        if (exists) {
          logger('deleteS3Bucket.s3.deleteAllObjects', [bucketName])();
          this.deleteAllObjects(bucketName).then((result, err) => {
            if (err) {
              reject(err);
              return;
            }
            logger('deleteS3Bucket.s3.deleteBucket', [bucketName])();
            this.s3
              .deleteBucket({
                Bucket: bucketName,
              })
              .promise()
              .then((dresult, derr) => {
                if (derr) {
                  logger('deleteS3Bucket.s3.deleteBucket', [bucketName])(derr);
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
    return new Promise((resolve, reject) => {
      logger('ifBucketExists.s3.headBucket', [bucketName])();
      this.s3.headBucket(
        {
          Bucket: bucketName,
        },
        (err, data) => {
          if (data !== null) {
            resolve(true);
            return;
          } else {
            if (err.statusCode === 404) {
              resolve(false);
              return;
            }
          }
          logger('ifBucketExists.s3.headBucket', [bucketName])(err);
          reject(err.message);
        },
      );
    });
  }
}

module.exports = S3;
