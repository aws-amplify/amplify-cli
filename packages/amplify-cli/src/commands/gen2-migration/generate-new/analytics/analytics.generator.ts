import path from 'node:path';
import fs from 'node:fs/promises';
import ts from 'typescript';
import { Generator } from '../generator';
import { AmplifyMigrationOperation } from '../../_operation';
import { BackendGenerator } from '../backend.generator';
import { Gen1App } from '../gen1-app/gen1-app';
import { printNodes } from '../ts-writer';

import { renderDefineAnalytics, AnalyticsRenderParameters } from './render-analytics';
import { CdkFromCfn, KinesisAnalyticsDefinition, AnalyticsCodegenResult } from './cdk-from-cfn';

const factory = ts.factory;

/**
 * Generates analytics resource files and contributes to backend.ts.
 *
 * For each Kinesis analytics resource in the Gen1 app, this generator:
 * 1. Converts the CloudFormation template to CDK using cdk-from-cfn
 * 2. Generates an analytics/resource.ts with a defineAnalytics function
 * 3. Adds the analytics import and call to backend.ts
 */
export class AnalyticsGenerator implements Generator {
  private readonly gen1App: Gen1App;
  private readonly backendGenerator: BackendGenerator;
  private readonly outputDir: string;

  public constructor(gen1App: Gen1App, backendGenerator: BackendGenerator, outputDir: string) {
    this.gen1App = gen1App;
    this.backendGenerator = backendGenerator;
    this.outputDir = outputDir;
  }

  public async plan(): Promise<AmplifyMigrationOperation[]> {
    const meta = await this.gen1App.fetchMeta();
    const analyticsCategory = meta.analytics as Record<string, KinesisAnalyticsDefinition> | undefined;
    if (!analyticsCategory || Object.keys(analyticsCategory).length === 0) {
      return [];
    }

    const operations: AmplifyMigrationOperation[] = [];
    const rootStackName = await this.gen1App.fetchRootStackName();
    const analyticsDir = path.join(this.outputDir, 'amplify', 'analytics');

    for (const [resourceName, definition] of Object.entries(analyticsCategory)) {
      if (definition.service !== 'Kinesis') {
        continue;
      }

      definition.name = resourceName;

      const fileWriter = async (content: string, filePath: string) => {
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, content, 'utf-8');
      };

      operations.push({
        describe: async () => [`Generate analytics/${resourceName}/resource.ts`],
        execute: async () => {
          const cdkFromCfn = new CdkFromCfn(this.outputDir, fileWriter, this.gen1App.clients.cloudFormation, rootStackName);

          const codegenResult: AnalyticsCodegenResult = await cdkFromCfn.generateKinesisAnalyticsL1Code(definition);

          const analyticsParams: AnalyticsRenderParameters = {
            constructClassName: codegenResult.constructClassName,
            constructFileName: codegenResult.constructFileName,
            resourceName: codegenResult.resourceName,
            shardCount: codegenResult.shardCount,
            streamName: codegenResult.streamName,
          };

          const nodes = renderDefineAnalytics(analyticsParams);
          const content = printNodes(nodes);

          await fs.mkdir(analyticsDir, { recursive: true });
          await fs.writeFile(path.join(analyticsDir, 'resource.ts'), content, 'utf-8');

          // Contribute to backend.ts
          this.backendGenerator.addImport('./analytics/resource', ['defineAnalytics']);
          this.backendGenerator.addStatement(
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
      });
    }

    return operations;
  }
}
