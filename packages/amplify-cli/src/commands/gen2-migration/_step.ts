import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { Argv, CommandModule } from 'yargs';

export abstract class AmplifyMigrationStep implements CommandModule {
  abstract readonly command: string;
  abstract readonly describe: string;

  constructor(private readonly context: $TSContext) {}

  public abstract validate(): Promise<void>;

  public abstract execute(): Promise<void>;

  public abstract rollback(): Promise<void>;

  builder = (yargs: Argv): Argv => {
    return yargs.version(false);
  };

  handler = async (): Promise<void> => {
    await this.validate();
    await this.execute();
  };
}
