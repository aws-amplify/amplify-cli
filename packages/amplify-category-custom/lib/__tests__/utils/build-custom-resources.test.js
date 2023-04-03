"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const execa_1 = __importDefault(require("execa"));
const build_custom_resources_1 = require("../../utils/build-custom-resources");
jest.mock('@aws-amplify/amplify-cli-core');
jest.mock('@aws-amplify/amplify-prompts');
jest.mock('../../utils/dependency-management-utils');
jest.mock('../../utils/generate-cfn-from-cdk');
jest.mock('execa');
jest.mock('ora');
jest.mock('fs-extra', () => ({
    readFileSync: jest.fn().mockReturnValue('mockCode'),
    existsSync: jest.fn().mockReturnValue(true),
    ensureDirSync: jest.fn().mockReturnValue(true),
    ensureDir: jest.fn(),
    writeFileSync: jest.fn().mockReturnValue(true),
    writeFile: jest.fn(),
}));
jest.mock('ora', () => () => ({
    start: jest.fn(),
    fail: jest.fn(),
    succeed: jest.fn(),
    stop: jest.fn(),
}));
jest.mock('../../utils/dependency-management-utils', () => ({
    getAllResources: jest.fn().mockResolvedValue({ mockedvalue: 'mockedkey' }),
}));
jest.mock('../../utils/generate-cfn-from-cdk', () => ({
    generateCloudFormationFromCDK: jest.fn(),
}));
jest.mock('@aws-amplify/amplify-cli-core', () => ({
    getPackageManager: jest.fn().mockResolvedValue('npm'),
    pathManager: {
        getBackendDirPath: jest.fn().mockReturnValue('mockTargetDir'),
    },
    JSONUtilities: {
        writeJson: jest.fn(),
        readJson: jest.fn(),
        stringify: jest.fn(),
    },
}));
describe('build custom resources scenarios', () => {
    let mockContext;
    beforeEach(() => {
        jest.clearAllMocks();
        mockContext = {
            amplify: {
                openEditor: jest.fn(),
                updateamplifyMetaAfterResourceAdd: jest.fn(),
                copyBatch: jest.fn(),
                getResourceStatus: jest.fn().mockResolvedValue({
                    allResources: [
                        {
                            resourceName: 'mockresource1',
                            service: 'customCDK',
                        },
                        {
                            resourceName: 'mockresource2',
                            service: 'customCDK',
                        },
                    ],
                }),
            },
        };
    });
    it('build all resources', async () => {
        await (0, build_custom_resources_1.buildCustomResources)(mockContext);
        expect(execa_1.default.sync).toBeCalledTimes(4);
    });
});
//# sourceMappingURL=build-custom-resources.test.js.map