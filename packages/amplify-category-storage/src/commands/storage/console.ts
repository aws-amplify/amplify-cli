import { printer } from 'amplify-prompts';
import { categoryName } from '../../constants';

export const name = 'console'; // subcommand

export async function run() {
  printer.info(`to be implemented: ${categoryName} ${name}`);
}
