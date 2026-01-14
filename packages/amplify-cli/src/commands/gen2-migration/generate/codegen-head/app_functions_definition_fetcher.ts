import assert from 'node:assert';
import { FunctionDefinition } from '../core/migration-pipeline';
import { getFunctionDefinition } from '../adapters/functions/index';
import { BackendEnvironmentResolver } from './backend_environment_selector';
import { GetFunctionCommand, GetPolicyCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { DescribeRuleCommand, CloudWatchEventsClient } from '@aws-sdk/client-cloudwatch-events';
import * as path from 'path';
import { StateManager, $TSMeta, JSONUtilities } from '@aws-amplify/amplify-cli-core';
import { BackendDownloader } from './backend_downloader';
import { AuthAccessAnalyzer } from './auth_access_analyzer';

/**
 * Configuration interface for Amplify Auth category resources.
 * Used to identify Cognito-based auth configurations and their function dependencies.
 */
interface AuthConfig {
  /** Array of resources this auth configuration depends on */
  dependsOn?: Array<{
    /** The Amplify category (e.g., 'function', 'storage') */
    category: string;
    /** The specific resource name within that category */
    resourceName: string;
  }>;
  /** The AWS service type (e.g., 'Cognito') */
  service: string;
  /** Additional configuration properties */
  [key: string]: unknown;
}

/**
 * Interface defining the contract for fetching function definitions during Gen 1 to Gen 2 migration.
 */
export interface AppFunctionsDefinitionFetcher {
  /**
   * Retrieves all function definitions from the current Amplify Gen 1 project.
   * @returns Promise resolving to an array of function definitions or undefined if none exist
   */
  getDefinition(): Promise<FunctionDefinition[] | undefined>;
}

/**
 * Fetches and analyzes AWS Lambda function definitions from an Amplify Gen 1 project
 * for migration to Gen 2. This class is responsible for:
 *
 * 1. Reading function metadata from amplify-meta.json
 * 2. Identifying trigger relationships between functions and other Amplify categories
 * 3. Fetching live AWS Lambda configurations and CloudWatch schedules
 * 4. Building a comprehensive function definition for migration purposes
 *
 * The fetcher handles three main types of function triggers:
 * - Auth triggers: Functions triggered by Cognito events (pre-signup, post-confirmation, etc.)
 * - Storage triggers: Functions triggered by S3 bucket events or DynamoDB streams
 * - Scheduled triggers: Functions triggered by CloudWatch Events on a schedule
 */
export class AppFunctionsDefinitionFetcher {
  /**
   * Creates a new AppFunctionsDefinitionFetcher instance.
   *
   * @param lambdaClient - AWS Lambda client for fetching function configurations and policies
   * @param cloudWatchEventsClient - CloudWatch Events client for fetching scheduled function rules
   * @param backendEnvironmentResolver - Resolver for determining the target backend environment
   * @param stateManager - Amplify state manager for accessing project metadata
   */
  constructor(
    private lambdaClient: LambdaClient,
    private cloudWatchEventsClient: CloudWatchEventsClient,
    private backendEnvironmentResolver: BackendEnvironmentResolver,
    private stateManager: StateManager,
    private ccbFetcher: BackendDownloader,
    private authAnalyzer: AuthAccessAnalyzer,
  ) {}

  /**
   * Fetches and processes all function definitions from the current Amplify Gen 1 project.
   *
   * This method performs the following operations:
   * 1. Resolves the target backend environment
   * 2. Reads project metadata from amplify-meta.json
   * 3. Identifies function trigger relationships across categories
   * 4. Fetches live AWS configurations for all functions
   * 5. Retrieves CloudWatch schedule expressions for scheduled functions
   * 6. Builds comprehensive function definitions for migration
   *
   * @returns Promise resolving to an array of function definitions or undefined if no functions exist
   * @throws AssertionError if backend environment cannot be resolved
   */
  getDefinition = async (): Promise<FunctionDefinition[] | undefined> => {
    // Resolve the target backend environment for this migration
    const backendEnvironment = await this.backendEnvironmentResolver.selectBackendEnvironment();
    assert(backendEnvironment?.stackName);

    const currentCloudBackendDirectory = await this.ccbFetcher.getCurrentCloudBackend(backendEnvironment.deploymentArtifacts);
    const amplifyMetaPath = path.join(currentCloudBackendDirectory, 'amplify-meta.json');

    const meta = JSONUtilities.readJson<$TSMeta>(amplifyMetaPath, { throwIfNotExist: true });

    const functions = meta?.function ?? {};
    const auth = meta?.auth ?? {};
    const storageList = meta?.storage ?? {};

    // Map to track which category triggers each function (auth, storage, etc.)
    const functionCategoryMap = new Map<string, string>();

    // Find Cognito auth configuration to identify auth-triggered functions
    const authValues: AuthConfig | undefined = Object.values(auth).find(
      (resourceConfig: unknown) =>
        resourceConfig && typeof resourceConfig === 'object' && 'service' in resourceConfig && resourceConfig?.service === 'Cognito',
    ) as AuthConfig;

    // Identify functions triggered by Cognito auth events
    // These are typically pre-signup, post-confirmation, pre-authentication, etc.
    if (auth && authValues && authValues.dependsOn) {
      for (const env of authValues.dependsOn) {
        if (env.category == 'function') {
          functionCategoryMap.set(env.resourceName, 'auth');
        }
      }
    }

    // Note: All functions should be categorized as 'function' regardless of what resources they access.
    // Only auth trigger functions are categorized differently.
    // Functions that access S3/DynamoDB are still regular functions, not storage functions.

    // Fetch live AWS Lambda function configurations for all functions in the project
    // This provides runtime information like memory, timeout, environment variables, etc.
    const getFunctionPromises = Object.keys(functions).map((key) => {
      return this.lambdaClient.send(
        new GetFunctionCommand({
          FunctionName: meta.function[key].output.Name,
        }),
      );
    });

    // Process function responses and filter out any null configurations
    const functionConfigurations = (await Promise.all(getFunctionPromises))
      .map((functionResponse) => functionResponse.Configuration ?? null)
      .filter((config): config is NonNullable<typeof config> => config !== null);

    // Fetch CloudWatch Events schedules for functions that are triggered on a schedule
    // This involves a two-step process:
    // 1. Parse the Lambda function's resource policy to find CloudWatch rule ARNs
    // 2. Query CloudWatch Events to get the actual schedule expression (cron/rate)
    const getFunctionSchedulePromises = Object.keys(functions).map(async (key) => {
      const functionName = meta.function[key].output.Name;

      // Step 1: Extract CloudWatch rule name from Lambda function policy
      // The policy contains ARNs that reference CloudWatch Events rules
      let ruleName: string | undefined;
      try {
        const policyResponse = await this.lambdaClient.send(new GetPolicyCommand({ FunctionName: functionName }));
        const policy = JSON.parse(policyResponse.Policy ?? '{}');

        // Look for policy statements that reference CloudWatch Events rules
        // The ARN format is: arn:aws:events:region:account:rule/rule-name
        ruleName = policy.Statement?.find((statement: any) => statement.Condition?.ArnLike?.['AWS:SourceArn']?.includes('rule/'))
          ?.Condition.ArnLike['AWS:SourceArn'].split('/')
          .pop();
      } catch (error) {
        // Function may not have a policy or may not be scheduled
        return { functionName, scheduleExpression: undefined };
      }

      let scheduleExpression: string | undefined;

      // Step 2: If we found a rule name, fetch its schedule expression
      if (ruleName) {
        try {
          const ruleResponse = await this.cloudWatchEventsClient.send(new DescribeRuleCommand({ Name: ruleName }));
          scheduleExpression = ruleResponse.ScheduleExpression;
        } catch (error) {
          // Rule may not exist or may not be accessible
          scheduleExpression = undefined;
        }
      }

      return {
        functionName,
        scheduleExpression,
      };
    });

    // Wait for all schedule fetching operations to complete
    const functionSchedules = await Promise.all(getFunctionSchedulePromises);

    // Get auth access from auth analyzer for function definitions
    const functionAuthAccess = await this.authAnalyzer.getFunctionAuthAccess();

    // Build comprehensive function definitions by combining:
    // - Live AWS Lambda configurations (runtime, memory, timeout, etc.)
    // - CloudWatch schedule expressions (for scheduled functions)
    // - Trigger category mappings (auth, storage, etc.)
    // - Original Amplify project metadata
    // - CloudFormation templates for auth access parsing
    return getFunctionDefinition(functionConfigurations, functionSchedules, functionCategoryMap, meta, functionAuthAccess);
  };
}
