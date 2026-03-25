import { Assessment } from './_assessment';
import { AwsClients } from './aws-clients';
import { Gen1App } from './generate/_infra/gen1-app';
import { SpinningLogger } from '../gen2-migration/_spinning-logger';
import { Assessor } from './assess/assessor';
import { AuthCognitoAssessor } from './assess/auth/auth-cognito.assessor';
import { AuthUserPoolGroupsAssessor } from './assess/auth/auth-user-pool-groups.assessor';
import { S3Assessor } from './assess/storage/s3.assessor';
import { DynamoDBAssessor } from './assess/storage/dynamodb.assessor';
import { DataAssessor } from './assess/api/data.assessor';
import { RestApiAssessor } from './assess/api/rest-api.assessor';
import { AnalyticsKinesisAssessor } from './assess/analytics/kinesis.assessor';
import { FunctionAssessor } from './assess/function/function.assessor';

/**
 * Evaluates migration readiness by discovering resources and
 * delegating to per-category assessors for resource-level and
 * feature-level support detection.
 */
export class AmplifyMigrationAssessor {
  public constructor(
    private readonly logger: SpinningLogger,
    private readonly currentEnvName: string,
    private readonly appName: string,
    private readonly appId: string,
    private readonly region: string,
  ) {}

  /**
   * Runs assessment and renders the result to the terminal.
   */
  public async run(): Promise<void> {
    const assessment = new Assessment(this.appName, this.currentEnvName);
    const clients = new AwsClients({ region: this.region });
    const gen1App = await Gen1App.create({ appId: this.appId, region: this.region, envName: this.currentEnvName, clients });
    const discovered = gen1App.discover();

    const assessors: Assessor[] = [];

    for (const resource of discovered) {
      switch (resource.key) {
        case 'auth:Cognito':
          assessors.push(new AuthCognitoAssessor(gen1App, resource));
          break;
        case 'auth:Cognito-UserPool-Groups':
          assessors.push(new AuthUserPoolGroupsAssessor(gen1App, resource));
          break;
        case 'storage:S3':
          assessors.push(new S3Assessor(gen1App, resource));
          break;
        case 'storage:DynamoDB':
          assessors.push(new DynamoDBAssessor(gen1App, resource));
          break;
        case 'api:AppSync':
          assessors.push(new DataAssessor(gen1App, resource));
          break;
        case 'api:API Gateway':
          assessors.push(new RestApiAssessor(gen1App, resource));
          break;
        case 'analytics:Kinesis':
          assessors.push(new AnalyticsKinesisAssessor(gen1App, resource));
          break;
        case 'function:Lambda':
          assessors.push(new FunctionAssessor(gen1App, resource));
          break;
        case 'unsupported':
          assessment.recordResource({ resource, generate: 'unsupported', refactor: 'unsupported' });
          break;
      }
    }

    for (const assessor of assessors) {
      assessor.assess(assessment);
    }

    assessment.display();
  }
}
