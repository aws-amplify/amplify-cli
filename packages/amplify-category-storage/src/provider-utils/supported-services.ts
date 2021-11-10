export const supportedServices = {
  S3: {
    inputs: [
      {
        key: 'resourceName',
        question: 'Provide a friendly name for your resource that will be used to label this category in the project:',
        validation: {
          operator: 'regex',
          value: '^[a-zA-Z0-9]+$',
          onErrorMsg: 'Resource name should be alphanumeric',
        },
        required: true,
      },
      {
        key: 'bucketName',
        question: 'Provide bucket name:',
        validation: {
          operator: 'regex',
          value: '^[a-z0-9-]{3,47}$',
          onErrorMsg:
            'Bucket name can only use the following characters: a-z 0-9 - and should have minimum 3 character and max of 47 character',
        },
        required: true,
      },
    ],
    alias: 'Content (Images, audio, video, etc.)',
    defaultValuesFilename: 's3-defaults.js',
    serviceWalkthroughFilename: 's3-walkthrough.js',
    cfnFilename: 's3-cloudformation-template.yml.ejs',
    provider: 'awscloudformation',
  },
  DynamoDB: {
    inputs: [
      {
        key: 'resourceName',
        type: 'input',
        question: 'Provide a friendly name for your resource that will be used to label this category in the project:',
        validation: {
          operator: 'regex',
          value: '^[a-zA-Z0-9]+$',
          onErrorMsg: 'Resource name should be alphanumeric',
        },
        required: true,
      },
      {
        key: 'tableName',
        type: 'input',
        question: 'Please provide table name:',
        validation: {
          operator: 'regex',
          value: '^[a-zA-Z0-9._-]+$',
          onErrorMsg: 'You can use the following characters: a-z A-Z 0-9 . - _',
        },
        required: true,
      },
      {
        key: 'attribute',
        type: 'input',
        question: 'What would you like to name this column:',
        validation: {
          operator: 'regex',
          value: '^[a-zA-Z0-9_-]+$',
          onErrorMsg: "'You can use the following characters: a-z A-Z 0-9 - _'",
        },
        required: true,
      },
      {
        key: 'attributeType',
        type: 'list',
        question: 'Please choose the data type:',
        required: true,
      },
      {
        key: 'partitionKey',
        type: 'list',
        question: 'Please choose partition key for the table:',
        required: true,
      },
      {
        key: 'sortKey',
        type: 'list',
        question: 'Please choose sort key for the table:',
      },
      {
        key: 'gsiName',
        type: 'input',
        question: 'Please provide the GSI name:',
        validation: {
          operator: 'regex',
          value: '^[a-zA-Z0-9_-]+$',
          onErrorMsg: 'You can use the following characters: a-z A-Z 0-9 - _',
        },
        required: true,
      },
      {
        key: 'gsiPartitionKey',
        type: 'list',
        question: 'Please choose partition key for the GSI:',
        required: true,
      },
      {
        key: 'gsiSortKey',
        type: 'list',
        question: 'Please choose sort key for the GSI:',
      },
    ],
    alias: 'NoSQL Database',
    defaultValuesFilename: 'dynamoDb-defaults.js',
    serviceWalkthroughFilename: 'dynamoDb-walkthrough.js',
    cfnFilename: 'dynamoDb-cloudformation-template.yml.ejs',
    provider: 'awscloudformation',
  },
};
