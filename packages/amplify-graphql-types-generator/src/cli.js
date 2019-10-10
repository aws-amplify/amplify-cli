#!/usr/bin/env node

import * as glob from 'glob';
import * as process from 'process';
import * as path from 'path';
import * as yargs from 'yargs';

import { downloadSchema, introspectSchema, printSchema, generate } from '.';
import { ToolError, logError } from './errors';

import 'source-map-support/register';

// Make sure unhandled errors in async code are propagated correctly
process.on('unhandledRejection', error => {
  throw error;
});

process.on('uncaughtException', handleError);

function handleError(error) {
  logError(error);
  process.exit(1);
}

yargs
  .command(
    '$0 [input..]',
    'Generate code from a GraphQL schema and query documents',
    {
      schema: {
        demand: true,
        describe: 'Path to GraphQL schema file. (Defaults to using .graphqlconfig or schema.json)',
        normalize: true,
        coerce: path.resolve,
      },
      output: {
        describe: 'Output directory for the generated files',
        normalize: true,
        coerce: path.resolve,
      },
      target: {
        demand: false,
        describe: 'Code generation target language',
        choices: ['swift', 'scala', 'json', 'ts', 'typescript', 'flow', 'flow-modern', 'angular'],
        default: 'angular',
      },
      only: {
        describe: 'Parse all input files, but only output generated code for the specified file [Swift only]',
        normalize: true,
        coerce: path.resolve,
      },
      namespace: {
        demand: false,
        describe: 'Optional namespace for generated types [currently Swift and Scala-only]',
        type: 'string',
      },
      'passthrough-custom-scalars': {
        demand: false,
        describe: "Don't attempt to map custom scalars [temporary option]",
        default: false,
      },
      'custom-scalars-prefix': {
        demand: false,
        describe: 'Prefix for custom scalars. (Implies that passthrough-custom-scalars is true if set)',
        default: '',
        normalize: true,
      },
      'add-typename': {
        demand: false,
        describe: 'For non-swift targets, always add the __typename GraphQL introspection type when generating target types',
        default: false,
      },
      'use-flow-exact-objects': {
        demand: false,
        describe: 'Use Flow exact objects for generated types [flow-modern only]',
        default: false,
        type: 'boolean',
      },
      'tag-name': {
        demand: false,
        describe:
          'Name of the template literal tag used to identify template literals containing GraphQL queries in Javascript/Typescript code',
        default: 'gql',
      },
      'project-name': {
        demand: false,
        describe: 'Name of the project to use in a multi-project .graphqlconfig file',
      },
      'merge-in-fields-from-fragment-spreads': {
        demand: false,
        describe: 'Merge fragment fields onto its enclosing type',
        default: true,
        type: 'boolean',
      },
      'complex-object-support': {
        demand: false,
        describe: 'Adds S3 wrapper code to the output. [Swift only]',
        default: 'auto',
        choices: ['yes', 'no', 'auto'],
      },
    },
    argv => {
      let { input } = argv;

      // Use glob if the user's shell was unable to expand the pattern
      if (input.length === 1 && glob.hasMagic(input[0])) {
        input = glob.sync(input[0]);
      }

      const inputPaths = input
        .map(input => path.resolve(input))
        // Sort to normalize different glob expansions between different terminals.
        .sort();

      const options = {
        passthroughCustomScalars: argv['passthrough-custom-scalars'] || argv['custom-scalars-prefix'] !== '',
        customScalarsPrefix: argv['custom-scalars-prefix'] || '',
        addTypename: argv['add-typename'],
        namespace: argv.namespace,
        mergeInFieldsFromFragmentSpreads: argv['merge-in-fields-from-fragment-spreads'],
        useFlowExactObjects: argv['use-flow-exact-objects'],
        complexObjectSupport: argv['complex-object-support'],
      };

      generate(inputPaths, argv.schema, argv.output, argv.only, argv.target, argv.tagName, options);
    }
  )
  .fail(function(message, error) {
    handleError(error ? error : new ToolError(message));
  })
  .help()
  .version()
  .strict().argv;
