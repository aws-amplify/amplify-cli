const graphQLConfig = require('graphql-config');
const { join } = require('path');

const { graphQlToAmplifyConfig } = require('./utils');

class AmplifyCodeGenConfig {
  constructor(context) {
    try {
      this.gqlConfig = graphQLConfig.getGraphQLConfig();
      this.fixOldConfig();
    } catch (e) {
      if (e instanceof graphQLConfig.ConfigNotFoundError) {
        const { amplify } = context;
        const projectRoot = amplify.getProjectDetails().projectPath || process.cwd();
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
    const newProject = {
      schemaPath: project.schema,
      includes: project.includes,
      excludes: project.excludes,
    };
    const extensions = {};
    if (project.amplifyExtension && Object.keys(project.amplifyExtension).length) {
      extensions.amplify = project.amplifyExtension;
    }
    if (project.endpoint) {
      extensions.endpoints = { prod: project.endpoint };
    }
    if (Object.keys(extensions).length) {
      newProject.extensions = extensions;
    }
    const projects = this.gqlConfig.projects || {};
    projects[project.projectName] = newProject;
    this.gqlConfig.config.projects = projects;
  }
  removeProject(projectName) {
    if (Object.keys(this.gqlConfig.config).includes(projectName)) {
      delete this.gqlConfig.config[projectName];
      return true;
    }
    return false;
  }
  fixOldConfig() {
    // Older version of config is not a valid graphqlconfig, fix it when loading
    const { config: cfg } = this.gqlConfig;
    let needsFix = false;
    cfg.projects = cfg.projects || {};
    Object.keys(cfg).forEach((key) => {
      const proj = cfg[key];
      if (proj.extensions && proj.extensions.amplify) {
        needsFix = true;
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
    if (needsFix) {
      this.save();
    }
  }
}
module.exports = AmplifyCodeGenConfig;
