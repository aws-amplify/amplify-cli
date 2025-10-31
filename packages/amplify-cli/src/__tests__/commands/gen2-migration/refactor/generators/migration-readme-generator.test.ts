import MigrationReadMeGenerator from '../../../../../commands/gen2-migration/refactor/generators/migration-readme-generator';

import fs from 'node:fs/promises';

jest.mock('node:fs/promises');

describe('MigrationReadMeGenerator', () => {
  const PATH = 'test';
  const migrationReadMeGenerator = new MigrationReadMeGenerator({
    path: PATH,
    categories: ['auth', 'storage'],
    hasOAuthEnabled: false,
  });
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize migration readme', async () => {
    await migrationReadMeGenerator.initialize();
    expect(fs.writeFile).toHaveBeenCalledWith('test/MIGRATION_README.md', '', {
      encoding: 'utf8',
    });
  });

  it('should render step1 without oauth related information', async () => {
    await migrationReadMeGenerator.renderStep1();
    expect(fs.appendFile).toHaveBeenCalledWith(
      'test/MIGRATION_README.md',
      `## REDEPLOY GEN2 APPLICATION
1.a) Uncomment the following lines in \`amplify/backend.ts\` file:
\`\`\`
s3Bucket.bucketName = YOUR_GEN1_BUCKET_NAME;
\`\`\`

\`\`\`
Tags.of(backend.stack).add("gen1-migrated-app", "true");
\`\`\`

1.b) Trigger a CI/CD build via hosting by committing \`amplify/backend.ts\` file to your Git repository`,
    );
  });

  it('should render step1 without storage', async () => {
    const PATH = 'test';
    const migrationReadMeGenerator = new MigrationReadMeGenerator({
      path: PATH,
      categories: ['auth'],
      hasOAuthEnabled: true,
    });
    await migrationReadMeGenerator.renderStep1();
    expect(fs.appendFile).toHaveBeenCalledWith(
      'test/MIGRATION_README.md',
      `## REDEPLOY GEN2 APPLICATION
1.a) Uncomment the following lines in \`amplify/backend.ts\` file:

\`\`\`
backend.auth.resources.userPool.node.tryRemoveChild('UserPoolDomain');
\`\`\`
\`\`\`
Tags.of(backend.stack).add("gen1-migrated-app", "true");
\`\`\`

1.b) Trigger a CI/CD build via hosting by committing \`amplify/backend.ts\` file to your Git repository`,
    );
  });
});
