import { DataAssessor } from '../../../../../commands/gen2-migration/assess/api/data.assessor';
import { Assessment } from '../../../../../commands/gen2-migration/assess/assessment';
import { Gen1App, DiscoveredResource } from '../../../../../commands/gen2-migration/_common/gen1-app';
import { FeatureFlags } from '@aws-amplify/amplify-cli-core';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- test helper for untyped cli-inputs.json
function mockGen1App(existingFiles: string[] = [], cliInputsData: any = {}): Gen1App {
  const fileSet = new Set(existingFiles);
  return {
    fileExists: (path: string) => fileSet.has(path),
    ensureCliInputs: () => undefined,
    cliInputs: () => cliInputsData,
  } as unknown as Gen1App;
}

function mockTransformerVersion(version: number): void {
  jest.spyOn(FeatureFlags, 'getNumber').mockImplementation((flagName: string) => {
    if (flagName === 'graphQLTransformer.transformerVersion') return version;
    throw new Error(`Unexpected FeatureFlags.getNumber call: ${flagName}`);
  });
}

const RESOURCE: DiscoveredResource = { category: 'api', resourceName: 'myApi', service: 'AppSync', key: 'api:AppSync' };

describe('DataAssessor', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('records resource as supported', () => {
    mockTransformerVersion(2);
    const assessment = new Assessment('app', 'dev');
    new DataAssessor(mockGen1App(), RESOURCE).record(assessment);

    const entry = assessment.resources[0];
    expect(entry!.generate.level).toBe('supported');
    expect(entry!.refactor.level).toBe('not-applicable');
  });

  it('detects override.ts', () => {
    mockTransformerVersion(2);
    const assessment = new Assessment('app', 'dev');
    new DataAssessor(mockGen1App(['api/myApi/override.ts']), RESOURCE).record(assessment);

    expect(assessment.features).toHaveLength(1);
    expect(assessment.features[0]).toEqual({
      feature: { name: 'overrides', path: 'api/myApi/override.ts' },
      generate: { level: 'unsupported', note: expect.any(String) },
      refactor: { level: 'not-applicable' },
    });
  });

  it('records no features when override.ts is absent', () => {
    mockTransformerVersion(2);
    const assessment = new Assessment('app', 'dev');
    new DataAssessor(mockGen1App(), RESOURCE).record(assessment);

    expect(assessment.features).toHaveLength(0);
  });

  it('detects conflict resolution (DataStore) as unsupported', () => {
    mockTransformerVersion(2);
    const cliInputs = {
      version: 1,
      serviceConfiguration: {
        apiName: 'myApi',
        serviceName: 'AppSync',
        conflictResolution: {
          defaultResolutionStrategy: { type: 'AUTOMERGE' },
        },
      },
    };
    const assessment = new Assessment('app', 'dev');
    new DataAssessor(mockGen1App([], cliInputs), RESOURCE).record(assessment);

    expect(assessment.features).toHaveLength(1);
    expect(assessment.features[0]).toEqual({
      feature: { name: 'conflict-resolution', path: 'api/myApi/cli-inputs.json' },
      generate: { level: 'unsupported', note: 'conflict resolution (DataStore) is not supported in Gen2' },
      refactor: { level: 'unsupported', note: 'conflict resolution (DataStore) is not supported in Gen2' },
    });
  });

  it('does not record conflict resolution when it is absent from cli-inputs.json', () => {
    mockTransformerVersion(2);
    const cliInputs = {
      version: 1,
      serviceConfiguration: {
        apiName: 'myApi',
        serviceName: 'AppSync',
        defaultAuthType: { mode: 'API_KEY', expirationTime: 7 },
      },
    };
    const assessment = new Assessment('app', 'dev');
    new DataAssessor(mockGen1App([], cliInputs), RESOURCE).record(assessment);

    expect(assessment.features).toHaveLength(0);
  });

  it('does not record conflict resolution when conflictResolution is an empty object', () => {
    mockTransformerVersion(2);
    const cliInputs = {
      version: 1,
      serviceConfiguration: {
        apiName: 'myApi',
        serviceName: 'AppSync',
        conflictResolution: {},
      },
    };
    const assessment = new Assessment('app', 'dev');
    new DataAssessor(mockGen1App([], cliInputs), RESOURCE).record(assessment);

    expect(assessment.features).toHaveLength(0);
  });

  it('records resource as unsupported when transformer version is not 2', () => {
    mockTransformerVersion(1);
    const assessment = new Assessment('app', 'dev');
    new DataAssessor(mockGen1App(), RESOURCE).record(assessment);

    const entry = assessment.resources[0];
    expect(entry!.generate.level).toBe('unsupported');
    expect(entry!.generate).toHaveProperty('note', 'Transformer V1 is not supported in Gen2');
    expect(entry!.refactor.level).toBe('not-applicable');
  });

  it('records resource as supported when transformer version is 2', () => {
    mockTransformerVersion(2);
    const assessment = new Assessment('app', 'dev');
    new DataAssessor(mockGen1App(), RESOURCE).record(assessment);

    const entry = assessment.resources[0];
    expect(entry!.generate.level).toBe('supported');
    expect(entry!.refactor.level).toBe('not-applicable');
  });
});
