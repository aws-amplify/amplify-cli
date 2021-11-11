import chalk from 'chalk';
import { EOL } from 'os';

export function getMigrateResourceMessageForOverride(categoryName: string, resourceName: string) {
  const docsLink = 'https://docs.amplify.aws/cli/migration/overrides';
  return [
    `Do you want to migrate ${categoryName} resource "${resourceName}" to support overrides?`,
    chalk.red(`Recommended to try in a non-production environment first. Run "amplify env add" to create or clone an environment.`),
    `Learn more about this migration: ${docsLink}`,
  ].join(EOL);
}
