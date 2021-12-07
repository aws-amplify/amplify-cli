import { $TSContext } from 'amplify-cli-core';
import path from 'path';

export async function run(context: $TSContext) {
  context.print.info(require(path.join(__dirname, '..', '..', 'package.json')).version);
}
