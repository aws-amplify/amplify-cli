import { ResourceStatus } from '@aws-sdk/client-cloudformation';
import {
  deserializeErrorMessages,
  CFNErrorMessages,
  CFNErrorMessage,
  serializeErrorMessages,
  collectStackErrorMessages,
} from '../../aws-utils/cloudformation-error-serializer';

const eventsWithFailure = [
  {
    PhysicalResourceId: 'testStackId1',
    LogicalResourceId: 'testLogicalResourceId1',
    ResourceType: 'AWS::IAM::Role',
    ResourceStatus: ResourceStatus.CREATE_FAILED,
    ResourceStatusReason: 'Some valid reason 1',
    // below properties are useless since we don't use them in the code
    StackId: 'testStackId1',
    EventId: 'testEventId1',
    StackName: 'testStackName1',
    Timestamp: new Date(),
  },
  {
    PhysicalResourceId: 'testStackId2',
    LogicalResourceId: 'testLogicalResourceId2',
    ResourceType: 'AWS::CloudFormation::Stack',
    ResourceStatus: ResourceStatus.UPDATE_FAILED,
    ResourceStatusReason: 'Some valid reason 2',
    // below properties are useless since we don't use them in the code
    StackId: 'testStackId2',
    EventId: 'testEventId2',
    StackName: 'testStackName2',
    Timestamp: new Date(),
  },
];

const testCFNError1: CFNErrorMessage = {
  name: 'testLogicalResourceId1 (AWS::IAM::Role)',
  eventType: 'create',
  reason: 'Some valid reason 1',
  isCustomResource: true, // override this for individual tests
};
const testCFNError2: CFNErrorMessage = {
  name: 'testLogicalResourceId2 (AWS::CloudFormation::Stack)',
  eventType: 'update',
  reason: 'Some valid reason 2',
  isCustomResource: true, // override this for individual tests
};
const testCFNErrorMessages = { messages: [testCFNError1, testCFNError2] };

describe('cfn error serializer', () => {
  it('deserialize error multiline', () => {
    let errorDetails = 'Name: S3Bucket (AWS::S3::Bucket), Event Type: create, Reason: some-bucket-dev already exists\n';
    errorDetails += 'Name: functionnotifyForNewUser (AWS::CloudFormation::Stack), Event Type: create, Reason: param1 must have values';
    const deserializedErrorMessages: CFNErrorMessages = deserializeErrorMessages(errorDetails);
    expect(deserializedErrorMessages.messages.length).toBe(2);
    expect(deserializedErrorMessages.messages[0].name).toBe('S3Bucket (AWS::S3::Bucket)');
    expect(deserializedErrorMessages.messages[0].eventType).toBe('create');
    expect(deserializedErrorMessages.messages[0].reason).toBe('some-bucket-dev already exists');
    expect(deserializedErrorMessages.messages[1].name).toBe('functionnotifyForNewUser (AWS::CloudFormation::Stack)');
    expect(deserializedErrorMessages.messages[1].eventType).toBe('create');
    expect(deserializedErrorMessages.messages[1].reason).toBe('param1 must have values');
  });

  it('serialize then deserialize to reconstruct the same object', () => {
    expect(deserializeErrorMessages(serializeErrorMessages(testCFNErrorMessages))).toEqual(testCFNErrorMessages);
  });
});

describe('collectStackErrorMessages', () => {
  it('collect messages when no custom stacks present', () => {
    const errorDetail = collectStackErrorMessages(eventsWithFailure, []);
    testCFNError1.isCustomResource = false;
    testCFNError2.isCustomResource = false;
    expect(errorDetail).toEqual(serializeErrorMessages(testCFNErrorMessages));
  });

  it('collect messages when custom stacks present', () => {
    const errorDetail = collectStackErrorMessages(eventsWithFailure, ['testStackId2']);
    testCFNError1.isCustomResource = false;
    testCFNError2.isCustomResource = true; // because testStackId2 present in the list of custom resources, this is expected to be true
    expect(errorDetail).toEqual(serializeErrorMessages(testCFNErrorMessages));
  });
});
