import { CustomResourceMigrator } from '../../../../../commands/gen2-migration/codegen-custom-resources';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';

describe('CustomResourceMigrator - End to End', () => {
  let migrator: CustomResourceMigrator;
  let gen1Dir: string;
  let gen2Dir: string;

  beforeEach(async () => {
    migrator = new CustomResourceMigrator();
    gen1Dir = await fs.mkdtemp(path.join(os.tmpdir(), 'gen1-'));
    gen2Dir = await fs.mkdtemp(path.join(os.tmpdir(), 'gen2-'));
  });

  afterEach(async () => {
    await fs.remove(gen1Dir);
    await fs.remove(gen2Dir);
  });

  it('should migrate SNS topic custom resource', async () => {
    const customDir = path.join(gen1Dir, 'amplify', 'backend', 'custom', 'notifications');
    await fs.ensureDir(customDir);

    const gen1Stack = `import * as cdk from 'aws-cdk-lib';
import * as AmplifyHelpers from '@aws-amplify/cli-extensibility-helper';
import { Construct } from 'constructs';
import * as sns from 'aws-cdk-lib/aws-sns';

export class cdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps, amplifyResourceProps?: AmplifyHelpers.AmplifyResourceProps) {
    super(scope, id, props);
    
    new cdk.CfnParameter(this, 'env', {
      type: 'String',
      description: 'Current Amplify CLI env name',
    });

    const amplifyProjectInfo = AmplifyHelpers.getProjectInfo();
    const snsTopicResourceName = \`sns-topic-\${amplifyProjectInfo.projectName}-\${cdk.Fn.ref('env')}\`;
    
    const topic = new sns.Topic(this, 'sns-topic', {
      topicName: snsTopicResourceName,
    });
    
    new cdk.CfnOutput(this, 'snsTopicArn', {
      value: topic.topicArn,
      description: 'The arn of the SNS topic',
    });
  }
}`;

    await fs.writeFile(path.join(customDir, 'cdk-stack.ts'), gen1Stack);

    await migrator.migrateCustomResources(gen1Dir, gen2Dir);

    const gen2ResourcePath = path.join(gen2Dir, 'amplify', 'custom', 'notifications', 'resource.ts');
    expect(await fs.pathExists(gen2ResourcePath)).toBe(true);

    const gen2Content = await fs.readFile(gen2ResourcePath, 'utf-8');

    expect(gen2Content).toContain('export class NotificationsStack extends Construct');
    expect(gen2Content).toContain('process.env.AMPLIFY_ENV');
    expect(gen2Content).toContain("process.env.AMPLIFY_PROJECT_NAME || 'myproject'");
    expect(gen2Content).not.toContain('AmplifyHelpers');
    expect(gen2Content).not.toContain('CfnParameter');
    expect(gen2Content).not.toContain('CfnOutput');

    const instructionsPath = path.join(gen2Dir, 'amplify', 'CUSTOM_RESOURCES_BACKEND_UPDATES.md');
    expect(await fs.pathExists(instructionsPath)).toBe(true);

    const instructions = await fs.readFile(instructionsPath, 'utf-8');
    expect(instructions).toContain("import { NotificationsStack } from './custom/notifications/resource'");
    expect(instructions).toContain("backend.createStack('notifications')");
  });

  it('should migrate multiple custom resources', async () => {
    const notificationsDir = path.join(gen1Dir, 'amplify', 'backend', 'custom', 'notifications');
    const analyticsDir = path.join(gen1Dir, 'amplify', 'backend', 'custom', 'analytics');

    await fs.ensureDir(notificationsDir);
    await fs.ensureDir(analyticsDir);

    const simpleStack = `import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class cdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
  }
}`;

    await fs.writeFile(path.join(notificationsDir, 'cdk-stack.ts'), simpleStack);
    await fs.writeFile(path.join(analyticsDir, 'cdk-stack.ts'), simpleStack);

    await migrator.migrateCustomResources(gen1Dir, gen2Dir);

    expect(await fs.pathExists(path.join(gen2Dir, 'amplify', 'custom', 'notifications', 'resource.ts'))).toBe(true);
    expect(await fs.pathExists(path.join(gen2Dir, 'amplify', 'custom', 'analytics', 'resource.ts'))).toBe(true);
  });
});
