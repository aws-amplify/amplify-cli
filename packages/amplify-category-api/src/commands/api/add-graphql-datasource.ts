import { ensureEnvParamManager } from '@aws-amplify/amplify-environment-parameters';
import { mergeTypeDefs } from '@graphql-tools/merge';
import {
  $TSAny, $TSContext, exitOnNextTick, FeatureFlags, pathManager, ResourceDoesNotExistError, stateManager,
} from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import * as fs from 'fs-extra';
import * as graphql from 'graphql';
import {
  AuroraServerlessMySQLDatabaseReader,
  RelationalDBSchemaTransformer,
  RelationalDBTemplateGenerator,
} from 'graphql-relational-schema-transformer';
import inquirer from 'inquirer';
import * as path from 'path';
import { supportedDataSources } from '../../provider-utils/supported-datasources';

const subcommand = 'add-graphql-datasource';
const category = 'api';
const providerName = 'awscloudformation';

export const name = subcommand;

/**
 * Entry point for adding RDS data source
 */
export const run = async (context: $TSContext): Promise<void> => {
  try {
    const AWS = await getAwsClient(context, 'list');

    const result: $TSAny = await datasourceSelectionPrompt(context, supportedDataSources);

    const providerController = await import(path.join('..', '..', 'provider-utils', result.providerName, 'index'));

    if (!providerController) {
      printer.error('Provider not configured for this category');
      return;
    }

    const { datasource } = result;
    const answers = await providerController.addDatasource(context, category, datasource);

    const { resourceName, databaseName } = answers;

    /**
     * Write the new env specific datasource information to the resource param manager
     */
    (await ensureEnvParamManager()).instance.getResourceParamManager(category, resourceName).setAllParams({
      rdsRegion: answers.region,
      rdsClusterIdentifier: answers.dbClusterArn,
      rdsSecretStoreArn: answers.secretStoreArn,
      rdsDatabaseName: answers.databaseName,
    });

    const backendConfig = stateManager.getBackendConfig();

    backendConfig[category][resourceName].rdsInit = true;

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
     * the db introspection to get the GraphQL Schema and Template Context
     */
    // eslint-disable-next-line spellcheck/spell-checker
    const improvePluralizationFlag = FeatureFlags.getBoolean('graphqltransformer.improvePluralization');
    const relationalSchemaTransformer = new RelationalDBSchemaTransformer(dbReader, answers.databaseName, improvePluralizationFlag);
    const graphqlSchemaContext = await relationalSchemaTransformer.introspectDatabaseSchema();

    if (graphqlSchemaContext === null) {
      printer.warn('No importable tables were found in the selected Database.');
      printer.blankLine();
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
      const currentGraphQLSchemaDoc = readSchema(graphqlSchemaFilePath);

      if (currentGraphQLSchemaDoc) {
        typesToBeMerged.unshift(currentGraphQLSchemaDoc);
      } else {
        printer.warn(`Graphql Schema file "${graphqlSchemaFilePath}" is empty.`);
        printer.blankLine();
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
    printer.error('There was an error adding the datasource');
    throw error;
  }
};

// eslint-disable-next-line @typescript-eslint/no-shadow
const datasourceSelectionPrompt = async (context: $TSContext, supportedDataSources): Promise<unknown> => {
  const options = [];
  Object.keys(supportedDataSources).forEach(datasource => {
    const optionName = supportedDataSources[datasource].alias
      || `${supportedDataSources[datasource].providerName}:${supportedDataSources[datasource].service}`;
    options.push({
      name: optionName,
      value: {
        provider: supportedDataSources[datasource].provider,
        datasource,
        providerName: supportedDataSources[datasource].provider,
      },
    });
  });

  if (options.length === 0) {
    const errMessage = `No data sources defined by configured providers for category: ${category}`;

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
      message: 'Please select from one of the below mentioned data sources',
      type: 'list',
      choices: options,
    },
  ];

  return inquirer.prompt(question).then(answer => answer.datasource);
};

const getAwsClient = async (context: $TSContext, action: string): Promise<$TSAny> => {
  const providerPlugins = context.amplify.getProviderPlugins(context);
  // eslint-disable-next-line
  const provider = require(providerPlugins[providerName]);

  return provider.getConfiguredAWSClient(context, 'aurora-serverless', action);
};

/**
 * Read the GraphQL schema
 */
export const readSchema = (graphqlSchemaFilePath: string): graphql.DocumentNode => {
  const graphqlSchemaRaw = fs.readFileSync(graphqlSchemaFilePath).toString();

  if (graphqlSchemaRaw.trim().length === 0) {
    return null;
  }

  let currentGraphQLSchemaDoc: graphql.DocumentNode;

  try {
    currentGraphQLSchemaDoc = graphql.parse(graphqlSchemaRaw);
  } catch (err) {
    const relativePathToInput = path.relative(process.cwd(), graphqlSchemaRaw);

    const error = new Error(`Could not parse graphql schema \n${relativePathToInput}\n${err.message}`);

    error.stack = undefined;

    throw error;
  }

  return currentGraphQLSchemaDoc;
};
