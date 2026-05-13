import { Assessment, unsupported } from './assess/assessment';
import { Gen1App } from './_common/gen1-app';
import { printer } from '@aws-amplify/amplify-prompts';
import { Assessor } from './assess/assessor';
import { AuthCognitoAssessor } from './assess/auth/auth-cognito.assessor';
import { AuthUserPoolGroupsAssessor } from './assess/auth/auth-user-pool-groups.assessor';
import { S3Assessor } from './assess/storage/s3.assessor';
import { DynamoDBAssessor } from './assess/storage/dynamodb.assessor';
import { DataAssessor } from './assess/api/data.assessor';
import { RestApiAssessor } from './assess/api/rest-api.assessor';
import { AnalyticsKinesisAssessor } from './assess/analytics/kinesis.assessor';
import { FunctionAssessor } from './assess/function/function.assessor';
import { GeoFenceCollectionAssessor } from './assess/geo/geo-geofence-collection.assessor';
import { GeoMapAssessor } from './assess/geo/geo-map.assessor';
import { GeoPlaceIndexAssessor } from './assess/geo/geo-place-index.assessor';
import { CustomCdkAssessor } from './assess/custom/custom-cdk.assessor';
import { SpinningLogger } from './_common/spinning-logger';

/**
 * Evaluates migration readiness by discovering resources and
 * delegating to per-category assessors for resource-level and
 * feature-level support detection.
 */
export class AmplifyMigrationAssessor {
  public constructor(private readonly gen1App: Gen1App, private readonly logger: SpinningLogger) {}

  public assess(): Assessment {
    const discovered = this.gen1App.discover();
    const combined = new Assessment(this.gen1App.appName, this.gen1App.envName);

    for (const resource of discovered) {
      const assessors: Assessor[] = [];
      this.logger.debug(`Assessing resource: ${resource.category}/${resource.resourceName} (${resource.service})`);
      switch (resource.key) {
        case 'auth:Cognito':
          assessors.push(new AuthCognitoAssessor(this.gen1App, resource));
          break;
        case 'auth:Cognito-UserPool-Groups':
          assessors.push(new AuthUserPoolGroupsAssessor(this.gen1App, resource));
          break;
        case 'storage:S3':
          assessors.push(new S3Assessor(this.gen1App, resource));
          break;
        case 'storage:DynamoDB':
          assessors.push(new DynamoDBAssessor(this.gen1App, resource));
          break;
        case 'api:AppSync':
          assessors.push(new DataAssessor(this.gen1App, resource));
          break;
        case 'api:API Gateway':
          assessors.push(new RestApiAssessor(this.gen1App, resource));
          break;
        case 'analytics:Kinesis':
          assessors.push(new AnalyticsKinesisAssessor(this.gen1App, resource));
          break;
        case 'function:Lambda':
          assessors.push(new FunctionAssessor(this.gen1App, resource));
          break;
        case 'geo:GeofenceCollection':
          assessors.push(new GeoFenceCollectionAssessor(this.gen1App, resource));
          break;
        case 'geo:Map':
          assessors.push(new GeoMapAssessor(this.gen1App, resource));
          break;
        case 'geo:PlaceIndex':
          assessors.push(new GeoPlaceIndexAssessor(this.gen1App, resource));
          break;
        case 'custom:customCDK':
          assessors.push(new CustomCdkAssessor(resource));
          break;
        case 'UNKNOWN':
          combined.recordResource({
            resource,
            generate: unsupported('unknown resource type'),
            refactor: unsupported('unknown resource type'),
          });
          break;
      }

      for (const assessor of assessors) {
        assessor.record(combined);
      }
    }
    return combined;
  }

  /**
   * Assesses all discovered resources and prints the full report.
   */
  public run(): void {
    const assessment = this.assess();
    printer.info(assessment.render());
  }
}
