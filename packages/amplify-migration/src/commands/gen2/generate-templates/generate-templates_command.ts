import { Arguments, ArgumentsCamelCase, Argv, CommandModule } from 'yargs';
import { generateTemplates } from '../../../';

interface GenerateTemplatesCommandOptions extends Arguments {
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
      })
      .option('to', {
        describe: 'Gen2 Amplify stack',
        type: 'string',
      });
  };
  handler = async (args: GenerateTemplatesCommandOptions): Promise<void> => {
    const { from, to } = args;
    if (!from || !to) {
      throw new Error('Invalid from and/or to stack names');
    }
    await generateTemplates(from, to);
  };
}
