jest.mock('../lib/category-manager');

const inquirer = require('inquirer');
const mockirer = require('mockirer');

const categoryManager = require('../lib/category-manager');

const indexModule = require('../index');

describe('index', () => {
  const mockContext = {
    print: {
      info: jest.fn(),
      warning: jest.fn(),
      error: jest.fn(),
      success: jest.fn(),
    },
  };
  const S3ANDCLOUDFRONT = 'S3AndCloudFront';
  const ANOTHERSERVICE = 'AnotherHostingService';

  const mockAvailableServices = [];
  let mockDisabledServices = [];
  let mockEnabledServices = [];

  const mockAnswers = {
    selectedServices: [],
  };

  beforeAll(() => {
    categoryManager.getCategoryStatus = jest.fn(() => {
      return {
        availableServices: mockAvailableServices,
        enabledServices: mockEnabledServices,
        disabledServices: mockDisabledServices,
      };
    });
  });

  beforeEach(() => {
    mockAvailableServices.length = 0;
    mockDisabledServices.length = 0;
    mockEnabledServices.length = 0;
    mockAnswers.selectedServices.length = 0;
    mockAnswers.selectedService = undefined;
    categoryManager.runServiceAction.mockClear();
  });

  test('add', async () => {
    mockAvailableServices.push(S3ANDCLOUDFRONT);
    mockAvailableServices.push(ANOTHERSERVICE);
    mockDisabledServices.push(S3ANDCLOUDFRONT);
    mockDisabledServices.push(ANOTHERSERVICE);
    mockAnswers.selectedServices.push(S3ANDCLOUDFRONT);
    mockirer(inquirer, mockAnswers);
    await indexModule.add(mockContext);
    expect(categoryManager.runServiceAction).toBeCalled();
  });

  test('add, only one disabled serivce', async () => {
    mockAvailableServices.push(S3ANDCLOUDFRONT);
    mockDisabledServices.push(S3ANDCLOUDFRONT);
    await indexModule.add(mockContext);
    expect(categoryManager.runServiceAction).toBeCalled();
    expect(categoryManager.runServiceAction.mock.calls[0][0]).toBe(mockContext);
    expect(categoryManager.runServiceAction.mock.calls[0][1]).toBe(S3ANDCLOUDFRONT);
    expect(categoryManager.runServiceAction.mock.calls[0][2]).toBe('enable');
  });

  test('add, no disabled service', async () => {
    mockAvailableServices.push(S3ANDCLOUDFRONT);
    mockEnabledServices.push(S3ANDCLOUDFRONT);

    await expect(indexModule.add(mockContext)).rejects.toThrow();
    expect(categoryManager.runServiceAction).not.toBeCalled();
  });

  test('add, no available service', async () => {
    await expect(indexModule.add(mockContext)).rejects.toThrow();
    expect(categoryManager.runServiceAction).not.toBeCalled();
  });

  test('configure', async () => {
    mockAvailableServices.push(S3ANDCLOUDFRONT);
    mockAvailableServices.push(ANOTHERSERVICE);
    mockEnabledServices.push(S3ANDCLOUDFRONT);
    mockEnabledServices.push(ANOTHERSERVICE);
    mockAnswers.selectedServices.push(S3ANDCLOUDFRONT);
    mockirer(inquirer, mockAnswers);
    await indexModule.configure(mockContext);
    expect(categoryManager.runServiceAction).toBeCalled();
  });

  test('configure, only one enabled serivce', async () => {
    mockAvailableServices.push(S3ANDCLOUDFRONT);
    mockEnabledServices.push(S3ANDCLOUDFRONT);
    await indexModule.configure(mockContext);
    expect(categoryManager.runServiceAction).toBeCalled();
    expect(categoryManager.runServiceAction.mock.calls[0][0]).toBe(mockContext);
    expect(categoryManager.runServiceAction.mock.calls[0][1]).toBe(S3ANDCLOUDFRONT);
    expect(categoryManager.runServiceAction.mock.calls[0][2]).toBe('configure');
  });

  test('configure, no enabled service', async () => {
    mockAvailableServices.push(S3ANDCLOUDFRONT);

    await expect(indexModule.configure(mockContext)).rejects.toThrow();
    expect(categoryManager.runServiceAction).not.toBeCalled();
  });

  test('configure, no available service', async () => {
    await expect(indexModule.configure(mockContext)).rejects.toThrow();
    expect(categoryManager.runServiceAction).not.toBeCalled();
  });

  test('publish', async () => {
    mockAvailableServices.push(S3ANDCLOUDFRONT);
    mockEnabledServices.push(S3ANDCLOUDFRONT);
    await indexModule.publish(mockContext, S3ANDCLOUDFRONT);
    expect(categoryManager.runServiceAction).toBeCalled();
    expect(categoryManager.runServiceAction.mock.calls[0][0]).toBe(mockContext);
    expect(categoryManager.runServiceAction.mock.calls[0][1]).toBe(S3ANDCLOUDFRONT);
    expect(categoryManager.runServiceAction.mock.calls[0][2]).toBe('publish');
  });

  test('publish, expected service no enabled', () => {
    mockAvailableServices.push(S3ANDCLOUDFRONT);
    mockAvailableServices.push(ANOTHERSERVICE);
    mockEnabledServices.push(ANOTHERSERVICE);
    mockDisabledServices.push(S3ANDCLOUDFRONT);

    expect(() => {
      indexModule.publish(mockContext, S3ANDCLOUDFRONT);
    }).toThrow();
    expect(categoryManager.runServiceAction).not.toBeCalled();
  });

  test('publish, no enabled service', () => {
    mockAvailableServices.push(S3ANDCLOUDFRONT);

    expect(() => {
      indexModule.publish(mockContext, S3ANDCLOUDFRONT);
    }).toThrow();
    expect(categoryManager.runServiceAction).not.toBeCalled();
  });

  test('console', async () => {
    mockAvailableServices.push(S3ANDCLOUDFRONT);
    mockAvailableServices.push(ANOTHERSERVICE);
    mockEnabledServices.push(S3ANDCLOUDFRONT);
    mockEnabledServices.push(ANOTHERSERVICE);
    mockAnswers.selectedService = mockEnabledServices[0];
    mockirer(inquirer, mockAnswers);
    await indexModule.console(mockContext);
    expect(categoryManager.runServiceAction).toBeCalled();
    expect(categoryManager.runServiceAction.mock.calls[0][0]).toBe(mockContext);
    expect(categoryManager.runServiceAction.mock.calls[0][1]).toBe(mockEnabledServices[0]);
    expect(categoryManager.runServiceAction.mock.calls[0][2]).toBe('console');
  });

  test('console, only one enabled serivce', async () => {
    mockAvailableServices.push(S3ANDCLOUDFRONT);
    mockEnabledServices.push(S3ANDCLOUDFRONT);
    await indexModule.console(mockContext);
    expect(categoryManager.runServiceAction).toBeCalled();
    expect(categoryManager.runServiceAction.mock.calls[0][0]).toBe(mockContext);
    expect(categoryManager.runServiceAction.mock.calls[0][1]).toBe(S3ANDCLOUDFRONT);
    expect(categoryManager.runServiceAction.mock.calls[0][2]).toBe('console');
  });

  test('console, no enabled service', async () => {
    mockAvailableServices.push(S3ANDCLOUDFRONT);
    mockDisabledServices.push(S3ANDCLOUDFRONT);

    await expect(indexModule.console(mockContext)).rejects.toThrow();
    expect(categoryManager.runServiceAction).not.toBeCalled();
  });

  test('console, no available service', async () => {
    await expect(indexModule.console(mockContext)).rejects.toThrow();
    expect(categoryManager.runServiceAction).not.toBeCalled();
  });

  test('migrate', async () => {
    await indexModule.migrate(mockContext);
    expect(categoryManager.migrate).toBeCalledWith(mockContext);
  });
});
