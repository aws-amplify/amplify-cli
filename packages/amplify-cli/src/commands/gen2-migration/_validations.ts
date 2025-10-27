import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { printer } from '@aws-amplify/amplify-prompts';

export class AmplifyGen2MigrationValidations {
  constructor(private readonly context: $TSContext) {}

  public async validateWorkingDirectory(): Promise<void> {
    printer.warn('Not implemented');
  }

  public async validateDeploymentStatus(): Promise<void> {
    printer.warn('Not implemented');
  }

  public async validateDeploymentVersion(): Promise<void> {
    printer.warn('Not implemented');
  }

  public async validateIsolatedEnvironment(): Promise<void> {
    printer.warn('Not implemented');
  }

  // eslint-disable-next-line spellcheck/spell-checker
  public async validateStatefulResources(): Promise<void> {
    printer.warn('Not implemented');
  }

  public async validateIngressTraffic(): Promise<void> {
    printer.warn('Not implemented');
  }
}
