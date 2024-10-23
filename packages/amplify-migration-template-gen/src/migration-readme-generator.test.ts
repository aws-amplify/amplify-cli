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

  // should render step1
  it('should render step1', async () => {
    await migrationReadMeGenerator.renderStep1(oldStackTemplate, newStackTemplate, [
      {
        ParameterKey: 'authSelections',
        ParameterValue: 'identityPoolAndUserPool',
      },
    ]);
    expect(fs.appendFile).toHaveBeenCalledWith(
      'test/MIGRATION_README.md',
      `### STEP 1: UPDATE GEN-1 AUTH STACK
It is a non-disruptive update since the template only replaces resource references with their resolved values. This is a required step to execute cloudformation stack refactor later.
\`\`\`
aws cloudformation update-stack \\
 --stack-name amplify-testauth-dev-12345-auth-ABCDE \\
 --template-body file://test/step1-gen1PreProcessUpdateStackTemplate.json \\
 --parameters '[{"ParameterKey":"authSelections","ParameterValue":"identityPoolAndUserPool"}]' \\
 --capabilities CAPABILITY_NAMED_IAM \\
 --tags '[]'
 \`\`\`
 
\`\`\`
aws cloudformation describe-stacks \\
 --stack-name amplify-testauth-dev-12345-auth-ABCDE
 \`\`\`
 
 #### Rollback step:
 \`\`\`
 aws cloudformation update-stack \\
 --stack-name amplify-testauth-dev-12345-auth-ABCDE \\
 --template-body file://test/step1-gen1PreProcessUpdateStackTemplate-rollback.json \\
 --parameters '[{"ParameterKey\":\"authSelections\",\"ParameterValue\":\"identityPoolAndUserPool\"}]' \\
 --capabilities CAPABILITY_NAMED_IAM
 \`\`\`
 
\`\`\`
aws cloudformation describe-stacks \\
 --stack-name amplify-testauth-dev-12345-auth-ABCDE
 \`\`\`
 `,
      { encoding: 'utf8' },
    );
  });

  // should render step2
  it('should render step2', async () => {
    await migrationReadMeGenerator.renderStep2(oldStackTemplate, newStackTemplate, [
      {
        ParameterKey: 'authSelections',
        ParameterValue: 'identityPoolAndUserPool',
      },
    ]);
    expect(fs.appendFile).toHaveBeenCalledWith(
      'test/MIGRATION_README.md',
      `### STEP 2: REMOVE GEN-2 AUTH STACK RESOURCES
This step is required since we will eventually replace gen-2 resources with gen-1 resources as part of Step 3 (refactor).
\`\`\`
aws cloudformation update-stack \\
 --stack-name amplify-mygen2app-test-sandbox-12345-auth-ABCDE \\
 --template-body file://test/step2-gen2ResourcesRemovalStackTemplate.json \\
 --parameters '[{"ParameterKey":"authSelections","ParameterValue":"identityPoolAndUserPool"}]' \\
 --capabilities CAPABILITY_NAMED_IAM \\
 --tags '[]'
 \`\`\`

\`\`\`
aws cloudformation describe-stacks \\
 --stack-name amplify-mygen2app-test-sandbox-12345-auth-ABCDE
 \`\`\`

 #### Rollback step:
 \`\`\`
 aws cloudformation update-stack \\
 --stack-name amplify-mygen2app-test-sandbox-12345-auth-ABCDE \\
 --template-body file://test/step2-gen2ResourcesRemovalStackTemplate-rollback.json \\
 --parameters '[{"ParameterKey\":\"authSelections\",\"ParameterValue\":\"identityPoolAndUserPool\"}]' \\
 --capabilities CAPABILITY_NAMED_IAM
 \`\`\`

\`\`\`
aws cloudformation describe-stacks \\
 --stack-name amplify-mygen2app-test-sandbox-12345-auth-ABCDE
 \`\`\`
 `,
      { encoding: 'utf8' },
    );
  });

  // should render step3
  it('should render step3', async () => {
    await migrationReadMeGenerator.renderStep3(oldStackTemplate, newStackTemplate, logicalIdMapping, oldStackTemplate, newStackTemplate);
    expect(fs.appendFile).toHaveBeenCalledWith(
      'test/MIGRATION_README.md',
      `### STEP 3: CREATE AND EXECUTE CLOUDFORMATION STACK REFACTOR FOR auth CATEGORY
This step will move the Gen1 auth resources to Gen2 stack.

3.a) Upload the source and destination templates to S3
\`\`\`
export BUCKET_NAME=<<YOUR_BUCKET_NAME>>
\`\`\`

\`\`\`
aws s3 cp test/step3-sourceTemplate.json s3://$BUCKET_NAME
\`\`\`

\`\`\`
aws s3 cp test/step3-destinationTemplate.json s3://$BUCKET_NAME
\`\`\`

3.b) Create stack refactor
\`\`\`
aws cloudformation create-stack-refactor  --stack-definitions StackName=amplify-testauth-dev-12345-auth-ABCDE,TemplateURL=s3://$BUCKET_NAME/step3-sourceTemplate.json  StackName=amplify-mygen2app-test-sandbox-12345-auth-ABCDE,TemplateURL=s3://$BUCKET_NAME/step3-destinationTemplate.json  --resource-mappings  '[{\"Source\":{\"StackName\":\"amplify-testauth-dev-12345-auth-ABCDE\",\"LogicalResourceId\":\"Gen1FooUserPool\"},\"Destination\":{\"StackName\":\"amplify-mygen2app-test-sandbox-12345-auth-ABCDE\",\"LogicalResourceId\":\"Gen2FooUserPool\"}}]'
\`\`\`
 
\`\`\`
export STACK_REFACTOR_ID=<<REFACTOR-ID-FROM-CREATE-STACK-REFACTOR_CALL>>
\`\`\`
  
3.c) Describe stack refactor to check for creation status
\`\`\`
 aws cloudformation describe-stack-refactor --stack-refactor-id $STACK_REFACTOR_ID
\`\`\`
 
3.d) Execute stack refactor
\`\`\`
 aws cloudformation execute-stack-refactor --stack-refactor-id $STACK_REFACTOR_ID
\`\`\`
 
3.e) Describe stack refactor to check for execution status
\`\`\`
 aws cloudformation describe-stack-refactor --stack-refactor-id $STACK_REFACTOR_ID
\`\`\`

#### Rollback step for refactor:
\`\`\`
aws s3 cp test/step3-sourceTemplate-rollback.json s3://$BUCKET_NAME
\`\`\`

\`\`\`
aws s3 cp test/step3-destinationTemplate-rollback.json s3://$BUCKET_NAME
\`\`\`

\`\`\`
 aws cloudformation create-stack-refactor  --stack-definitions StackName=amplify-testauth-dev-12345-auth-ABCDE,TemplateURL=s3://$BUCKET_NAME/step3-sourceTemplate-rollback.json  StackName=amplify-mygen2app-test-sandbox-12345-auth-ABCDE,TemplateURL=s3://$BUCKET_NAME/step3-destinationTemplate-rollback.json  --resource-mappings  '[{\"Source\":{\"StackName\":\"amplify-mygen2app-test-sandbox-12345-auth-ABCDE\",\"LogicalResourceId\":\"Gen2FooUserPool\"},\"Destination\":{\"StackName\":\"amplify-testauth-dev-12345-auth-ABCDE\",\"LogicalResourceId\":\"Gen1FooUserPool\"}}]'
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

  it('should render step4', async () => {
    await migrationReadMeGenerator.renderStep4();
    expect(fs.appendFile).toHaveBeenCalledWith(
      'test/MIGRATION_README.md',
      `### STEP 4: REDEPLOY GEN2 APPLICATION
This step will remove the hardcoded references from the template and replace them with resource references (where applicable).

4.a) Only applicable to Storage category: Uncomment the following line in \`amplify/backend.ts\` file to instruct CDK to use the gen1 S3 bucket
\`\`\`
s3Bucket.bucketName = YOUR_GEN1_BUCKET_NAME;
\`\`\`

4.b) Deploy sandbox using the below command or trigger a CI/CD build via hosting by committing this file to your Git repository
\`\`\`
npx ampx sandbox
\`\`\`
`,
    );
  });
});
