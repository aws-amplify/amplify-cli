import { PatternDetector } from '../../../../../../commands/gen2-migration/generate/custom-resources/parser/pattern-detector';

describe('PatternDetector', () => {
  let detector: PatternDetector;

  beforeEach(() => {
    detector = new PatternDetector();
  });

  describe('detectPatterns', () => {
    it('should detect CfnParameter for env', () => {
      const code = `new cdk.CfnParameter(this, 'env', { type: 'String' });`;
      const patterns = detector.detectPatterns(code);
      expect(patterns.hasCfnParameter).toBe(true);
    });

    it('should detect cdk.Fn.ref', () => {
      const code = `const name = \`resource-\${cdk.Fn.ref('env')}\`;`;
      const patterns = detector.detectPatterns(code);
      expect(patterns.hasCdkFnRef).toBe(true);
    });

    it('should detect AmplifyHelpers.getProjectInfo', () => {
      const code = `const info = AmplifyHelpers.getProjectInfo();`;
      const patterns = detector.detectPatterns(code);
      expect(patterns.hasGetProjectInfo).toBe(true);
    });

    it('should detect AmplifyHelpers.addResourceDependency', () => {
      const code = `AmplifyHelpers.addResourceDependency(this, 'auth', 'userPool', []);`;
      const patterns = detector.detectPatterns(code);
      expect(patterns.hasAddResourceDependency).toBe(true);
    });

    it('should detect CfnOutput', () => {
      const code = `new cdk.CfnOutput(this, 'topicArn', { value: topic.topicArn });`;
      const patterns = detector.detectPatterns(code);
      expect(patterns.hasCfnOutput).toBe(true);
    });
  });

  describe('extractCfnOutputs', () => {
    it('should extract CfnOutput with value and description', () => {
      const code = `new cdk.CfnOutput(this, 'snsTopicArn', {
        value: topic.topicArn,
        description: 'The arn of the SNS topic',
      });`;

      const outputs = detector.extractCfnOutputs(code);

      expect(outputs).toHaveLength(1);
      expect(outputs[0].id).toBe('snsTopicArn');
      expect(outputs[0].value).toBe('topic.topicArn');
      expect(outputs[0].description).toBe('The arn of the SNS topic');
    });

    it('should extract multiple CfnOutputs', () => {
      const code = `
        new cdk.CfnOutput(this, 'topicArn', { value: topic.topicArn });
        new cdk.CfnOutput(this, 'queueUrl', { value: queue.queueUrl });
      `;

      const outputs = detector.extractCfnOutputs(code);

      expect(outputs).toHaveLength(2);
      expect(outputs[0].id).toBe('topicArn');
      expect(outputs[1].id).toBe('queueUrl');
    });
  });
});
