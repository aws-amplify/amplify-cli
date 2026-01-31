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

  private async implications(): Promise<string[]> {
    const implications = [];

    if (await this.packageJsonExists()) {
      implications.push(`Add Gen2 TypeScript dependencies to ${this.packageJsonPath}`);
    } else {
      implications.push(`Create ${this.packageJsonPath} with Gen2 TypeScript dependencies`);
    }

    if (await this.packageLockExists()) {
      implications.push(`Regenerate ${this.packageLockPath}`);
    } else {
      implications.push(`Create ${this.packageLockPath}`);
    }

    if (await this.nodeModulesExists()) {
      implications.push(`Recreate ${this.nodeModulesPath}`);
    } else {
      implications.push(`Create ${this.nodeModulesPath}`);
    }

    implications.push(`Replace your local 'amplify' folder with corresponding Gen2 TypeScript definition files`);
    implications.push(`Install Gen2 dependencies`);

    return implications;
  }

  public async validate(): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const validations = new AmplifyGen2MigrationValidations(this.logger, this.rootStackName, this.currentEnvName, this.context);
    await validations.validateLockStatus();
    await validations.validateWorkingDirectory();
  }

  public async operations(): Promise<AmplifyMigrationOperation[]> {
    return [
      {
        describe: async () => {
          return this.implications();
        },
        execute: async () => {
          await this.execute();
        },
        rollback: async () => {
          await this.rollback();
        },
      },
    ];
  }

  private async execute(): Promise<void> {
    await prepare(this.logger, this.appId, this.currentEnvName, this.region);
  }

  private async rollback(): Promise<void> {
    // Rollback logic can be added here if needed
  }
}
