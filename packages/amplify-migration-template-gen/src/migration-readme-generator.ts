import fs from 'node:fs/promises';
import { CATEGORY, CFNTemplate, ResourceMapping } from './types';
import extractStackNameFromId from './cfn-stack-name-extractor';

interface MigrationReadMeGeneratorOptions {
  path: string;
  category: CATEGORY;
  gen1CategoryStackId: string;
  gen2CategoryStackId: string;
}

class MigrationReadmeGenerator {
  private readonly path: string;
  private readonly category: CATEGORY;
  private readonly gen1CategoryStackName: string;
  private readonly gen2CategoryStackName: string;
  private readonly migrationReadMePath: string;

  constructor({ path, category, gen1CategoryStackId, gen2CategoryStackId }: MigrationReadMeGeneratorOptions) {
    this.path = path;
    this.category = category;
    this.gen1CategoryStackName = extractStackNameFromId(gen1CategoryStackId);
    this.gen2CategoryStackName = extractStackNameFromId(gen2CategoryStackId);
    this.migrationReadMePath = `${this.path}/MIGRATION_README.md`;
  }

  async initialize(): Promise<void> {
    await fs.writeFile(this.migrationReadMePath, `## Stack refactor steps for ${this.category} category\n`, { encoding: 'utf8' });
  }

  /**
   * Creates and executes Stack refactor operation for the given category
   * @param sourceTemplate
   * @param destinationTemplate
   * @param logicalIdMapping
   * @param oldSourceTemplate
   * @param oldDestinationTemplate
   */
  async renderStep1(
    sourceTemplate: CFNTemplate,
    destinationTemplate: CFNTemplate,
    logicalIdMapping: Map<string, string>,
    oldSourceTemplate: CFNTemplate,
    oldDestinationTemplate: CFNTemplate,
  ): Promise<void> {
    const sourceTemplateFileName = 'step3-sourceTemplate.json';
    const destinationTemplateFileName = 'step3-destinationTemplate.json';
    const rollbackSourceTemplateFileName = 'step3-sourceTemplate-rollback.json';
    const rollbackDestinationTemplateFileName = 'step3-destinationTemplate-rollback.json';

    const step1SourceTemplateFileNamePath = `${this.path}/${sourceTemplateFileName}`;
    const step1DestinationTemplateFileNamePath = `${this.path}/${destinationTemplateFileName}`;
    const step1RollbackSourceTemplateFileNamePath = `${this.path}/${rollbackSourceTemplateFileName}`;
    const step1RollbackDestinationTemplateFileNamePath = `${this.path}/${rollbackDestinationTemplateFileName}`;

    const resourceMappings: ResourceMapping[] = [];
    const rollbackResourceMappings: ResourceMapping[] = [];
    for (const [gen1LogicalId, gen2LogicalId] of logicalIdMapping) {
      resourceMappings.push({
        Source: {
          StackName: this.gen1CategoryStackName,
          LogicalResourceId: gen1LogicalId,
        },
        Destination: {
          StackName: this.gen2CategoryStackName,
          LogicalResourceId: gen2LogicalId,
        },
      });
      rollbackResourceMappings.push({
        Source: {
          StackName: this.gen2CategoryStackName,
          LogicalResourceId: gen2LogicalId,
        },
        Destination: {
          StackName: this.gen1CategoryStackName,
          LogicalResourceId: gen1LogicalId,
        },
      });
    }
    await fs.appendFile(
      this.migrationReadMePath,
      `### STEP 1: CREATE AND EXECUTE CLOUDFORMATION STACK REFACTOR FOR ${this.category} CATEGORY
This step will move the Gen1 ${this.category} resources to Gen2 stack.

1.a) Create stack refactor
\`\`\`
aws cloudformation create-stack-refactor \
 --stack-definitions StackName=${this.gen1CategoryStackName},TemplateBody@=file://${step1SourceTemplateFileNamePath} \
 StackName=${this.gen2CategoryStackName},TemplateBody@=file://${step1DestinationTemplateFileNamePath} \
 --resource-mappings \
 '${JSON.stringify(resourceMappings)}'
\`\`\`
 
\`\`\`
export STACK_REFACTOR_ID=<<REFACTOR-ID-FROM-CREATE-STACK-REFACTOR_CALL>>
\`\`\`
  
1.b) Describe stack refactor to check for creation status
\`\`\`
 aws cloudformation describe-stack-refactor --stack-refactor-id $STACK_REFACTOR_ID
\`\`\`
 
1.c) Execute stack refactor
\`\`\`
 aws cloudformation execute-stack-refactor --stack-refactor-id $STACK_REFACTOR_ID
\`\`\`
 
1.d) Describe stack refactor to check for execution status
\`\`\`
 aws cloudformation describe-stack-refactor --stack-refactor-id $STACK_REFACTOR_ID
\`\`\`

#### Rollback step for refactor:
\`\`\`
 aws cloudformation create-stack-refactor \
 --stack-definitions StackName=${this.gen1CategoryStackName},TemplateBody@=file://${step1RollbackSourceTemplateFileNamePath} \
 StackName=${this.gen2CategoryStackName},TemplateBody@=file://${step1RollbackDestinationTemplateFileNamePath} \
 --resource-mappings \
 '${JSON.stringify(rollbackResourceMappings)}'
\`\`\`

\`\`\`
export STACK_REFACTOR_ID=<<REFACTOR-ID-FROM-CREATE-STACK-REFACTOR_CALL>>
\`\`\`

Describe stack refactor to check for creation status
\`\`\`
 aws cloudformation describe-stack-refactor --stack-refactor-id $STACK_REFACTOR_ID
\`\`\`

Execute stack refactor
\`\`\`
 aws cloudformation execute-stack-refactor --stack-refactor-id $STACK_REFACTOR_ID
\`\`\`

Describe stack refactor to check for execution status
\`\`\`
 aws cloudformation describe-stack-refactor --stack-refactor-id $STACK_REFACTOR_ID
\`\`\`
 `,
      { encoding: 'utf8' },
    );
    await fs.writeFile(step1SourceTemplateFileNamePath, JSON.stringify(sourceTemplate, null, 2), { encoding: 'utf8' });
    await fs.writeFile(step1DestinationTemplateFileNamePath, JSON.stringify(destinationTemplate, null, 2), { encoding: 'utf8' });
    await fs.writeFile(step1RollbackSourceTemplateFileNamePath, JSON.stringify(oldSourceTemplate, null, 2), { encoding: 'utf8' });
    await fs.writeFile(step1RollbackDestinationTemplateFileNamePath, JSON.stringify(oldDestinationTemplate, null, 2), { encoding: 'utf8' });
  }

  async renderStep2() {
    await fs.appendFile(
      this.migrationReadMePath,
      `### STEP 2: REDEPLOY GEN2 APPLICATION
This step will remove the hardcoded references from the template and replace them with resource references (where applicable).

2.a) Only applicable to Storage category: Uncomment the following line in \`amplify/backend.ts\` file to instruct CDK to use the gen1 S3 bucket
\`\`\`
s3Bucket.bucketName = YOUR_GEN1_BUCKET_NAME;
\`\`\`

2.b) Deploy sandbox using the below command or trigger a CI/CD build via hosting by committing this file to your Git repository
\`\`\`
npx ampx sandbox
\`\`\`
`,
    );
  }
}

export default MigrationReadmeGenerator;
