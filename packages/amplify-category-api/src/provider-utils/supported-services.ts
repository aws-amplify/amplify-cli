export const supportedServices = {
  AppSync: {
    inputs: [
      {
        key: 'resourceName',
        type: 'input',
        question: 'Provide a friendly name for your resource to be used as label for this category in the project:',
        validation: {
          operator: 'regex',
          value: '^[a-zA-Z0-9]+$',
          onErrorMsg: 'Resource name should be alphanumeric',
        },
        required: true,
      },
      {
        key: 'apiName',
        type: 'input',
        question: 'Provide API name:',
        validation: {
          operator: 'regex',
          value: '^[a-zA-Z0-9]{1,80}$',
          onErrorMsg: 'You can use the following characters: a-z A-Z 0-9 with maximum length of 80',
        },
        required: true,
      },
      {
        key: 'apiCreationChoice',
        type: 'confirm',
        question: 'Do you have an annotated GraphQL schema?',
        required: true,
      },
      {
        key: 'schemaFilePath',
        type: 'input',
        question: 'Provide your schema file path:',
        required: true,
      },
      {
        key: 'templateSelection',
        type: 'list',
        question: 'Choose a schema template:',
        options: [
          {
            name: 'Single object with fields (e.g., “Todo” with ID, name, description)',
            value: 'single-object-schema.graphql',
          },
          {
            name: 'One-to-many relationship (e.g., “Blogs” with “Posts” and “Comments”)',
            value: 'many-relationship-schema.graphql',
          },
          {
            name: 'Objects with fine-grained access control (e.g., a project management app with owner-based authorization)',
            value: 'single-object-auth-schema.graphql',
          },
          {
            name: 'Blank Schema',
            value: 'blank-schema.graphql',
          },
        ],
        required: true,
      },
      {
        key: 'editSchemaChoice',
        type: 'confirm',
        question: 'Do you want to edit the schema now?',
        required: true,
      },
      {
        key: 'editorSelection',
        type: 'list',
        question: 'Choose the editor you want to open the schema in:',
        options: [
          {
            name: 'Sublime Text',
            value: 'sublime',
          },
          {
            name: 'Atom Editor',
            value: 'atom',
          },
          {
            name: 'Visual Studio Code',
            value: 'code',
          },
          {
            name: 'IDEA 14 CE',
            value: 'idea14ce',
          },
          {
            name: 'Vim (via Terminal, macOS only)',
            value: 'vim',
          },
          {
            name: 'Emacs (via Terminal, macOS only)',
            value: 'emacs',
          },
          {
            name: 'None - Use my env variables to open my default editor',
            value: 'none',
          },
        ],
        required: true,
      },
      {
        key: 'dynamoDbType',
        type: 'list',
        question: 'Choose a DynamoDB data source option',
        options: [
          {
            name: 'Use the DynamoDB table configured in the current Amplify project',
            value: 'currentProject',
          },
          {
            name: 'Create a new DynamoDB table',
            value: 'newResource',
          },
          {
            name: 'Use a DynamoDB table already deployed on AWS',
            value: 'cloudResource',
          },
        ],
      },
    ],
    alias: 'GraphQL',
    serviceWalkthroughFilename: 'appSync-walkthrough.js',
    cfnFilename: 'appSync-cloudformation-template-default.yml.ejs',
    provider: 'awscloudformation',
  },
  'API Gateway': {
    inputs: [
      {
        key: 'apiName',
        question: 'Provide a friendly name for your API:',
        required: true,
      },
      {
        key: 'pathName',
        question: 'HTTP path name?',
        type: 'input',
        required: 'true',
      },
      {
        key: 'lambdaFunction',
        question: 'Select the Lambda function',
        required: true,
        type: 'input',
      },
    ],
    alias: 'REST',
    serviceWalkthroughFilename: 'apigw-walkthrough.js',
    provider: 'awscloudformation',
  },
};
