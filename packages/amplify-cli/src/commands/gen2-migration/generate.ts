import { AmplifyMigrationOperation, AmplifyMigrationStep } from './_step';
import { prepare, pathExists } from './generate/codegen-head/command-handlers';
import { AmplifyGen2MigrationValidations } from './_validations';
import * as path from 'path';

export class AmplifyMigrationGenerateStep extends AmplifyMigrationStep {
  private readonly packageJsonPath = path.join(process.cwd(), 'package.json');
  private readonly nodeModulesPath = path.join(process.cwd(), 'node_modules');
  private readonly packageLockPath = path.join(process.cwd(), 'package-lock.json');

  public async packageJsonExists(): Promise<boolean> {
    return await pathExists(this.packageJsonPath);
  }

  public async nodeModulesExists(): Promise<boolean> {
    return await pathExists(this.nodeModulesPath);
  }

  public async packageLockExists(): Promise<boolean> {
    return await pathExists(this.packageLockPath);
  }

  public async executeImplications(): Promise<string[]> {
    return ['TODO'];
  }

  public async rollbackImplications(): Promise<string[]> {
    throw new Error('Method not implemented.');
  }

  public async executeValidate(): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const validations = new AmplifyGen2MigrationValidations(this.logger, this.rootStackName, this.currentEnvName, this.context);
    await validations.validateLockStatus();
    await validations.validateWorkingDirectory();
  }

  public async rollbackValidate(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  public async execute(): Promise<AmplifyMigrationOperation[]> {
    const descriptions: string[] = [];

    if (await this.packageJsonExists()) {
      descriptions.push(`Add Gen2 TypeScript dependencies to ${this.packageJsonPath}`);
    } else {
      descriptions.push(`Create ${this.packageJsonPath} with Gen2 TypeScript dependencies`);
    }

    if (await this.packageLockExists()) {
      descriptions.push(`Regenerate ${this.packageLockPath}`);
    } else {
      descriptions.push(`Create ${this.packageLockPath}`);
    }

    if (await this.nodeModulesExists()) {
      descriptions.push(`Recreate ${this.nodeModulesPath}`);
    } else {
      descriptions.push(`Create ${this.nodeModulesPath}`);
    }

    descriptions.push(`Replace your local 'amplify' folder with corresponding Gen2 TypeScript definition files`);
    descriptions.push(`Install Gen2 dependencies`);

    return [
      {
        describe: async () => descriptions,
        execute: async () => {
          await prepare(this.logger, this.appId, this.currentEnvName, this.region);
        },
      },
    ];
  }

  public async rollback(): Promise<AmplifyMigrationOperation[]> {
    throw new Error('Not Implemented');
  }
}
