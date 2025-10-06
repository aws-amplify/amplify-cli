import { $TSContext, setPermissionsBoundaryArn, getPermissionsBoundaryArn, stateManager } from '@aws-amplify/amplify-cli-core';
import { prompt } from 'inquirer';
import { GetPolicyCommand, IAMClient as IAM } from '@aws-sdk/client-iam';
import { configurePermissionsBoundaryForInit } from '../../permissions-boundary/permissions-boundary';
import { IAMClient } from '../../aws-utils/aws-iam';
import { mockClient } from 'aws-sdk-client-mock';
import 'aws-sdk-client-mock-jest';

const permissionsBoundaryArn = 'arn:aws:iam::123456789012:policy/some-policy-name';
const argName = 'permissions-boundary';
const envName = 'newEnvName';

jest.mock('@aws-amplify/amplify-cli-core', () => ({
  ...(jest.requireActual('@aws-amplify/amplify-cli-core') as {}),
  stateManager: {
    getLocalEnvInfo: jest.fn(),
  },
  setPermissionsBoundaryArn: jest.fn(),
  getPermissionsBoundaryArn: jest.fn(),
}));

jest.mock('inquirer');
jest.mock('../../aws-utils/aws-iam');

const setPermissionsBoundaryArn_mock = setPermissionsBoundaryArn as jest.MockedFunction<typeof setPermissionsBoundaryArn>;
const getPermissionsBoundaryArn_mock = getPermissionsBoundaryArn as jest.MockedFunction<typeof getPermissionsBoundaryArn>;
const prompt_mock = prompt as jest.MockedFunction<typeof prompt>;
const IAMClient_mock = IAMClient as jest.Mocked<typeof IAMClient>;
const stateManager_mock = stateManager as jest.Mocked<typeof stateManager>;
const mockIAMClient = mockClient(IAM);

stateManager_mock.getLocalEnvInfo.mockReturnValue({ envName: 'testenv' });

describe('configure permissions boundary on init', () => {
  let context_stub: $TSContext;

  beforeEach(() => {
    context_stub = {
      amplify: {
        inputValidation: () => () => true,
      },
      exeInfo: {
        isNewProject: true,
        isNewEnv: true,
        localEnvInfo: {
          envName,
        },
      },
      input: {
        options: {},
      },
      print: {
        error: jest.fn(),
        warning: jest.fn(),
        info: jest.fn(),
      },
    } as unknown as $TSContext;
    jest.clearAllMocks();
    mockIAMClient.reset();
  });
  it('applies policy specifed in cmd arg when present', async () => {
    context_stub.input.options[argName] = permissionsBoundaryArn;
    await configurePermissionsBoundaryForInit(context_stub);
    expect(setPermissionsBoundaryArn_mock.mock.calls[0][0]).toEqual(permissionsBoundaryArn);
  });

  it('does not prompt for policy', async () => {
    await configurePermissionsBoundaryForInit(context_stub);
    expect(setPermissionsBoundaryArn_mock.mock.calls[0][0]).toBeUndefined();
    expect(prompt_mock).not.toHaveBeenCalled();
  });
});

describe('configure permissions boundary on env add', () => {
  let context_stub: $TSContext;

  beforeEach(() => {
    context_stub = {
      amplify: {
        inputValidation: () => () => true,
      },
      exeInfo: {
        isNewProject: false,
        isNewEnv: true,
        localEnvInfo: {
          envName,
        },
      },
      input: {
        options: {},
      },
      print: {
        error: jest.fn(),
        warning: jest.fn(),
        info: jest.fn(),
      },
    } as unknown as $TSContext;
    jest.clearAllMocks();
  });
  it('applies policy specified in cmd arg when present', async () => {
    context_stub.input.options[argName] = permissionsBoundaryArn;
    await configurePermissionsBoundaryForInit(context_stub);
    expect(setPermissionsBoundaryArn_mock.mock.calls[0][0]).toEqual(permissionsBoundaryArn);
  });

  it('does nothing when no cmd arg specified and no policy in current env', async () => {
    await configurePermissionsBoundaryForInit(context_stub);
    expect(setPermissionsBoundaryArn_mock).not.toHaveBeenCalled();
    expect(prompt_mock).not.toHaveBeenCalled();
  });

  it('applies existing policy to new env when existing policy is accessible', async () => {
    getPermissionsBoundaryArn_mock.mockReturnValueOnce(permissionsBoundaryArn);
    IAMClient_mock.getInstance.mockResolvedValueOnce({
      client: mockIAMClient as unknown as IAM,
    });
    mockIAMClient.on(GetPolicyCommand).resolvesOnce({});
    await configurePermissionsBoundaryForInit(context_stub);
    expect(setPermissionsBoundaryArn_mock.mock.calls[0][0]).toEqual(permissionsBoundaryArn);
    expect(prompt_mock).not.toHaveBeenCalled();
  });

  it('prompts for new policy when existing one is not accessible', async () => {
    getPermissionsBoundaryArn_mock.mockReturnValueOnce(permissionsBoundaryArn);
    IAMClient_mock.getInstance.mockResolvedValueOnce({
      client: mockIAMClient as unknown as IAM,
    });
    mockIAMClient.on(GetPolicyCommand).rejects({ name: 'NoSuchEntityException', message: 'test error' });
    const newPermissionsBoundaryArn = 'thisIsANewArn';
    prompt_mock.mockResolvedValueOnce({
      permissionsBoundaryArn: newPermissionsBoundaryArn,
    });
    await configurePermissionsBoundaryForInit(context_stub);
    expect(setPermissionsBoundaryArn_mock.mock.calls[0][0]).toEqual(newPermissionsBoundaryArn);
  });

  it('fails when existing policy not accessible and --yes specified with no cmd arg', async () => {
    context_stub.input.options.yes = true;
    getPermissionsBoundaryArn_mock.mockReturnValueOnce(permissionsBoundaryArn);
    IAMClient_mock.getInstance.mockResolvedValueOnce({
      client: mockIAMClient as unknown as IAM,
    });
    mockIAMClient.on(GetPolicyCommand).rejects({ name: 'NoSuchEntityException', message: 'test error' });
    await expect(configurePermissionsBoundaryForInit(context_stub)).rejects.toMatchInlineSnapshot(
      `[InputValidationError: A permissions boundary ARN must be specified using --permissions-boundary]`,
    );
    expect(prompt_mock).not.toHaveBeenCalled();
  });
});
