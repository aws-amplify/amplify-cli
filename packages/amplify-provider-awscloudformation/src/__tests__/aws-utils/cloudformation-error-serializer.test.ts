import { deserializeErrorMessages, CFNErrorMessages } from '../../aws-utils/cloudformation-error-serializer';

describe('deserialize errors', () => {
  let errorDetails = 'Name: S3Bucket (AWS::S3::Bucket), Event Type: create, Reason: some-bucket-dev already exists\n';
  errorDetails += 'Name: functionnotifyForNewUser (AWS::CloudFormation::Stack), Event Type: create, Reason: param1 must have values';

  it('deserialize error multiline', () => {
    const deserializedErrorMessages: CFNErrorMessages = deserializeErrorMessages(errorDetails);
    expect(deserializedErrorMessages.messages.length).toBe(2);
    expect(deserializedErrorMessages.messages[0].name).toBe('S3Bucket (AWS::S3::Bucket)');
    expect(deserializedErrorMessages.messages[0].eventType).toBe('create');
    expect(deserializedErrorMessages.messages[0].reason).toBe('some-bucket-dev already exists');
    expect(deserializedErrorMessages.messages[1].name).toBe('functionnotifyForNewUser (AWS::CloudFormation::Stack)');
    expect(deserializedErrorMessages.messages[1].eventType).toBe('create');
    expect(deserializedErrorMessages.messages[1].reason).toBe('param1 must have values');
  });
});
