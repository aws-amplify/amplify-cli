import { getUserPoolGroupList } from '../../../extensions/amplify-helpers/get-userpoolgroup-list';

jest.mock('amplify-cli-core', () => ({
  pathManager: {
    getBackendDirPath: jest.fn().mockImplementation(() => ''),
  },
  JSONUtilities: {
    readJson: jest.fn().mockImplementation(() => [
      {
        groupName: 'Admins',
        precedence: 1,
        customPolicies: [
          {
            PolicyName: 'admin-group-policy',
            PolicyDocument: {
              Version: '2012-10-17',
              Statement: [
                {
                  Sid: 'statement1',
                  Effect: 'Allow',
                  Action: ['s3:CreateBucket'],
                  Resource: ['arn:aws:s3:::*'],
                },
              ],
            },
          },
        ],
      },
      {
        groupName: 'Editors',
        precedence: 2,
      },
    ]),
  },
}));

describe('getUserPoolGroupList', () => {
  const mock_context = {};
  it('should return array of groupNames', () => {
    const userPoolGroupList = getUserPoolGroupList(mock_context);
    expect(userPoolGroupList).toStrictEqual(['Admins', 'Editors']);
  });
});
