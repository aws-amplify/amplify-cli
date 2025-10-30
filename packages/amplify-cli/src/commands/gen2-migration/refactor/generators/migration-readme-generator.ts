import fs from 'node:fs/promises';
import { CATEGORY } from '../types';

interface MigrationReadMeGeneratorOptions {
  path: string;
  categories: CATEGORY[];
  hasOAuthEnabled: boolean;
}

class MigrationReadmeGenerator {
  private readonly path: string;
  private readonly migrationReadMePath: string;
  private readonly categories: CATEGORY[];
  private readonly hasOAuthEnabled: boolean;

  constructor({ path, categories, hasOAuthEnabled }: MigrationReadMeGeneratorOptions) {
    this.path = path;
    this.migrationReadMePath = `${this.path}/MIGRATION_README.md`;
    this.categories = categories;
    this.hasOAuthEnabled = hasOAuthEnabled;
  }

  async initialize(): Promise<void> {
    await fs.writeFile(this.migrationReadMePath, ``, { encoding: 'utf8' });
  }

  async renderStep1() {
    const s3BucketChanges = `\`\`\`
s3Bucket.bucketName = YOUR_GEN1_BUCKET_NAME;
\`\`\``;
    const userPoolDomainRemoval = `\`\`\`
backend.auth.resources.userPool.node.tryRemoveChild('UserPoolDomain');
\`\`\``;
    const gen2Tag = `\`\`\`
Tags.of(backend.stack).add("gen1-migrated-app", "true");
\`\`\``;
    await fs.appendFile(
      this.migrationReadMePath,
      `## REDEPLOY GEN2 APPLICATION
1.a) Uncomment the following lines in \`amplify/backend.ts\` file:
${this.categories.includes('storage') ? s3BucketChanges : ''}
${this.hasOAuthEnabled ? userPoolDomainRemoval : ''}
${gen2Tag}

1.b) Trigger a CI/CD build via hosting by committing \`amplify/backend.ts\` file to your Git repository`,
    );
  }
}

export default MigrationReadmeGenerator;
