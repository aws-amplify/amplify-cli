import { Argv, CommandModule } from 'yargs';
import { execute } from '../../../';

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
    this.command = 'start';
    this.describe = 'Starts Amplify Gen2 code generation';
  }

  builder = (yargs: Argv): Argv => {
    return yargs.version(false);
  };
  handler = async (): Promise<void> => {
    await execute();
  };
}
