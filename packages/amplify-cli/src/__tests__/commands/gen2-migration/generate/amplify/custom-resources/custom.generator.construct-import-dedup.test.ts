import { CustomResourceGenerator } from '../../../../../../commands/gen2-migration/generate/amplify/custom-resources/custom.generator';
import { BackendGenerator } from '../../../../../../commands/gen2-migration/generate/amplify/backend.generator';
import { RootPackageJsonGenerator } from '../../../../../../commands/gen2-migration/generate/package.json.generator';
import { SpinningLogger } from '../../../../../../commands/gen2-migration/_common/spinning-logger';
import { Gen1App } from '../../../../../../commands/gen2-migration/_common/gen1-app';
import { DEFAULT_STATEFUL_RESOURCES } from '../../../../../../commands/gen2-migration/_common/resource-types';

jest.unmock('fs-extra');

jest.mock('@aws-amplify/amplify-cli-core', () => {
  const actual = jest.requireActual('@aws-amplify/amplify-cli-core');
  return {
    ...actual,
    JSONUtilities: {
      ...actual.JSONUtilities,
      readJson: jest.fn().mockImplementation((filePath: string, opts?: unknown) => {
        if (typeof filePath === 'string' && filePath.endsWith('package.json')) {
          return { dependencies: {}, devDependencies: {} };
        }
        if (typeof filePath === 'string' && filePath.endsWith('project-config.json')) {
          return { projectName: 'testProject' };
        }
        return actual.JSONUtilities.readJson(filePath, opts);
      }),
    },
  };
});

const mockMkdir = jest.fn().mockResolvedValue(undefined);
const mockWriteFile = jest.fn().mockResolvedValue(undefined);
const mockCp = jest.fn().mockResolvedValue(undefined);
const mockRm = jest.fn().mockResolvedValue(undefined);
const mockReadFile = jest.fn();
const mockReaddir = jest.fn().mockResolvedValue([]);
const mockRename = jest.fn().mockResolvedValue(undefined);
jest.mock('node:fs/promises', () => ({
  mkdir: (...args: unknown[]) => mockMkdir(...args),
  writeFile: (...args: unknown[]) => mockWriteFile(...args),
  cp: (...args: unknown[]) => mockCp(...args),
  rm: (...args: unknown[]) => mockRm(...args),
  readFile: (...args: unknown[]) => mockReadFile(...args),
  readdir: (...args: unknown[]) => mockReaddir(...args),
  rename: (...args: unknown[]) => mockRename(...args),
}));

const CDK_STACK_CONTENT = `
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export class cdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
  }
}
`;

describe('CustomResourceGenerator - Construct import deduplication', () => {
  const outputDir = '/fake/output';
  const logger = new SpinningLogger('test');
  const gen1App = { statefulResourceTypes: [...Array.from(DEFAULT_STATEFUL_RESOURCES)] } as unknown as Gen1App;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReadFile.mockResolvedValue(CDK_STACK_CONTENT);
  });

  it('does not inject duplicate Construct import when source uses double quotes', async () => {
    const backendGenerator = new BackendGenerator(outputDir, logger);
    const packageJsonGenerator = new RootPackageJsonGenerator(outputDir);
    const generator = new CustomResourceGenerator(gen1App, backendGenerator, packageJsonGenerator, outputDir, 'myRes', logger);
    const ops = await generator.plan();
    await ops[0].execute();

    // The generator writes transformed content to cdk-stack.ts before renaming it
    const writeCall = mockWriteFile.mock.calls.find((c: unknown[]) => (c[0] as string).endsWith('cdk-stack.ts'));
    expect(writeCall).toBeDefined();
    const writtenContent = writeCall![1] as string;

    const constructsImports = (writtenContent.match(/from ['"]constructs['"]/g) || []).length;
    expect(constructsImports).toBe(1);
  });
});
