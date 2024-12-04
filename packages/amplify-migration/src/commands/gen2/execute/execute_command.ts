import { ArgumentsCamelCase, Argv, CommandModule } from 'yargs';
import { executeStackRefactor } from '../../../command-handlers';
import assert from 'node:assert';

export interface ExecuteCommandOptions {
  from: string | undefined;
  to: string | undefined;
}

/**
 * Command that executes stack refactor operation needed for Gen2 migration.
 */
export class Gen2ExecuteCommand implements CommandModule<object, ExecuteCommandOptions> {
  /**
   * @inheritDoc
   */
  readonly command: string;

  /**
   * @inheritDoc
   */
  readonly describe: string;

  constructor() {
    this.command = 'execute';
    this.describe = 'Moves Amplify Gen1 resources from a Gen1 stack into a Gen2 stack';
  }

  builder = (yargs: Argv): Argv<ExecuteCommandOptions> => {
    return yargs
      .version(false)
      .option('from', {
        describe: 'Gen1 Amplify stack',
        type: 'string',
        demandOption: true,
      })
      .option('to', {
        describe: 'Gen2 Amplify stack',
        type: 'string',
        demandOption: true,
      });
  };
  handler = async (args: ArgumentsCamelCase<ExecuteCommandOptions>): Promise<void> => {
    const { from, to } = args;
    assert(from);
    assert(to);
    await executeStackRefactor(from, to);
  };
}
