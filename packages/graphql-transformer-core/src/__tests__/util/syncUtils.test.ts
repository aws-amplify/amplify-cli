import { SyncConfigLAMBDA, ConflictHandlerType } from '../../util/transformConfig';
import { SyncUtils } from '../../util/syncUtils';

describe('sync resolver config', () => {
  it('creates the correct lambda resolver config', () => {
    const syncConfig: SyncConfigLAMBDA = {
      ConflictDetection: 'VERSION',
      ConflictHandler: ConflictHandlerType.LAMBDA,
      LambdaConflictHandler: {
        name: 'myLambda-${env}',
      },
    };

    expect(SyncUtils.syncResolverConfig(syncConfig)).toMatchSnapshot();
  });
});

describe('sync lambda arn resource', () => {
  it('creates the correct lambda arn substitution', () => {
    const partialSyncConfig = {
      name: 'myLambda-${env}',
    };

    expect(SyncUtils.syncLambdaArnResource(partialSyncConfig)).toMatchSnapshot();
  });
});
