import path from 'node:path';
import fs from 'node:fs/promises';
import ts from 'typescript';
import { Generator } from '../../generator';
import { AmplifyMigrationOperation } from '../../../_operation';
import { BackendGenerator } from '../backend.generator';
import { Gen1App } from '../../input/gen1-app';
import { printNodes } from '../../ts-writer';
import { AnalyticsRenderer } from './kinesis.renderer';
import { KinesisCfnConverter, KinesisAnalyticsDefinition } from './kinesis-cfn-converter';

const factory = ts.factory;

/**
 * Generates a single Kinesis analytics resource and contributes to backend.ts.
 *
 * Converts the CloudFormation template to CDK using cdk-from-cfn,
 * generates analytics/resource.ts, and adds the analytics import
 * and call to backend.ts.
 */
export class AnalyticsKinesisGenerator implements Generator {
  private readonly gen1App: Gen1App;
  private readonly backendGenerator: BackendGenerator;
  private readonly outputDir: string;
  private readonly resourceName: string;
  private readonly renderer: AnalyticsRenderer;

  public constructor(gen1App: Gen1App, backendGenerator: BackendGenerator, outputDir: string, resourceName: string) {
    this.gen1App = gen1App;
    this.backendGenerator = backendGenerator;
    this.outputDir = outputDir;
    this.resourceName = resourceName;
    this.renderer = new AnalyticsRenderer();
  }

  /**
   * Plans the Kinesis analytics generation operation.
   */
  public async plan(): Promise<AmplifyMigrationOperation[]> {
    const analyticsCategory = await this.gen1App.fetchMetaCategory('analytics');
    if (!analyticsCategory) return [];

    const resourceMeta = analyticsCategory[this.resourceName] as Record<string, unknown> | undefined;
    if (!resourceMeta) return [];

    const rootStackName = await this.gen1App.fetchRootStackName();
    const analyticsDir = path.join(this.outputDir, 'amplify', 'analytics');

    const definition: KinesisAnalyticsDefinition = {
      name: this.resourceName,
      service: 'Kinesis',
      providerMetadata: resourceMeta.providerMetadata as KinesisAnalyticsDefinition['providerMetadata'],
    };

    return [
      {
        describe: async () => [`Generate amplify/analytics/${this.resourceName}/resource.ts`],
        execute: async () => {
          const fileWriter = async (content: string, filePath: string) => {
            await fs.mkdir(path.dirname(filePath), { recursive: true });
            await fs.writeFile(filePath, content, 'utf-8');
          };

          const kinesisCfnConverter = new KinesisCfnConverter(
            this.outputDir,
            fileWriter,
            this.gen1App.clients.s3,
            this.gen1App.clients.cloudFormation,
            rootStackName,
          );

          const codegenResult = await kinesisCfnConverter.generateKinesisAnalyticsL1Code(definition);

          const nodes = this.renderer.render({
            constructClassName: codegenResult.constructClassName,
            constructFileName: codegenResult.constructFileName,
            resourceName: codegenResult.resourceName,
            shardCount: codegenResult.shardCount,
            streamName: codegenResult.streamName,
          });

          const content = printNodes(nodes);

          await fs.mkdir(analyticsDir, { recursive: true });
          await fs.writeFile(path.join(analyticsDir, 'resource.ts'), content, 'utf-8');

          this.backendGenerator.addImport('./analytics/resource', ['defineAnalytics']);
          this.backendGenerator.addEarlyStatement(
            factory.createVariableStatement(
              undefined,
              factory.createVariableDeclarationList(
                [
                  factory.createVariableDeclaration(
                    'analytics',
                    undefined,
                    undefined,
                    factory.createCallExpression(factory.createIdentifier('defineAnalytics'), undefined, [
                      factory.createIdentifier('backend'),
                    ]),
                  ),
                ],
                ts.NodeFlags.Const,
              ),
            ),
          );
        },
      },
    ];
  }
}
