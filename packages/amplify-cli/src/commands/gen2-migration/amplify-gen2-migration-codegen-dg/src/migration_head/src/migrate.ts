#!/usr/bin/env node
import { generateCommandFailureHandler } from './error_handler.js';
import { createMainParser } from './main_parser_factory.js';
import { hideBin } from 'yargs/helpers';
import { version } from '../../../../../../../package.json';

const libraryVersion = version;
const parser = createMainParser(libraryVersion);
const errorHandler = generateCommandFailureHandler(parser);
parser.parseAsync(hideBin(process.argv)).catch(async (e) => {
  if (e instanceof Error) {
    await errorHandler(e.message, e, isDebugFlagEnabled());
  }
});

const isDebugFlagEnabled = (): boolean => process.argv.includes('--debug');
