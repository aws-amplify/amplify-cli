import { mockClient } from 'aws-sdk-client-mock';
import * as cwe from '@aws-sdk/client-cloudwatch-events';
import { MigrationApp } from '../app';

/**
 * Mock for the AWS CloudWatch Events service client (`@aws-sdk/client-cloudwatch-events`).
 *
 * This is a no-op mock — it doesn't register any command handlers. The migration
 * codegen may create a CloudWatch Events client, but the current codegen paths
 * don't make any calls that need realistic responses. The mock exists to prevent
 * unhandled SDK calls from throwing during tests.
 *
 * If the codegen starts calling CloudWatch Events commands in the future, add
 * `.on(SomeCommand).resolves(...)` handlers here following the pattern in other mocks.
 */
export class CloudWatchEventsMock {
  public readonly mock;

  constructor(private readonly app: MigrationApp) {
    this.mock = mockClient(cwe.CloudWatchEventsClient);
  }
}
