const graphQLConfig = require('graphql-config');
const { join, isAbsolute, relative } = require('path');
const slash = require('slash');
const { graphQlToAmplifyConfig } = require('./utils');

class AmplifyCodeGenConfig {
  constructor(context, withoutInit = false) {
    try {
      this.gqlConfig = graphQLConfig.getGraphQLConfig();
      this.fixOldConfig();
    } catch (e) {
      if (e instanceof graphQLConfig.ConfigNotFoundError) {
        const { amplify } = context;
        let projectRoot;
        if (!withoutInit) {
          projectRoot = amplify.getEnvInfo().projectPath || process.cwd();
        } else {
          projectRoot = process.cwd();
        }
        const configPath = join(projectRoot, '.graphqlconfig.yml');
        this.gqlConfig = new graphQLConfig.GraphQLConfig(null, configPath);
        this.gqlConfig.config = {};
      } else {
        throw e;
      }
    }
  }
  static isValidAmplifyProject(project) {
    if (project.schema && Object.keys(project.amplifyExtension).length) {
      return true;
    }
    return false;
  }
  save() {
    if (this.gqlConfig) {
      this.gqlConfig.saveConfig(this.gqlConfig.config);
    }
  }
  getProjects() {
    return this.gqlConfig.config ? graphQlToAmplifyConfig(this.gqlConfig) : [];
  }
  addProject(project) {
    if (!this.constructor.isValidAmplifyProject(project)) {
      return false;
    }
    const schemaPath = isAbsolute(project.schema) ? relative(this.gqlConfig.configDir, project.schema) : project.schema;
    const newProject = {
      schemaPath,
      includes: project.includes,
      excludes: project.excludes,
    };
    const extensions = {};
    if (project.amplifyExtension && Object.keys(project.amplifyExtension).length) {
      extensions.amplify = project.amplifyExtension;
    }

    if (Object.keys(extensions).length) {
      newProject.extensions = extensions;
    }

    const projects = this.gqlConfig.projects || {};
    projects[project.projectName] = this.constructor.normalizePath(newProject);
    this.gqlConfig.config.projects = projects;
  }
  removeProject(projectName) {
    if (Object.keys(this.gqlConfig.getProjects()).includes(projectName)) {
      delete this.gqlConfig.config.projects[projectName];
      return true;
    }
    return false;
  }

  static normalizePath(proj) {
    if (!proj.schemaPath || !proj.extensions || !proj.extensions.amplify) {
      return proj;
    }
    const updatedProj = {};
    updatedProj.schemaPath = slash(proj.schemaPath);
    updatedProj.includes = (proj.includes || []).map(p => slash(p));
    updatedProj.excludes = (proj.excludes || []).map(p => slash(p));
    const amplifyExtension = {
      ...proj.extensions.amplify,
    };
    amplifyExtension.generatedFileName = amplifyExtension.generatedFileName
      ? slash(amplifyExtension.generatedFileName)
      : amplifyExtension.generatedFileName;
    amplifyExtension.docsFilePath = amplifyExtension.docsFilePath ? slash(amplifyExtension.docsFilePath) : amplifyExtension.docsFilePath;

    updatedProj.extensions = {
      amplify: amplifyExtension,
    };

    return updatedProj;
  }

  fixOldConfig() {
    // Older version of config is not a valid graphqlconfig, fix it when loading
    const { config: cfg } = this.gqlConfig;
    if (cfg.extensions && cfg.extensions.amplify && cfg.extensions.amplify.version >= 3) {
      return;
    }
    cfg.projects = cfg.projects || {};
    Object.keys(cfg).forEach(key => {
      const proj = cfg[key];
      if (proj.extensions && proj.extensions.amplify) {
        delete cfg[key];
        if (proj.extensions.endPoints) {
          proj.extensions.endpoints = {
            prod: proj.extensions.endPoints,
          };
          delete proj.extensions.endPoints;
        }
        cfg.projects[key] = proj;
      }
    });

    Object.keys(cfg.projects || {}).forEach(projName => {
      cfg.projects[projName] = this.constructor.normalizePath(cfg.projects[projName]);
    });
    cfg.extensions = {
      ...cfg.extensions,
      amplify: {
        ...((cfg.extensions && cfg.extensions.amplify) || {}),
        version: 3,
      },
    };
    this.save();
  }
}
module.exports = AmplifyCodeGenConfig;
