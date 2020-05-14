const xcode = require('xcode');
const glob = require('glob');
const path = require('path');
const fs = require('fs-extra');

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
 * @returns {string}
 */
function getXcodeProjectDir() {
  const files = fs.readdirSync(process.cwd());
  const targetFiles = files.filter(function extenstionFilter(file) {
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
    // console.log(value);
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
  return group.pbxGroup.children.filter(child => child.comment === name).length > 0;
}

/**
 * @public
 * @return {Promise<void>}
 */
async function addDataStoreFiles() {
  const projectDir = getXcodeProjectDir();
  const rootDir = path.resolve(projectDir, '..', '..');
  const project = xcode.project(projectDir);
  return new Promise((resolve, reject) => {
    const schemaFilePattern = path.join(rootDir, 'amplify', 'backend', 'api', '*', 'schema.graphql');
    const [schemaFile] = glob.sync(schemaFilePattern);
    if (!schemaFile) {
      reject(new Error('schema.graphql file not found'));
      return;
    }

    project.parse(error => {
      if (error) {
        reject(error);
        return;
      }

      const rootGroup = getRootGroup(project);
      if (rootGroup == null || typeof rootGroup.uuid !== 'string') {
        reject(new Error('Could not find root group of Xcode project'));
        return;
      }

      try {
        // step 1: add generated models
        const modelsFilePattern = path.join(rootDir, 'amplify', 'generated', 'models', '*.swift');
        const modelFiles = glob.sync(modelsFilePattern).map(file => {
          return path.relative(rootDir, file);
        });
        if (modelFiles && modelFiles.length > 0) {
          const modelsGroup = getOrCreateGroup(project, 'AmplifyModels');
          modelFiles.forEach(file => {
            const { base: filename } = path.parse(file);
            if (!groupHasFile(modelsGroup, filename)) {
              console.log(`adding model source file... ${file}`);
              project.addSourceFile(file, {}, modelsGroup.uuid);
            }
          });
        }

        // step 2: add configuration, schema and other amplify resources
        const amplifyConfigGroup = getOrCreateGroup(project, 'AmplifyConfig');

        // add the amplifytools config file
        project.addFile('./amplifytools.xcconfig', amplifyConfigGroup.uuid);

        // adding resources (i.e. files that are added to the app bundle)
        project.addPbxGroup([], 'Resources', 'Resources', '"<group>"');
        project.addResourceFile('amplifyconfiguration.json', null, amplifyConfigGroup.uuid);
        project.addResourceFile('awsconfiguration.json', null, amplifyConfigGroup.uuid);
        project.removePbxGroup('Resources');

        // add schema.graphql
        project.addFile(path.relative(rootDir, schemaFile), amplifyConfigGroup.uuid, {
          lastKnownFileType: 'text',
        });

        fs.writeFileSync(projectDir, project.writeSync());
        resolve();
      } catch (projectError) {
        reject(projectError);
      }
    });
  });
}

module.exports = {
  addDataStoreFiles,
};
