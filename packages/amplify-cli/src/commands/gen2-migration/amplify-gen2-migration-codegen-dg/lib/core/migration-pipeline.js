'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.createGen2Renderer = void 0;
const path_1 = __importDefault(require('path'));
const promises_1 = __importDefault(require('node:fs/promises'));
const renderer_1 = require('../npm_package/renderer');
const render_pipeline_1 = require('../render_pipeline');
const package_json_1 = require('../renderers/package_json');
const typescript_block_node_1 = require('../renderers/typescript_block_node');
const synthesizer_1 = require('../backend/synthesizer');
const ensure_directory_1 = require('../renderers/ensure_directory');
const index_1 = require('../generators/auth/index');
const index_js_1 = require('../generators/storage/index.js');
const index_2 = require('../generators/data/index');
const index_3 = require('../generators/functions/index');
const assert_1 = __importDefault(require('assert'));
const createFileWriter = (path) => async (content) => promises_1.default.writeFile(path, content);
const createGen2Renderer = ({
  outputDir,
  backendEnvironmentName,
  auth,
  storage,
  data,
  functions,
  customResources,
  unsupportedCategories,
  fileWriter = (content, path) => createFileWriter(path)(content),
}) => {
  const ensureOutputDir = new ensure_directory_1.EnsureDirectory(outputDir);
  const ensureAmplifyDirectory = new ensure_directory_1.EnsureDirectory(path_1.default.join(outputDir, 'amplify'));
  const amplifyPackageJson = new package_json_1.JsonRenderer(
    async () => ({ type: 'module' }),
    (content) => fileWriter(content, path_1.default.join(outputDir, 'amplify', 'package.json')),
  );
  const jsonRenderer = new package_json_1.JsonRenderer(
    async () => {
      let packageJson = {
        name: 'my-gen2-app',
      };
      try {
        const packageJsonContents = await promises_1.default.readFile(`./package.json`, { encoding: 'utf-8' });
        packageJson = JSON.parse(packageJsonContents);
      } catch (e) {}
      return (0, renderer_1.patchNpmPackageJson)(packageJson, {
        'aws-cdk': '^2',
        'aws-cdk-lib': '^2',
        'ci-info': '^3.8.0',
        constructs: '^10.0.0',
        typescript: '^5.0.0',
        '@types/node': '*',
      });
    },
    (content) => fileWriter(content, path_1.default.join(outputDir, 'package.json')),
  );
  const amplifyTsConfigJson = new package_json_1.JsonRenderer(
    async () => ({
      compilerOptions: {
        target: 'es2022',
        module: 'es2022',
        moduleResolution: 'bundler',
        resolveJsonModule: true,
        esModuleInterop: true,
        forceConsistentCasingInFileNames: true,
        strict: true,
        skipLibCheck: true,
        paths: {
          '$amplify/*': ['../.amplify/generated/*'],
        },
      },
    }),
    (content) => fileWriter(content, path_1.default.join(outputDir, 'amplify', 'tsconfig.json')),
  );
  const backendSynthesizer = new synthesizer_1.BackendSynthesizer();
  const backendRenderOptions = {};
  const renderers = [ensureOutputDir, ensureAmplifyDirectory, amplifyPackageJson, amplifyTsConfigJson, jsonRenderer];
  if (unsupportedCategories && unsupportedCategories.size >= 1) {
    backendRenderOptions.unsupportedCategories = unsupportedCategories;
  }
  if (functions && functions.length) {
    const functionNamesAndCategory = new Map();
    for (const func of functions) {
      if (func.name) {
        const resourceName = func.resourceName;
        (0, assert_1.default)(resourceName);
        const funcCategory = func.category;
        (0, assert_1.default)(funcCategory);
        functionNamesAndCategory.set(resourceName, funcCategory);
        const dirPath = path_1.default.join(outputDir, 'amplify', funcCategory, resourceName);
        renderers.push(new ensure_directory_1.EnsureDirectory(dirPath));
        renderers.push(
          new typescript_block_node_1.TypescriptNodeArrayRenderer(
            async () => (0, index_3.renderFunctions)(func),
            (content) => {
              return fileWriter(content, path_1.default.join(dirPath, 'resource.ts')).then(() =>
                fileWriter('', path_1.default.join(dirPath, 'handler.ts')),
              );
            },
          ),
        );
      }
    }
    backendRenderOptions.function = {
      importFrom: './function/resource',
      functionNamesAndCategories: functionNamesAndCategory,
    };
  }
  if (auth) {
    renderers.push(new ensure_directory_1.EnsureDirectory(path_1.default.join(outputDir, 'amplify', 'auth')));
    renderers.push(
      new typescript_block_node_1.TypescriptNodeArrayRenderer(
        async () => (0, index_1.renderAuthNode)(auth),
        (content) => fileWriter(content, path_1.default.join(outputDir, 'amplify', 'auth', 'resource.ts')),
      ),
    );
    backendRenderOptions.auth = {
      importFrom: './auth/resource',
      userPoolOverrides: auth === null || auth === void 0 ? void 0 : auth.userPoolOverrides,
      guestLogin: auth === null || auth === void 0 ? void 0 : auth.guestLogin,
      identityPoolName: auth === null || auth === void 0 ? void 0 : auth.identityPoolName,
      oAuthFlows: auth === null || auth === void 0 ? void 0 : auth.oAuthFlows,
      readAttributes: auth === null || auth === void 0 ? void 0 : auth.readAttributes,
      writeAttributes: auth === null || auth === void 0 ? void 0 : auth.writeAttributes,
      referenceAuth: auth === null || auth === void 0 ? void 0 : auth.referenceAuth,
      userPoolClient: auth === null || auth === void 0 ? void 0 : auth.userPoolClient,
    };
  }
  if (data && data.tableMappings && backendEnvironmentName && data.tableMappings[backendEnvironmentName] !== undefined) {
    renderers.push(new ensure_directory_1.EnsureDirectory(path_1.default.join(outputDir, 'amplify', 'data')));
    renderers.push(
      new typescript_block_node_1.TypescriptNodeArrayRenderer(
        async () => (0, index_2.generateDataSource)(data),
        (content) => fileWriter(content, path_1.default.join(outputDir, 'amplify', 'data', 'resource.ts')),
      ),
    );
    backendRenderOptions.data = {
      importFrom: './data/resource',
    };
  }
  if (storage) {
    const hasS3Bucket =
      (storage === null || storage === void 0 ? void 0 : storage.accessPatterns) ||
      (storage === null || storage === void 0 ? void 0 : storage.storageIdentifier);
    if (hasS3Bucket) {
      renderers.push(new ensure_directory_1.EnsureDirectory(path_1.default.join(outputDir, 'amplify', 'storage')));
      renderers.push(
        new typescript_block_node_1.TypescriptNodeArrayRenderer(
          async () => (0, index_js_1.renderStorage)(storage),
          (content) => fileWriter(content, path_1.default.join(outputDir, 'amplify', 'storage', 'resource.ts')),
        ),
      );
    }
    backendRenderOptions.storage = {
      importFrom: './storage/resource',
      dynamoDB: storage.dynamoDB,
      accelerateConfiguration: storage.accelerateConfiguration,
      versionConfiguration: storage.versioningConfiguration,
      hasS3Bucket: hasS3Bucket,
      bucketEncryptionAlgorithm: storage.bucketEncryptionAlgorithm,
      bucketName: storage.bucketName,
    };
  }
  if (customResources && customResources.size > 0) {
    backendRenderOptions.customResources = customResources;
  }
  const backendRenderer = new typescript_block_node_1.TypescriptNodeArrayRenderer(
    async () => backendSynthesizer.render(backendRenderOptions),
    (content) => fileWriter(content, path_1.default.join(outputDir, 'amplify', 'backend.ts')),
  );
  renderers.push(backendRenderer);
  return new render_pipeline_1.RenderPipeline(renderers);
};
exports.createGen2Renderer = createGen2Renderer;
//# sourceMappingURL=migration-pipeline.js.map
