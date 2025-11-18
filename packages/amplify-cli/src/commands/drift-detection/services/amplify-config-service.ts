/**
 * Amplify configuration service
 * Handles Amplify project configuration and validation
 */

import { stateManager, pathManager, AmplifyError } from '@aws-amplify/amplify-cli-core';

/**
 * Service for Amplify project configuration
 */
export class AmplifyConfigService {
  /**
   * Validate this is an Amplify project
   */
  public validateAmplifyProject(): void {
    try {
      const projectPath = pathManager.findProjectRoot();
      if (!projectPath) {
        throw new Error('Not an Amplify project');
      }
    } catch (error) {
      throw new AmplifyError('ProjectNotFoundError', {
        message: 'Not an Amplify project.',
        resolution: 'Run this command from an Amplify project directory.',
      });
    }
  }

  /**
   * Get the root stack name from Amplify configuration
   */
  public getRootStackName(): string {
    const projectPath = pathManager.findProjectRoot();
    const meta = stateManager.getMeta(projectPath);

    const stackName = meta?.providers?.awscloudformation?.StackName;
    if (!stackName) {
      throw new AmplifyError('StackNotFoundError', {
        message: 'Stack information not found in amplify-meta.json.',
        resolution: 'Has the project been deployed? Run "amplify push" to deploy your project.',
      });
    }

    return stackName;
  }

  /**
   * Extract project name from stack name
   */
  public extractProjectName(stackName: string): string {
    // Extract project name from stack name (e.g., "amplify-my-project-dev-123" -> "my-project")
    const match = stackName.match(/^amplify-([^-]+)-/);
    return match ? match[1] : stackName;
  }

  /**
   * Extract category from logical ID
   */
  public extractCategory(logicalId: string): string {
    const idLower = logicalId.toLowerCase();
    if (idLower.includes('auth')) return 'auth';
    if (idLower.includes('storage')) return 'storage';
    if (idLower.includes('function')) return 'function';
    if (idLower.includes('api')) return 'api';
    if (idLower.includes('hosting')) return 'hosting';
    if (idLower.includes('analytics')) return 'analytics';
    return 'other';
  }

  /**
   * Get the AWS region from Amplify configuration
   */
  public getRegion(): string {
    const projectPath = pathManager.findProjectRoot();
    const meta = stateManager.getMeta(projectPath);

    const region = meta?.providers?.awscloudformation?.Region;
    if (!region) {
      // Try to get from team provider info
      const teamProviderInfo = stateManager.getTeamProviderInfo(projectPath);
      const envName = stateManager.getLocalEnvInfo(projectPath)?.envName;

      if (envName && teamProviderInfo?.[envName]?.awscloudformation?.Region) {
        return teamProviderInfo[envName].awscloudformation.Region;
      }

      throw new AmplifyError('ConfigurationError', {
        message: 'AWS region not found in project configuration.',
        resolution: 'Ensure your project has been initialized with "amplify init".',
      });
    }

    return region;
  }
}
