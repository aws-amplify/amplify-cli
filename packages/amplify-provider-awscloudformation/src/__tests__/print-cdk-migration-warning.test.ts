import { $TSObject, $TSContext } from "amplify-cli-core";
import * as fs from "fs-extra";
import { printer } from "amplify-prompts";
import { printCdkMigrationWarning } from "../print-cdk-migration-warning";

const detectAffectedDirectDependenciesMock = jest.fn();

jest.mock("amplify-prompts");

jest.mock("fs-extra");

const fsMock = fs as jest.Mocked<typeof fs>;

const printerMock = printer as jest.Mocked<typeof printer>;

jest.mock("amplify-cli-core", () => ({
  ...(jest.requireActual("amplify-cli-core") as $TSObject),
  pathManager: {
    getBackendDirPath: jest.fn().mockReturnValue("mockDirPath"),
    getResourceOverrideFilePath: jest.fn().mockReturnValue("mockDirPath/override.ts")
  },
  AmplifyCategories: {
    STORAGE: "storage",
    API: "api",
    AUTH: "auth",
    FUNCTION: "function",
    HOSTING: "hosting",
    INTERACTIONS: "interactions",
    NOTIFICATIONS: "notifications",
    PREDICTIONS: "predictions",
    ANALYTICS: "analytics",
    CUSTOM: "custom"
  },
  AmplifyNodePkgDetector: jest.fn().mockImplementation(() => ({
    detectAffectedDirectDependencies: detectAffectedDirectDependenciesMock
  }))
}));

const inputPayload = {
  a: {
    name: "b",
    version: "x.y.z"
  }
};

const mockContext = {
  amplify: {
    getResourceStatus: jest.fn()
  }
};

describe("print migration warning tests", () => {
  beforeEach(() => jest.clearAllMocks());

  it("no migration message when there are no override and custom resources", async () => {
    const resourcesToBeCreated = [
      {
        category: "function",
        resourceName: "someResource",
        service: "Lambda"
      }
    ];
    const resourcesToBeDeleted = [
      {
        category: "auth",
        resourceName: "someResource1",
        service: "Cognito"
      }
    ];
    const resourcesToBeUpdated = [
      {
        category: "storage",
        resourceName: "someResource2",
        service: "S3"
      }
    ];

    const allResources = [...resourcesToBeCreated, ...resourcesToBeDeleted, ...resourcesToBeUpdated];
    mockContext.amplify.getResourceStatus.mockResolvedValue({ allResources });
    // amplify-node-detector plug
    detectAffectedDirectDependenciesMock.mockReturnValue(undefined);
    // override plug
    fsMock.existsSync.mockReturnValue(false);
    printerMock.warn.mockReturnValue(undefined);
    await printCdkMigrationWarning((mockContext as unknown) as $TSContext);
    expect(printerMock.warn).not.toBeCalled();
  });

  it("migration message when there are only custom resources", async () => {
    const resourcesToBeCreated = [
      {
        category: "auth",
        resourceName: "someResource",
        service: "Cognito"
      }
    ];
    const resourcesToBeDeleted = [
      {
        category: "custom",
        resourceName: "someResource1",
        service: "mockService"
      }
    ];
    const resourcesToBeUpdated = [
      {
        category: "custom",
        resourceName: "someResource2",
        service: "mockService2"
      }
    ];

    const allResources = [...resourcesToBeCreated, ...resourcesToBeDeleted, ...resourcesToBeUpdated];
    mockContext.amplify.getResourceStatus.mockResolvedValue({ allResources });
    detectAffectedDirectDependenciesMock.mockReturnValue(inputPayload);
    fsMock.existsSync.mockReturnValue(false);
    printerMock.warn.mockReturnValue(undefined);
    await printCdkMigrationWarning((mockContext as unknown) as $TSContext);
    expect(printerMock.warn.mock.calls[0][0]).toMatchInlineSnapshot(`
      "
      We detected that you are using CDK v1 with custom stacks and overrides.AWS CDK v1 has entered maintenance mode on June 1, 2022

      Impacted Files:

       - mockDirPath/custom/someResource1/package.json
       - mockDirPath/custom/someResource2/package.json
      Follow this guide: https://docs.aws.amazon.com/cdk/v2/guide/migrating-v2.html
      "
    `);
  });

  it("migration message when there are only overrides", async () => {
    const resourcesToBeCreated = [
      {
        category: "auth",
        resourceName: "someResource",
        service: "Cognito"
      }
    ];
    const resourcesToBeUpdated = [
      {
        category: "storage",
        resourceName: "someResource2",
        service: "S3"
      }
    ];

    const allResources = [...resourcesToBeCreated, ...resourcesToBeUpdated];
    mockContext.amplify.getResourceStatus.mockResolvedValue({ allResources });
    detectAffectedDirectDependenciesMock.mockReturnValue(inputPayload);
    fsMock.existsSync.mockReturnValue(true);
    printerMock.warn.mockReturnValue(undefined);
    await printCdkMigrationWarning((mockContext as unknown) as $TSContext);
    expect(printerMock.warn.mock.calls[0][0]).toMatchInlineSnapshot(`
      "
      We detected that you are using CDK v1 with custom stacks and overrides.AWS CDK v1 has entered maintenance mode on June 1, 2022

      Impacted Files:

       - mockDirPath/package.json
      Upgrade '@aws-amplify/cli-extensibility-helper' to latest version ^3.0.0
      "
    `);
  });

  it("migration message when there both are present", async () => {
    const resourcesToBeCreated = [
      {
        category: "auth",
        resourceName: "someResource",
        service: "Cognito"
      }
    ];
    const resourcesToBeUpdated = [
      {
        category: "custom",
        resourceName: "someResource2",
        service: "mockService2"
      }
    ];

    const allResources = [...resourcesToBeCreated, ...resourcesToBeUpdated];
    mockContext.amplify.getResourceStatus.mockResolvedValue({ allResources });
    detectAffectedDirectDependenciesMock.mockReturnValue(inputPayload);
    fsMock.existsSync.mockReturnValue(true);
    printerMock.warn.mockReturnValueOnce(undefined);
    await printCdkMigrationWarning((mockContext as unknown) as $TSContext);
    expect(printerMock.warn.mock.calls[0][0]).toMatchInlineSnapshot(`
      "
      We detected that you are using CDK v1 with custom stacks and overrides.AWS CDK v1 has entered maintenance mode on June 1, 2022

      Impacted Files:

       - mockDirPath/package.json
      Upgrade '@aws-amplify/cli-extensibility-helper' to latest version ^3.0.0
       - mockDirPath/custom/someResource2/package.json
      Follow this guide: https://docs.aws.amazon.com/cdk/v2/guide/migrating-v2.html
      "
    `);
  });
});
