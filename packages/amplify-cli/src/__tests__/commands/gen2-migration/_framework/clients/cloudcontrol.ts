import { mockClient } from 'aws-sdk-client-mock';
import { MigrationApp } from '../app';
import * as cloudcontrol from '@aws-sdk/client-cloudcontrol';

export class CloudControlMock {
  public readonly mock;

  constructor(private readonly app: MigrationApp) {
    this.mock = mockClient(cloudcontrol.CloudControlClient);
  }
}
