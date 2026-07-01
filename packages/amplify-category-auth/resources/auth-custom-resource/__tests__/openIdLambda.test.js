/* eslint-disable @typescript-eslint/no-var-requires */

// In-memory IAM OIDC provider state driven by the mocked client.
// Must be prefixed with `mock` so jest allows referencing it inside the jest.mock factory.
const mockState = { providers: {} };

jest.mock('cfn-response', () => ({
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  send: jest.fn((event, context, status, data) => {
    context.__result = { status, data };
  }),
}), { virtual: true });

jest.mock('@aws-sdk/client-iam', () => {
  class NoSuchEntityException extends Error {
    constructor(message) {
      super(message);
      this.name = 'NoSuchEntityException';
    }
  }
  const mkCmd = (name) =>
    class {
      constructor(input) {
        this.input = input;
        this.__name = name;
      }
    };
  const send = jest.fn(async (cmd) => {
    switch (cmd.__name) {
      case 'List':
        return { OpenIDConnectProviderList: Object.keys(mockState.providers).map((Arn) => ({ Arn })) };
      case 'Create': {
        const host = cmd.input.Url.replace('https://', '');
        const Arn = `arn:aws:iam::123456789012:oidc-provider/${host}`;
        mockState.providers[Arn] = { ClientIDList: [...cmd.input.ClientIDList] };
        return { OpenIDConnectProviderArn: Arn };
      }
      case 'Get': {
        const p = mockState.providers[cmd.input.OpenIDConnectProviderArn];
        if (!p) throw new NoSuchEntityException('no provider');
        return { ClientIDList: [...p.ClientIDList] };
      }
      case 'Add': {
        const p = mockState.providers[cmd.input.OpenIDConnectProviderArn];
        if (!p) throw new NoSuchEntityException('no provider');
        if (!p.ClientIDList.includes(cmd.input.ClientID)) p.ClientIDList.push(cmd.input.ClientID);
        return {};
      }
      case 'Remove': {
        const p = mockState.providers[cmd.input.OpenIDConnectProviderArn];
        if (!p) throw new NoSuchEntityException('no provider');
        const i = p.ClientIDList.indexOf(cmd.input.ClientID);
        if (i === -1) throw new NoSuchEntityException('no client id');
        p.ClientIDList.splice(i, 1);
        return {};
      }
      case 'Delete': {
        if (!mockState.providers[cmd.input.OpenIDConnectProviderArn]) throw new NoSuchEntityException('no provider');
        delete mockState.providers[cmd.input.OpenIDConnectProviderArn];
        return {};
      }
      default:
        throw new Error(`unexpected command ${cmd.__name}`);
    }
  });
  return {
    NoSuchEntityException,
    IAMClient: jest.fn(() => ({ send })),
    ListOpenIDConnectProvidersCommand: mkCmd('List'),
    CreateOpenIDConnectProviderCommand: mkCmd('Create'),
    GetOpenIDConnectProviderCommand: mkCmd('Get'),
    AddClientIDToOpenIDConnectProviderCommand: mkCmd('Add'),
    RemoveClientIDFromOpenIDConnectProviderCommand: mkCmd('Remove'),
    DeleteOpenIDConnectProviderCommand: mkCmd('Delete'),
    __send: send,
  };
}, { virtual: true });

const iamMock = require('@aws-sdk/client-iam');
const { handler } = require('../openIdLambda');

const URL = 'https://accounts.google.com';

// The handler is intentionally fire-and-forget (returns void, calls cfn-response.send when done).
// Flush pending microtasks until cfn-response.send populates the result.
async function invoke(event) {
  const context = {};
  handler(event, context);
  for (let i = 0; i < 100 && !context.__result; i++) {
    // eslint-disable-next-line no-await-in-loop
    await new Promise((r) => setImmediate(r));
  }
  return context.__result;
}

describe('openIdLambda custom resource', () => {
  beforeEach(() => {
    mockState.providers = {};
    iamMock.__send.mockClear();
  });

  it('creates the OIDC provider on Create', async () => {
    const res = await invoke({ RequestType: 'Create', ResourceProperties: { clientIdList: 'a,b', url: URL } });
    expect(res.status).toBe('SUCCESS');
    const arns = Object.keys(mockState.providers);
    expect(arns).toHaveLength(1);
    expect(mockState.providers[arns[0]].ClientIDList).toEqual(['a', 'b']);
  });

  it('deletes the OIDC provider on Delete when this stack is the sole owner', async () => {
    await invoke({ RequestType: 'Create', ResourceProperties: { clientIdList: 'a,b', url: URL } });
    const res = await invoke({ RequestType: 'Delete', ResourceProperties: { clientIdList: 'a,b', url: URL } });
    expect(res.status).toBe('SUCCESS');
    expect(Object.keys(mockState.providers)).toHaveLength(0);
  });

  it('retains a shared provider and removes only this stacks client IDs on Delete', async () => {
    await invoke({ RequestType: 'Create', ResourceProperties: { clientIdList: 'a', url: URL } });
    const arn = Object.keys(mockState.providers)[0];
    mockState.providers[arn].ClientIDList.push('otherApp');
    const res = await invoke({ RequestType: 'Delete', ResourceProperties: { clientIdList: 'a', url: URL } });
    expect(res.status).toBe('SUCCESS');
    expect(Object.keys(mockState.providers)).toHaveLength(1);
    expect(mockState.providers[arn].ClientIDList).toEqual(['otherApp']);
  });

  it('is idempotent when the provider is already gone', async () => {
    const res = await invoke({ RequestType: 'Delete', ResourceProperties: { clientIdList: 'a', url: URL } });
    expect(res.status).toBe('SUCCESS');
    expect(Object.keys(mockState.providers)).toHaveLength(0);
  });
});
