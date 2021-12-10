import { $TSContext } from 'amplify-cli-core';
import path from 'path';

export async function run(context: $TSContext) {
  printer.info((await import(path.join(__dirname, '..', '..', 'package.json'))).version);
}
