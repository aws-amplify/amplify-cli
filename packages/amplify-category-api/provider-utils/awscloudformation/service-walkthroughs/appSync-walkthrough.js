const inquirer = require('inquirer');
const moment = require('moment');
const fs = require('fs-extra');
const path = require('path');
const openInEditor = require('open-in-editor');
const GraphQLTransform = require('graphql-transform').default;
const AppSyncDynamoDBTransformer = require('graphql-dynamodb-transformer').default;
const AppSyncAuthTransformer = require('graphql-auth-transformer').default;
const AppSyncTransformer = require('graphql-appsync-transformer').default;
const category = 'api';
const parametersFileName = 'parameters.json';
const templateFileName = 'cloudformation-template.json';
const schemaFileName = 'schema.graphql';

const securityTypeMapping = {
  apiKey: 'API_KEY',
  iam: 'AWS_IAM',
  cognito: 'AMAZON_COGNITO_USER_POOLS',
  openId: 'OPENID_CONNECT',
};

async function serviceWalkthrough(context, defaultValuesFilename, serviceMetadata) {
  const { amplify } = context;
  const { inputs } = serviceMetadata;
  const defaultValuesSrc = `${__dirname}/../default-values/${defaultValuesFilename}`;
  const { getAllDefaults } = require(defaultValuesSrc);
  const allDefaultValues = getAllDefaults(amplify.getProjectDetails());

  const resourceQuestions = [
    {
      type: inputs[0].type,
      name: inputs[0].key,
      message: inputs[0].question,
      validate: amplify.inputValidation(inputs[0]),
      default: () => {
        const defaultValue = allDefaultValues[inputs[0].key];
        return defaultValue;
      },
    },
    {
      type: inputs[1].type,
      name: inputs[1].key,
      message: inputs[1].question,
      validate: amplify.inputValidation(inputs[1]),
      default: answers => answers.resourceName,
    },
    {
      type: inputs[2].type,
      name: inputs[2].key,
      message: inputs[2].question,
      validate: amplify.inputValidation(inputs[2]),
      default: () => {
        const defaultValue = allDefaultValues[inputs[2].key];
        return defaultValue;
      },
    },
  ];

  // Ask resource and API name question

  const resourceAnswers = await inquirer.prompt(resourceQuestions);
  Object.assign(allDefaultValues, resourceAnswers);

  const backendDir = amplify.pathManager.getBackendDirPath();

  const resourceDir = `${backendDir}/${category}/${resourceAnswers[inputs[0].key]}`;
  const buildDir = `${resourceDir}/build`;

  fs.ensureDirSync(buildDir);

  const parametersFilePath = path.join(resourceDir, parametersFileName);

  const parameters = {
    AppSyncApiName: resourceAnswers[inputs[1].key]
  };

  const jsonString = JSON.stringify(parameters, null, 4);

  fs.writeFileSync(parametersFilePath, jsonString, 'utf8');

  if (resourceAnswers[inputs[2].key]) {
    console.log('Yes I have a file');
    const filePathQuestion = {
      type: inputs[3].type,
      name: inputs[3].key,
      message: inputs[3].question,
      validate: amplify.inputValidation(inputs[3])
    };
    const { schemaFilePath } = await inquirer.prompt(filePathQuestion);

    fs.copyFileSync(schemaFilePath, `${resourceDir}/${schemaFileName}`);

    // Transformer compiler code

    const transformer = new GraphQLTransform({
      transformers: [
          new AppSyncTransformer(buildDir),
          new AppSyncDynamoDBTransformer(),
          new AppSyncAuthTransformer(),
      ]
    });
    
    const cfdoc = transformer.transform(fs.readFileSync(schemaFilePath, 'utf8'));
    fs.writeFileSync(`${resourceDir}/${templateFileName}`, JSON.stringify(cfdoc, null, 4), 'utf8');

    return { answers: resourceAnswers, output: { securityType: 'AWS_IAM' }, noCfnFile: true };

  } else {


    console.log('No I dont have a file');

    const templateQuestions = [
      {
        type: inputs[4].type,
        name: inputs[4].key,
        message: inputs[4].question,
        choices: inputs[4].options,
        validate: amplify.inputValidation(inputs[4])
      },
      {
        type: inputs[5].type,
        name: inputs[5].key,
        message: inputs[5].question,
        validate: amplify.inputValidation(inputs[5]),
        default: () => {
          const defaultValue = allDefaultValues[inputs[5].key];
          return defaultValue;
        }
      }
    ];

    const {templateSelection, editSchemaChoice} = await inquirer.prompt(templateQuestions);
    const schemaFilePath= `${__dirname}/../appsync-schemas/${templateSelection}`;
    const targetSchemaFilePath = `${resourceDir}/${schemaFileName}`;

    fs.copyFileSync(schemaFilePath, targetSchemaFilePath);

    if(editSchemaChoice) {
      const editorQuestion = {
        type: inputs[6].type,
        name: inputs[6].key,
        message: inputs[6].question,
        choices: inputs[6].options,
        validate: amplify.inputValidation(inputs[6])
      };

      const {editorSelection} = await inquirer.prompt(editorQuestion);
      let editorOption = {};
      if(editorSelection !== 'none') {
        editorOption = {
          editor: editorSelection
        }
      }
      const editor = openInEditor.configure(editorOption, function(err) {
        console.error('Editor not found in your machine. Please open your faviorite editor and modify the file if needed: ' + err);
      });

      return editor.open(targetSchemaFilePath)
      .then(function() {
        console.log('Success!');
        return context.amplify.pressEnterToContinue.run({ message: 'Press Enter to continue' });
      }, function(err) {
        console.error('Something went wrong: ' + err);
      })
      .then(() => {
        const transformer = new GraphQLTransform({
          transformers: [
              new AppSyncTransformer(buildDir),
              new AppSyncDynamoDBTransformer(),
              new AppSyncAuthTransformer(),
          ]
        });
        const cfdoc = transformer.transform(fs.readFileSync(targetSchemaFilePath, 'utf8'));
        fs.writeFileSync(`${resourceDir}/${templateFileName}`, JSON.stringify(cfdoc, null, 4), 'utf8');

        return { answers: resourceAnswers, output: { securityType: 'AWS_IAM' }, noCfnFile: true };
      });
    } else {

       const transformer = new GraphQLTransform({
          transformers: [
              new AppSyncTransformer(buildDir),
              new AppSyncDynamoDBTransformer(),
              new AppSyncAuthTransformer(),
          ]
        });
        const cfdoc = transformer.transform(fs.readFileSync(targetSchemaFilePath, 'utf8'));
        fs.writeFileSync(`${resourceDir}/${templateFileName}`, JSON.stringify(cfdoc, null, 4), 'utf8');


        return { answers: resourceAnswers, output: { securityType: 'AWS_IAM' }, noCfnFile: true };
    }

  }

}


module.exports = { serviceWalkthrough };
