import { Assessment } from '../../../commands/gen2-migration/_assessment';
import { DiscoveredResource } from '../../../commands/gen2-migration/generate-new/_infra/gen1-app';

describe('Assessment', () => {
  describe('record()', () => {
    it('creates an entry on first record for a resource', () => {
      const assessment = new Assessment('app', 'dev');
      const resource: DiscoveredResource = { category: 'auth', resourceName: 'myPool', service: 'Cognito', key: 'auth:Cognito' };

      assessment.record('generate', resource, { supported: true, notes: [] });

      const entry = assessment.entries.get('auth:myPool');
      expect(entry).toBeDefined();
      expect(entry!.generate.supported).toBe(true);
      // Refactor defaults to unsupported until recorded
      expect(entry!.refactor.supported).toBe(false);
    });

    it('updates an existing entry without overwriting the other step', () => {
      const assessment = new Assessment('app', 'dev');
      const resource: DiscoveredResource = { category: 'storage', resourceName: 'myBucket', service: 'S3', key: 'storage:S3' };

      assessment.record('generate', resource, { supported: true, notes: [] });
      assessment.record('refactor', resource, { supported: true, notes: [] });

      const entry = assessment.entries.get('storage:myBucket');
      expect(entry!.generate.supported).toBe(true);
      expect(entry!.refactor.supported).toBe(true);
    });

    it('records notes correctly', () => {
      const assessment = new Assessment('app', 'dev');
      const resource: DiscoveredResource = { category: 'function', resourceName: 'myFunc', service: 'Lambda', key: 'function:Lambda' };

      assessment.record('generate', resource, { supported: true, notes: ['custom-policies not supported'] });

      const entry = assessment.entries.get('function:myFunc');
      expect(entry!.generate.notes).toEqual(['custom-policies not supported']);
    });

    it('handles multiple resources across categories', () => {
      const assessment = new Assessment('app', 'dev');

      assessment.record(
        'generate',
        { category: 'auth', resourceName: 'pool', service: 'Cognito', key: 'auth:Cognito' },
        { supported: true, notes: [] },
      );
      assessment.record(
        'generate',
        { category: 'storage', resourceName: 'bucket', service: 'S3', key: 'storage:S3' },
        { supported: true, notes: [] },
      );
      assessment.record(
        'generate',
        { category: 'geo', resourceName: 'map', service: 'Location', key: 'unknown' },
        { supported: false, notes: [] },
      );

      expect(assessment.entries.size).toBe(3);
      expect(assessment.entries.get('auth:pool')!.generate.supported).toBe(true);
      expect(assessment.entries.get('storage:bucket')!.generate.supported).toBe(true);
      expect(assessment.entries.get('geo:map')!.generate.supported).toBe(false);
    });
  });
});
