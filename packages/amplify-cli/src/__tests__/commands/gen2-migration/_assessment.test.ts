import { Assessment } from '../../../commands/gen2-migration/_assessment';
import { DiscoveredResource } from '../../../commands/gen2-migration/generate/_infra/gen1-app';

describe('Assessment', () => {
  describe('record()', () => {
    it('creates an entry on first record for a resource', () => {
      const assessment = new Assessment('app', 'dev');
      const resource: DiscoveredResource = { category: 'auth', resourceName: 'myPool', service: 'Cognito', key: 'auth:Cognito' };

      assessment.record('generate', resource, 'supported');

      const entry = assessment.entries.get('auth:myPool');
      expect(entry).toBeDefined();
      expect(entry!.generate).toBe('supported');
      // Refactor defaults to unsupported until recorded
      expect(entry!.refactor).toBe('unsupported');
    });

    it('updates an existing entry without overwriting the other step', () => {
      const assessment = new Assessment('app', 'dev');
      const resource: DiscoveredResource = { category: 'storage', resourceName: 'myBucket', service: 'S3', key: 'storage:S3' };

      assessment.record('generate', resource, 'supported');
      assessment.record('refactor', resource, 'supported');

      const entry = assessment.entries.get('storage:myBucket');
      expect(entry!.generate).toBe('supported');
      expect(entry!.refactor).toBe('supported');
    });

    it('handles multiple resources across categories', () => {
      const assessment = new Assessment('app', 'dev');

      assessment.record('generate', { category: 'auth', resourceName: 'pool', service: 'Cognito', key: 'auth:Cognito' }, 'supported');
      assessment.record('generate', { category: 'storage', resourceName: 'bucket', service: 'S3', key: 'storage:S3' }, 'supported');
      assessment.record('generate', { category: 'geo', resourceName: 'map', service: 'Location', key: 'unsupported' }, 'unsupported');

      expect(assessment.entries.size).toBe(3);
      expect(assessment.entries.get('auth:pool')!.generate).toBe('supported');
      expect(assessment.entries.get('storage:bucket')!.generate).toBe('supported');
      expect(assessment.entries.get('geo:map')!.generate).toBe('unsupported');
    });
  });

  describe('recordFeature()', () => {
    it('accumulates feature assessments', () => {
      const assessment = new Assessment('app', 'dev');

      assessment.recordFeature({
        feature: 'Custom policies',
        path: 'function/myFunc/custom-policies.json',
        generate: 'unsupported',
        refactor: 'not-applicable',
      });
      assessment.recordFeature({
        feature: 'Overrides',
        path: 'auth/myPool/override.ts',
        generate: 'unsupported',
        refactor: 'not-applicable',
      });

      expect(assessment.features).toHaveLength(2);
      expect(assessment.features[0].feature).toBe('Custom policies');
      expect(assessment.features[1].feature).toBe('Overrides');
    });
  });

  describe('display()', () => {
    let output: string[];

    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- capturing printer output for snapshot tests
      const { printer } = require('@aws-amplify/amplify-prompts');
      output = [];
      jest.spyOn(printer, 'info').mockImplementation((...args: unknown[]) => output.push(String(args[0])));
      jest.spyOn(printer, 'blankLine').mockImplementation(() => output.push(''));
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    function stripAnsi(str: string): string {
      // eslint-disable-next-line no-control-regex -- stripping ANSI escape codes for snapshot comparison
      return str.replace(/\u001b\[[0-9;]*m/g, '');
    }

    function displayed(assessment: Assessment): string {
      assessment.display();
      return output.map(stripAnsi).join('\n');
    }

    it('renders a fully supported app', () => {
      const assessment = new Assessment('myapp', 'dev');
      assessment.record('generate', { category: 'auth', resourceName: 'pool', service: 'Cognito', key: 'auth:Cognito' }, 'supported');
      assessment.record('refactor', { category: 'auth', resourceName: 'pool', service: 'Cognito', key: 'auth:Cognito' }, 'supported');
      assessment.record('generate', { category: 'storage', resourceName: 'bucket', service: 'S3', key: 'storage:S3' }, 'supported');
      assessment.record('refactor', { category: 'storage', resourceName: 'bucket', service: 'S3', key: 'storage:S3' }, 'supported');

      expect(displayed(assessment)).toMatchInlineSnapshot(`
        "
        Assessment for "myapp" (env: dev)

        Resources

        ┌──────────┬──────────┬─────────┬──────────┬──────────┐
        │ Category │ Resource │ Service │ Generate │ Refactor │
        ├──────────┼──────────┼─────────┼──────────┼──────────┤
        │ auth     │ pool     │ Cognito │ ✔        │ ✔        │
        ├──────────┼──────────┼─────────┼──────────┼──────────┤
        │ storage  │ bucket   │ S3      │ ✔        │ ✔        │
        └──────────┴──────────┴─────────┴──────────┴──────────┘"
      `);
    });

    it('renders an app blocked by unsupported refactor', () => {
      const assessment = new Assessment('myapp', 'dev');
      assessment.record('generate', { category: 'auth', resourceName: 'pool', service: 'Cognito', key: 'auth:Cognito' }, 'supported');
      assessment.record('refactor', { category: 'auth', resourceName: 'pool', service: 'Cognito', key: 'auth:Cognito' }, 'supported');
      assessment.record('generate', { category: 'geo', resourceName: 'map', service: 'Location', key: 'unsupported' }, 'unsupported');
      assessment.record('refactor', { category: 'geo', resourceName: 'map', service: 'Location', key: 'unsupported' }, 'unsupported');

      expect(displayed(assessment)).toMatchInlineSnapshot(`
        "
        Assessment for "myapp" (env: dev)

        Resources

        ┌──────────┬──────────┬──────────┬──────────────────────┬────────────────────┐
        │ Category │ Resource │ Service  │ Generate             │ Refactor           │
        ├──────────┼──────────┼──────────┼──────────────────────┼────────────────────┤
        │ auth     │ pool     │ Cognito  │ ✔                    │ ✔                  │
        ├──────────┼──────────┼──────────┼──────────────────────┼────────────────────┤
        │ geo      │ map      │ Location │ ✘ manual code needed │ ✘ blocks migration │
        └──────────┴──────────┴──────────┴──────────────────────┴────────────────────┘"
      `);
    });

    it('renders an app with unsupported generate but supported refactor', () => {
      const assessment = new Assessment('myapp', 'dev');
      assessment.record('generate', { category: 'auth', resourceName: 'pool', service: 'Cognito', key: 'auth:Cognito' }, 'supported');
      assessment.record('refactor', { category: 'auth', resourceName: 'pool', service: 'Cognito', key: 'auth:Cognito' }, 'supported');
      assessment.record(
        'generate',
        { category: 'custom', resourceName: 'alarms', service: 'CloudFormation', key: 'unsupported' },
        'unsupported',
      );
      assessment.record(
        'refactor',
        { category: 'custom', resourceName: 'alarms', service: 'CloudFormation', key: 'unsupported' },
        'supported',
      );

      expect(displayed(assessment)).toMatchInlineSnapshot(`
        "
        Assessment for "myapp" (env: dev)

        Resources

        ┌──────────┬──────────┬────────────────┬──────────────────────┬──────────┐
        │ Category │ Resource │ Service        │ Generate             │ Refactor │
        ├──────────┼──────────┼────────────────┼──────────────────────┼──────────┤
        │ auth     │ pool     │ Cognito        │ ✔                    │ ✔        │
        ├──────────┼──────────┼────────────────┼──────────────────────┼──────────┤
        │ custom   │ alarms   │ CloudFormation │ ✘ manual code needed │ ✔        │
        └──────────┴──────────┴────────────────┴──────────────────────┴──────────┘"
      `);
    });

    it('renders features table when features are detected', () => {
      const assessment = new Assessment('myapp', 'dev');
      assessment.record(
        'generate',
        { category: 'function', resourceName: 'myFunc', service: 'Lambda', key: 'function:Lambda' },
        'supported',
      );
      assessment.record(
        'refactor',
        { category: 'function', resourceName: 'myFunc', service: 'Lambda', key: 'function:Lambda' },
        'supported',
      );
      assessment.recordFeature({
        feature: 'Custom policies',
        path: 'function/myFunc/custom-policies.json',
        generate: 'unsupported',
        refactor: 'not-applicable',
      });

      expect(displayed(assessment)).toMatchInlineSnapshot(`
        "
        Assessment for "myapp" (env: dev)

        Resources

        ┌──────────┬──────────┬─────────┬──────────┬──────────┐
        │ Category │ Resource │ Service │ Generate │ Refactor │
        ├──────────┼──────────┼─────────┼──────────┼──────────┤
        │ function │ myFunc   │ Lambda  │ ✔        │ ✔        │
        └──────────┴──────────┴─────────┴──────────┴──────────┘

        Features

        ┌─────────────────┬──────────────────────────────────────┬──────────┬──────────┐
        │ Feature         │ Path                                 │ Generate │ Refactor │
        ├─────────────────┼──────────────────────────────────────┼──────────┼──────────┤
        │ Custom policies │ function/myFunc/custom-policies.json │ ✘        │ —        │
        └─────────────────┴──────────────────────────────────────┴──────────┴──────────┘"
      `);
    });
  });
});
