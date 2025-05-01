const fs = require('fs-extra');
const { globSync } = require('glob');
const path = require('path');
const xcode = require('xcode');

/**
 * @typedef {Object} PBXGroup
 * @property {Array<object|string>} children
 * @property {string} isa
 * @property {string|undefined} name
 * @property {string|undefined} path
 * @property {string} sourceTree
 */

/**
 * @typedef {Object} PBXGroupRef
 * @property {string} uuid
 * @property {PBXGroup} pbxGroup
 */

/**
 * @private
 * Xcode project extension.
 */
const XCODE_PROJ_EXTENSION = '.xcodeproj';

/**
 * @private
 * Graphql schema file
 */
const GRAPHQL_SCHEMA = 'schema.graphql';

/**
 * @private
 * @returns {string} or undefined if not in an XCode project
 */
function getXcodeProjectDir() {
  const files = fs.readdirSync(process.cwd());
  const targetFiles = files.filter(function extensionFilter(file) {
    return path.extname(file).toLowerCase() === XCODE_PROJ_EXTENSION;
  });
  let projDir;
  if (targetFiles.length) {
    projDir = path.join(process.cwd(), targetFiles[0], '/project.pbxproj');
  }
  return projDir;
}

/**
 * @private
 * @param {object} project
 * @param {string} name
 * @returns {PBXGroupRef|undefined}
 */
function getGroupByName(project, name) {
  /** @type PBXGroupRef */
  let rootGroup = null;

  const groups = Object.entries(project.hash.project.objects.PBXGroup);
  for (let i = 0; i < groups.length; i++) {
    const [key, value] = groups[i];
    if (typeof value !== 'string') {
      // only the root pbx group can have no name, path or description
      const isRoot = name === undefined && value.name === undefined && value.path === undefined;
      const matchesName = typeof name === 'string' && (value.name === name || value.path === name);

      if (isRoot || matchesName) {
        rootGroup = {
          uuid: key,
          pbxGroup: value,
        };
        break;
      }
    }
  }
  return rootGroup;
}

/**
 * @private
 * @param {object} project
 * @returns {PBXGroupRef|undefined}
 */
function getRootGroup(project) {
  return getGroupByName(project);
}

/**
 * @private
 * @param {object} project
 * @param {string} name
 * @returns {PBXGroupRef}
 */
function getOrCreateGroup(project, name) {
  let group = getGroupByName(project, name);
  if (!group) {
    group = project.addPbxGroup([], name, '.');
    const rootGroup = getRootGroup(project);
    rootGroup.pbxGroup.children = [{ value: group.uuid, comment: group.pbxGroup.name }, ...rootGroup.pbxGroup.children];
  }
  return group;
}

/**
 * @private
 * @param {PBXGroupRef} group
 * @param {string} name
 * @returns {boolean}
 */
function groupHasFile(group, name) {
  return group.pbxGroup.children.filter((child) => child.comment === name).length > 0;
}

/**
 * @private
 * @param {*} rootDir project root directory
 * @returns {string?}
 */
function getSchemaFile(rootDir) {
  const schemaFilePattern = path.join(rootDir, 'amplify', 'backend', 'api', '*', GRAPHQL_SCHEMA);
  const [schemaFile] = globSync(schemaFilePattern);
  return schemaFile;
}

/**
 * Adds amplify generated models files to the "AmplifyModels" group in given Xcode project
 * @param {string} rootDir
 * @param {string} schemaFile
 * @param {XcodeProj} xcodeProject
 * @returns {boolean} returns true if models have been successfully added to the `xcodeProject`
 */
function addAmplifyModels(rootDir, schemaFile, xcodeProject) {
  let hasGeneratedFiles = false;
  if (!schemaFile) {
    return hasGeneratedFiles;
  }

  // add generated model
  const modelsFilePattern = path.join(rootDir, 'amplify', 'generated', 'models', '*.swift');
  const modelFiles = globSync(modelsFilePattern).map((file) => {
    return path.relative(rootDir, file);
  });
  if (modelFiles && modelFiles.length > 0) {
    const modelsGroup = getOrCreateGroup(xcodeProject, 'AmplifyModels');
    modelFiles.forEach((file) => {
      const { base: filename } = path.parse(file);
      if (!groupHasFile(modelsGroup, filename)) {
        xcodeProject.addSourceFile(file, {}, modelsGroup.uuid);
        hasGeneratedFiles = true;
      }
    });
  }
  return hasGeneratedFiles;
}

/**
 * Adds amplify files to the Xcode project grouped by categories:
 *
 * - `AmplifyConfig`
 *   - `amplifytools.xcconfig`
 *   - `amplifyconfiguration.json`
 *   - `awsconfiguration.json`
 *   - `schema.graphql`
 * - `AmplifyModels`
 *   - *all generated models*
 *
 * @public
 * @return {Promise<void>}
 */
async function addAmplifyFiles() {
  const projectDir = getXcodeProjectDir();
  if (!projectDir) {
    // if not in a xcode project do not move forward with xcode logic
    return;
  }
  const rootDir = path.resolve(projectDir, '..', '..');
  const project = xcode.project(projectDir);
  await new Promise((resolve, reject) => {
    project.parse((error) => {
      if (error) {
        reject(error);
        return;
      }

      const rootGroup = getRootGroup(project);
      if (!rootGroup || typeof rootGroup.uuid !== 'string') {
        reject(new Error('Could not find root group of Xcode project'));
        return;
      }

      // only overwrite the project when files are actually modified
      /** @type {boolean} */
      let hasGeneratedFiles = false;

      try {
        const schemaFile = getSchemaFile(rootDir);

        // step 1: add generated models
        hasGeneratedFiles = addAmplifyModels(rootDir, schemaFile, project);

        // step 2: add configuration, schema and other amplify resources
        const amplifyConfigGroup = getOrCreateGroup(project, 'AmplifyConfig');

        // add the amplifytools config file
        const amplifyToolsConfigFile = 'amplifytools.xcconfig';
        if (!groupHasFile(amplifyConfigGroup, amplifyToolsConfigFile)) {
          project.addFile(amplifyToolsConfigFile, amplifyConfigGroup.uuid);
          hasGeneratedFiles = true;
        }

        // adding resources (i.e. files that are added to the app bundle)
        const resourcesGroup = project.pbxGroupByName('Resources');
        if (!resourcesGroup) {
          project.addPbxGroup([], 'Resources');
        }
        const amplifyConfigFile = 'amplifyconfiguration.json';
        const awsConfigFile = 'awsconfiguration.json';
        if (!groupHasFile(amplifyConfigGroup, amplifyConfigFile)) {
          project.addResourceFile(amplifyConfigFile, null, amplifyConfigGroup.uuid);
          project.addResourceFile(awsConfigFile, null, amplifyConfigGroup.uuid);
          hasGeneratedFiles = true;
        }

        // add schema.graphql
        if (!groupHasFile(amplifyConfigGroup, GRAPHQL_SCHEMA) && schemaFile) {
          const schemaFilePath = path.relative(rootDir, schemaFile);
          project.addFile(schemaFilePath, amplifyConfigGroup.uuid, {
            lastKnownFileType: 'text',
          });
          hasGeneratedFiles = true;
        }

        if (hasGeneratedFiles) {
          fs.writeFileSync(projectDir, project.writeSync());
        }
        resolve();
      } catch (projectError) {
        reject(projectError);
      }
    });
  });
}

module.exports = {
  addAmplifyFiles,
};
