import { ArgumentsCamelCase, Argv, CommandModule } from 'yargs';
import fs from 'node:fs/promises';
import { executeStackRefactor } from '../../../command-handlers';
import assert from 'node:assert';
import { ResourceMapping } from '@aws-amplify/migrate-template-gen';

export interface ExecuteCommandOptions {
  from: string | undefined;
  to: string | undefined;
  resourceMappings: string | undefined;
}

const FILE_PROTOCOL_PREFIX = 'file://';

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
      .option('resourceMappings', {
        describe: `Path to the resource mappings JSON file. E.g file://complete/path/to/file. The JSON is an array of resource mappings
        where each mapping consists of a Source object and Destination object with each of them containing the StackName and LogicalResourceId
        of the resource to move. E.g:
        [{
          "Source": {
            "StackName": "myStackA",
            "LogicalResourceId": "myLogicalIdA"
          },
          "Destination": {
            "StackName": "myStackB",
            "LogicalResourceId": "myLogicalIdB"
          }
        }]`,
        type: 'string',
        demandOption: false,
      });
  };
  handler = async (args: ArgumentsCamelCase<ExecuteCommandOptions>): Promise<void> => {
    const { from, to, resourceMappings } = args;
    assert(from);
    assert(to);

    let parsedResourceMappings: ResourceMapping[] | undefined = undefined;

    if (resourceMappings) {
      if (!resourceMappings.startsWith(FILE_PROTOCOL_PREFIX)) {
        throw new Error(`Expected resourceMappings to start with ${FILE_PROTOCOL_PREFIX}`);
      }
      const resourceMapPath = resourceMappings.split(FILE_PROTOCOL_PREFIX)[1];
      if (!resourceMapPath) {
        throw new Error(`Expected resourceMappings to have a path after ${FILE_PROTOCOL_PREFIX}`);
      }
      const resourceMappingsFromFile = await fs.readFile(resourceMapPath, { encoding: 'utf-8' });
      try {
        parsedResourceMappings = JSON.parse(resourceMappingsFromFile);
      } catch (error) {
        throw new Error(`Failed to parse resourceMappings from ${resourceMapPath}: ${error.message}`);
      }
      if (!Array.isArray(parsedResourceMappings) || !parsedResourceMappings.every(this.isResourceMappingValid)) {
        throw new Error('Invalid resourceMappings structure');
      }
    }
    await executeStackRefactor(from, to, parsedResourceMappings);
  };

  isResourceMappingValid = (resourceMapping: unknown): resourceMapping is ResourceMapping => {
    return (
      typeof resourceMapping === 'object' &&
      resourceMapping !== null &&
      'Destination' in resourceMapping &&
      typeof resourceMapping.Destination === 'object' &&
      resourceMapping.Destination !== null &&
      'StackName' in resourceMapping.Destination &&
      typeof resourceMapping.Destination.StackName === 'string' &&
      'LogicalResourceId' in resourceMapping.Destination &&
      typeof resourceMapping.Destination.LogicalResourceId === 'string' &&
      'Source' in resourceMapping &&
      typeof resourceMapping.Source === 'object' &&
      resourceMapping.Source !== null &&
      'StackName' in resourceMapping.Source &&
      typeof resourceMapping.Source.StackName === 'string' &&
      'LogicalResourceId' in resourceMapping.Source &&
      typeof resourceMapping.Source.LogicalResourceId === 'string'
    );
  };
}
