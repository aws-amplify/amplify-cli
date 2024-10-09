import { ArgumentsCamelCase, Argv, CommandModule } from 'yargs';
import { generateTemplates } from '../../../';
import assert from 'node:assert';

export interface GenerateTemplatesCommandOptions {
  from: string | undefined;
  to: string | undefined;
}

/**
 * Command that generates templates needed for Gen2 migration.
 */
export class GenerateTemplatesCommand implements CommandModule<object, GenerateTemplatesCommandOptions> {
  /**
   * @inheritDoc
   */
  readonly command: string;

  /**
   * @inheritDoc
   */
  readonly describe: string;

  constructor() {
    this.command = 'generate-templates';
    this.describe = 'Generates stack refactor inputs (CFN templates)';
  }

  builder = (yargs: Argv): Argv<GenerateTemplatesCommandOptions> => {
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
  handler = async (args: ArgumentsCamelCase<GenerateTemplatesCommandOptions>): Promise<void> => {
    const { from, to } = args;
    assert(from);
    assert(to);
    await generateTemplates(from, to);
  };
}
