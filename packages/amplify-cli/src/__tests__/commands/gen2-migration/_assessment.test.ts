import { Assessment } from '../../../commands/gen2-migration/_assessment';

describe('Assessment', () => {
  describe('validFor()', () => {
    it('returns true when all resources are supported', () => {
      const assessment = new Assessment('app', 'dev');
      assessment.recordResource({
        resource: { category: 'auth', resourceName: 'myPool', service: 'Cognito', key: 'auth:Cognito' },
        generate: 'supported',
        refactor: 'supported',
      });

      expect(assessment.validFor('generate')).toBe(true);
      expect(assessment.validFor('refactor')).toBe(true);
    });

    it('returns false when a resource is unsupported for generate', () => {
      const assessment = new Assessment('app', 'dev');
      assessment.recordResource({
        resource: { category: 'auth', resourceName: 'pool', service: 'Cognito', key: 'auth:Cognito' },
        generate: 'supported',
        refactor: 'supported',
      });
      assessment.recordResource({
        resource: { category: 'geo', resourceName: 'map', service: 'Location', key: 'UNKNOWN' },
        generate: 'unsupported',
        refactor: 'unsupported',
      });

      expect(assessment.validFor('generate')).toBe(false);
      expect(assessment.validFor('refactor')).toBe(false);
    });

    it('returns false when a feature is unsupported', () => {
      const assessment = new Assessment('app', 'dev');
      assessment.recordResource({
        resource: { category: 'function', resourceName: 'myFunc', service: 'Lambda', key: 'function:Lambda' },
        generate: 'supported',
        refactor: 'not-applicable',
      });
      assessment.recordFeature({
        feature: { name: 'Custom policies', path: 'function/myFunc/custom-policies.json' },
        generate: 'unsupported',
        refactor: 'not-applicable',
      });

      expect(assessment.validFor('generate')).toBe(false);
      expect(assessment.validFor('refactor')).toBe(true);
    });

    it('treats not-applicable as valid', () => {
      const assessment = new Assessment('app', 'dev');
      assessment.recordResource({
        resource: { category: 'function', resourceName: 'myFunc', service: 'Lambda', key: 'function:Lambda' },
        generate: 'supported',
        refactor: 'not-applicable',
      });

      expect(assessment.validFor('refactor')).toBe(true);
    });
  });

  describe('render()', () => {
    function stripAnsi(str: string): string {
      // eslint-disable-next-line no-control-regex -- stripping ANSI escape codes for snapshot comparison
      return str.replace(/\u001b\[[0-9;]*m/g, '');
    }

    it('renders a fully supported app', () => {
      const assessment = new Assessment('myapp', 'dev');
      assessment.recordResource({
        resource: { category: 'auth', resourceName: 'pool', service: 'Cognito', key: 'auth:Cognito' },
        generate: 'supported',
        refactor: 'supported',
      });
      assessment.recordResource({
        resource: { category: 'storage', resourceName: 'bucket', service: 'S3', key: 'storage:S3' },
        generate: 'supported',
        refactor: 'supported',
      });

      expect(stripAnsi(assessment.render())).toMatchSnapshot();
    });

    it('renders an app blocked by unsupported refactor', () => {
      const assessment = new Assessment('myapp', 'dev');
      assessment.recordResource({
        resource: { category: 'auth', resourceName: 'pool', service: 'Cognito', key: 'auth:Cognito' },
        generate: 'supported',
        refactor: 'supported',
      });
      assessment.recordResource({
        resource: { category: 'geo', resourceName: 'map', service: 'Location', key: 'UNKNOWN' },
        generate: 'unsupported',
        refactor: 'unsupported',
      });

      expect(stripAnsi(assessment.render())).toMatchSnapshot();
    });
  });
});
