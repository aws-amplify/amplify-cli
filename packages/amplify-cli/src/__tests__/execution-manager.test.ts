import * as fs from 'fs-extra';
import path from 'path';
import { AmplifyEvent, PluginManifest, PluginPlatform } from '@aws-amplify/amplify-cli-core';
import { CLIInput as CommandLineInput } from '../domain/command-input';
import { Context } from '../domain/context';
import { PluginInfo } from '@aws-amplify/amplify-cli-core';
import { executeCommand } from '../execution-manager';
import { printer } from '@aws-amplify/amplify-prompts';

jest.mock('@aws-amplify/amplify-prompts');

const handleAmplifyEventMock = jest.fn();
jest.mock('../../__mocks__/faked-plugin', () => ({
  executeAmplifyCommand: jest.fn(),
  handleAmplifyEvent: handleAmplifyEventMock,
}));

describe('execution manager', () => {
  const mockFs = fs as jest.Mocked<typeof fs>;
  const mockContext = jest.createMockFromModule<Context>('../domain/context');

  mockContext.input = new CommandLineInput([
    '/Users/userName/.nvm/versions/node/v8.11.4/bin/node',
    '/Users/userName/.nvm/versions/node/v8.11.4/bin/amplify',
    'push',
  ]);
  mockContext.input.plugin = 'core';
  mockContext.pluginPlatform = new PluginPlatform();

  mockContext.pluginPlatform.plugins.core = [
    new PluginInfo(
      '@aws-amplify/cli-internal',
      'latestVersion',
      path.join(__dirname, '../../__mocks__/faked-plugin.js'),
      new PluginManifest('core', 'core', undefined, undefined, ['init', 'push', 'pull', 'models']),
    ),
  ];

  const eventPluginManifest = new PluginManifest('test-event-plugin', 'util');
  eventPluginManifest.eventHandlers = [
    AmplifyEvent.PrePush,
    AmplifyEvent.PreInit,
    AmplifyEvent.PrePull,
    AmplifyEvent.PreCodegenModels,
    AmplifyEvent.PostPush,
    AmplifyEvent.PostInit,
    AmplifyEvent.PostPull,
    AmplifyEvent.PostCodegenModels,
  ];
  mockContext.pluginPlatform.plugins.testEvent = [
    new PluginInfo('', '1.0.0', path.join(__dirname, '../../__mocks__/faked-plugin.js'), eventPluginManifest),
  ];
  mockContext.usageData = {
    init: jest.fn(),
    setIsHeadless: jest.fn(),
    emitError: jest.fn(),
    emitAbort: jest.fn(),
    emitSuccess: jest.fn(),
    startCodePathTimer: jest.fn(),
    stopCodePathTimer: jest.fn(),
    pushHeadlessFlow: jest.fn(),
    pushInteractiveFlow: jest.fn(),
    getFlowReport: jest.fn(),
    assignProjectIdentifier: jest.fn(),
    getUsageDataPayload: jest.fn(),
    calculatePushNormalizationFactor: jest.fn(),
    getSessionUuid: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockContext.parameters = { options: {} };
  });

  it.each([
    ['init', { event: AmplifyEvent.PreInit, data: {} }],
    ['push', { event: AmplifyEvent.PrePush, data: {} }],
    ['pull', { event: AmplifyEvent.PrePull, data: {} }],
    ['models', { event: AmplifyEvent.PreCodegenModels, data: {} }],
  ])('executeCommand raise pre %s event', async (command, args) => {
    mockFs.readdirSync.mockReturnValue([]);
    mockFs.existsSync.mockReturnValue(true);
    mockContext.input.command = command;
    await executeCommand(mockContext);
    expect(handleAmplifyEventMock).toBeCalledWith(mockContext, args);
  });

  it.each([
    ['init', { event: AmplifyEvent.PostInit, data: {} }],
    ['push', { event: AmplifyEvent.PostPush, data: {} }],
    ['pull', { event: AmplifyEvent.PostPull, data: {} }],
    ['models', { event: AmplifyEvent.PostCodegenModels, data: {} }],
  ])('executeCommand raise post %s event', async (command, args) => {
    mockFs.readdirSync.mockReturnValue([]);
    mockFs.existsSync.mockReturnValue(true);
    mockContext.input.command = command;
    await executeCommand(mockContext);
    expect(handleAmplifyEventMock).toBeCalledWith(mockContext, args);
  });

  it.each([[AmplifyEvent.PreCodegenModels], [AmplifyEvent.PostCodegenModels]])(
    'executeCommand skips %s when target and model-schema parameters are provided',
    async (event) => {
      mockFs.readdirSync.mockReturnValue([]);
      mockFs.existsSync.mockReturnValue(true);
      mockContext.input.command = 'models';
      mockContext.parameters.options = { target: 'javascript', 'model-schema': 'schema.graphql' };
      await executeCommand(mockContext);
      expect(printer.info).toBeCalledWith(expect.stringContaining(`Skipping ${event}`));
      expect(handleAmplifyEventMock).not.toBeCalledWith(mockContext, { event, data: {} });
    },
  );
});
