import { BackendEnvironmentResolver } from './backend_environment_selector';
import { BackendDownloader } from './backend_downloader';
import { JSONUtilities, $TSMeta } from '@aws-amplify/amplify-cli-core';
import { fileOrDirectoryExists } from './directory_exists';
import path from 'node:path';
import fs from 'node:fs/promises';
import assert from 'node:assert';

/**
 * Scans function CloudFormation templates for auth access patterns.
 * Provides centralized template fetching for auth-related analysis.
 */
export class AuthFunctionScanner {
  constructor(private backendEnvironmentResolver: BackendEnvironmentResolver, private ccbFetcher: BackendDownloader) {}

  /**
   * Fetches CloudFormation templates for all functions in the project.
   * @returns Map of function names to their CloudFormation template content
   */
  async getFunctionTemplates(): Promise<Map<string, string>> {
    const backendEnvironment = await this.backendEnvironmentResolver.selectBackendEnvironment();
    assert(backendEnvironment?.deploymentArtifacts);

    const currentCloudBackendDirectory = await this.ccbFetcher.getCurrentCloudBackend(backendEnvironment.deploymentArtifacts);
    const amplifyMetaPath = path.join(currentCloudBackendDirectory, 'amplify-meta.json');

    const meta = JSONUtilities.readJson<$TSMeta>(amplifyMetaPath, { throwIfNotExist: true });
    const functions = meta?.function ?? {};

    const functionTemplates = new Map<string, string>();
    for (const functionName of Object.keys(functions)) {
      try {
        const templatePath = path.join(
          currentCloudBackendDirectory,
          'function',
          functionName,
          `${functionName}-cloudformation-template.json`,
        );
        if (await fileOrDirectoryExists(templatePath)) {
          const templateContent = await fs.readFile(templatePath, 'utf8');
          functionTemplates.set(functionName, templateContent);
        }
      } catch (error) {
        // Template may not exist or may not be readable
      }
    }

    return functionTemplates;
  }
}
