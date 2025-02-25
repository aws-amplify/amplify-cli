import { ArgumentsCamelCase, Argv, CommandModule } from 'yargs';
import { revertGen2Migration } from '../../../command-handlers';
import assert from 'node:assert';

export interface RevertCommandOptions {
  from: string | undefined;
  to: string | undefined;
}

/**
 * Command that executes stack refactor operation needed to move back resources to Gen1 stack.
 */
export class Gen2RevertCommand implements CommandModule<object, RevertCommandOptions> {
  /**
   * @inheritDoc
   */
  readonly command: string;

  /**
   * @inheritDoc
   */
  readonly describe: string;

  constructor() {
    this.command = 'revert';
    this.describe = 'Moves Amplify Gen2 resources from a Gen2 stack into a Gen1 stack';
  }

  builder = (yargs: Argv): Argv<RevertCommandOptions> => {
    return yargs
      .version(false)
      .option('from', {
        describe: 'Gen2 Amplify stack',
        type: 'string',
        demandOption: true,
      })
      .option('to', {
        describe: 'Gen1 Amplify stack',
        type: 'string',
        demandOption: true,
      });
  };
  handler = async (args: ArgumentsCamelCase<RevertCommandOptions>): Promise<void> => {
    const { from, to } = args;
    assert(from);
    assert(to);
    await revertGen2Migration(from, to);
  };
}
