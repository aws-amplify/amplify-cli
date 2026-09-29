import chalk from 'chalk';

export const importMessages = {
  NoS3BucketsToImport: 'No S3 Buckets were found to import.',
  OneBucket: (bucketName: string) => `${greenCheck} Only one S3 Bucket (${bucketName}) found and it was automatically selected.`,

  BucketSelection: 'Select the S3 Bucket you want to import:',
  AutoCompleteFooter: '(Type in a partial name or scroll up and down to reveal more choices)',

  ImportPreviousBucket: (resourceName: string, bucketName: string, envName: string) =>
    `The resource: '${resourceName}' (S3: '${bucketName}') already imported to '${envName}' environment, do you want to import it to the new environment?`,

  ImportPreviousResourceFooter: `If you choose No, then an import walkthrough will run to import a different resource into the new environment.`,

  ImportNewResourceRequired: (resourceName: string) =>
    `Imported resource: '${resourceName}' found, parameters are required for environment creation.`,

  BucketNotFound: (bucketName: string) => `The previously configured S3 Bucket: '${bucketName}' cannot be found.`,

  NoDynamoDBTablesToImport: 'No DynamoDB Tables were found to import.',
  OneTable: (tableName: string) => `${greenCheck} Only one DynamoDB Table (${tableName}) found and it was automatically selected.`,

  TableSelection: 'Select the DynamoDB Table you want to import:',

  ImportPreviousTable: (resourceName: string, tableName: string, envName: string) =>
    `The resource: '${resourceName}' (DynamoDB Table: '${tableName}') already imported to '${envName}' environment, do you want to import it to the new environment?`,

  TableNotFound: (tableName: string) => `The previously configured DynamoDB Table: '${tableName}' cannot be found.`,
};

const greenCheck = chalk.green('✔');
