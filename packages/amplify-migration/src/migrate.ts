#!/usr/bin/env node
import fs from 'fs';
import { generateCommandFailureHandler } from './error_handler.js';
import { createMainParser } from './main_parser_factory.js';
import { hideBin } from 'yargs/helpers';

const packageJson = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf-8'));
const libraryVersion = packageJson.version;

const parser = createMainParser(libraryVersion);
const errorHandler = generateCommandFailureHandler(parser);
parser.parseAsync(hideBin(process.argv)).catch(async (e) => {
  if (e instanceof Error) {
    await errorHandler(e.message, e);
  }
});
