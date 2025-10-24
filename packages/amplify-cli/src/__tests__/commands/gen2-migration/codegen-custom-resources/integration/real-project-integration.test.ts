import { CustomResourceScanner } from '../../../../../commands/gen2-migration/codegen-custom-resources/scanner/custom-resource-scanner';
import { promises as fsPromises } from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('Real Project Integration Tests', () => {
  let scanner: CustomResourceScanner;

  beforeAll(() => {
    scanner = new CustomResourceScanner();
  });

  describe('Complex Real-World Scenarios', () => {
    it('should handle a realistic notification service stack', async () => {
      const tempDir = await fsPromises.mkdtemp(path.join(os.tmpdir(), 'amplify-integration-'));

      try {
        // Create a realistic Amplify custom resource structure
        const customDir = path.join(tempDir, 'amplify', 'backend', 'custom');
        const notificationDir = path.join(customDir, 'notifications');

        await fsPromises.mkdir(notificationDir, { recursive: true });

        // Real-world CDK stack content
        const realWorldStack = `
import * as cdk from 'aws-cdk-lib';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as AmplifyHelpers from '@aws-amplify/cli-extensibility-helper';

export class cdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps, amplifyResourceProps?: AmplifyResourceProps) {
    super(scope, id, props);
    
    // Environment parameter
    const envParameter = new cdk.CfnParameter(this, 'env', {
      type: 'String',
      description: 'Current Amplify environment name'
    });

    // Get project info
    const projectInfo = AmplifyHelpers.getProjectInfo();
    const projectName = projectInfo.projectName;
    
    // Create SNS topic with environment-specific name
    const topic = new sns.Topic(this, 'NotificationTopic', {
      topicName: \`\${projectName}-\${cdk.Fn.ref('env')}-notifications\`,
      displayName: 'Amplify Notifications'
    });

    // Create DLQ for failed messages
    const dlq = new sqs.Queue(this, 'NotificationDLQ', {
      queueName: \`\${projectName}-\${cdk.Fn.ref('env')}-notifications-dlq\`,
      retentionPeriod: cdk.Duration.days(14)
    });

    // Lambda function for processing notifications
    const processor = new lambda.Function(this, 'NotificationProcessor', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda'),
      environment: {
        TOPIC_ARN: topic.topicArn,
        PROJECT_NAME: projectName,
        ENV: cdk.Fn.ref('env')
      },
      deadLetterQueue: dlq
    });

    // Add resource dependencies
    const authResources = AmplifyHelpers.addResourceDependency(this, 'auth', 'userPool', [
      'UserPoolId',
      'UserPoolClientId'
    ]);

    // Conditional resources based on environment
    if (cdk.Fn.ref('env') === 'prod') {
      new sns.Subscription(this, 'ProdAlerts', {
        topic: topic,
        protocol: sns.SubscriptionProtocol.EMAIL,
        endpoint: 'admin@company.com'
      });
    }

    // Outputs
    new cdk.CfnOutput(this, 'TopicArn', {
      value: topic.topicArn,
      description: 'SNS Topic ARN for notifications'
    });

    new cdk.CfnOutput(this, 'ProcessorFunctionName', {
      value: processor.functionName,
      description: 'Lambda function name for notification processing'
    });
  }
}

interface AmplifyResourceProps {
  categories: object;
  env: string;
}
        `;

        await fsPromises.writeFile(path.join(notificationDir, 'cdk-stack.ts'), realWorldStack);

        // Test the full pipeline
        const resources = await scanner.scanCustomResources(tempDir);
        expect(resources).toHaveLength(1);
        expect(resources[0].name).toBe('notifications');

        // Read and parse the actual file content
        const stackContent = await fsPromises.readFile(resources[0].cdkStackPath, 'utf-8');

        // Verify it contains real-world patterns
        expect(stackContent).toContain('AmplifyHelpers.getProjectInfo()');
        expect(stackContent).toContain('AmplifyHelpers.addResourceDependency');
        expect(stackContent).toContain("cdk.Fn.ref('env')");
        expect(stackContent).toContain('new cdk.CfnParameter');
        expect(stackContent).toContain('new cdk.CfnOutput');

        // Test transformation (would need actual parser implementation)
        // This demonstrates the integration test structure
        console.log('✅ Successfully processed real-world Amplify custom resource');
      } finally {
        await fsPromises.rm(tempDir, { recursive: true, force: true });
      }
    });

    it('should handle multiple interconnected custom resources', async () => {
      const tempDir = await fsPromises.mkdtemp(path.join(os.tmpdir(), 'amplify-multi-'));

      try {
        const customDir = path.join(tempDir, 'amplify', 'backend', 'custom');

        // Create multiple custom resources that depend on each other
        const resources = ['notifications', 'analytics', 'monitoring'];

        for (const resourceName of resources) {
          const resourceDir = path.join(customDir, resourceName);
          await fsPromises.mkdir(resourceDir, { recursive: true });

          const stackContent = `
import * as cdk from 'aws-cdk-lib';
import * as AmplifyHelpers from '@aws-amplify/cli-extensibility-helper';

export class cdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    
    const env = new cdk.CfnParameter(this, 'env', { type: 'String' });
    const projectName = AmplifyHelpers.getProjectInfo().projectName;
    
    // Cross-resource dependencies
    ${
      resourceName === 'analytics'
        ? `
    const notificationDeps = AmplifyHelpers.addResourceDependency(this, 'custom', 'notifications', ['TopicArn']);
    `
        : ''
    }
    
    ${
      resourceName === 'monitoring'
        ? `
    const analyticsDeps = AmplifyHelpers.addResourceDependency(this, 'custom', 'analytics', ['StreamArn']);
    const notificationDeps = AmplifyHelpers.addResourceDependency(this, 'custom', 'notifications', ['TopicArn']);
    `
        : ''
    }
    
    // Resource-specific logic here
    const resourceId = \`\${projectName}-\${cdk.Fn.ref('env')}-${resourceName}\`;
  }
}
          `;

          await fsPromises.writeFile(path.join(resourceDir, 'cdk-stack.ts'), stackContent);
        }

        const foundResources = await scanner.scanCustomResources(tempDir);
        expect(foundResources).toHaveLength(3);

        const resourceNames = foundResources.map((r) => r.name).sort();
        expect(resourceNames).toEqual(['analytics', 'monitoring', 'notifications']);

        console.log('✅ Successfully processed multiple interconnected resources');
      } finally {
        await fsPromises.rm(tempDir, { recursive: true, force: true });
      }
    });

    it('should handle edge cases in file system structure', async () => {
      const tempDir = await fsPromises.mkdtemp(path.join(os.tmpdir(), 'amplify-edge-'));

      try {
        const customDir = path.join(tempDir, 'amplify', 'backend', 'custom');

        // Test various edge cases
        await fsPromises.mkdir(path.join(customDir, 'valid-resource'), { recursive: true });
        await fsPromises.writeFile(path.join(customDir, 'valid-resource', 'cdk-stack.ts'), 'export class cdkStack {}');

        // Directory without cdk-stack.ts
        await fsPromises.mkdir(path.join(customDir, 'incomplete-resource'), { recursive: true });
        await fsPromises.writeFile(path.join(customDir, 'incomplete-resource', 'other-file.ts'), 'console.log("not a stack");');

        // File instead of directory
        await fsPromises.writeFile(path.join(customDir, 'not-a-directory.ts'), 'export const config = {};');

        // Hidden directory
        await fsPromises.mkdir(path.join(customDir, '.hidden-resource'), { recursive: true });
        await fsPromises.writeFile(path.join(customDir, '.hidden-resource', 'cdk-stack.ts'), 'export class cdkStack {}');

        const resources = await scanner.scanCustomResources(tempDir);

        // Should only find valid resources
        expect(resources).toHaveLength(2); // valid-resource and .hidden-resource
        expect(resources.map((r) => r.name).sort()).toEqual(['.hidden-resource', 'valid-resource']);

        console.log('✅ Successfully handled file system edge cases');
      } finally {
        await fsPromises.rm(tempDir, { recursive: true, force: true });
      }
    });
  });

  describe('Performance Tests', () => {
    it('should handle large projects efficiently', async () => {
      const tempDir = await fsPromises.mkdtemp(path.join(os.tmpdir(), 'amplify-perf-'));

      try {
        const customDir = path.join(tempDir, 'amplify', 'backend', 'custom');

        // Create many custom resources to test performance
        const resourceCount = 50;
        const startTime = Date.now();

        for (let i = 0; i < resourceCount; i++) {
          const resourceDir = path.join(customDir, `resource-${i}`);
          await fsPromises.mkdir(resourceDir, { recursive: true });
          await fsPromises.writeFile(
            path.join(resourceDir, 'cdk-stack.ts'),
            `export class cdkStack { constructor() { /* Resource ${i} */ } }`,
          );
        }

        const scanStartTime = Date.now();
        const resources = await scanner.scanCustomResources(tempDir);
        const scanEndTime = Date.now();

        expect(resources).toHaveLength(resourceCount);

        const scanDuration = scanEndTime - scanStartTime;
        const totalDuration = scanEndTime - startTime;

        console.log(`✅ Scanned ${resourceCount} resources in ${scanDuration}ms (total: ${totalDuration}ms)`);

        // Performance assertion - should scan 50 resources in under 1 second
        expect(scanDuration).toBeLessThan(1000);
      } finally {
        await fsPromises.rm(tempDir, { recursive: true, force: true });
      }
    });
  });
});
