'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.patchNpmPackageJson = void 0;
const withDefault = (version) => (version !== null && version !== void 0 ? version : '*');
const patchNpmPackageJson = (packageJson, packageVersions = {}) => {
  var _a, _b;
  return {
    ...packageJson,
    devDependencies: {
      ...((_a = packageJson.devDependencies) !== null && _a !== void 0 ? _a : {}),
      '@aws-amplify/backend': withDefault(packageVersions['@aws-amplify/backend']),
      '@aws-amplify/backend-cli': withDefault(packageVersions['@aws-amplify/backend-cli']),
      '@aws-amplify/backend-data': withDefault(packageVersions['@aws-amplify/backend-data']),
      'aws-cdk': withDefault(packageVersions['aws-cdk']),
      'aws-cdk-lib': withDefault(packageVersions['aws-cdk-lib']),
      'ci-info': withDefault(packageVersions['ci-info']),
      constructs: withDefault(packageVersions.constructs),
      esbuild: withDefault(packageVersions.esbuild),
      tsx: withDefault(packageVersions.tsx),
      typescript: withDefault(packageVersions.typescript),
      '@types/node': withDefault(packageVersions['@types/node']),
    },
    dependencies: {
      ...((_b = packageJson.dependencies) !== null && _b !== void 0 ? _b : {}),
      'aws-amplify': withDefault(packageVersions['aws-amplify']),
    },
  };
};
exports.patchNpmPackageJson = patchNpmPackageJson;
//# sourceMappingURL=renderer.js.map
