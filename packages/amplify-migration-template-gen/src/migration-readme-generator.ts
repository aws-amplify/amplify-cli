import fs from 'node:fs/promises';
import { CATEGORY } from './types';

interface MigrationReadMeGeneratorOptions {
  path: string;
  categories: CATEGORY[];
}

class MigrationReadmeGenerator {
  private readonly path: string;
  private readonly migrationReadMePath: string;
  private readonly categories: CATEGORY[];

  constructor({ path, categories }: MigrationReadMeGeneratorOptions) {
    this.path = path;
    this.migrationReadMePath = `${this.path}/MIGRATION_README.md`;
    this.categories = categories;
  }

  async initialize(): Promise<void> {
    await fs.writeFile(this.migrationReadMePath, ``, { encoding: 'utf8' });
  }

  async renderStep1() {
    const s3BucketChanges = `\`\`\`
s3Bucket.bucketName = YOUR_GEN1_BUCKET_NAME;
\`\`\`
`;
    await fs.appendFile(
      this.migrationReadMePath,
      `## REDEPLOY GEN2 APPLICATION
1.a) Uncomment the following lines in \`amplify/backend.ts\` file
${this.categories.includes('storage') ? s3BucketChanges : ''}
${
  this.categories.includes('auth')
    ? `\`\`\`
backend.auth.resources.userPool.node.tryRemoveChild('UserPoolDomain');
\`\`\``
    : ''
}

\`\`\`
Tags.of(backend.stack).add("gen1-migrated-app", "true");
\`\`\`

1.b) Deploy sandbox using the below command or trigger a CI/CD build via hosting by committing this file to your Git repository
\`\`\`
npx ampx sandbox
\`\`\`
`,
    );
  }
}

export default MigrationReadmeGenerator;
