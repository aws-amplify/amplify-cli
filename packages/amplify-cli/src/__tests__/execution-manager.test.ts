import * as fs from 'fs-extra';
import path from 'path';
import {
  AmplifyEvent,
  AmplifyEventArgs,
  AmplifyPostCodegenModelsEventData,
  AmplifyPostInitEventData,
  AmplifyPostPullEventData,
  AmplifyPostPushEventData,
  AmplifyPreCodegenModelsEventData,
  AmplifyPreInitEventData,
  AmplifyPrePullEventData,
  AmplifyPrePushEventData,
} from '../domain/amplify-event';
import { Context } from '../domain/context';
import { Input } from '../domain/input';
import { PluginInfo } from '../domain/plugin-info';
import { PluginManifest } from '../domain/plugin-manifest';
import { PluginPlatform } from '../domain/plugin-platform';
import { executeCommand } from '../execution-manager';

const handleAmplifyEventMock = jest.fn();
jest.mock('../../__mocks__/faked-plugin', () => ({
  executeAmplifyCommand: jest.fn(),
  handleAmplifyEvent: handleAmplifyEventMock,
}));

describe('execution manager', () => {
  const mockFs = (fs as jest.Mocked<typeof fs>);
  const mockContext = jest.createMockFromModule<Context>('../domain/context');

  mockContext.input = new Input([
    '/Users/userName/.nvm/versions/node/v8.11.4/bin/node',
    '/Users/userName/.nvm/versions/node/v8.11.4/bin/amplify',
    'push',
  ]);
  mockContext.input.plugin = 'core';
  mockContext.pluginPlatform = new PluginPlatform();

  mockContext.pluginPlatform.plugins.core = [
    new PluginInfo('@aws-amplify/cli-internal',
      'latestVersion',
      path.join(__dirname, '../../__mocks__/faked-plugin.js'),
      new PluginManifest('core', 'core', undefined, undefined, ['init', 'push', 'pull', 'models'])),
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
    new PluginInfo(
      '',
      '1.0.0',
      path.join(__dirname, '../../__mocks__/faked-plugin.js'),
      eventPluginManifest,
    ),
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
  });

  it.each([
    ['init', new AmplifyEventArgs(AmplifyEvent.PreInit, new AmplifyPreInitEventData())],
    ['push', new AmplifyEventArgs(AmplifyEvent.PrePush, new AmplifyPrePushEventData())],
    ['pull', new AmplifyEventArgs(AmplifyEvent.PrePull, new AmplifyPrePullEventData())],
    ['models', new AmplifyEventArgs(AmplifyEvent.PreCodegenModels, new AmplifyPreCodegenModelsEventData())],
  ])('executeCommand raise pre %s event', async (command, args) => {
    mockFs.existsSync.mockReturnValue(true);
    mockContext.input.command = command;
    await executeCommand(mockContext);
    expect(handleAmplifyEventMock)
      .toBeCalledWith(mockContext, args);
  });

  it.each([
    ['init', new AmplifyEventArgs(AmplifyEvent.PostInit, new AmplifyPostInitEventData())],
    ['push', new AmplifyEventArgs(AmplifyEvent.PostPush, new AmplifyPostPushEventData())],
    ['pull', new AmplifyEventArgs(AmplifyEvent.PostPull, new AmplifyPostPullEventData())],
    ['models', new AmplifyEventArgs(AmplifyEvent.PostCodegenModels, new AmplifyPostCodegenModelsEventData())],
  ])('executeCommand raise post %s event', async (command, args) => {
    mockFs.existsSync.mockReturnValue(true);
    mockContext.input.command = command;
    await executeCommand(mockContext);
    expect(handleAmplifyEventMock)
      .toBeCalledWith(mockContext, args);
  });
});
