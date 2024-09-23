import { Argv, CommandModule } from 'yargs';
// import { execute, generateTemplates } from '../../../';

export type Gen2GenerateTemplatesCommandOptions = Record<string, never>;

/**
 * Command that generates CloudFormation templates needed for stack refactor operation to move resources from Gen1 to Gen2.
 */
export class Gen2GenerateTemplatesCommand implements CommandModule<object, Gen2GenerateTemplatesCommandOptions> {
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
    this.describe = 'Generates stack refactor inputs (CFN templates) to move Gen1 resources to Gen2 applications.';
  }

  builder = (yargs: Argv): Argv => {
    return yargs.version(false);
  };
  handler = async (): Promise<void> => {
    // await generateTemplates();
  };
}
