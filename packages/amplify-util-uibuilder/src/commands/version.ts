import { printer } from 'amplify-prompts';
import path from 'path';

export async function run() {
  printer.info((await import(path.join(__dirname, '..', '..', 'package.json'))).version);
}
