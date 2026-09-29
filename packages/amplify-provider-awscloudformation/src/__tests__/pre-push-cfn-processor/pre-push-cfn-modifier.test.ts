import { Template } from 'cloudform-types';
import { applyS3SSEModification } from '../../pre-push-cfn-processor/modifiers/s3-sse-modifier';
import { prePushCfnTemplateModifier } from '../../pre-push-cfn-processor/pre-push-cfn-modifier';

jest.mock('../../pre-push-cfn-processor/modifiers/s3-sse-modifier');

const applyS3SSEModification_mock = applyS3SSEModification as jest.MockedFunction<typeof applyS3SSEModification>;

applyS3SSEModification_mock.mockImplementation(async (bucket) => {
  bucket.Properties = {};
  (bucket.Properties as any).something = 'test';
  return bucket;
});

describe('prePushCfnTemplateModifier', () => {
  it('iterates through template resources and calls the appropriate resource modifier', async () => {
    const template: Template = {
      Resources: {
        TestResource1: {
          Type: 'AWS::IAM::Role',
        },
        TestResource2: {
          Type: 'AWS::S3::Bucket',
        },
      },
    };
    await prePushCfnTemplateModifier(template);
    expect(template).toMatchInlineSnapshot(`
{
  "Resources": {
    "TestResource1": {
      "Type": "AWS::IAM::Role",
    },
    "TestResource2": {
      "Properties": {
        "something": "test",
      },
      "Type": "AWS::S3::Bucket",
    },
  },
}
`);
  });
});
