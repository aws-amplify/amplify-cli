/* eslint-disable spellcheck/spell-checker */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-expressions */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-param-reassign */
/* eslint-disable no-prototype-builtins */
/* eslint-disable consistent-return */
/* eslint-disable jsdoc/require-description */
/* eslint-disable no-else-return */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable spellcheck/spell-checker */
/* eslint-disable no-return-await */
/* eslint-disable arrow-parens */
/* eslint-disable no-confusing-arrow */
/* eslint-disable implicit-arrow-linebreak */
/* eslint-disable no-await-in-loop */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable import/order */
/* eslint-disable import/first */
import { $TSAny, $TSContext } from 'amplify-cli-core';

import aws from './aws.js';
import _ from 'lodash';

const providerName = require('../constants').ProviderName;

import { loadConfiguration } from '../configuration-manager';
import fs from 'fs-extra';
import ora from 'ora';
import { pagedAWSCall } from './paged-call';
import { ListObjectVersionsOutput, ListObjectVersionsRequest, ObjectIdentifier } from 'aws-sdk/clients/s3';

const minChunkSize = 5 * 1024 * 1024; // 5 MB https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3/ManagedUpload.html#minPartSize-property
const { fileLogger } = require('../utils/aws-logger');

const logger = fileLogger('aws-s3');

// https://stackoverflow.com/questions/52703321/make-some-properties-optional-in-a-typescript-type
type OptionalExceptFor<T, TRequired extends keyof T> = Partial<T> & Pick<T, TRequired>;

/**
 *
 */
export class S3 {
  private static instance: S3;
  private readonly context: $TSContext;
  private readonly s3: AWS.S3;
  private uploadState: {
    envName: string;
    s3Params: {
      Bucket: string;
    };
  };

  /**
   *
   */
  static async getInstance(context: $TSContext, options = {}): Promise<S3> {
    if (!S3.instance) {
      let cred = {};
      try {
        cred = await loadConfiguration(context);
      } catch (e) {
        // ignore missing config
      }

      S3.instance = new S3(context, cred, options);
    }
    return S3.instance;
  }

  private constructor(context: $TSContext, cred: $TSAny, options = {}) {
    this.context = context;
    this.s3 = new aws.S3({ ...cred, ...options });
  }

  /**
   *
   */
  private populateUploadState(): void {
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

  /**
   *
   */
  private attachBucketToParams(s3Params: $TSAny, envName?: string) {
    if (!s3Params.hasOwnProperty('Bucket')) {
      const projectDetails = this.context.amplify.getProjectDetails();
      if (!envName) envName = this.context.amplify.getEnvInfo().envName;
      const projectBucket = projectDetails.teamProviderInfo[envName][providerName].DeploymentBucketName;
      s3Params.Bucket = projectBucket;
    }
    return s3Params;
  }

  /**
   *
   */
  async uploadFile(s3Params: $TSAny, showSpinner = true) {
    // envName and bucket does not change during execution, cache them into a class level
    // field.
    if (this.uploadState === undefined) {
      this.populateUploadState();
    }
    const spinner = showSpinner ? ora('Uploading files...') : undefined;

    const augmentedS3Params = {
      ...s3Params,
      ...this.uploadState.s3Params,
    };
    const { Body, ...others } = augmentedS3Params;
    let uploadTask;
    try {
      showSpinner && spinner.start('Uploading files...');
      if (
        (s3Params.Body instanceof fs.ReadStream && fs.statSync(s3Params.Body.path).size > minChunkSize)
        || (Buffer.isBuffer(s3Params.Body) && s3Params.Body.length > minChunkSize)
      ) {
        logger('uploadFile.s3.upload', [others])();
        uploadTask = this.s3.upload(augmentedS3Params);
        uploadTask.on('httpUploadProgress', max => {
          if (showSpinner) spinner.text = `Uploading files...${Math.round((max.loaded / max.total) * 100)}%`;
        });
      } else {
        logger('uploadFile.s3.putObject', [others])();
        uploadTask = this.s3.putObject(augmentedS3Params);
      }
      await uploadTask.promise();
      return this.uploadState.s3Params.Bucket;
    } catch (ex) {
      logger('uploadFile.s3', [others])(ex);
      throw ex;
    } finally {
      showSpinner && spinner.stop();
    }
  }

  /**
   *
   */
  async getFile(s3Params: $TSAny, envName?: string) {
    s3Params = this.attachBucketToParams(s3Params, envName);
    const log = logger('s3.getFile', [s3Params]);
    try {
      log();
      const result = await this.s3.getObject(s3Params).promise();
      return result.Body;
    } catch (ex) {
      log(ex);
      throw ex;
    }
  }

  /**
   *
   */
  async createBucket(bucketName: string, throwIfExists = false): Promise<string | void> {
    // Check if bucket exists;
    const params = {
      Bucket: bucketName,
    };
    logger('createBucket.ifBucketExists', [bucketName])();
    if (!(await this.ifBucketExists(bucketName))) {
      this.context.print.warning(
        'The specified S3 bucket to store the CloudFormation templates is not present. We are creating one for you....',
      );
      this.context.print.warning(`Bucket name: ${bucketName}`);
      logger('createBucket.s3.createBucket', [params])();
      await this.s3.createBucket(params).promise();
      logger('createBucket.s3.waitFor', ['bucketExists', params])();
      await this.s3.waitFor('bucketExists', params).promise();
      this.context.print.success('S3 bucket successfully created');
      return bucketName;
    } else if (throwIfExists) {
      throw new Error(`Bucket ${bucketName} already exists`);
    }
  }

  /**
   * Get all the object versions of all objects in the S3 bucket
   * @param bucketName - name of s3 bucekt
   * @param options - list object versions output
   * @returns Object list
   */
  async getAllObjectVersions(
    bucketName: string,
    options: OptionalExceptFor<ListObjectVersionsOutput, 'KeyMarker' | 'VersionIdMarker'> = null,
  ) {
    const result = await pagedAWSCall<ListObjectVersionsOutput, Required<ObjectIdentifier>, typeof options, ListObjectVersionsRequest>(
      async (param, nextToken?) => {
        const parmaWithNextToken = nextToken ? { ...param, ...nextToken } : param;
        logger('getAllObjectKey.s3.listObjectVersions', [parmaWithNextToken])();
        return await this.s3.listObjectVersions(parmaWithNextToken).promise();
      },
      {
        Bucket: bucketName,
        ...options,
      },
      (response?) => response.Versions?.map(({ Key, VersionId }) => ({ Key, VersionId })),
      async (response?) =>
        response?.IsTruncated
          ? { KeyMarker: response.NextKeyMarker, VersionIdMarker: response.NextVersionIdMarker, Prefix: response.Prefix }
          : undefined,
    );
    return result;
  }

  /**
   *
   */
  public async deleteDirectory(bucketName: string, dirPath: string): Promise<void> {
    logger('deleteDirectory.s3.getAllObjectVersions', [{ BucketName: bucketName }])();
    const allObjects = await this.getAllObjectVersions(bucketName, { Prefix: dirPath });
    const chunkedResult = _.chunk(allObjects, 1000);
    const chunkedResultLength = chunkedResult.length;
    for (let idx = 0; idx < chunkedResultLength; idx += 1) {
      logger(`deleteAllObjects.s3.deleteObjects (${idx} of ${chunkedResultLength})`, [{ Bucket: bucketName }])();
      await this.s3
        .deleteObjects({
          Bucket: bucketName,
          Delete: {
            Objects: chunkedResult[idx],
          },
        })
        .promise();
    }
  }

  /**
   * Delete the file provided as input
   * @param bucketName S3 bucket name
   * @param filePath Path to the file to be deleted
   */
  public async deleteObject(bucketName: string, filePath: string): Promise<void> {
    logger('deleteObject.s3', [{ BucketName: bucketName, FilePath: filePath }])();
    await this.s3.deleteObject({
      Bucket: bucketName,
      Key: filePath,
    }).promise();
  }

  /**
   *
   */
  public async deleteAllObjects(bucketName: string): Promise<void> {
    logger('deleteAllObjects.s3.getAllObjectVersions', [{ BucketName: bucketName }])();
    const allObjects = await this.getAllObjectVersions(bucketName);
    const chunkedResult = _.chunk(allObjects, 1000);
    const chunkedResultLength = chunkedResult.length;
    for (let idx = 0; idx < chunkedResultLength; idx += 1) {
      logger(`deleteAllObjects.s3.deleteObjects (${idx} of ${chunkedResultLength})`, [{ Bucket: bucketName }])();
      await this.s3
        .deleteObjects({
          Bucket: bucketName,
          Delete: {
            Objects: chunkedResult[idx],
          },
        })
        .promise();
    }
  }

  /**
   *
   */
  public async deleteS3Bucket(bucketName: string) {
    logger('deleteS3Bucket.s3.ifBucketExists', [{ BucketName: bucketName }])();
    if (await this.ifBucketExists(bucketName)) {
      logger('deleteS3Bucket.s3.deleteAllObjects', [{ BucketName: bucketName }])();
      await this.deleteAllObjects(bucketName);
      logger('deleteS3Bucket.s3.deleteBucket', [{ BucketName: bucketName }])();
      await this.s3.deleteBucket({ Bucket: bucketName }).promise();
    }
  }

  /**
   *
   */
  public async emptyS3Bucket(bucketName: string) {
    if (await this.ifBucketExists(bucketName)) {
      await this.deleteAllObjects(bucketName);
    }
  }

  /**
   *
   */
  public async ifBucketExists(bucketName: string) {
    try {
      logger('ifBucketExists.s3.headBucket', [{ BucketName: bucketName }])();
      await this.s3
        .headBucket({
          Bucket: bucketName,
        })
        .promise();
      return true;
    } catch (e) {
      logger('ifBucketExists.s3.headBucket', [{ BucketName: bucketName }])(e);
      if (e.statusCode === 404) {
        return false;
      }
      throw e;
    }
  }

  public getStringObjectFromBucket = async (bucketName: string, objectKey: string): Promise<string | undefined> => {
    try {
      const result = await this.s3
        .getObject({
          Bucket: bucketName,
          Key: objectKey,
        })
        .promise();

      return result.Body.toString();
    } catch (e) {
      if (e.statusCode === 404) {
        return undefined;
      }

      throw e;
    }
  };
}
