import { Assessment } from '../../../commands/gen2-migration/_assessment';
import { DiscoveredResource } from '../../../commands/gen2-migration/generate-new/_infra/gen1-app';

describe('Assessment', () => {
  describe('record()', () => {
    it('creates an entry on first record for a resource', () => {
      const assessment = new Assessment('app', 'dev');
      const resource: DiscoveredResource = { category: 'auth', resourceName: 'myPool', service: 'Cognito', key: 'auth:Cognito' };

      assessment.record('generate', resource, { supported: true });

      const entry = assessment.entries.get('auth:myPool');
      expect(entry).toBeDefined();
      expect(entry!.generate.supported).toBe(true);
      // Refactor defaults to unsupported until recorded
      expect(entry!.refactor.supported).toBe(false);
    });

    it('updates an existing entry without overwriting the other step', () => {
      const assessment = new Assessment('app', 'dev');
      const resource: DiscoveredResource = { category: 'storage', resourceName: 'myBucket', service: 'S3', key: 'storage:S3' };

      assessment.record('generate', resource, { supported: true });
      assessment.record('refactor', resource, { supported: true });

      const entry = assessment.entries.get('storage:myBucket');
      expect(entry!.generate.supported).toBe(true);
      expect(entry!.refactor.supported).toBe(true);
    });

    it('handles multiple resources across categories', () => {
      const assessment = new Assessment('app', 'dev');

      assessment.record(
        'generate',
        { category: 'auth', resourceName: 'pool', service: 'Cognito', key: 'auth:Cognito' },
        { supported: true },
      );
      assessment.record('generate', { category: 'storage', resourceName: 'bucket', service: 'S3', key: 'storage:S3' }, { supported: true });
      assessment.record(
        'generate',
        { category: 'geo', resourceName: 'map', service: 'Location', key: 'unsupported' },
        { supported: false },
      );

      expect(assessment.entries.size).toBe(3);
      expect(assessment.entries.get('auth:pool')!.generate.supported).toBe(true);
      expect(assessment.entries.get('storage:bucket')!.generate.supported).toBe(true);
      expect(assessment.entries.get('geo:map')!.generate.supported).toBe(false);
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
      assessment.record(
        'generate',
        { category: 'auth', resourceName: 'pool', service: 'Cognito', key: 'auth:Cognito' },
        { supported: true },
      );
      assessment.record(
        'refactor',
        { category: 'auth', resourceName: 'pool', service: 'Cognito', key: 'auth:Cognito' },
        { supported: true },
      );
      assessment.record('generate', { category: 'storage', resourceName: 'bucket', service: 'S3', key: 'storage:S3' }, { supported: true });
      assessment.record('refactor', { category: 'storage', resourceName: 'bucket', service: 'S3', key: 'storage:S3' }, { supported: true });

      expect(displayed(assessment)).toMatchInlineSnapshot(`
      "
      Assessment for "myapp" (env: dev)

      ┌──────────┬──────────┬─────────┬──────────┬──────────┐
      │ Category │ Resource │ Service │ Generate │ Refactor │
      ├──────────┼──────────┼─────────┼──────────┼──────────┤
      │ auth     │ pool     │ Cognito │ ✔        │ ✔        │
      │ storage  │ bucket   │ S3      │ ✔        │ ✔        │
      └──────────┴──────────┴─────────┴──────────┴──────────┘

      ✔ Migration can proceed."
    `);
    });

    it('renders an app blocked by unsupported refactor', () => {
      const assessment = new Assessment('myapp', 'dev');
      assessment.record(
        'generate',
        { category: 'auth', resourceName: 'pool', service: 'Cognito', key: 'auth:Cognito' },
        { supported: true },
      );
      assessment.record(
        'refactor',
        { category: 'auth', resourceName: 'pool', service: 'Cognito', key: 'auth:Cognito' },
        { supported: true },
      );
      assessment.record(
        'generate',
        { category: 'geo', resourceName: 'map', service: 'Location', key: 'unsupported' },
        { supported: false },
      );
      assessment.record(
        'refactor',
        { category: 'geo', resourceName: 'map', service: 'Location', key: 'unsupported' },
        { supported: false },
      );

      expect(displayed(assessment)).toMatchInlineSnapshot(`
      "
      Assessment for "myapp" (env: dev)

      ┌──────────┬──────────┬──────────┬──────────────────────┬────────────────────┐
      │ Category │ Resource │ Service  │ Generate             │ Refactor           │
      ├──────────┼──────────┼──────────┼──────────────────────┼────────────────────┤
      │ auth     │ pool     │ Cognito  │ ✔                    │ ✔                  │
      │ geo      │ map      │ Location │ ✘ manual code needed │ ✘ blocks migration │
      └──────────┴──────────┴──────────┴──────────────────────┴────────────────────┘

      ✘ Migration blocked."
    `);
    });

    it('renders an app with unsupported generate but supported refactor', () => {
      const assessment = new Assessment('myapp', 'dev');
      assessment.record(
        'generate',
        { category: 'auth', resourceName: 'pool', service: 'Cognito', key: 'auth:Cognito' },
        { supported: true },
      );
      assessment.record(
        'refactor',
        { category: 'auth', resourceName: 'pool', service: 'Cognito', key: 'auth:Cognito' },
        { supported: true },
      );
      assessment.record(
        'generate',
        { category: 'custom', resourceName: 'alarms', service: 'CloudFormation', key: 'unsupported' },
        { supported: false },
      );
      assessment.record(
        'refactor',
        { category: 'custom', resourceName: 'alarms', service: 'CloudFormation', key: 'unsupported' },
        { supported: true },
      );

      expect(displayed(assessment)).toMatchInlineSnapshot(`
      "
      Assessment for "myapp" (env: dev)

      ┌──────────┬──────────┬────────────────┬──────────────────────┬──────────┐
      │ Category │ Resource │ Service        │ Generate             │ Refactor │
      ├──────────┼──────────┼────────────────┼──────────────────────┼──────────┤
      │ auth     │ pool     │ Cognito        │ ✔                    │ ✔        │
      │ custom   │ alarms   │ CloudFormation │ ✘ manual code needed │ ✔        │
      └──────────┴──────────┴────────────────┴──────────────────────┴──────────┘

      ✔ Migration can proceed."
    `);
    });
  });
});
