import { Assessment } from '../../../commands/gen2-migration/_assessment';

describe('Assessment', () => {
  describe('recordResource()', () => {
    it('records a resource assessment', () => {
      const assessment = new Assessment('app', 'dev');
      assessment.recordResource(
        { category: 'auth', resourceName: 'myPool', service: 'Cognito', key: 'auth:Cognito' },
        'supported',
        'supported',
      );

      expect(assessment.resources).toHaveLength(1);
      expect(assessment.resources[0].generate).toBe('supported');
      expect(assessment.resources[0].refactor).toBe('supported');
    });

    it('handles multiple resources across categories', () => {
      const assessment = new Assessment('app', 'dev');
      assessment.recordResource(
        { category: 'auth', resourceName: 'pool', service: 'Cognito', key: 'auth:Cognito' },
        'supported',
        'supported',
      );
      assessment.recordResource(
        { category: 'storage', resourceName: 'bucket', service: 'S3', key: 'storage:S3' },
        'supported',
        'supported',
      );
      assessment.recordResource(
        { category: 'geo', resourceName: 'map', service: 'Location', key: 'unsupported' },
        'unsupported',
        'unsupported',
      );

      expect(assessment.resources).toHaveLength(3);
      expect(assessment.resources[0].generate).toBe('supported');
      expect(assessment.resources[2].generate).toBe('unsupported');
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
      assessment.recordResource(
        { category: 'auth', resourceName: 'pool', service: 'Cognito', key: 'auth:Cognito' },
        'supported',
        'supported',
      );
      assessment.recordResource(
        { category: 'storage', resourceName: 'bucket', service: 'S3', key: 'storage:S3' },
        'supported',
        'supported',
      );

      expect(displayed(assessment)).toMatchSnapshot();
    });

    it('renders an app blocked by unsupported refactor', () => {
      const assessment = new Assessment('myapp', 'dev');
      assessment.recordResource(
        { category: 'auth', resourceName: 'pool', service: 'Cognito', key: 'auth:Cognito' },
        'supported',
        'supported',
      );
      assessment.recordResource(
        { category: 'geo', resourceName: 'map', service: 'Location', key: 'unsupported' },
        'unsupported',
        'unsupported',
      );

      expect(displayed(assessment)).toMatchSnapshot();
    });

    it('renders an app with unsupported generate but supported refactor', () => {
      const assessment = new Assessment('myapp', 'dev');
      assessment.recordResource(
        { category: 'auth', resourceName: 'pool', service: 'Cognito', key: 'auth:Cognito' },
        'supported',
        'supported',
      );
      assessment.recordResource(
        { category: 'custom', resourceName: 'alarms', service: 'CloudFormation', key: 'unsupported' },
        'unsupported',
        'supported',
      );

      expect(displayed(assessment)).toMatchSnapshot();
    });

    it('renders features table when features are detected', () => {
      const assessment = new Assessment('myapp', 'dev');
      assessment.recordResource(
        { category: 'function', resourceName: 'myFunc', service: 'Lambda', key: 'function:Lambda' },
        'supported',
        'not-applicable',
      );
      assessment.recordFeature({
        feature: 'Custom policies',
        path: 'function/myFunc/custom-policies.json',
        generate: 'unsupported',
        refactor: 'not-applicable',
      });

      expect(displayed(assessment)).toMatchSnapshot();
    });
  });
});
