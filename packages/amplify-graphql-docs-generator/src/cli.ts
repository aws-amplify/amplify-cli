import * as yargs from 'yargs';
import * as path from 'path';

import { logError } from './logger';
import { generate } from './index';

// / Make sure unhandled errors in async code are propagated correctly
process.on('unhandledRejection', error => {
  throw error;
});

process.on('uncaughtException', handleError);

function handleError(error: Error) {
  logError(error);
  process.exit(1);
}

export function run(argv: Array<String>): void {
  // tslint:disable
  yargs
    .command(
      '$0',
      'Generate graphql operations for the provided introspection schema',
      {
        schema: {
          demand: true,
          describe: 'Path introspection schema',
          default: 'schema.json',
          normalize: true,
          coerce: path.resolve,
        },
        output: {
          demand: true,
          default: 'all-operations.graphql',
          normalize: true,
          coerce: path.resolve,
        },
        language: {
          demand: true,
          default: 'graphql',
          normalize: true,
          choices: ['graphql', 'javascript', 'flow', 'typescript'],
        },
        maxDepth: {
          demand: true,
          default: 2,
          normalize: true,
          type: 'number',
        },
        separateFiles: {
          default: false,
          type: 'boolean',
        },
      },
      async argv => {
        generate(argv.schema, argv.output, { separateFiles: argv.separateFiles, language: argv.language, maxDepth: argv.maxDepth });
      }
    )
    .help()
    .version()
    .strict().argv;
}
