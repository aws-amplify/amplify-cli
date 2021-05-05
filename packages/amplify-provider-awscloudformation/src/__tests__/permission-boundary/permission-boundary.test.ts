import { $TSContext } from 'amplify-cli-core';
import { configurePermissionBoundaryForInit } from '../../permission-boundary/permission-boundary';
import { setPermissionBoundaryArn, getPermissionBoundaryArn } from 'amplify-cli-core';
import { prompt } from 'inquirer';
import { getIAMClient } from '../../aws-utils/aws-iam';
import { IAM } from 'aws-sdk';

const permissionBoundaryArn = 'arn:aws:iam::123456789012:policy/some-policy-name';
const argName = 'permission-boundary';
const envName = 'newEnvName';

jest.mock('amplify-cli-core');
jest.mock('inquirer');
jest.mock('../../aws-utils/aws-iam');

const setPermissionBoundaryArn_mock = setPermissionBoundaryArn as jest.MockedFunction<typeof setPermissionBoundaryArn>;
const getPermissionBoundaryArn_mock = getPermissionBoundaryArn as jest.MockedFunction<typeof getPermissionBoundaryArn>;
const prompt_mock = prompt as jest.MockedFunction<typeof prompt>;
const getIAMClient_mock = getIAMClient as jest.MockedFunction<typeof getIAMClient>;

describe('configure permission boundary on init', () => {
  let context_stub: $TSContext;

  beforeEach(() => {
    context_stub = ({
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
    } as unknown) as $TSContext;
    jest.clearAllMocks();
  });
  it('applies policy specifed in cmd arg when present', async () => {
    context_stub.input.options[argName] = permissionBoundaryArn;
    await configurePermissionBoundaryForInit(context_stub);
    expect(setPermissionBoundaryArn_mock.mock.calls[0][0]).toEqual(permissionBoundaryArn);
  });

  it('does not prompt for policy', async () => {
    await configurePermissionBoundaryForInit(context_stub);
    expect(setPermissionBoundaryArn_mock.mock.calls[0][0]).toBeUndefined();
    expect(prompt_mock).not.toHaveBeenCalled();
  });
});

describe('configure permission boundary on env add', () => {
  let context_stub: $TSContext;

  beforeEach(() => {
    context_stub = ({
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
    } as unknown) as $TSContext;
    jest.clearAllMocks();
  });
  it('applies policy specified in cmd arg when present', async () => {
    context_stub.input.options[argName] = permissionBoundaryArn;
    await configurePermissionBoundaryForInit(context_stub);
    expect(setPermissionBoundaryArn_mock.mock.calls[0][0]).toEqual(permissionBoundaryArn);
  });

  it('does nothing when no cmd arg specified and no policy in current env', async () => {
    await configurePermissionBoundaryForInit(context_stub);
    expect(setPermissionBoundaryArn_mock).not.toHaveBeenCalled();
    expect(prompt_mock).not.toHaveBeenCalled();
  });

  it('applies existing policy to new env when existing policy is accessible', async () => {
    getPermissionBoundaryArn_mock.mockReturnValueOnce(permissionBoundaryArn);
    getIAMClient_mock.mockResolvedValueOnce(({
      getPolicy: jest.fn().mockReturnValueOnce({
        promise: jest.fn(),
      }),
    } as unknown) as IAM);
    await configurePermissionBoundaryForInit(context_stub);
    expect(setPermissionBoundaryArn_mock.mock.calls[0][0]).toEqual(permissionBoundaryArn);
    expect(prompt_mock).not.toHaveBeenCalled();
  });

  it('prompts for new policy when existing one is not accessible', async () => {
    getPermissionBoundaryArn_mock.mockReturnValueOnce(permissionBoundaryArn);
    getIAMClient_mock.mockResolvedValueOnce(({
      getPolicy: jest.fn().mockReturnValueOnce({
        promise: jest.fn().mockRejectedValueOnce('test error'),
      }),
    } as unknown) as IAM);
    const newPermissionBoundaryArn = 'thisIsANewArn';
    prompt_mock.mockResolvedValueOnce({
      permissionBoundaryArn: newPermissionBoundaryArn,
    });
    await configurePermissionBoundaryForInit(context_stub);
    expect(setPermissionBoundaryArn_mock.mock.calls[0][0]).toEqual(newPermissionBoundaryArn);
  });

  it('fails when existing policy not accessible and --yes specified with no cmd arg', async () => {
    context_stub.input.options.yes = true;
    getPermissionBoundaryArn_mock.mockReturnValueOnce(permissionBoundaryArn);
    getIAMClient_mock.mockResolvedValueOnce(({
      getPolicy: jest.fn().mockReturnValueOnce({
        promise: jest.fn().mockRejectedValueOnce('test error'),
      }),
    } as unknown) as IAM);
    await expect(configurePermissionBoundaryForInit(context_stub)).rejects.toMatchInlineSnapshot(
      `[Error: A Permission Boundary ARN must be specified using --permission-boundary]`,
    );
    expect(prompt_mock).not.toHaveBeenCalled();
  });
});
