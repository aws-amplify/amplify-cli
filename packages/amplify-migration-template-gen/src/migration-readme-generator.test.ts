import MigrationReadMeGenerator from './migration-readme-generator';
import fs from 'node:fs/promises';
import { CFNTemplate } from './types';

jest.mock('node:fs/promises');

describe('MigrationReadMeGenerator', () => {
  const PATH = 'test';
  const CATEGORY = 'auth';
  const GEN1_CATEGORY_STACK_ID = 'arn:aws:cloudformation:us-east-1:1234567890:stack/amplify-testauth-dev-12345-auth-ABCDE/12345';
  const GEN2_CATEGORY_STACK_ID = 'arn:aws:cloudformation:us-east-1:1234567890:stack/amplify-mygen2app-test-sandbox-12345-auth-ABCDE/12345';
  const migrationReadMeGenerator = new MigrationReadMeGenerator({
    path: PATH,
    category: CATEGORY,
    gen1CategoryStackId: GEN1_CATEGORY_STACK_ID,
    gen2CategoryStackId: GEN2_CATEGORY_STACK_ID,
  });
  const oldStackTemplate: CFNTemplate = {
    Description: 'Gen1FooTemplate',
    AWSTemplateFormatVersion: 'AWSTemplateFormatVersion',
    Resources: {
      Gen1Foo: {
        Type: 'AWS::S3::Bucket',
        Properties: {
          Name: 'FooBucket',
        },
      },
    },
    Parameters: {},
    Outputs: {},
  };
  const newStackTemplate: CFNTemplate = {
    Description: 'Gen1FooTemplate',
    AWSTemplateFormatVersion: 'AWSTemplateFormatVersion',
    Resources: {
      Gen2Foo: {
        Type: 'AWS::S3::Bucket',
        Properties: {
          Name: 'FooBucket',
        },
      },
    },
    Parameters: {
      authSelections: {
        Type: 'String',
      },
    },
    Outputs: {},
  };
  const logicalIdMapping = new Map([['Gen1FooUserPool', 'Gen2FooUserPool']]);

  it('should initialize migration readme', async () => {
    await migrationReadMeGenerator.initialize();
    expect(fs.writeFile).toHaveBeenCalledWith('test/MIGRATION_README.md', '## Stack refactor steps for auth category\n', {
      encoding: 'utf8',
    });
  });

  it('should render step1', async () => {
    await migrationReadMeGenerator.renderStep1(oldStackTemplate, newStackTemplate, logicalIdMapping, oldStackTemplate, newStackTemplate);
    expect(fs.appendFile).toHaveBeenCalledWith(
      'test/MIGRATION_README.md',
      `### STEP 1: CREATE AND EXECUTE CLOUDFORMATION STACK REFACTOR FOR auth CATEGORY
This step will move the Gen1 auth resources to Gen2 stack.

1.a) Create stack refactor
\`\`\`
aws cloudformation create-stack-refactor  --stack-definitions StackName=amplify-testauth-dev-12345-auth-ABCDE,TemplateBody@=file://test/step3-sourceTemplate.json  StackName=amplify-mygen2app-test-sandbox-12345-auth-ABCDE,TemplateBody@=file://test/step3-destinationTemplate.json  --resource-mappings  '[{\"Source\":{\"StackName\":\"amplify-testauth-dev-12345-auth-ABCDE\",\"LogicalResourceId\":\"Gen1FooUserPool\"},\"Destination\":{\"StackName\":\"amplify-mygen2app-test-sandbox-12345-auth-ABCDE\",\"LogicalResourceId\":\"Gen2FooUserPool\"}}]'
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
 aws cloudformation create-stack-refactor  --stack-definitions StackName=amplify-testauth-dev-12345-auth-ABCDE,TemplateBody@=file://test/step3-sourceTemplate-rollback.json  StackName=amplify-mygen2app-test-sandbox-12345-auth-ABCDE,TemplateBody@=file://test/step3-destinationTemplate-rollback.json  --resource-mappings  '[{\"Source\":{\"StackName\":\"amplify-mygen2app-test-sandbox-12345-auth-ABCDE\",\"LogicalResourceId\":\"Gen2FooUserPool\"},\"Destination\":{\"StackName\":\"amplify-testauth-dev-12345-auth-ABCDE\",\"LogicalResourceId\":\"Gen1FooUserPool\"}}]'
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
  });

  it('should render step2', async () => {
    await migrationReadMeGenerator.renderStep2();
    expect(fs.appendFile).toHaveBeenCalledWith(
      'test/MIGRATION_README.md',
      `### STEP 2: REDEPLOY GEN2 APPLICATION
This step will remove the hardcoded references from the template and replace them with resource references (where applicable).

2.a) Uncomment the following lines in \`amplify/backend.ts\` file to instruct CDK to use the gen1 S3 bucket (if storage is enabled) and apply retain removal policies for auth and/or storage resources
\`\`\`
s3Bucket.bucketName = YOUR_GEN1_BUCKET_NAME;
\`\`\`

\`\`\`
s3Bucket.applyRemovalPolicy(RemovalPolicy.RETAIN, { applyToUpdateReplacePolicy: true });
\`\`\`

\`\`\`
cfnUserPool.applyRemovalPolicy(RemovalPolicy.RETAIN, { applyToUpdateReplacePolicy: true });
\`\`\`

\`\`\`
cfnIdentityPool.applyRemovalPolicy(RemovalPolicy.RETAIN, { applyToUpdateReplacePolicy: true });
\`\`\`

2.b) Deploy sandbox using the below command or trigger a CI/CD build via hosting by committing this file to your Git repository
\`\`\`
npx ampx sandbox
\`\`\`
`,
    );
  });
});
