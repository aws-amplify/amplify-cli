import { Argv, CommandModule } from 'yargs';
import { execute } from '../../../command-handlers';

export type Gen2StartCommandOptions = Record<string, never>;

/**
 * Command that starts Gen2 migration.
 */
export class Gen2StartCommand implements CommandModule<object, Gen2StartCommandOptions> {
  /**
   * @inheritDoc
   */
  readonly command: string;

  /**
   * @inheritDoc
   */
  readonly describe: string;

  constructor() {
    this.command = 'generate-code';
    this.describe = 'Generates Amplify Gen2 code based on Gen1 configuration';
  }

  builder = (yargs: Argv): Argv => {
    return yargs.version(false);
  };
  handler = async (): Promise<void> => {
    await execute();
  };
}
