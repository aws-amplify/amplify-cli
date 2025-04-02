import MigrationReadMeGenerator from './migration-readme-generator';
import fs from 'node:fs/promises';

jest.mock('node:fs/promises');

describe('MigrationReadMeGenerator', () => {
  const PATH = 'test';
  const migrationReadMeGenerator = new MigrationReadMeGenerator({
    path: PATH,
    categories: ['auth', 'storage'],
  });

  it('should initialize migration readme', async () => {
    await migrationReadMeGenerator.initialize();
    expect(fs.writeFile).toHaveBeenCalledWith('test/MIGRATION_README.md', '', {
      encoding: 'utf8',
    });
  });

  it('should render step1', async () => {
    await migrationReadMeGenerator.renderStep1();
    expect(fs.appendFile).toHaveBeenCalledWith(
      'test/MIGRATION_README.md',
      `## REDEPLOY GEN2 APPLICATION
1.a) Uncomment the following lines in \`amplify/backend.ts\` file
\`\`\`
s3Bucket.bucketName = YOUR_GEN1_BUCKET_NAME;
\`\`\`

\`\`\`
backend.auth.resources.userPool.node.tryRemoveChild('UserPoolDomain');
\`\`\`

\`\`\`
Tags.of(backend.stack).add("gen1-migrated-app", "true");
\`\`\`

1.b) Deploy sandbox using the below command or trigger a CI/CD build via hosting by committing this file to your Git repository
\`\`\`
npx ampx sandbox
\`\`\`
`,
    );
  });

  it('should render step1 without storage', async () => {
    const PATH = 'test';
    const migrationReadMeGenerator = new MigrationReadMeGenerator({
      path: PATH,
      categories: ['auth'],
    });
    await migrationReadMeGenerator.renderStep1();
    expect(fs.appendFile).toHaveBeenCalledWith(
      'test/MIGRATION_README.md',
      `## REDEPLOY GEN2 APPLICATION
1.a) Uncomment the following lines in \`amplify/backend.ts\` file

\`\`\`
backend.auth.resources.userPool.node.tryRemoveChild('UserPoolDomain');
\`\`\`

\`\`\`
Tags.of(backend.stack).add("gen1-migrated-app", "true");
\`\`\`

1.b) Deploy sandbox using the below command or trigger a CI/CD build via hosting by committing this file to your Git repository
\`\`\`
npx ampx sandbox
\`\`\`
`,
    );
  });
});
