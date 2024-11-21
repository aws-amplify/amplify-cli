import fs from 'node:fs/promises';
import { CATEGORY, CFNTemplate, ResourceMapping } from './types';
import { Parameter } from '@aws-sdk/client-cloudformation';
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

  //   /**
  //    * Resolves outputs and dependencies to prepare for refactor
  //    * @param oldGen1StackTemplate
  //    * @param newGen1StackTemplate
  //    * @param parameters
  //    */
  //   async renderStep1(oldGen1StackTemplate: CFNTemplate, newGen1StackTemplate: CFNTemplate, parameters: Parameter[]): Promise<void> {
  //     const step1FileNamePath = `${this.path}/step1-gen1PreProcessUpdateStackTemplate.json`;
  //     const step1RollbackFileNamePath = `${this.path}/step1-gen1PreProcessUpdateStackTemplate-rollback.json`;
  //     const paramsString = JSON.stringify(parameters);
  //     await fs.appendFile(
  //       this.migrationReadMePath,
  //       `### STEP 1: UPDATE GEN-1 ${this.category.toUpperCase()} STACK
  // It is a non-disruptive update since the template only replaces resource references with their resolved values. This is a required step to execute cloudformation stack refactor later.
  // \`\`\`
  // aws cloudformation update-stack \\
  //  --stack-name ${this.gen1CategoryStackName} \\
  //  --template-body file://${step1FileNamePath} \\
  //  --parameters '${paramsString}' \\
  //  --capabilities CAPABILITY_NAMED_IAM \\
  //  --tags '[]'
  //  \`\`\`
  //
  // \`\`\`
  // aws cloudformation describe-stacks \\
  //  --stack-name ${this.gen1CategoryStackName}
  //  \`\`\`
  //
  //  #### Rollback step:
  //  \`\`\`
  //  aws cloudformation update-stack \\
  //  --stack-name ${this.gen1CategoryStackName} \\
  //  --template-body file://${step1RollbackFileNamePath} \\
  //  --parameters '${paramsString}' \\
  //  --capabilities CAPABILITY_NAMED_IAM
  //  \`\`\`
  //
  // \`\`\`
  // aws cloudformation describe-stacks \\
  //  --stack-name ${this.gen1CategoryStackName}
  //  \`\`\`
  //  `,
  //       { encoding: 'utf8' },
  //     );
  //     await fs.writeFile(step1FileNamePath, JSON.stringify(newGen1StackTemplate, null, 2), { encoding: 'utf8' });
  //     await fs.writeFile(step1RollbackFileNamePath, JSON.stringify(oldGen1StackTemplate, null, 2), { encoding: 'utf8' });
  //   }
  //
  //   /**
  //    * Removes Gen2 resources from Gen2 stack to prepare for refactor
  //    * @param oldGen2StackTemplate
  //    * @param newGen2StackTemplate
  //    * @param parameters
  //    */
  //   async renderStep2(oldGen2StackTemplate: CFNTemplate, newGen2StackTemplate: CFNTemplate, parameters: Parameter[] = []): Promise<void> {
  //     const step2FileNamePath = `${this.path}/step2-gen2ResourcesRemovalStackTemplate.json`;
  //     const step2RollbackFileNamePath = `${this.path}/step2-gen2ResourcesRemovalStackTemplate-rollback.json`;
  //     const paramsString = JSON.stringify(parameters);
  //     await fs.appendFile(
  //       this.migrationReadMePath,
  //       `### STEP 2: REMOVE GEN-2 ${this.category.toUpperCase()} STACK RESOURCES
  // This step is required since we will eventually replace gen-2 resources with gen-1 resources as part of Step 3 (refactor).
  // \`\`\`
  // aws cloudformation update-stack \\
  //  --stack-name ${this.gen2CategoryStackName} \\
  //  --template-body file://${step2FileNamePath} \\
  //  --parameters '${paramsString}' \\
  //  --capabilities CAPABILITY_NAMED_IAM \\
  //  --tags '[]'
  //  \`\`\`
  //
  // \`\`\`
  // aws cloudformation describe-stacks \\
  //  --stack-name ${this.gen2CategoryStackName}
  //  \`\`\`
  //
  //  #### Rollback step:
  //  \`\`\`
  //  aws cloudformation update-stack \\
  //  --stack-name ${this.gen2CategoryStackName} \\
  //  --template-body file://${step2RollbackFileNamePath} \\
  //  --parameters '${paramsString}' \\
  //  --capabilities CAPABILITY_NAMED_IAM
  //  \`\`\`
  //
  // \`\`\`
  // aws cloudformation describe-stacks \\
  //  --stack-name ${this.gen2CategoryStackName}
  //  \`\`\`
  //  `,
  //       { encoding: 'utf8' },
  //     );
  //     await fs.writeFile(step2FileNamePath, JSON.stringify(newGen2StackTemplate, null, 2), { encoding: 'utf8' });
  //     await fs.writeFile(step2RollbackFileNamePath, JSON.stringify(oldGen2StackTemplate, null, 2), { encoding: 'utf8' });
  //   }

  /**
   * Creates and executes Stack refactor operation for the given category
   * @param sourceTemplate
   * @param destinationTemplate
   * @param logicalIdMapping
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

    const step3SourceTemplateFileNamePath = `${this.path}/${sourceTemplateFileName}`;
    const step3DestinationTemplateFileNamePath = `${this.path}/${destinationTemplateFileName}`;
    const step3RollbackSourceTemplateFileNamePath = `${this.path}/${rollbackSourceTemplateFileName}`;
    const step3RollbackDestinationTemplateFileNamePath = `${this.path}/${rollbackDestinationTemplateFileName}`;

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

1.a) Upload the source and destination templates to S3
\`\`\`
export BUCKET_NAME=<<YOUR_BUCKET_NAME>>
\`\`\`

\`\`\`
aws s3 cp ${step3SourceTemplateFileNamePath} s3://$BUCKET_NAME
\`\`\`

\`\`\`
aws s3 cp ${step3DestinationTemplateFileNamePath} s3://$BUCKET_NAME
\`\`\`

1.b) Create stack refactor
\`\`\`
aws cloudformation create-stack-refactor \
 --stack-definitions StackName=${this.gen1CategoryStackName},TemplateURL=s3://$BUCKET_NAME/${sourceTemplateFileName} \
 StackName=${this.gen2CategoryStackName},TemplateURL=s3://$BUCKET_NAME/${destinationTemplateFileName} \
 --resource-mappings \
 '${JSON.stringify(resourceMappings)}'
\`\`\`
 
\`\`\`
export STACK_REFACTOR_ID=<<REFACTOR-ID-FROM-CREATE-STACK-REFACTOR_CALL>>
\`\`\`
  
1.c) Describe stack refactor to check for creation status
\`\`\`
 aws cloudformation describe-stack-refactor --stack-refactor-id $STACK_REFACTOR_ID
\`\`\`
 
1.d) Execute stack refactor
\`\`\`
 aws cloudformation execute-stack-refactor --stack-refactor-id $STACK_REFACTOR_ID
\`\`\`
 
1.e) Describe stack refactor to check for execution status
\`\`\`
 aws cloudformation describe-stack-refactor --stack-refactor-id $STACK_REFACTOR_ID
\`\`\`

#### Rollback step for refactor:
\`\`\`
aws s3 cp ${step3RollbackSourceTemplateFileNamePath} s3://$BUCKET_NAME
\`\`\`

\`\`\`
aws s3 cp ${step3RollbackDestinationTemplateFileNamePath} s3://$BUCKET_NAME
\`\`\`

\`\`\`
 aws cloudformation create-stack-refactor \
 --stack-definitions StackName=${this.gen1CategoryStackName},TemplateURL=s3://$BUCKET_NAME/${rollbackSourceTemplateFileName} \
 StackName=${this.gen2CategoryStackName},TemplateURL=s3://$BUCKET_NAME/${rollbackDestinationTemplateFileName} \
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
    await fs.writeFile(step3SourceTemplateFileNamePath, JSON.stringify(sourceTemplate, null, 2), { encoding: 'utf8' });
    await fs.writeFile(step3DestinationTemplateFileNamePath, JSON.stringify(destinationTemplate, null, 2), { encoding: 'utf8' });
    await fs.writeFile(step3RollbackSourceTemplateFileNamePath, JSON.stringify(oldSourceTemplate, null, 2), { encoding: 'utf8' });
    await fs.writeFile(step3RollbackDestinationTemplateFileNamePath, JSON.stringify(oldDestinationTemplate, null, 2), { encoding: 'utf8' });
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
