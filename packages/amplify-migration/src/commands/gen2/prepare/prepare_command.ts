import { Argv, CommandModule } from 'yargs';
import { prepare } from '../../../command-handlers';

export type Gen2PrepareCommandOptions = Record<string, never>;

/**
 * Command that prepares for Gen2 migration.
 */
export class Gen2PrepareCommand implements CommandModule<object, Gen2PrepareCommandOptions> {
  /**
   * @inheritDoc
   */
  readonly command: string;

  /**
   * @inheritDoc
   */
  readonly describe: string;

  constructor() {
    this.command = 'prepare';
    this.describe = 'Generates Amplify Gen2 code based on Gen1 configuration';
  }

  builder = (yargs: Argv): Argv => {
    return yargs.version(false);
  };
  handler = async (): Promise<void> => {
    await prepare();
  };
}
