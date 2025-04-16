import { ArgumentsCamelCase, Argv, CommandModule } from 'yargs';
import { promises as fs } from 'fs';
import { executeStackRefactor } from '../../../command-handlers';
import assert from 'node:assert';
import { ResourceMapping } from '@aws-amplify/migrate-template-gen';

export interface ExecuteCommandOptions {
  from: string | undefined;
  to: string | undefined;
  customResourceMap: string | undefined; // New argument
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
      })
      .option('customResourceMap', {
        describe: 'Path to the custom category resource map JSON file',
        type: 'string',
        demandOption: false,
      });
  };
  handler = async (args: ArgumentsCamelCase<ExecuteCommandOptions>): Promise<void> => {
    const { from, to, customResourceMap } = args;
    assert(from);
    assert(to);

    let parsedcustomResourceMap: ResourceMapping[] | undefined = undefined;

    if (customResourceMap) {
      try {
        const fileContent = await fs.readFile(customResourceMap, { encoding: 'utf-8' });
        parsedcustomResourceMap = JSON.parse(fileContent) as ResourceMapping[];
      } catch (error) {
        throw new Error(`Failed to load customResourceMap from ${customResourceMap}: ${error.message}`);
      }
    }

    await executeStackRefactor(from, to, parsedcustomResourceMap);
  };
}
