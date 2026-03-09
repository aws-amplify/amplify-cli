import { Generator } from '../../generator';
import { AmplifyMigrationOperation } from '../../../_operation';
import { BackendGenerator } from '../backend.generator';
import { Gen1App } from '../../input/gen1-app';
import { S3Generator } from './s3.generator';
import { DynamoDBGenerator } from './dynamodb.generator';

/**
 * Dispatches storage generation by service type (S3, DynamoDB).
 *
 * Reads the storage category from amplify-meta.json and creates
 * an S3Generator and/or DynamoDBGenerator based on the service
 * keys present. DynamoDBGenerator receives `hasS3Bucket` so it
 * can reuse the storage stack when both services coexist.
 */
export class StorageGenerator implements Generator {
  private readonly gen1App: Gen1App;
  private readonly backendGenerator: BackendGenerator;
  private readonly outputDir: string;
  private readonly functionNamesAndCategories: Map<string, string>;

  public constructor(
    gen1App: Gen1App,
    backendGenerator: BackendGenerator,
    outputDir: string,
    functionNamesAndCategories: Map<string, string>,
  ) {
    this.gen1App = gen1App;
    this.backendGenerator = backendGenerator;
    this.outputDir = outputDir;
    this.functionNamesAndCategories = functionNamesAndCategories;
  }

  /**
   * Plans storage operations by dispatching to S3 and DynamoDB generators.
   */
  public async plan(): Promise<AmplifyMigrationOperation[]> {
    const storageCategory = await this.gen1App.fetchMetaCategory('storage');
    if (!storageCategory) return [];

    const hasS3 = Object.values(storageCategory).some((v) => (v as Record<string, unknown>).service === 'S3');
    const hasDynamo = Object.values(storageCategory).some((v) => (v as Record<string, unknown>).service === 'DynamoDB');

    const operations: AmplifyMigrationOperation[] = [];

    if (hasS3) {
      const s3Gen = new S3Generator(this.gen1App, this.backendGenerator, this.outputDir, this.functionNamesAndCategories);
      operations.push(...(await s3Gen.plan()));
    }

    if (hasDynamo) {
      const dynamoGen = new DynamoDBGenerator(this.gen1App, this.backendGenerator, hasS3);
      operations.push(...(await dynamoGen.plan()));
    }

    return operations;
  }
}
