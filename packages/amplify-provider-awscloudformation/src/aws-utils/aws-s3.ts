/* eslint-disable spellcheck/spell-checker */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable arrow-parens */
/* eslint-disable no-await-in-loop */
/* eslint-disable @typescript-eslint/no-var-requires */

import { $TSAny, $TSContext, AmplifyError, AmplifyFault, stateManager } from '@aws-amplify/amplify-cli-core';

import _ from 'lodash';

import fs from 'fs-extra';
import ora from 'ora';
import { ListObjectVersionsOutput, ListObjectVersionsRequest, ObjectIdentifier } from 'aws-sdk/clients/s3';
import { pagedAWSCall } from './paged-call';
import { loadConfiguration } from '../configuration-manager';
import aws from './aws';

const providerName = require('../constants').ProviderName;
const consumers = require('stream/consumers');

const { fileLogger } = require('../utils/aws-logger');

const logger = fileLogger('aws-s3');

// https://stackoverflow.com/questions/52703321/make-some-properties-optional-in-a-typescript-type
type OptionalExceptFor<T, TRequired extends keyof T> = Partial<T> & Pick<T, TRequired>;

/**
 * Wrapper class around S3 bucket client API with helper functions to perform CRUD operations.
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
   * Static method to create/return the singleton object
   * @param context - Amplify CLI context
   * @param options - S3 bucket client options
   * @returns Promise<S3>  Returns the singleton object of the  S3 client wrapper class.
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
   * Populate the uploadState member with the Amplify deployment bucket name
   */
  private populateUploadState(): void {
    const amplifyMeta = stateManager.getMeta();
    const teamProviderInfo = stateManager.getTeamProviderInfo();
    const { envName } = stateManager.getLocalEnvInfo();
    const projectBucket = amplifyMeta.providers
      ? amplifyMeta.providers[providerName].DeploymentBucketName
      : teamProviderInfo?.[envName]?.[providerName]?.DeploymentBucketName;

    this.uploadState = {
      envName,
      s3Params: {
        Bucket: projectBucket,
      },
    };
  }

  /**
   * Helper function to update S3Params with the deployment bucket name
   * @param s3Params - S3 params to be updated.
   * @param envName - Environment for which we need to fetch the S3 bucket.
   * @returns Updated S3 Params
   */
  private attachBucketToParams(s3Params: $TSAny, envName?: string): $TSAny {
    // eslint-disable-next-line no-prototype-builtins
    if (!s3Params.hasOwnProperty('Bucket')) {
      if (!envName) envName = this.context.amplify.getEnvInfo().envName;
      const teamProviderInfo = stateManager.getTeamProviderInfo();
      const projectBucket = teamProviderInfo[envName][providerName].DeploymentBucketName;
      s3Params.Bucket = projectBucket;
    }
    return s3Params;
  }

  /**
   * Upload the given object from local path to the Amplify deployment bucket.
   * @param s3Params S3 PutObjectCommandInputType
   * @param showSpinner Flag, if true displays the spinner on the terminal. Must be set to false on headless.
   * @returns Promise<void>
   */
  async uploadFile(s3Params: $TSAny, showSpinner = true): Promise<string> {
    // envName and bucket does not change during execution, cache them into a class level
    // field.
    if (this.uploadState === undefined) {
      this.populateUploadState();
    }
    const spinner = showSpinner ? ora('Uploading files.') : undefined;

    const augmentedS3Params = {
      ...s3Params,
      ...this.uploadState.s3Params,
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _Body, ...others } = augmentedS3Params;
    let uploadTask;
    try {
      if (showSpinner) {
        spinner.start('Uploading files.');
      }
      logger('uploadFile.s3.upload', [others])();
      const minChunkSize = 5 * 1024 * 1024; // 5 MB
      if (augmentedS3Params.Body instanceof fs.ReadStream && fs.statSync(augmentedS3Params.Body.path).size <= minChunkSize) {
        // Buffer small files to avoid memory leak.
        // Previous implementation used s3.putObject for small uploads, but it didn't have retries, see https://github.com/aws-amplify/amplify-cli/pull/13493.
        // On the other hand uploading small streams leads to memory leak, see https://github.com/aws/aws-sdk-js/issues/2552.
        // Therefore, buffering small files ourselves seems to be middle ground between memory leak and loosing retries.
        // Buffering small files brings back balance between leaking and non-leaking uploads that is matching
        // the ratio from before https://github.com/aws-amplify/amplify-cli/pull/13493.
        augmentedS3Params.Body = await consumers.buffer(augmentedS3Params.Body);
      }
      uploadTask = this.s3.upload(augmentedS3Params);
      if (showSpinner) {
        uploadTask.on('httpUploadProgress', (max) => {
          spinner.text = `Uploading files...${Math.round((max.loaded / max.total) * 100)}%`;
        });
      }
      await uploadTask.promise();
      return this.uploadState.s3Params.Bucket;
    } finally {
      if (showSpinner) {
        spinner.stop();
      }
    }
  }

  /**
   * Get the specified object from the Amplify deployment bucket.
   * @param s3Params - input parameters of GetObjectCommandInput type.
   * @param envName - environment name to be attached to the input-params
   * @returns Promise<S3.GetObjectOutput> The object read from the S3 bucket.
   */
  async getFile(s3Params: $TSAny, envName?: string) {
    s3Params = this.attachBucketToParams(s3Params, envName);
    logger('s3.getFile', [s3Params])();

    const result = await this.s3.getObject(s3Params).promise();
    return result.Body;
  }

  /**
   * Create the S3 bucket
   * @param bucketName - Name of the bucket to be created.( This needs to be globally unique )
   * @param throwIfExists - If set to true, this function will thrown an exception if the bucket already exists.
   * @returns Promise<bucketName> of the created bucket.
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
    } else if (throwIfExists) {
      throw new AmplifyError('BucketAlreadyExistsError', {
        message: `Bucket ${bucketName} already exists`,
      });
    }
    return bucketName;
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
        const objVersionList = await this.s3.listObjectVersions(parmaWithNextToken).promise();
        return objVersionList;
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
   * Delete a directory in the S3 bucket
   * @param bucketName Name of the S3 bucket
   * @param dirPath Path to the directory to be recursively deleted
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
   * Check if the given object exists in the given bucket
   * @param bucketName - Name of the bucket to check if the object exists
   * @param filePath - Object key ( path to the file key )
   * @returns Promise<boolean> true if exists
   */
  public async checkExistObject(bucketName: string, filePath: string): Promise<boolean> {
    logger('checkExistObject.s3', [{ BucketName: bucketName, FilePath: filePath }])();
    try {
      await this.s3
        .headObject({
          Bucket: bucketName,
          Key: filePath,
        })
        .promise();
      return true;
    } catch (error) {
      logger('checkExistObject.s3', [{ BucketName: bucketName, FilePath: filePath, Error: error.name }])();
      return false;
    }
  }

  /**
   * Delete the file provided as input, if it exists. No op if the file does not exist.
   * @param bucketName S3 bucket name
   * @param filePath Path to the file to be deleted
   */
  public async deleteObject(bucketName: string, filePath: string): Promise<void> {
    logger('deleteObject.s3', [{ BucketName: bucketName, FilePath: filePath }])();
    const objExists = await this.checkExistObject(bucketName, filePath);
    if (objExists) {
      await this.s3
        .deleteObject({
          Bucket: bucketName,
          Key: filePath,
        })
        .promise();
    }
  }

  /**
   * Delete all objects in the given S3 bucket
   * @param bucketName - Name of the S3 bucket
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
   * Delete the given S3 bucket
   * @param bucketName - Name of the bucket to be deleted
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
   * Delete all objects from the given S3bucket
   * @param bucketName - Name of the bucket to be emptied.
   */
  public async emptyS3Bucket(bucketName: string) {
    if (await this.ifBucketExists(bucketName)) {
      await this.deleteAllObjects(bucketName);
    }
  }

  /**
   * Check if the given S3 bucket exists.
   * @param bucketName - Name of the bucket to check for existance
   * @returns Promise<boolean> true if bucket exists
   */
  public async ifBucketExists(bucketName: string): Promise<boolean> {
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

      if (e.code === 'NotFound') {
        throw new AmplifyError(
          'BucketNotFoundError',
          {
            message: e.message,
            resolution: `Check that bucket name is correct: ${bucketName}`,
          },
          e,
        );
      }

      throw new AmplifyFault(
        'UnknownFault',
        {
          message: e.message,
        },
        e,
      );
    }
  }

  /**
   * Get the string version of an object from the s3 bucket
   * @param bucketName - name of the s3 bucket to get the object from.
   * @param objectKey - Name of the object to be read from the S3 bucket.
   * @returns Promise<string> string representation of the object being read.
   */
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

      throw new AmplifyFault(
        'UnexpectedS3Fault',
        {
          message: e.message,
        },
        e,
      );
    }
  };
}
