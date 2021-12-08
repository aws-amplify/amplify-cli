import chalk from 'chalk';
import { EOL } from 'os';

export function getMigrateResourceMessageForOverride(categoryName: string, resourceName: string, isUpdate = true) {
  const docsLink = 'https://docs.amplify.aws/cli/migration/override';

  if (isUpdate) {
    return [
      '',
      `A migration is needed to support latest updates on ${categoryName} resources.`,
      chalk.red(`Recommended to try in a non-production environment first. Run "amplify env add" to create or clone an environment.`),
      chalk.red(
        `Custom cloudformation changes will NOT be preserved. Custom changes can be made with "amplify ${categoryName} override" after migration.`,
      ),
      `Learn more about this migration: ${docsLink}`,
      `Do you want to migrate ${categoryName} resource "${resourceName}"?`,
    ].join(EOL);
  }

  return [
    '',
    `A migration is needed to override ${categoryName} resources.`,
    chalk.red(`Recommended to try in a non-production environment first. Run "amplify env add" to create or clone an environment.`),
    `Learn more about this migration: ${docsLink}`,
    `Do you want to migrate ${categoryName} resource "${resourceName}" to support overrides?`,
  ].join(EOL);
}
