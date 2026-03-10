import { mockClient } from 'aws-sdk-client-mock';
import * as s3 from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';
import { Readable } from 'stream';
import { MigrationApp } from '../app';
// eslint-disable-next-line import/no-extraneous-dependencies
import { SdkStream } from '@smithy/types';
import { JSONUtilities } from '@aws-amplify/amplify-cli-core';

/**
 * Mock for the Amazon S3 service client (`@aws-sdk/client-s3`).
 *
 * Mocks five commands:
 *
 * - `GetBucketNotificationConfigurationCommand`: Returns Lambda function trigger
 *   configurations for the storage bucket.
 *
 * - `GetBucketAccelerateConfigurationCommand`: Returns `undefined` status (no
 *   transfer acceleration configured).
 *
 * - `GetBucketVersioningCommand`: Returns `undefined` status (versioning not enabled).
 *
 * - `GetBucketEncryptionCommand`: Returns default AES256 server-side encryption.
 *
 * - `GetObjectCommand`: Serves CloudFormation templates that the codegen fetches
 *   from S3 (e.g., analytics Kinesis templates stored in the deployment bucket).
 *
 * Source files:
 * - `storage/<name>/build/cloudformation-template.json`: S3 bucket notification config
 * - `amplify-meta.json`: Bucket name (`storage.<name>.output.BucketName`), region
 * - Various CloudFormation templates in `#current-cloud-backend/` (for `GetObject`)
 */
export class S3Mock {
  public readonly mock;

  constructor(private readonly app: MigrationApp) {
    this.mock = mockClient(s3.S3Client);
    this.mockGetBucketNotificationConfigurationDefault();
    this.mockGetBucketAccelerateConfiguration();
    this.mockGetBucketVersioning();
    this.mockGetBucketEncryption();
    this.mockGetObject();
    this.mockGetBucketNotificationConfiguration();
  }

  private mockGetBucketNotificationConfigurationDefault() {
    this.mock.on(s3.GetBucketNotificationConfigurationCommand).callsFake(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      async (input: s3.GetBucketNotificationConfigurationCommandInput): Promise<s3.GetBucketNotificationConfigurationCommandOutput> => {
        return {
          LambdaFunctionConfigurations: [],
          $metadata: {},
        };
      },
    );
  }

  private mockGetBucketAccelerateConfiguration() {
    this.mock.on(s3.GetBucketAccelerateConfigurationCommand).callsFake(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      async (input: s3.GetBucketAccelerateConfigurationCommandInput): Promise<s3.GetBucketAccelerateConfigurationCommandOutput> => {
        return {
          Status: undefined,
          $metadata: {},
        };
      },
    );
  }

  private mockGetBucketVersioning() {
    this.mock
      .on(s3.GetBucketVersioningCommand)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .callsFake(async (input: s3.GetBucketVersioningCommandInput): Promise<s3.GetBucketVersioningCommandOutput> => {
        return {
          Status: undefined,
          $metadata: {},
        };
      });
  }

  private mockGetBucketEncryption() {
    this.mock
      .on(s3.GetBucketEncryptionCommand)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .callsFake(async (input: s3.GetBucketEncryptionCommandInput): Promise<s3.GetBucketEncryptionCommandOutput> => {
        const stackName = this.app.clients.cloudformation.stackNameForResource(input.Bucket!);
        const templatePath = this.app.templatePathForStack(stackName);
        const template = JSONUtilities.readJson<any>(templatePath);

        const encryptionConfig = template.Resources.S3Bucket?.Properties?.BucketEncryption;
        if (encryptionConfig) {
          return {
            ServerSideEncryptionConfiguration: {
              Rules: encryptionConfig.ServerSideEncryptionConfiguration.map((rule: any) => ({
                ApplyServerSideEncryptionByDefault: {
                  SSEAlgorithm: rule.ServerSideEncryptionByDefault?.SSEAlgorithm ?? 'AES256',
                },
                BucketKeyEnabled: rule.BucketKeyEnabled ?? false,
              })),
            },
            $metadata: {},
          };
        }

        return {
          ServerSideEncryptionConfiguration: {
            Rules: [
              {
                ApplyServerSideEncryptionByDefault: {
                  SSEAlgorithm: 'AES256',
                },
                BucketKeyEnabled: false,
              },
            ],
          },
          $metadata: {},
        };
      });
  }

  private mockGetObject() {
    this.mock.on(s3.GetObjectCommand).callsFake(async (input: s3.GetObjectCommandInput): Promise<s3.GetObjectCommandOutput> => {
      // Map S3 key (e.g. amplify-cfn-templates/analytics/kinesis-cloudformation-template.json)
      // to a local file in the ccb directory by searching for the template filename.
      const templateFileName = path.basename(input.Key!);
      const keyParts = input.Key!.split('/');
      // keyParts: ['amplify-cfn-templates', '<category>', '<filename>']
      const category = keyParts.length >= 2 ? keyParts[keyParts.length - 2] : undefined;

      let localPath: string | undefined;
      if (category) {
        const categoryDir = path.join(this.app.ccbPath, category);
        if (fs.existsSync(categoryDir)) {
          const candidates: string[] = [];
          for (const resourceDir of fs.readdirSync(categoryDir)) {
            const candidate = path.join(categoryDir, resourceDir, templateFileName);
            if (fs.existsSync(candidate)) {
              candidates.push(candidate);
            }
          }
          if (candidates.length > 1) {
            throw new Error(`S3 GetObject mock: multiple candidates found for key '${input.Key}': ${candidates.join(', ')}`);
          }
          localPath = candidates[0];
        }
      }

      if (!localPath) {
        throw new Error(`S3 GetObject mock: could not find local file for key '${input.Key}'`);
      }

      const content = fs.readFileSync(localPath, 'utf-8');
      const stream = Readable.from([content]) as SdkStream<Readable>;
      stream.transformToString = async () => content;
      return { Body: stream as s3.GetObjectCommandOutput['Body'], $metadata: {} };
    });
  }

  private mockGetBucketNotificationConfiguration() {
    this.mock
      .on(s3.GetBucketNotificationConfigurationCommand)
      .callsFake(
        async (input: s3.GetBucketNotificationConfigurationCommandInput): Promise<s3.GetBucketNotificationConfigurationCommandOutput> => {
          const stackName = this.app.clients.cloudformation.stackNameForResource(input.Bucket!);
          const templatePath = this.app.templatePathForStack(stackName);
          const template = JSONUtilities.readJson<any>(templatePath);

          const templateConfigurations = template.Resources.S3Bucket.Properties.NotificationConfiguration?.LambdaConfigurations ?? [];

          const configurations: s3.LambdaFunctionConfiguration[] = [];
          for (const config of templateConfigurations) {
            // e.g { "Ref": "functionS3Trigger3ae193b9Arn" }
            const functionRef = config.Function.Ref as string;
            const functionName = `${functionRef.substring(8, functionRef.length - 3)}-${this.app.environmentName}`;
            configurations.push({
              Events: [config.Event],
              LambdaFunctionArn: `arn:aws:lambda:${this.app.region}:123456789012:function:${functionName}`,
            });
          }
          return {
            LambdaFunctionConfigurations: configurations,
            $metadata: {},
          };
        },
      );
  }
}
