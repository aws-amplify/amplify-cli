import { Assessment, FeatureAssessment } from './_assessment';
import { DiscoveredResource, Gen1App } from './generate/_infra/gen1-app';
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

/**
 * Evaluates migration readiness by discovering resources and
 * delegating to per-category assessors for resource-level and
 * feature-level support detection.
 */
export class AmplifyMigrationAssessor {
  public constructor(private readonly gen1App: Gen1App) {}

  /**
   * Assesses features for a single discovered resource.
   * Returns only the detected feature assessments.
   */
  public assessFeatures(resource: DiscoveredResource): readonly FeatureAssessment[] {
    const assessment = new Assessment();
    this.runAssessor(resource, assessment);
    return assessment.features;
  }

  /**
   * Assesses all discovered resources and prints the full report.
   */
  public run(appName: string, envName: string): void {
    const discovered = this.gen1App.discover();
    const combined = new Assessment(appName, envName);

    for (const resource of discovered) {
      this.runAssessor(resource, combined);
    }

    printer.info(combined.render());
  }

  /**
   * Runs the appropriate assessor for a resource, recording into the given assessment.
   */
  private runAssessor(resource: DiscoveredResource, assessment: Assessment): void {
    const assessors: Assessor[] = [];

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
      case 'unsupported':
        assessment.recordResource({ resource, generate: 'unsupported', refactor: 'unsupported' });
        break;
    }

    for (const assessor of assessors) {
      assessor.assess(assessment);
    }
  }
}
