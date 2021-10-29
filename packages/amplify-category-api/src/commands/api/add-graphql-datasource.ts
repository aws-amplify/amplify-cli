import { mergeTypeDefs } from '@graphql-tools/merge';
import { $TSAny, $TSContext, exitOnNextTick, FeatureFlags, pathManager, ResourceDoesNotExistError, stateManager } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import * as fs from 'fs-extra';
import * as graphql from 'graphql';
import {
  AuroraServerlessMySQLDatabaseReader,
  RelationalDBSchemaTransformer,
  RelationalDBTemplateGenerator,
} from 'graphql-relational-schema-transformer';
import inquirer from 'inquirer';
import _ from 'lodash';
import * as path from 'path';

const subcommand = 'add-graphql-datasource';
const categories = 'categories';
const category = 'api';
const providerName = 'awscloudformation';

export const name = subcommand;

export const run = async (context: $TSContext) => {
  try {
    const servicesMetadata = (await import(path.join('..', '..', 'provider-utils', 'supported-services'))).supportedServices;
    const AWS = await getAwsClient(context, 'list');

    const result: $TSAny = await datasourceSelectionPrompt(context, servicesMetadata);

    const providerController = await import(path.join('..', '..', 'provider-utils', result.providerName, 'index'));

    if (!providerController) {
      printer.error('Provider not configured for this category');
      return;
    }

    const { datasource } = result;
    const answers = await providerController.addDatasource(context, category, datasource);

    const { resourceName, databaseName } = answers;

    /**
     * Write the new env specific datasource information into
     * the team-provider-info file
     */
    const currEnv = context.amplify.getEnvInfo().envName;
    const teamProviderInfo = stateManager.getTeamProviderInfo();

    _.set(teamProviderInfo, [currEnv, categories, category, resourceName], {
      rdsRegion: answers.region,
      rdsClusterIdentifier: answers.dbClusterArn,
      rdsSecretStoreArn: answers.secretStoreArn,
      rdsDatabaseName: answers.databaseName,
    });

    stateManager.setTeamProviderInfo(undefined, teamProviderInfo);

    const backendConfig = stateManager.getBackendConfig();

    backendConfig[category][resourceName]['rdsInit'] = true;

    stateManager.setBackendConfig(undefined, backendConfig);

    /**
     * Load the MySqlRelationalDBReader
     */
    const dbReader = new AuroraServerlessMySQLDatabaseReader(
      answers.region,
      answers.secretStoreArn,
      answers.dbClusterArn,
      answers.databaseName,
      AWS,
    );

    /**
     * Instantiate a new Relational Schema Transformer and perform
     * the db instrospection to get the GraphQL Schema and Template Context
     */
    const improvePluralizationFlag = FeatureFlags.getBoolean('graphqltransformer.improvePluralization');
    const relationalSchemaTransformer = new RelationalDBSchemaTransformer(dbReader, answers.databaseName, improvePluralizationFlag);
    const graphqlSchemaContext = await relationalSchemaTransformer.introspectDatabaseSchema();

    if (graphqlSchemaContext === null) {
      printer.warn('No importable tables were found in the selected Database.');
      printer.info('');
      return;
    }

    /**
     * Merge the GraphQL Schema with the existing schema.graphql in the projects stack
     *
     */
    const apiDirPath = pathManager.getResourceDirectoryPath(undefined, category, resourceName);

    fs.ensureDirSync(apiDirPath);

    const graphqlSchemaFilePath = path.join(apiDirPath, 'schema.graphql');
    const rdsGraphQLSchemaDoc = graphqlSchemaContext.schemaDoc;
    const schemaDirectoryPath = path.join(apiDirPath, 'schema');

    if (fs.existsSync(graphqlSchemaFilePath)) {
      const typesToBeMerged = [rdsGraphQLSchemaDoc];
      const currGraphQLSchemaDoc = readSchema(graphqlSchemaFilePath);

      if (currGraphQLSchemaDoc) {
        typesToBeMerged.unshift(currGraphQLSchemaDoc);
      } else {
        printer.warn(`Graphql Schema file "${graphqlSchemaFilePath}" is empty.`);
        printer.info('');
      }

      const concatGraphQLSchemaDoc = mergeTypeDefs(typesToBeMerged);

      fs.writeFileSync(graphqlSchemaFilePath, graphql.print(concatGraphQLSchemaDoc), 'utf8');
    } else if (fs.existsSync(schemaDirectoryPath)) {
      const rdsSchemaFilePath = path.join(schemaDirectoryPath, 'rds.graphql');

      fs.writeFileSync(rdsSchemaFilePath, graphql.print(rdsGraphQLSchemaDoc), 'utf8');
    } else {
      throw new Error(`Could not find a schema in either ${graphqlSchemaFilePath} or schema directory at ${schemaDirectoryPath}`);
    }

    const resolversDir = path.join(apiDirPath, 'resolvers');

    /**
     * Instantiate a new Relational Template Generator and create
     * the template and relational resolvers
     */

    const templateGenerator = new RelationalDBTemplateGenerator(graphqlSchemaContext);

    let template = templateGenerator.createTemplate(context);

    template = templateGenerator.addRelationalResolvers(template, resolversDir, improvePluralizationFlag);

    const cfn = templateGenerator.printCloudformationTemplate(template);

    /**
     * Add the generated the CFN to the appropriate nested stacks directory
     */

    const stacksDir = path.join(apiDirPath, 'stacks');
    const writeToPath = path.join(stacksDir, `${resourceName}-${databaseName}-rds.json`);

    fs.writeFileSync(writeToPath, cfn, 'utf8');

    context.amplify.executeProviderUtils(context, 'awscloudformation', 'compileSchema', { forceCompile: true });

    printer.success(`Successfully added the ${datasource} datasource locally`);
    printer.blankLine();
    printer.success('Some next steps:');
    printer.info('"amplify push" will build all your local backend resources and provision it in the cloud');
    printer.info(
      '"amplify publish" will build all your local backend and frontend resources (if you have hosting category added) and provision it in the cloud',
    );
    printer.blankLine();
  } catch (error) {
    printer.info(error.stack);
    printer.error('There was an error adding the datasource');

    await context.usageData.emitError(error);

    process.exitCode = 1;
  }
};

async function datasourceSelectionPrompt(context: $TSContext, supportedDatasources) {
  const options = [];
  Object.keys(supportedDatasources).forEach(datasource => {
    const optionName =
      supportedDatasources[datasource].alias ||
      `${supportedDatasources[datasource].providerName}:${supportedDatasources[datasource].service}`;
    options.push({
      name: optionName,
      value: {
        provider: supportedDatasources[datasource].provider,
        datasource,
        providerName: supportedDatasources[datasource].provider,
      },
    });
  });

  if (options.length === 0) {
    const errMessage = `No datasources defined by configured providers for category: ${category}`;

    printer.error(errMessage);

    await context.usageData.emitError(new ResourceDoesNotExistError(errMessage));

    exitOnNextTick(1);
  }

  if (options.length === 1) {
    // No need to ask questions
    printer.info(`Using datasource: ${options[0].value.datasource}, provided by: ${options[0].value.providerName}`);

    return new Promise(resolve => {
      resolve(options[0].value);
    });
  }

  const question = [
    {
      name: 'datasource',
      message: 'Please select from one of the below mentioned datasources',
      type: 'list',
      choices: options,
    },
  ];

  return inquirer.prompt(question).then(answer => answer.datasource);
}

async function getAwsClient(context: $TSContext, action: string) {
  const providerPlugins = context.amplify.getProviderPlugins(context);
  const provider = require(providerPlugins[providerName]);

  return await provider.getConfiguredAWSClient(context, 'aurora-serverless', action);
}

export function readSchema(graphqlSchemaFilePath: string) {
  const graphqlSchemaRaw = fs.readFileSync(graphqlSchemaFilePath).toString();

  if (graphqlSchemaRaw.trim().length === 0) {
    return null;
  }

  let currGraphQLSchemaDoc: graphql.DocumentNode;

  try {
    currGraphQLSchemaDoc = graphql.parse(graphqlSchemaRaw);
  } catch (err) {
    const relativePathToInput = path.relative(process.cwd(), graphqlSchemaRaw);

    const error = new Error(`Could not parse graphql schema \n${relativePathToInput}\n${err.message}`);

    error.stack = undefined;

    throw error;
  }

  return currGraphQLSchemaDoc;
}
