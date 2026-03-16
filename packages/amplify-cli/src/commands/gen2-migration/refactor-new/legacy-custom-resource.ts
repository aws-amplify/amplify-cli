/* eslint-disable spellcheck/spell-checker */
/**
 * Legacy code path for custom resource mappings (--resourceMappings flag).
 * Isolated here to keep the main refactor.ts free of `any` types and eslint-disable directives.
 * Will be removed when a custom resource refactorer is implemented.
 */
import { AmplifyMigrationOperation } from '../_operation';
import { AmplifyError } from '@aws-amplify/amplify-cli-core';
import fs from 'fs-extra';
import { GetCallerIdentityCommand, STSClient } from '@aws-sdk/client-sts';
import { ResourceMapping } from './workflow/category-refactorer';

const FILE_PROTOCOL_PREFIX = 'file://';

/**
 * Parses and validates a resource mappings file from the --resourceMappings flag.
 */
export async function parseResourceMappings(resourceMappings: string): Promise<ResourceMapping[]> {
  if (!resourceMappings.startsWith(FILE_PROTOCOL_PREFIX)) {
    throw new AmplifyError('InputValidationError', {
      message: `Resource mappings path must start with ${FILE_PROTOCOL_PREFIX}`,
      resolution: `Use the format: ${FILE_PROTOCOL_PREFIX}/path/to/mappings.json`,
    });
  }

  const resourceMapPath = resourceMappings.split(FILE_PROTOCOL_PREFIX)[1];
  if (!resourceMapPath) {
    throw new AmplifyError('InputValidationError', {
      message: 'Invalid resource mappings path',
      resolution: `Use the format: ${FILE_PROTOCOL_PREFIX}/path/to/file.json`,
    });
  }

  if (!(await fs.pathExists(resourceMapPath))) {
    throw new AmplifyError('ResourceDoesNotExistError', {
      message: `Resource mappings file not found: ${resourceMapPath}`,
      resolution: 'Ensure the file exists and the path is correct.',
    });
  }

  const fileContent = await fs.readFile(resourceMapPath, 'utf-8');

  let parsed: unknown;
  try {
    parsed = JSON.parse(fileContent);
  } catch (parseError) {
    throw new AmplifyError('InputValidationError', {
      message: `Failed to parse JSON from resource mappings file: ${
        parseError instanceof Error ? parseError.message : 'Invalid JSON format'
      }`,
      resolution: 'Ensure the file contains valid JSON.',
    });
  }

  if (!Array.isArray(parsed) || !parsed.every(isResourceMappingValid)) {
    throw new AmplifyError('InputValidationError', {
      message: 'Invalid resource mappings structure',
      resolution: 'Each mapping must have Source and Destination objects with StackName and LogicalResourceId properties.',
    });
  }

  return parsed;
}

/**
 * Executes the legacy custom resource refactor using the old TemplateGenerator.
 */
export async function executeLegacyRefactor(params: {
  readonly rootStackName: string;
  readonly toStack: string;
  readonly appId: string;
  readonly currentEnvName: string;
  readonly region: string;
  readonly logger: { info: (msg: string) => void };
  readonly parsedMappings: ResourceMapping[];
}): Promise<AmplifyMigrationOperation[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let TemplateGenerator: any;
  try {
    // @ts-expect-error generators/ was removed in Phase 7; the catch block handles this gracefully.
    ({ TemplateGenerator } = await import('./generators/template-generator'));
  } catch {
    throw new AmplifyError('NotImplementedError', {
      message: '--resourceMappings requires the legacy refactor code which has been removed',
      resolution: 'A custom resource refactorer has not been implemented yet. Please remove the --resourceMappings flag.',
    });
  }

  return [
    {
      validate: async () => {
        return;
      },
      describe: async () => ['Move stateful resources from your Gen1 app to be managed by your Gen2 app'],
      execute: async () => {
        const templateGenerator = await initializeLegacyTemplateGenerator(TemplateGenerator, params);
        await templateGenerator.initializeForAssessment();
        const categories = [...templateGenerator.categoryStackMap.keys()];
        const success = await templateGenerator.generateSelectedCategories(categories, params.parsedMappings);
        if (!success) {
          throw new AmplifyError('DeploymentError', { message: 'Failed to execute CloudFormation stack refactor' });
        }
      },
    },
  ];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function initializeLegacyTemplateGenerator(
  TemplateGenerator: any,
  params: {
    readonly rootStackName: string;
    readonly toStack: string;
    readonly appId: string;
    readonly currentEnvName: string;
    readonly region: string;
    readonly logger: { info: (msg: string) => void };
  },
) {
  const stsClient = new STSClient({});
  const { Account: accountId } = await stsClient.send(new GetCallerIdentityCommand({}));
  if (!accountId) {
    throw new AmplifyError('ConfigurationError', { message: 'Unable to determine AWS account ID' });
  }

  const { CloudFormationClient } = await import('@aws-sdk/client-cloudformation');
  const { SSMClient } = await import('@aws-sdk/client-ssm');
  const { CognitoIdentityProviderClient } = await import('@aws-sdk/client-cognito-identity-provider');

  return new TemplateGenerator(
    params.rootStackName,
    params.toStack,
    accountId,
    new CloudFormationClient({}),
    new SSMClient({}),
    new CognitoIdentityProviderClient({}),
    params.appId,
    params.currentEnvName,
    params.logger,
    params.region,
  );
}

function isResourceMappingValid(resourceMapping: unknown): resourceMapping is ResourceMapping {
  return (
    typeof resourceMapping === 'object' &&
    resourceMapping !== null &&
    'Destination' in resourceMapping &&
    typeof resourceMapping.Destination === 'object' &&
    resourceMapping.Destination !== null &&
    'StackName' in resourceMapping.Destination &&
    typeof resourceMapping.Destination.StackName === 'string' &&
    'LogicalResourceId' in resourceMapping.Destination &&
    typeof resourceMapping.Destination.LogicalResourceId === 'string' &&
    'Source' in resourceMapping &&
    typeof resourceMapping.Source === 'object' &&
    resourceMapping.Source !== null &&
    'StackName' in resourceMapping.Source &&
    typeof resourceMapping.Source.StackName === 'string' &&
    'LogicalResourceId' in resourceMapping.Source &&
    typeof resourceMapping.Source.LogicalResourceId === 'string'
  );
}
